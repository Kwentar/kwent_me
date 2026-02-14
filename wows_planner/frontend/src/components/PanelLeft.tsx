import React, { useState } from 'react';
import { Layer, SessionUser, User } from '../types';
import { Layers, Plus, Trash2, Map, Upload, Eye, EyeOff, Users, Shield, Lock, Unlock, User as UserIcon, Edit2 } from 'lucide-react';

interface PanelLeftProps {
  layers: Layer[];
  activeLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onUpdateLayerMap: (id: string, url: string) => void;
  onToggleVisibility: (id: string) => void;
  
  // New props for User Management
  currentUser: User | null;
  sessionUsers: SessionUser[];
  isOwner: boolean;
  onToggleUserPermission: (userId: string) => void;
  onUpdateUserName: (name: string) => void;
  readOnly: boolean;
}

export const PanelLeft: React.FC<PanelLeftProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onUpdateLayerMap,
  onToggleVisibility,
  currentUser,
  sessionUsers,
  isOwner,
  onToggleUserPermission,
  onUpdateUserName,
  readOnly
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const handleStartEdit = (name: string) => {
      setNewName(name);
      setIsEditingName(true);
  };

  const handleSaveName = () => {
      if (newName.trim()) {
          onUpdateUserName(newName.trim());
          setIsEditingName(false);
      }
  };


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeLayerId) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onUpdateLayerMap(activeLayerId, ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleUrlSubmit = () => {
    if (activeLayerId && urlInput) {
        onUpdateLayerMap(activeLayerId, urlInput);
        setUrlInput('');
    }
  };

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full z-10 shadow-xl">
      {/* SECTION 1: LAYERS */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Layers className="text-blue-500" /> Tactical Layers
        </h2>
      </div>

      <div className="flex-grow overflow-y-auto p-2 space-y-2 min-h-0 border-b border-slate-800">
        {layers.map(layer => (
          <div 
            key={layer.id}
            onClick={() => onSelectLayer(layer.id)}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${activeLayerId === layer.id ? 'bg-slate-800 border-blue-500 shadow-md shadow-blue-900/20' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-slate-200">{layer.name}</span>
               <div className="flex gap-1">
                 <button 
                   onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                   className={`p-1 hover:text-blue-400 ${readOnly ? 'cursor-not-allowed opacity-50' : ''} text-slate-500`}
                   disabled={readOnly}
                 >
                   {layer.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                 </button>
                 {!readOnly && layers.length > 1 && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }}
                        className="p-1 hover:text-red-400 text-slate-500"
                    >
                        <Trash2 size={16} />
                    </button>
                 )}
               </div>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
                <Map size={12} />
                {layer.backgroundImage ? 'Map Loaded' : 'No Map Background'}
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 2: LAYER CONTROLS (Hidden if read only) */}
      {!readOnly && (
        <div className="p-4 border-b border-slate-800 space-y-4 bg-slate-950/30">
          <button 
              onClick={onAddLayer}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md flex items-center justify-center gap-2 transition-colors font-medium text-sm"
          >
              <Plus size={16} /> New Layer
          </button>

          {activeLayerId && (
              <div className="space-y-3 pt-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Background Map</label>
                  
                  <div className="relative group">
                      <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="border-2 border-dashed border-slate-700 rounded-md p-3 flex items-center justify-center gap-2 text-sm text-slate-400 group-hover:border-blue-500 group-hover:text-blue-400 transition-colors">
                          <Upload size={16} /> Upload Image
                      </div>
                  </div>

                  <div className="flex gap-2">
                      <input 
                          type="text" 
                          placeholder="Or paste image URL..."
                          className="flex-grow bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                      />
                      <button 
                          onClick={handleUrlSubmit}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 rounded border border-slate-700 text-xs"
                      >
                          Set
                      </button>
                  </div>
              </div>
          )}
        </div>
      )}

      {/* SECTION 3: ACTIVE USERS */}
      {currentUser && (
          <div className="flex-shrink-0 flex flex-col h-1/3 min-h-[150px]">
             <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Users className="text-green-500" size={16} /> Active Personnel
                </h2>
             </div>
             <div className="overflow-y-auto p-2 space-y-1">
                 {sessionUsers.map(u => (
                     <div 
                        key={u.id}
                        onClick={() => onToggleUserPermission(u.id)}
                        className={`flex items-center justify-between p-2 rounded border ${isOwner && u.id !== currentUser.id ? 'cursor-pointer hover:bg-slate-800' : 'cursor-default'} ${u.id === currentUser.id ? 'bg-slate-800/30 border-slate-700' : 'border-transparent'}`}
                     >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                {u.avatarUrl ? (
                                    <img src={u.avatarUrl} className="w-8 h-8 rounded-full bg-slate-700" alt="av" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                                        <UserIcon size={14} />
                                    </div>
                                )}
                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${u.isOnline ? 'bg-green-500' : 'bg-slate-500'}`} />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-slate-200 flex items-center gap-1">
                                    {u.id === currentUser?.id && isEditingName ? (
                                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                            <input 
                                                value={newName} 
                                                onChange={e => setNewName(e.target.value)}
                                                className="bg-slate-950 border border-blue-500 rounded px-1 py-0.5 text-xs text-white w-24"
                                                autoFocus
                                                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                                            />
                                            <button onClick={handleSaveName} className="text-green-500 hover:text-green-400">✓</button>
                                        </div>
                                    ) : (
                                        <>
                                            {u.name}
                                            {u.id === currentUser?.id && (
                                                <>
                                                    <span className="text-[10px] text-slate-500">(You)</span>
                                                    <button onClick={(e) => { e.stopPropagation(); handleStartEdit(u.name); }} className="text-slate-500 hover:text-blue-400 ml-1">
                                                        <Edit2 size={10} />
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="text-[10px] uppercase font-bold tracking-wide flex items-center gap-1">
                                    {u.isOwner ? (
                                        <span className="text-yellow-500 flex items-center gap-0.5"><Shield size={8} fill="currentColor" /> COMMANDER</span>
                                    ) : u.canEdit ? (
                                        <span className="text-blue-400">OFFICER</span>
                                    ) : (
                                        <span className="text-slate-500">OBSERVER</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Permission Toggle Icon (Only visible to owner, for other users) */}
                        {isOwner && u.id !== currentUser.id && (
                            <div title={u.canEdit ? "Revoke Access" : "Grant Access"}>
                                {u.canEdit ? <Unlock size={14} className="text-blue-500" /> : <Lock size={14} className="text-slate-600" />}
                            </div>
                        )}
                     </div>
                 ))}
             </div>
          </div>
      )}
    </div>
  );
};
