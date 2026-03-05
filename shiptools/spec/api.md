Метод: https://api.korabli.su/mk/encyclopedia/ships/
Параметры:
application_id*
Идентификатор приложения

fields
string, list
Поля ответа. Поля разделяются запятыми. Вложенные поля разделяются точками. Для исключения поля используется знак «-» перед названием поля. Если параметр не указан, возвращаются все поля. Максимальное ограничение: 100.

language
string
Язык локализации. По умолчанию: "ru". Допустимые значения:

"cs" — Čeština
"de" — Deutsch
"en" — English
"es" — Español
"fr" — Français
"it" — Italiano
"ja" — 日本語
"pl" — Polski
"ru" — Русский (используется по умолчанию)
"th" — ไทย
"zh-tw" — 繁體中文
"zh-cn" — 中文
"tr" — Türkçe
"pt-br" — Português do Brasil
"es-mx" — Español (México)
limit
numeric
Количество возвращаемых записей (может вернуться меньше записей, но не больше 100). Если переданный лимит превышает 100, тогда автоматически выставляется лимит в 100 (по умолчанию).

nation
string, list
Нация. Максимальное ограничение: 100.

page_no
numeric
Номер страницы результатов. По умолчанию: 1. Минимальное значение: 1.

ship_id
numeric, list
Идентификатор корабля. Максимальное ограничение: 100.

type
string, list
Класс корабля. Максимальное ограничение: 100. Допустимые значения:

"AirCarrier" — Авианосец
"Battleship" — Линкор
"Destroyer" — Эсминец
"Cruiser" — Крейсер
"Submarine" — Submarine

ОТВЕТ

Поле	Тип	Описание
description	string	
Описание корабля

has_demo_profile	boolean	
Показывает, что характеристики корабля приведены для примера и могут быть изменены.

is_premium	boolean	
Показывает, является ли корабль премиум кораблём

is_special	boolean	
Показывает, является ли корабль акционным

mod_slots	numeric	
Количество слотов модернизаций

name	string	
Название корабля

nation	string	
Нация

next_ships	associative array	
Список доступных для исследования кораблей в виде пар

price_credit	numeric	
Стоимость покупки в серебре

price_gold	numeric	
Стоимость покупки в золоте

ship_id	numeric	
Идентификатор корабля

ship_id_str	string	
Строковый идентификатор корабля

tier	numeric	
Уровень

type	string	
Класс корабля

upgrades	list of integers	
Список совместимых Модификаций

default_profile		
Характеристики базовой комплектации

default_profile.battle_level_range_max	numeric	
Максимальный уровень случайного боя

default_profile.battle_level_range_min	numeric	
Минимальный уровень случайного боя

default_profile.anti_aircraft		
Орудия противовоздушной обороны. Если модуль отсутствует на корабле, полю присваивается значение null.

default_profile.anti_aircraft.defense	numeric	
Эффективность ПВО

default_profile.anti_aircraft.slots		
Слоты орудий

default_profile.anti_aircraft.slots.avg_damage	numeric	
Средний урон в секунду

default_profile.anti_aircraft.slots.caliber	numeric	
Калибр

default_profile.anti_aircraft.slots.distance	float	
Дальность стрельбы (км)

default_profile.anti_aircraft.slots.guns	numeric	
Количество орудий

default_profile.anti_aircraft.slots.name	string	
Название орудия

default_profile.armour		
Живучесть базовой комплектации

default_profile.armour.flood_damage	numeric	
ПТЗ. Снижение урона (%)

default_profile.armour.flood_prob	numeric	
ПТЗ. Снижение вероятности затопления (%)

default_profile.armour.health	numeric	
Боеспособность

default_profile.armour.total	numeric	
Показатель защищённости (%)

default_profile.armour.casemate		
Орудийный каземат

default_profile.armour.casemate.max	numeric	
Максимальное значение

default_profile.armour.casemate.min	numeric	
Минимальное значение

default_profile.armour.citadel		
Цитадель

default_profile.armour.citadel.max	numeric	
Максимальное значение

default_profile.armour.citadel.min	numeric	
Минимальное значение

