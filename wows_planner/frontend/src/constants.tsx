import { ShipColor, ToolType } from './types';
import { Crosshair, Eraser, MousePointer2, RefreshCw } from 'lucide-react';

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

export const SHIP_TOOLS = [
  { id: ToolType.SHIP_BB, label: 'Battleship', short: 'BB', symbol: 'BB' },
  { id: ToolType.SHIP_CL, label: 'Cruiser', short: 'CA/CL', symbol: 'CL' },
  { id: ToolType.SHIP_DD, label: 'Destroyer', short: 'DD', symbol: 'DD' },
  { id: ToolType.SHIP_CV, label: 'Carrier', short: 'CV', symbol: 'CV' },
  { id: ToolType.SHIP_SUB, label: 'Submarine', short: 'SS', symbol: 'SUB' },
];
