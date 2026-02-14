import React, { useState, useEffect, useRef } from 'react'
import {
    Stage,
    Layer,
    Rect,
    Circle,
    Text,
    Image as KonvaImage,
} from 'react-konva'

// URL для плейсхолдера карты, если ничего не загружено.
const DEFAULT_MAP_SRC =
    'https://placehold.co/1200x800/2b4d6d/ffffff?text=Загрузите+карту+сражения'
const SIDEBAR_WIDTH = 300 // Ширина боковой панели в пикселях

const App = () => {
    // 1. State: Исходный URL/Data-URL карты
    const [mapImageSrc, setMapImageSrc] = useState(DEFAULT_MAP_SRC)
    // 2. State: Объект Image для Konva
    const [mapImage, setMapImage] = useState(null)
    // 3. State: Текст из поля ввода URL
    const [urlInput, setUrlInput] = useState('')
    // 4. State: Размеры Stage (должны быть динамическими с учетом сайдбара)
    const [stageDimensions, setStageDimensions] = useState({
        width: window.innerWidth - SIDEBAR_WIDTH,
        height: window.innerHeight,
    })
    // 5. State: Конфигурация Stage для Пан/Зум
    const [stageConfig, setStageConfig] = useState({
        scale: 1, // Текущий масштаб
        x: 0, // Позиция по X
        y: 0, // Позиция по Y
    })

    // Референс на Konva Stage для доступа к его методам
    const stageRef = useRef(null)
    const isDraggingRef = useRef(false)

    // =========================================================================
    // Эффект для загрузки изображения (преобразование URL/DataURL в объект Image)
    // =========================================================================
    useEffect(() => {
        if (!mapImageSrc) {
            setMapImage(null)
            return
        }

        const image = new window.Image()
        image.src = mapImageSrc
        image.crossOrigin = 'Anonymous'

        image.onload = () => {
            setMapImage(image)
        }

        image.onerror = (e) => {
            console.error('Не удалось загрузить изображение карты:', e)
            if (mapImageSrc !== DEFAULT_MAP_SRC) {
                setMapImageSrc(DEFAULT_MAP_SRC)
            }
        }

        return () => {
            image.onload = null
            image.onerror = null
        }
    }, [mapImageSrc])

    // =========================================================================
    // Эффект для обработки изменения размера окна (для адаптивности)
    // =========================================================================
    useEffect(() => {
        const checkSize = () => {
            setStageDimensions({
                width: window.innerWidth - SIDEBAR_WIDTH,
                height: window.innerHeight,
            })
        }
        window.addEventListener('resize', checkSize)
        checkSize()
        return () => window.removeEventListener('resize', checkSize)
    }, [])

    // =========================================================================
    // Обработчик загрузки файла
    // =========================================================================
    const handleFileChange = (event) => {
        const file = event.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setMapImageSrc(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    // =========================================================================
    // Обработчик загрузки по URL
    // =========================================================================
    const handleUrlLoad = () => {
        if (urlInput) {
            setMapImageSrc(urlInput)
            setUrlInput('')
        }
    }

    // =========================================================================
    // Обработчик масштабирования (Зум)
    // =========================================================================
    const handleWheel = (e) => {
        e.evt.preventDefault() // Отключаем стандартный скроллинг страницы
        const stage = stageRef.current
        if (!stage) return

        const oldScale = stageConfig.scale
        // Коэффициент масштабирования
        const scaleBy = 1.1

        // Определяем новое значение масштаба
        let newScale =
            e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy

        // Ограничение масштаба (min: 0.1, max: 5)
        newScale = Math.max(0.1, Math.min(newScale, 5))

        // Вычисляем позицию курсора относительно Stage (для масштабирования к курсору)
        const pointer = stage.getPointerPosition()

        // Вычисляем, куда Konva "смотрит" в текущих координатах (до зума)
        const mousePointTo = {
            x: (pointer.x - stageConfig.x) / oldScale,
            y: (pointer.y - stageConfig.y) / oldScale,
        }

        // Обновляем состояние Stage
        setStageConfig({
            scale: newScale,
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        })
    }

    // =========================================================================
    // Обработчик перетаскивания (Пан)
    // =========================================================================
    const handleMouseDown = (e) => {
        // Проверяем, что это не перетаскивание Konva-объекта (корабля),
        // а клик по пустому месту Stage.
        if (e.target === e.target.getStage()) {
            isDraggingRef.current = true
            // Устанавливаем курсор для перетаскивания
            e.target.content.style.cursor = 'grabbing'
        }
    }

    const handleMouseUp = (e) => {
        isDraggingRef.current = false
        // Сбрасываем курсор
        e.target.content.style.cursor = 'grab'
    }

    const handleMouseMove = (e) => {
        if (!isDraggingRef.current) return
        const stage = stageRef.current
        if (!stage) return

        // Получаем смещение мыши
        const dx = e.evt.movementX
        const dy = e.evt.movementY

        // Обновляем позицию Stage
        setStageConfig((prevConfig) => ({
            ...prevConfig,
            x: prevConfig.x + dx,
            y: prevConfig.y + dy,
        }))
    }

    // =========================================================================
    // Рендеринг Konva Stage и слоев
    // =========================================================================
    const renderStage = () => {
        const stageWidth = stageDimensions.width
        const stageHeight = stageDimensions.height

        let mapProps = {}
        let initialMapX = 0
        let initialMapY = 0

        if (mapImage) {
            // Логика для вписывания изображения в размер Stage (Cover/Contain-like)
            const imageRatio = mapImage.width / mapImage.height
            const stageRatio = stageWidth / stageHeight

            let renderWidth, renderHeight

            if (imageRatio > stageRatio) {
                renderHeight = stageHeight
                renderWidth = stageHeight * imageRatio
                initialMapX = (stageWidth - renderWidth) / 2 // Центрируем по горизонтали
            } else {
                renderWidth = stageWidth
                renderHeight = stageWidth / imageRatio
                initialMapY = (stageHeight - renderWidth) / 2 // Центрируем по вертикали
            }

            mapProps = {
                image: mapImage,
                x: initialMapX, // Исходные координаты карты (центр)
                y: initialMapY,
                width: renderWidth,
                height: renderHeight,
                // Карта больше не draggable, Stage сам управляет панорамированием
            }
        }

        return (
            // Stage теперь использует состояние stageConfig для управления позицией и масштабом
            <Stage
                ref={stageRef}
                width={stageWidth}
                height={stageHeight}
                scaleX={stageConfig.scale}
                scaleY={stageConfig.scale}
                x={stageConfig.x}
                y={stageConfig.y}
                onWheel={handleWheel} // Обработчик зума
                onMouseDown={handleMouseDown} // Обработчик начала панорамирования
                onMouseUp={handleMouseUp} // Обработчик конца панорамирования
                onMouseMove={handleMouseMove} // Обработчик панорамирования
                className="cursor-grab" // Устанавливаем курсор для перетаскивания
            >
                <Layer>
                    {/* Фон: темно-синяя вода (базовый цвет) */}
                    <Rect
                        x={-stageConfig.x / stageConfig.scale} // Сдвигаем Rect обратно, чтобы он покрывал весь видимый Stage
                        y={-stageConfig.y / stageConfig.scale}
                        width={stageWidth / stageConfig.scale}
                        height={stageHeight / stageConfig.scale}
                        fill="#1f2937"
                    />

                    {/* Рендерим загруженное изображение карты */}
                    {mapImage && <KonvaImage {...mapProps} />}

                    {/* Пример корабля (красный кружок) */}
                    <Circle
                        // Корабль должен быть расположен в мировых координатах (не зависеть от pan/zoom)
                        x={stageWidth / 2}
                        y={stageHeight / 2}
                        radius={15}
                        fill="red"
                        draggable
                    />
                    <Text
                        x={stageWidth / 2 - 20}
                        y={stageHeight / 2 + 30}
                        text="Эсминец"
                        fontSize={15}
                        fill="white"
                    />
                </Layer>
            </Stage>
        )
    }

    // =========================================================================
    // Основной макет компонента (Sidebar + Stage)
    // =========================================================================
    return (
        // Используем Tailwind для создания двухколоночного макета
        <div className="flex h-screen w-screen font-sans bg-gray-800 text-gray-200">
            {/* Левая панель инструментов (Sidebar) */}
            <div
                className="flex flex-col flex-none bg-gray-900/80 backdrop-blur-sm p-5 border-r border-gray-700/50 overflow-y-auto shadow-2xl"
                style={{ width: `${SIDEBAR_WIDTH}px` }}
            >
                <h2 className="text-4xl font-bold mb-8 text-cyan-400 tracking-wider text-center flex items-center justify-center gap-3">
                    <i className="lucide-compass mr-3"></i>WoWs Planner
                </h2>

                {/* Секция загрузки карты */}
                <div className="mb-6 p-5 bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700/50">
                    <h3 className="text-xl font-bold mb-4 pb-3 text-cyan-300 border-b border-gray-700">
                        Загрузка карты (Фон)
                    </h3>

                    {/* Загрузка из файла */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-2 text-gray-400">
                            Загрузить файл:
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full text-sm text-gray-300
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-lg file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-cyan-500 file:text-white
                                    hover:file:bg-cyan-600 transition duration-200 cursor-pointer"
                        />
                    </div>

                    {/* Разделитель "ИЛИ" */}
                    <div className="flex items-center my-6">
                        <div className="flex-grow border-t border-gray-700"></div>
                        <span className="flex-shrink mx-4 text-gray-500 text-xs">
                            ИЛИ
                        </span>
                        <div className="flex-grow border-t border-gray-700"></div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-400">
                            Загрузить по URL:
                        </label>
                        <input
                            type="text"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="Например: https://i.imgur.com/map.jpg"
                            className="w-full p-2.5 mb-3 text-sm bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-500 transition-all duration-200"
                        />
                        <button
                            onClick={handleUrlLoad}
                            className="w-full py-2.5 px-4 bg-teal-600 rounded-lg font-bold hover:bg-teal-700 transition-all duration-200 shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500"
                        >
                            Загрузить URL
                        </button>
                    </div>

                    {/* Показ текущего источника для отладки */}
                    <p className="text-xs mt-5 text-gray-500 italic truncate">
                        Текущий источник:{' '}
                        {mapImageSrc.length > 40
                            ? mapImageSrc.substring(0, 40) + '...'
                            : mapImageSrc}
                    </p>
                </div>

                {/* Место для других инструментов */}
                <div className="mt-6 p-5 bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700/50">
                    <h3 className="text-xl font-bold text-cyan-300">
                        Инструменты
                    </h3>
                    <p className="text-sm text-gray-400 mt-3">
                        (Здесь мы добавим инструменты для рисования, пингов и
                        размещения кораблей.)
                    </p>
                </div>
            </div>

            {/* Основная область холста (Canvas) */}
            <div className="flex-grow bg-gray-800">{renderStage()}</div>
        </div>
    )
}

export default App