default_profile.armour.deck		
Броневая палуба

default_profile.armour.deck.max	numeric	
Максимальное значение

default_profile.armour.deck.min	numeric	
Минимальное значение

default_profile.armour.extremities		
Носовая и кормовая оконечности

default_profile.armour.extremities.max	numeric	
Максимальное значение

default_profile.armour.extremities.min	numeric	
Минимальное значение

default_profile.armour.range		
Бронирование

default_profile.armour.range.max	numeric	
Максимальное значение

default_profile.armour.range.min	numeric	
Минимальное значение

default_profile.artillery		
Главный калибр. Если модуль отсутствует на корабле, полю присваивается значение null.

default_profile.artillery.artillery_id	numeric	
Идентификатор орудия

default_profile.artillery.artillery_id_str	string	
Строковый идентификатор орудия

default_profile.artillery.distance	float	
Дальность стрельбы

default_profile.artillery.gun_rate	float	
Скорострельность (выстр / мин)

default_profile.artillery.max_dispersion	numeric	
Максимальное рассеивание (м)

default_profile.artillery.rotation_time	float	
Время поворота на 180 градусов (с)

default_profile.artillery.shot_delay	float	
Время перезарядки орудий ГК в секундах

default_profile.artillery.shells		
Снаряды

default_profile.artillery.shells.bullet_mass	numeric	
Масса снаряда

default_profile.artillery.shells.bullet_speed	numeric	
Скорость снаряда

default_profile.artillery.shells.burn_probability	float	
Вероятность пожара при попадании в цель снарядом (%)

default_profile.artillery.shells.damage	numeric	
Максимальный урон

default_profile.artillery.shells.name	string	
Название снаряда

default_profile.artillery.shells.type	string	
Тип снаряда

default_profile.artillery.slots		
Слоты орудий

default_profile.artillery.slots.barrels	numeric	
Количество стволов в слоте

default_profile.artillery.slots.guns	numeric	
Количество башен главного калибра

default_profile.artillery.slots.name	string	
Название

default_profile.atbas		
Вспомогательный калибр. Если модуль отсутствует на корабле, полю присваивается значение null.

default_profile.atbas.distance	float	
Дальность стрельбы

default_profile.atbas.slots		
Слоты орудий

default_profile.atbas.slots.bullet_mass	numeric	
Масса снаряда

default_profile.atbas.slots.bullet_speed	numeric	
Скорость снаряда

default_profile.atbas.slots.burn_probability	float	
Вероятность пожара при попадании в цель снарядом (%)

default_profile.atbas.slots.damage	numeric	
Максимальный урон

default_profile.atbas.slots.gun_rate	float	
Скорострельность (выстр / мин)

default_profile.atbas.slots.name	string	
Название снаряда

default_profile.atbas.slots.shot_delay	float	
Время перезарядки в секундах

default_profile.atbas.slots.type	string	
Тип снаряда

default_profile.concealment		
Маскировка базовой комплектации

default_profile.concealment.detect_distance_by_plane	float	
Дальность видимости с самолётов

default_profile.concealment.detect_distance_by_ship	float	
Дальность видимости с кораблей

default_profile.concealment.detect_distance_by_submarine	float	
Detectability range by depths

default_profile.concealment.total	numeric	
Показатель маскировки (%)

default_profile.depth_charge		
Depth charges

default_profile.depth_charge.bomb_max_damage	numeric	
Maximum damage

default_profile.depth_charge.max_packs	numeric	
Number of charges

default_profile.depth_charge.num_bombs_in_pack	numeric	
Bombs in charge

default_profile.depth_charge.reload_time	float	
Время перезарядки

default_profile.dive_bomber		
Пикирующие бомбардировшики. Если модуль отсутствует на корабле, полю присваивается значение null.

default_profile.dive_bomber.bomb_bullet_mass	numeric	
Масса авиабомбы

default_profile.dive_bomber.bomb_burn_probability	float	
Вероятность пожара при попадании в цель бомбой (%)

default_profile.dive_bomber.bomb_damage	numeric	
Максимальный урон бомбой

