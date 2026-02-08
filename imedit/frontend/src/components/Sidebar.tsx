import React from 'react';
import { 
  Square, 
  Pencil, 
  Highlighter, 
  Crop, 
  MousePointer2, 
  Download, 
  Upload, 
  Link, 
  Trash2
} from 'lucide-react';
import type { Tool } from './Editor';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  onUploadClick: () => void;
  onUrlClick: () => void;
  onDownloadClick: () => void;
  onClearDrawing: () => void;
  yoloCrop: boolean;
  setYoloCrop: (val: boolean) => void;
}

const colors = [
  '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
  '#ff00ff', '#00ffff', '#000000', '#ffffff',
  '#ffa500', '#800080'
];

const Sidebar: React.FC<SidebarProps> = ({ 
  tool, setTool, color, setColor, brushSize, setBrushSize,
  onUploadClick, onUrlClick, onDownloadClick, onClearDrawing,
  yoloCrop, setYoloCrop
}) => {
  return (
    <div className="w-64 h-full bg-white border-r border-slate-200 flex flex-col p-4 space-y-6 shadow-sm z-20">
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Kwent Snap</h1>
        <p className="text-xs text-slate-400">Simple screenshot editor</p>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tools</label>
        <div className="grid grid-cols-2 gap-2">
          <ToolButton active={tool === 'select'} onClick={() => setTool('select')} icon={<MousePointer2 size={18} />} label="Select" />
          <ToolButton active={tool === 'brush'} onClick={() => setTool('brush')} icon={<Pencil size={18} />} label="Brush" />
          <ToolButton active={tool === 'highlighter'} onClick={() => setTool('highlighter')} icon={<Highlighter size={18} />} label="Marker" />
          <ToolButton active={tool === 'rectangle'} onClick={() => setTool('rectangle')} icon={<Square size={18} />} label="Rect" />
          <ToolButton active={tool === 'crop'} onClick={() => setTool('crop')} icon={<Crop size={18} />} label="Crop" />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Colors</label>
        <div className="flex flex-wrap gap-2">
          {colors.map(c => (
            <button
              key={c}
              className={cn(
                "w-6 h-6 rounded-full border border-slate-200 transition-transform hover:scale-110",
                color === c && "ring-2 ring-blue-500 ring-offset-2 scale-110"
              )}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brush Size: {brushSize}px</label>
        <input 
          type="range" 
          min="1" 
          max="50" 
          value={brushSize} 
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settings</label>
        <label className="flex items-center space-x-2 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={yoloCrop} 
            onChange={(e) => setYoloCrop(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">YOLO Crop</span>
        </label>
      </div>

      <div className="pt-4 border-t border-slate-100 space-y-2">
        <ActionButton onClick={onUploadClick} icon={<Upload size={18} />} label="Open Image" />
        <ActionButton onClick={onUrlClick} icon={<Link size={18} />} label="Load URL" />
        <ActionButton onClick={onClearDrawing} icon={<Trash2 size={18} />} label="Clear Drawing" danger />
        <div className="pt-2">
          <button 
            onClick={onDownloadClick}
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 font-medium"
          >
            <Download size={18} />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ToolButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center p-2 rounded-lg border transition-all space-y-1",
      active 
        ? "bg-blue-50 border-blue-200 text-blue-600 shadow-inner" 
        : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200"
    )}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const ActionButton = ({ onClick, icon, label, danger }: { onClick: () => void, icon: React.ReactNode, label: string, danger?: boolean }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
      danger 
        ? "text-red-500 hover:bg-red-50" 
        : "text-slate-600 hover:bg-slate-50"
    )}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default Sidebar;