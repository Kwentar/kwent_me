import React from 'react';
import { ToolType, ShipColor } from '../types';
import { TOOLS, SHIP_TOOLS, COLORS } from '../constants';
import { ShipSymbol } from './ShipSymbol';
import { Settings2, Anchor, Lock, AlertCircle } from 'lucide-react';

interface PanelRightProps {
  selectedTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  shipConfig: { color: string; label: string };
  onUpdateShipConfig: (config: { color: string; label: string }) => void;
  pingColor: string;
  onUpdatePingColor: (color: string) => void;
  readOnly?: boolean;
}

export const PanelRight: React.FC<PanelRightProps> = ({
  selectedTool,
  onSelectTool,
  shipConfig,
  onUpdateShipConfig,
  pingColor,
  onUpdatePingColor,
  readOnly = false
}) => {
  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-10 shadow-xl">
      <div className="p-4 border-b border-slate-800 bg-slate-950/50">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Settings2 className="text-blue-500" /> Instruments
        </h2>
        <p className="text-xs text-slate-400 mt-1">
            {readOnly ? 'Visual Signaling Only' : 'Tools and customization'}
        </p>
      </div>

      <div className="p-4 overflow-y-auto flex-grow space-y-6">
        
        {/* READ ONLY MODE UI */}
        {readOnly ? (
            <div className="space-y-6">
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 flex items-start gap-3">
                    <div className="bg-slate-900 p-2 rounded-lg text-slate-400">
                        <Lock size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-200">Restricted Access</h4>
                        <p className="text-xs text-slate-500 mt-1">You do not have command authority on this tablet. Click on the map to signal positions (Ping).</p>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">Signal Color</label>
                    <div className="flex flex-wrap gap-3">
                        {COLORS.map(c => (
                            <button
                                key={c.value}
                                onClick={() => onUpdatePingColor(c.value)}
                                className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-transform ${c.class} ${pingColor === c.value ? 'border-white scale-110 shadow-lg' : 'border-slate-800 opacity-60 hover:opacity-100'}`}
                                title={c.label}
                            >
                                {pingColor === c.value && <div className="w-2 h-2 bg-current rounded-full mix-blend-difference" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            /* FULL EDIT MODE UI */
            <>
                {/* Basic Tools */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">Map Tools</label>
                    <div className="grid grid-cols-2 gap-2">
                        {TOOLS.map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => onSelectTool(tool.id)}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${selectedTool === tool.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                            >
                                {tool.icon}
                                <span className="text-xs mt-1 font-medium">{tool.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Ship Tools */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">Place Unit</label>
                    <div className="grid grid-cols-1 gap-2">
                        {SHIP_TOOLS.map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => onSelectTool(tool.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${selectedTool === tool.id ? 'bg-slate-800 border-blue-500 ring-1 ring-blue-500' : 'bg-slate-900 border-slate-800 hover:bg-slate-800'}`}
                            >
                                <div className="w-8 h-8 flex items-center justify-center bg-slate-950 rounded border border-slate-700">
                                    <ShipSymbol type={(tool as any).symbol} color={selectedTool === tool.id ? shipConfig.color : '#64748b'} size={24} />
                                </div>
                                <div>
                                    <div className={`font-bold text-sm ${selectedTool === tool.id ? 'text-blue-400' : 'text-slate-300'}`}>{tool.label}</div>
                                    <div className="text-[10px] text-slate-500">{tool.short} Class Hull</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Configuration (Ping) */}
                {selectedTool === ToolType.PING && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-400 mb-2 block">Ping Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map(c => (
                                        <button
                                            key={c.value}
                                            onClick={() => onUpdatePingColor(c.value)}
                                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${c.class} ${pingColor === c.value ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80'}`}
                                            title={c.label}
                                        >
                                            {pingColor === c.value && <div className="w-2 h-2 bg-current rounded-full mix-blend-difference" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Configuration (Only if a ship tool is selected) */}
                {[...SHIP_TOOLS.map(t => t.id)].includes(selectedTool) && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-400 mb-2 block">Unit Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map(c => (
                                        <button
                                            key={c.value}
                                            onClick={() => onUpdateShipConfig({ ...shipConfig, color: c.value })}
                                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${c.class} ${shipConfig.color === c.value ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80'}`}
                                            title={c.label}
                                        >
                                            {shipConfig.color === c.value && <div className="w-2 h-2 bg-current rounded-full mix-blend-difference" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-400 mb-2 block">Tactical Label</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        maxLength={10}
                                        value={shipConfig.label}
                                        onChange={(e) => onUpdateShipConfig({ ...shipConfig, label: e.target.value })}
                                        placeholder="Callsign (e.g. ALPHA)"
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 uppercase font-mono"
                                    />
                                    <div className="absolute right-2 top-2 text-[10px] text-slate-600 font-mono">
                                        {shipConfig.label.length}/10
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};