default_profile.dive_bomber.bomb_name	string	
Название бомбы

default_profile.dive_bomber.cruise_speed	numeric	
Крейсерская скорость (узлы)

default_profile.dive_bomber.dive_bomber_id	numeric	
Идентификатор пикирующих бомбардировщиков

default_profile.dive_bomber.dive_bomber_id_str	string	
Строковый идентификатор пикирующих бомбардировщиков

default_profile.dive_bomber.gunner_damage	numeric	
Средний урон бортстрелка пикирующего бомбардировщика в секунду

default_profile.dive_bomber.max_damage	numeric	
Максимальный урон бомбой

default_profile.dive_bomber.max_health	numeric	
Живучесть

default_profile.dive_bomber.name	string	
Название эскадрильи

default_profile.dive_bomber.plane_level	numeric	
Уровень пикирующего бомбардировщика

default_profile.dive_bomber.prepare_time	numeric	
Время подготовки к взлёту

default_profile.dive_bomber.squadrons	numeric	
Количество эскадрилий

default_profile.dive_bomber.accuracy		
Точность

default_profile.dive_bomber.accuracy.max	float	
Максимальное значение

default_profile.dive_bomber.accuracy.min	float	
Минимальное значение

default_profile.dive_bomber.count_in_squadron		
Количество самолётов в одной эскадрилье

default_profile.dive_bomber.count_in_squadron.max	numeric	
Максимальное значение

default_profile.dive_bomber.count_in_squadron.min	numeric	
Минимальное значение

default_profile.engine		
Двигатель

default_profile.engine.engine_id	numeric	
Идентификатор двигателя

default_profile.engine.engine_id_str	string	
Строковый идентификатор двигателя

default_profile.engine.max_speed	float	
Максимальная скорость хода (узлы)

default_profile.fighters		
Истребители. Если модуль отсутствует на корабле, полю присваивается значение null.

default_profile.fighters.avg_damage	numeric	
Средний урон в секунду

default_profile.fighters.cruise_speed	numeric	
Крейсерская скорость (узлы)

default_profile.fighters.fighters_id	numeric	
Идентификатор истребителей

default_profile.fighters.fighters_id_str	string	
Строковый идентификатор истребителей

default_profile.fighters.gunner_damage	numeric	
Средний урон стрелка истребителя в секунду

default_profile.fighters.max_ammo	numeric	
Боекомплект

default_profile.fighters.max_health	numeric	
Живучесть

default_profile.fighters.name	string	
Название эскадрильи

default_profile.fighters.plane_level	numeric	
Уровень истребителя

default_profile.fighters.prepare_time	numeric	
Время подготовки к взлёту

default_profile.fighters.squadrons	numeric	
Количество эскадрилий

default_profile.fighters.count_in_squadron		
Количество самолётов в одной эскадрилье

default_profile.fighters.count_in_squadron.max	numeric	
Максимальное значение

default_profile.fighters.count_in_squadron.min	numeric	
Минимальное значение

default_profile.fire_control		
Система управления огнём. Если модуль отсутствует на корабле, полю присваивается значение null.

default_profile.fire_control.distance	float	
Дальность стрельбы

default_profile.fire_control.distance_increase	numeric	
Увеличение дальности стрельбы (%)

default_profile.fire_control.fire_control_id	numeric	
Идентификатор системы управления огнём

default_profile.fire_control.fire_control_id_str	string	
Строковый идентификатор системы управления огнём

default_profile.flight_control		
Полётный контроль. Если модуль отсутствует на корабле, полю присваивается значение null.

default_profile.flight_control.bomber_squadrons	numeric	
Количество эскадрилий бомбардировщиков

default_profile.flight_control.fighter_squadrons	numeric	
Количество эскадрилий истребителей

default_profile.flight_control.flight_control_id	numeric	
Идентификатор полётного контроля

default_profile.flight_control.flight_control_id_str	string	
Строковый идентификатор полётного контроля

default_profile.flight_control.torpedo_squadrons	numeric	
Количество эскадрилий торпедоносцев

default_profile.hull		
Корпус

