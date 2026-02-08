import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Rect, Group, Text, Label, Tag, Transformer } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';

export type Tool = 'brush' | 'rectangle' | 'highlighter' | 'crop' | 'select';

export interface EditorHandle {
  download: () => void;
  copyToClipboard: () => Promise<void>;
  clear: () => void;
}

interface EditorProps {
  tool: Tool;
  color: string;
  brushSize: number;
  imageUrl: string | null;
  onImageLoad: (dimensions: { width: number; height: number }) => void;
  yoloCrop: boolean;
  onToast: (msg: string) => void;
}

interface DrawingItem {
  tool: Tool;
  points?: number[];
  color: string;
  size?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface HistoryState {
  items: DrawingItem[];
  crop: { x: number; y: number; width: number; height: number } | null;
}

const Editor = forwardRef<EditorHandle, EditorProps>(({ tool, color, brushSize, imageUrl, onImageLoad, yoloCrop, onToast }, ref) => {
  const [image] = useImage(imageUrl || '');
  
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const [currentItems, setCurrentItems] = useState<DrawingItem[]>([]);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [pendingCrop, setPendingCrop] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [allSelected, setAllSelected] = useState(false);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const stageRef = useRef<Konva.Stage>(null);
  const pendingCropRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    download: () => {
      if (!stageRef.current) return;
      
      const dataUrl = getExportUrl();
      const link = document.createElement('a');
      link.download = `kwent-imedit-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    copyToClipboard: async () => {
      if (!stageRef.current) return;
      
      try {
        const dataUrl = getExportUrl();
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        onToast('Copied to clipboard');
      } catch (err) {
        console.error('Failed to copy:', err);
        onToast('Failed to copy');
      }
    },
    clear: () => {
      if (window.confirm('Clear all drawings?')) {
        setCurrentItems([]);
        pushHistory([], cropRect);
      }
    }
  }));

  const getExportUrl = () => {
    if (!stageRef.current) return '';
    
    // Temporarily hide crop UI for export if needed? 
    // Actually toDataURL captures what is visible.
    // If we have pending crop, we probably shouldn't export it? 
    // Or we should? Usually you export the *result*.
    // Pending crop is UI. We should hide it.
    
    // Better: use the logic we had.
    if (cropRect) {
      return stageRef.current.toDataURL({
        x: stagePos.x + cropRect.x * stageScale,
        y: stagePos.y + cropRect.y * stageScale,
        width: cropRect.width * stageScale,
        height: cropRect.height * stageScale,
        pixelRatio: 2 / stageScale
      });
    }
    
    if (image) {
        return stageRef.current.toDataURL({
            x: stagePos.x,
            y: stagePos.y,
            width: image.width * stageScale,
            height: image.height * stageScale,
            pixelRatio: 2 / stageScale
        });
    }

    return stageRef.current.toDataURL();
  };

  // Initialize
  useEffect(() => {
    if (image && stageRef.current) {
      const stageW = stageRef.current.width();
      const stageH = stageRef.current.height();
      
      const scale = Math.min((stageW - 100) / image.width, (stageH - 100) / image.height);
      const finalScale = Math.min(scale, 1);

      const x = (stageW - image.width * finalScale) / 2;
      const y = (stageH - image.height * finalScale) / 2;

      setStageScale(finalScale);
      setStagePos({ x, y });

      onImageLoad({ width: image.width, height: image.height });
      
      setHistory([{ items: [], crop: null }]);
      setHistoryStep(0);
      setCurrentItems([]);
      setCropRect(null);
      setPendingCrop(null);
      setAllSelected(false);
      
      containerRef.current?.focus();
    }
  }, [image]);

  useEffect(() => {
    if (pendingCrop && pendingCropRef.current && transformerRef.current) {
      transformerRef.current.nodes([pendingCropRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [pendingCrop]);

  const pushHistory = (newItems: DrawingItem[], newCrop: typeof cropRect) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push({ items: newItems, crop: newCrop });
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleMouseDown = (e: any) => {
    containerRef.current?.focus();
    setAllSelected(false); // Clear selection on click

    if (tool === 'select') return;
    
    if (pendingCrop && (e.target === pendingCropRef.current || e.target.getParent()?.className === 'Transformer')) {
        return;
    }
    
    // Clear pending crop if drawing new one
    if (pendingCrop && tool === 'crop') {
        setPendingCrop(null);
    }

    setIsDrawing(true);
    const stage = e.target.getStage();
    const relativePos = stage.getRelativePointerPosition();
    if (!relativePos) return;

    if (tool === 'brush' || tool === 'highlighter') {
      setCurrentItems([...currentItems, { 
        tool, 
        points: [relativePos.x, relativePos.y], 
        color, 
        size: brushSize 
      }]);
    } else if (tool === 'rectangle' || tool === 'crop') {
      setCurrentItems([...currentItems, { 
        tool, 
        x: relativePos.x, 
        y: relativePos.y, 
        width: 0, 
        height: 0, 
        color: tool === 'crop' ? 'red' : color,
        size: brushSize // Store size for rect border
      }]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;
    
    const stage = e.target.getStage();
    const relativePos = stage.getRelativePointerPosition();
    if (!relativePos) return;

    const newItems = [...currentItems];
    const lastItem = newItems[newItems.length - 1];

    if (tool === 'brush' || tool === 'highlighter') {
      lastItem.points = lastItem.points!.concat([relativePos.x, relativePos.y]);
    } else if (tool === 'rectangle' || tool === 'crop') {
      lastItem.width = relativePos.x - lastItem.x!;
      lastItem.height = relativePos.y - lastItem.y!;
    }

    setCurrentItems(newItems);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const lastItem = currentItems[currentItems.length - 1];
    
    if (tool === 'crop') {
      let x = lastItem.x!;
      let y = lastItem.y!;
      let w = lastItem.width!;
      let h = lastItem.height!;

      if (w < 0) { x += w; w = Math.abs(w); }
      if (h < 0) { y += h; h = Math.abs(h); }

      // We remove the drawn item immediately as it becomes Crop State
      const itemsWithoutGuide = currentItems.slice(0, -1);
      setCurrentItems(itemsWithoutGuide);

      if (w < 5 || h < 5) return;

      const newCrop = { x, y, width: w, height: h };

      if (yoloCrop) {
        setCropRect(newCrop);
        pushHistory(itemsWithoutGuide, newCrop);
      } else {
        setPendingCrop(newCrop);
      }
    } else {
      pushHistory(currentItems, cropRect);
    }
  };

  const applyPendingCrop = () => {
      if (pendingCrop) {
          setCropRect(pendingCrop);
          pushHistory(currentItems, pendingCrop);
          setPendingCrop(null);
      }
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    if (newScale < 0.1 || newScale > 10) return;

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStageScale(newScale);
    setStagePos(newPos);
  };

  const handleTransformEnd = () => {
      if (pendingCropRef.current) {
          const node = pendingCropRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          
          node.scaleX(1);
          node.scaleY(1);
          
          setPendingCrop({
              x: node.x(),
              y: node.y(),
              width: Math.max(5, node.width() * scaleX),
              height: Math.max(5, node.height() * scaleY),
          });
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        const prevStep = historyStep - 1;
        if (prevStep >= 0) {
          const state = history[prevStep];
          setHistoryStep(prevStep);
          setCurrentItems(state.items);
          setCropRect(state.crop);
          setPendingCrop(null);
          setAllSelected(false);
        }
      }
      
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
          e.preventDefault();
          setAllSelected(true);
          onToast('All items selected');
      }

      if (e.key === 'Enter' && pendingCrop) {
          applyPendingCrop();
      }
      if (e.key === 'Escape') {
          if (pendingCrop) setPendingCrop(null);
          if (allSelected) setAllSelected(false);
      }
      
      if (e.key === 'Backspace' || e.key === 'Delete') {
          if (allSelected) {
              e.preventDefault();
              setCurrentItems([]);
              pushHistory([], cropRect);
              setAllSelected(false);
              onToast('Cleared all drawings');
          }
      }
  };

  return (
    <div 
        ref={containerRef}
        className="w-full h-full bg-slate-200 overflow-hidden flex items-center justify-center relative outline-none"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => containerRef.current?.focus()}
    >
      <Stage
        width={window.innerWidth - 300}
        height={window.innerHeight}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onWheel={handleWheel}
        ref={stageRef}
        draggable={tool === 'select' && !pendingCrop}
      >
        <Layer>
          <Group clipFunc={cropRect ? (ctx) => {
              ctx.rect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
          } : undefined}>
            {image && (
              <KonvaImage image={image} x={0} y={0} opacity={allSelected ? 0.7 : 1} />
            )}
            {currentItems.map((item, i) => {
              const isSelected = allSelected; // We could make individual selection later
              
              if (item.tool === 'brush' || item.tool === 'highlighter') {
                return (
                  <Line
                    key={i}
                    points={item.points}
                    stroke={isSelected ? 'blue' : item.color}
                    strokeWidth={item.size}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={item.tool === 'highlighter' ? 'multiply' : 'source-over'}
                    opacity={item.tool === 'highlighter' ? 0.5 : 1}
                    shadowBlur={isSelected ? 5 : 0}
                    shadowColor="blue"
                  />
                );
              }
              if (item.tool === 'rectangle') {
                return (
                  <Rect
                    key={i}
                    x={item.x}
                    y={item.y}
                    width={item.width}
                    height={item.height}
                    stroke={isSelected ? 'blue' : item.color}
                    strokeWidth={item.size || 2} // Use stored size or default
                    shadowBlur={isSelected ? 5 : 0}
                    shadowColor="blue"
                  />
                );
              }
              if (item.tool === 'crop') {
                 // Drawing guide for crop
                 return (
                  <Rect
                    key={i}
                    x={item.x}
                    y={item.y}
                    width={item.width}
                    height={item.height}
                    stroke="red"
                    strokeWidth={2}
                    dash={[5, 5]}
                  />
                );
              }
              return null;
            })}
          </Group>
          
          {pendingCrop && (
             <Group>
                 <Rect
                    ref={pendingCropRef}
                    x={pendingCrop.x}
                    y={pendingCrop.y}
                    width={pendingCrop.width}
                    height={pendingCrop.height}
                    stroke="#00FF00"
                    strokeWidth={2}
                    dash={[10, 5]}
                    draggable
                    onTransformEnd={handleTransformEnd}
                    onDragEnd={(e) => {
                        setPendingCrop({
                            ...pendingCrop,
                            x: e.target.x(),
                            y: e.target.y()
                        });
                    }}
                 />
                 <Transformer
                    ref={transformerRef}
                    rotateEnabled={false}
                    keepRatio={false}
                    boundBoxFunc={(_, newBox) => {
                        return newBox;
                    }}
                 />
                 <Label x={pendingCrop.x} y={pendingCrop.y - 35}>
                    <Tag fill="black" opacity={0.7} pointerDirection="down" pointerWidth={10} pointerHeight={10} />
                    <Text text="Enter to Crop" fill="white" padding={5} fontSize={14} />
                 </Label>
             </Group>
          )}
        </Layer>
      </Stage>
    </div>
  );
});

export default Editor;