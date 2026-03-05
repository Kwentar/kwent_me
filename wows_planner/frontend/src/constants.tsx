import { ShipColor, ToolType } from './types';
import { Crosshair, Eraser, MousePointer2, RefreshCw, MoveUp, Circle, Pencil } from 'lucide-react';

export const COLORS = [
  { value: ShipColor.GREEN, label: 'Friendly', class: 'bg-green-500' },
  { value: ShipColor.RED, label: 'Enemy', class: 'bg-red-500' },
  { value: ShipColor.YELLOW, label: 'Neutral', class: 'bg-yellow-500' },
  { value: ShipColor.BLUE, label: 'Ally', class: 'bg-blue-500' },
  { value: ShipColor.WHITE, label: 'White', class: 'bg-white' },
  { value: ShipColor.BLACK, label: 'Black', class: 'bg-slate-900' },
];

export const TOOLS = [
  { id: ToolType.POINTER, icon: <MousePointer2 size={20} />, label: 'Move' },
  { id: ToolType.PING, icon: <Crosshair size={20} />, label: 'Ping' },
  { id: ToolType.ROTATE, icon: <RefreshCw size={20} />, label: 'Rotate' },
  { id: ToolType.ERASER, icon: <Eraser size={20} />, label: 'Erase' },
];

export const DRAW_TOOLS = [
  { id: ToolType.ARROW, icon: <MoveUp size={20} />, label: 'Arrow' },
  { id: ToolType.CIRCLE, icon: <Circle size={20} />, label: 'Circle' },
  { id: ToolType.PEN, icon: <Pencil size={20} />, label: 'Pen' },
];

export const SHIP_TOOLS = [
  { id: ToolType.SHIP_BB, label: 'Battleship', short: 'BB', symbol: 'BB' },
  { id: ToolType.SHIP_CL, label: 'Cruiser', short: 'CA/CL', symbol: 'CL' },
  { id: ToolType.SHIP_DD, label: 'Destroyer', short: 'DD', symbol: 'DD' },
  { id: ToolType.SHIP_CV, label: 'Carrier', short: 'CV', symbol: 'CV' },
  { id: ToolType.SHIP_SUB, label: 'Submarine', short: 'SS', symbol: 'SUB' },
];

export const MAP_SIZES: Record<string, number> = {
  'океан': 36,
  'соломоновы острова': 30,
  'сахалин': 30,
  'кольцо': 36,
  'пролив': 36,
  'большая гонка': 30,
  'новый рассвет': 36,
  'атлантика': 42,
  'север': 48,
  'край вулканов': 48,
  'линия разлома': 42,
  'ледяные острова': 42,
  'ловушка': 42,
  'два брата': 42,
  'огненная земля': 48,
  'осколки': 42,
  'море надежды': 48,
  'слёзы пустыни': 42,
  'к полюсу!': 24,
  'острова': 24,
  'северное сияние': 48,
  'горная цепь': 48,
  'раскол': 48,
  'окинава': 42,
  'трезубец': 42,
  'соседи': 42,
  'путь воина': 48,
  'петля': 48,
  'устье': 42,
  'сонный бохайвань': 42,
  'гавань': 42,
  'греция': 42,
  'зона крушения альфа': 42,
  'северные воды': 42,
  'фарерские острова': 42,
  'сейшельские острова': 42,
  'камчатка': 42,
  'дюнкерк': 36,
};