default_profile.hull.anti_aircraft_barrels	numeric	
Точки ПВО

default_profile.hull.artillery_barrels	numeric	
Количество башен главного калибра

default_profile.hull.atba_barrels	numeric	
Башни вспомогательного калибра

default_profile.hull.health	numeric	
Боеспособность

default_profile.hull.hull_id	numeric	
Идентификатор корпуса

default_profile.hull.hull_id_str	string	
Строковый идентификатор корпуса

default_profile.hull.planes_amount	numeric	
Вместимость ангара

default_profile.hull.torpedoes_barrels	numeric	
Торпедные аппараты

default_profile.hull.range		
Бронирование (мм)

default_profile.hull.range.max	numeric	
Максимальное значение

default_profile.hull.range.min	numeric	
Минимальное значение

default_profile.mobility		
Манёвренность базовой комплектации

default_profile.mobility.max_speed	float	
Максимальная скорость (узлы)

default_profile.mobility.rudder_time	float	
Время перекладки руля (с)

default_profile.mobility.total	numeric	
Показатель манёвренности (%)

default_profile.mobility.turning_radius	numeric	
Радиус циркуляции (м)

default_profile.submarine_battery		
Dive capacity of basic configuration

default_profile.submarine_battery.consumption_rate	float	
Dive capacity depletion

default_profile.submarine_battery.max_capacity	float	
Dive capacity

default_profile.submarine_battery.regen_rate	float	
Dive capacity recharge rate

default_profile.submarine_battery.total	numeric	
Dive capacity (%)

default_profile.submarine_mobility		
Underwater maneuvering of basic configuration

default_profile.submarine_mobility.buoyancy_rudder_time	float	
Diving plane shift time

default_profile.submarine_mobility.max_buoyancy_speed	float	
Maximum dive and ascent speed

default_profile.submarine_mobility.max_speed_under_water	numeric	
Maximum submerged speed

default_profile.submarine_mobility.total	numeric	
Underwater maneuvering (%)

default_profile.submarine_sonar		
Sonar of basic configuration

default_profile.submarine_sonar.submarine_sonar_id	numeric	
Sonar ID

default_profile.submarine_sonar.submarine_sonar_id_str	string	
Sonar string ID

default_profile.submarine_sonar.total	numeric	
Sonar (%)

default_profile.submarine_sonar.wave_duration_0	numeric	
Duration of a ping effect on a sector highlighted once

default_profile.submarine_sonar.wave_duration_1	numeric	
Duration of a ping effect on a sector highlighted twice

default_profile.submarine_sonar.wave_max_dist	float	
Maximum range

default_profile.submarine_sonar.wave_shot_delay	float	
Время перезарядки

default_profile.submarine_sonar.wave_speed_max	numeric	
Ping velocity

default_profile.submarine_sonar.wave_width	numeric	
Ping width

default_profile.torpedo_bomber		
Торпедоносцы. Если модуль отсутствует на корабле, полю присваивается значение null.

default_profile.torpedo_bomber.cruise_speed	numeric	
Крейсерская скорость (узлы)

default_profile.torpedo_bomber.gunner_damage	numeric	
Средний урон бортстрелка торпедоносца в секунду

default_profile.torpedo_bomber.max_damage	numeric	
Максимальный урон бомбой

default_profile.torpedo_bomber.max_health	numeric	
Живучесть

default_profile.torpedo_bomber.name	string	
Название эскадрильи

default_profile.torpedo_bomber.plane_level	numeric	
Уровень торпедоносца

default_profile.torpedo_bomber.prepare_time	numeric	
Время подготовки к взлёту

default_profile.torpedo_bomber.squadrons	numeric	
Количество эскадрилий

default_profile.torpedo_bomber.torpedo_bomber_id	numeric	
Идентификатор торпедоносцев

default_profile.torpedo_bomber.torpedo_bomber_id_str	string	
Строковый идентификатор торпедоносцев

default_profile.torpedo_bomber.torpedo_damage	numeric	
Максимальный урон торпедой

default_profile.torpedo_bomber.torpedo_distance	float	
Дальность стрельбы

default_profile.torpedo_bomber.torpedo_max_speed	numeric	
Максимальная скорость (узлы)

default_profile.torpedo_bomber.torpedo_name	string	
Название торпеды

default_profile.torpedo_bomber.count_in_squadron		
Количество самолётов в одной эскадрилье

default_profile.torpedo_bomber.count_in_squadron.max	numeric	
Максимальное значение

default_profile.torpedo_bomber.count_in_squadron.min	numeric	
Минимальное значение

default_profile.torpedoes		
Торпедный аппарат. Если модуль отсутствует на корабле, полю присваивается значение null.

default_profile.torpedoes.distance	float	
Дальность стрельбы

default_profile.torpedoes.max_damage	numeric	
Максимальный урон

default_profile.torpedoes.reload_time	numeric	
Время перезарядки (с)

default_profile.torpedoes.rotation_time	float	
Время поворота на 180 градусов (с)

default_profile.torpedoes.torpedo_name	string	
Торпеда

default_profile.torpedoes.torpedo_speed	numeric	
Скорость хода торпед (узлы)

default_profile.torpedoes.torpedoes_id	numeric	
Идентификатор торпедного аппарата

default_profile.torpedoes.torpedoes_id_str	string	
Строковый идентификатор торпедного аппарата

default_profile.torpedoes.visibility_dist	float	
Дальность хода торпед в километрах

default_profile.torpedoes.slots		
Слоты торпедных аппаратов

default_profile.torpedoes.slots.barrels	numeric	
Количество труб в торпедном аппарате

default_profile.torpedoes.slots.caliber	numeric	
Калибр

default_profile.torpedoes.slots.guns	numeric	
Торпедные аппараты

default_profile.torpedoes.slots.name	string	
Название

default_profile.weaponry		
Мощность вооружения базовой комплектации

default_profile.weaponry.aircraft	numeric	
Авиации (%)

default_profile.weaponry.anti_aircraft	numeric	
ПВО (%)

default_profile.weaponry.artillery	numeric	
Артиллерии (%)

default_profile.weaponry.torpedoes	numeric	
Торпед (%)

images		
Изображения корабля

images.large	string	
URL к изображению корабля в размере 870 x 512 пкс

images.medium	string	
URL к изображению корабля в размере 435 x 256 пкс

images.small	string	
URL к изображению корабля в размере 214 x 126 пкс

modules		
Список совместимых модулей

modules.artillery	list of integers	
Главный калибр. Если модуль отсутствует на корабле, полю присваивается значение null.

modules.dive_bomber	list of integers	
Пикирующие бомбардировшики. Если модуль отсутствует на корабле, полю присваивается значение null.

modules.engine	list of integers	
Двигатели

modules.fighter	list of integers	
Истребители. Если модуль отсутствует на корабле, полю присваивается значение null.

modules.fire_control	list of integers	
Система управления огнём. Если модуль отсутствует на корабле, полю присваивается значение null.

modules.flight_control	list of integers	
Полётный контроль. Если модуль отсутствует на корабле, полю присваивается значение null.

modules.hull	list of integers	
Корпус

modules.sonar	list of integers	
Sonar

modules.torpedo_bomber	list of integers	
Торпедоносцы. Если модуль отсутствует на корабле, полю присваивается значение null.

modules.torpedoes	list of integers	
Торпедный аппарат. Если модуль отсутствует на корабле, полю присваивается значение null.

modules_tree		
Информация об исследовании модулей

modules_tree.is_default	boolean	
Показывает, является ли модуль базовым

modules_tree.module_id	numeric	
Идентификатор модуля

modules_tree.module_id_str	string	
Строковый идентификатор модуля

modules_tree.name	string	
Название модуля

modules_tree.next_modules	list of integers	
Список идентификаторов модулей, доступных после исследования модуля

modules_tree.next_ships	list of integers	
Список идентификаторов техники доступной после исследования модуля

modules_tree.price_credit	numeric	
Стоимость в серебре

modules_tree.price_xp	numeric	
Стоимость исследования

modules_tree.type	string	
Тип модуля