import React, { useState, useEffect } from 'react';
import { PanelLeft } from './PanelLeft';
import { PanelRight } from './PanelRight';
import { TacticalMap } from './TacticalMap';
import { Layer, ToolType, TacticalItem, ShipColor, Ping, Tablet, User, SessionUser } from '../types';
import { Wifi, ArrowLeft, ShieldCheck, Eye } from 'lucide-react';

interface TabletViewProps {
  user: User | null; // Current logged in user
  tablet: Tablet;
  onUpdateTablet: (updatedTablet: Tablet) => void;
  onBack: () => void;
}

const MOCK_BOT_USERS: SessionUser[] = [
    { id: 'bot-1', name: 'Lt. Anderson', email: '', avatarUrl: undefined, isOnline: true, canEdit: false, isOwner: false },
    { id: 'bot-2', name: 'Ens. Jenkins', email: '', avatarUrl: undefined, isOnline: true, canEdit: false, isOwner: false },
];

export const TabletView: React.FC<TabletViewProps> = ({ user, tablet, onUpdateTablet, onBack }) => {
  // --- Permissions Logic ---
  const isOwner = user?.id === tablet.ownerId;
  const [sessionUsers, setSessionUsers] = useState<SessionUser[]>([]);
  
  // Find current user in the session list to check dynamic permissions
  const mySessionUser = sessionUsers.find(u => u.id === user?.id);
  
  // Final permission check: Owner OR (Logged In AND Granted Edit Rights)
  const canEdit = isOwner || (!!user && mySessionUser?.canEdit === true);

  // --- State ---
  const [layers, setLayers] = useState<Layer[]>(tablet.layers);
  const [activeLayerId, setActiveLayerId] = useState<string>(tablet.layers.length > 0 ? tablet.layers[0].id : '');
  const [selectedTool, setSelectedTool] = useState<ToolType>(ToolType.POINTER);
  
  // Configuration State
  const [shipConfig, setShipConfig] = useState<{ color: string; label: string }>({
    color: ShipColor.GREEN,
    label: ''
  });
  const [pingColor, setPingColor] = useState<string>(ShipColor.WHITE);
  const [pings, setPings] = useState<Ping[]>([]);
  
  const [isOnline, setIsOnline] = useState(true);

  // --- Initialization Effect ---
  useEffect(() => {
    // Build initial user list
    let users: SessionUser[] = [...MOCK_BOT_USERS];
    
    // Add Owner (if not me)
    if (!isOwner && tablet.ownerId !== user?.id) {
         // In a real app we'd fetch owner details
         users.push({ id: tablet.ownerId, name: 'Owner (Host)', email: '', isOnline: true, canEdit: true, isOwner: true });
    }

    // Add Me
    if (user) {
        users.push({
            ...user,
            isOnline: true,
            canEdit: isOwner, // Owners start with edit, others don't
            isOwner: isOwner
        });
    } else {
        // Guest user
        users.push({
            id: 'guest-' + Math.random(),
            name: 'Guest Observer',
            email: '',
            isOnline: true,
            canEdit: false,
            isOwner: false
        });
    }
    
    setSessionUsers(users);
  }, [user, tablet.ownerId, isOwner]);

  // --- Handlers ---

  const handleToggleUserPermission = (userId: string) => {
      if (!isOwner) return; // Only owner can toggle
      if (userId === user?.id) return; // Can't toggle self (as owner)

      setSessionUsers(prev => prev.map(u => {
          if (u.id === userId) {
              return { ...u, canEdit: !u.canEdit };
          }
          return u;
      }));
  };

  const updateTabletData = (newLayers: Layer[]) => {
      if (!canEdit) return; // Double check
      setLayers(newLayers);
      onUpdateTablet({
          ...tablet,
          layers: newLayers,
          lastModified: Date.now()
      });
  };

  const handleUpdateLayer = (layerId: string, items: TacticalItem[]) => {
    if (!canEdit) return;
    const newLayers = layers.map(l => l.id === layerId ? { ...l, items } : l);
    updateTabletData(newLayers);
  };

  const handleUpdateLayerMap = (layerId: string, url: string) => {
    if (!canEdit) return;
    const newLayers = layers.map(l => l.id === layerId ? { ...l, backgroundImage: url } : l);
    updateTabletData(newLayers);
  };

  const handleAddLayer = () => {
    if (!canEdit) return;
    const newLayer: Layer = {
      id: crypto.randomUUID(),
      name: `Tactic ${layers.length + 1}`,
      items: [],
      isVisible: true,
      backgroundImage: null
    };
    const newLayers = [...layers, newLayer];
    updateTabletData(newLayers);
    setActiveLayerId(newLayer.id);
  };

  const handleDeleteLayer = (id: string) => {
    if (!canEdit) return;
    if (layers.length <= 1) return;
    const newLayers = layers.filter(l => l.id !== id);
    updateTabletData(newLayers);
    if (activeLayerId === id) {
        setActiveLayerId(newLayers[0].id);
    }
  };

  const handlePing = (x: number, y: number) => {
    const newPing: Ping = {
        id: crypto.randomUUID(),
        x,
        y,
        color: pingColor, // Use the selected ping color
        createdAt: Date.now()
    };
    setPings(prev => [...prev, newPing]);
    setTimeout(() => {
        setPings(prev => prev.filter(p => p.id !== newPing.id));
    }, 1500);
  };

  // --- Effects ---

  // Ensure active layer is valid
  useEffect(() => {
      if (layers.length > 0 && !layers.find(l => l.id === activeLayerId)) {
          setActiveLayerId(layers[0].id);
      }
  }, [layers, activeLayerId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setSelectedTool(ToolType.POINTER);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeLayer = layers.find(l => l.id === activeLayerId);

  return (
    <div className="flex h-screen w-screen bg-black text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* LEFT PANEL */}
      <PanelLeft 
        layers={layers}
        activeLayerId={activeLayerId}
        onSelectLayer={setActiveLayerId}
        onAddLayer={handleAddLayer}
        onDeleteLayer={handleDeleteLayer}
        onUpdateLayerMap={handleUpdateLayerMap}
        onToggleVisibility={(id) => {
             // Visibility can be local for viewer, but strictly it updates state so let's allow it locally or restrict?
             // Prompt says "Unred layers" for logged in. Let's assume view toggle is local for convenience or restricted.
             // For now, let's treat layer visibility as a shared state for simplicity.
             if (!canEdit) return; 
             const newLayers = layers.map(l => l.id === id ? { ...l, isVisible: !l.isVisible } : l);
             updateTabletData(newLayers);
        }}
        // User List Props
        currentUser={user}
        sessionUsers={sessionUsers}
        isOwner={isOwner}
        onToggleUserPermission={handleToggleUserPermission}
        readOnly={!canEdit}
      />

      {/* CENTER STAGE */}
      <main className="flex-grow flex flex-col relative z-0">
        {/* Header / Top Bar */}
        <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onBack}
                    className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="font-bold text-lg tracking-wider text-slate-100 uppercase flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-600 rounded-sm"></span>
                    {tablet.name}
                </h1>
                {!canEdit && (
                    <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Eye size={12} /> View Only
                    </span>
                )}
                {canEdit && (
                    <span className="bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded flex items-center gap-1 border border-blue-500/30">
                        <ShieldCheck size={12} /> Command Mode
                    </span>
                )}
            </div>
            
            <div className="flex items-center gap-6 text-xs font-mono text-slate-400">
                 <div className="flex items-center gap-2" title="Simulation Mode Active">
                    <Wifi size={14} className={isOnline ? "text-green-500" : "text-red-500"} />
                    <span>{isOnline ? "NET: ONLINE" : "NET: OFFLINE"}</span>
                 </div>
                 <div className="px-2 py-1 bg-slate-800 rounded border border-slate-700">
                    ID: <span className="text-white">{tablet.id.substring(0,6).toUpperCase()}</span>
                 </div>
            </div>
        </div>

        {/* The Map */}
        <div className="flex-grow relative bg-slate-950">
            <TacticalMap 
                activeLayer={activeLayer}
                selectedTool={canEdit ? selectedTool : ToolType.PING} // Force PING tool if read-only
                onUpdateLayer={handleUpdateLayer}
                shipConfig={shipConfig}
                pings={pings}
                onPing={handlePing}
            />
            
            {/* Overlay hint */}
            <div className="absolute bottom-4 left-4 pointer-events-none opacity-50">
                <p className="text-[10px] text-slate-500">
                    COORD: {activeLayer?.items.length || 0} ITEMS | LAYER: {activeLayer?.name.toUpperCase()}
                </p>
            </div>
        </div>
      </main>

      {/* RIGHT PANEL */}
      <PanelRight 
         selectedTool={canEdit ? selectedTool : ToolType.PING}
         onSelectTool={setSelectedTool}
         shipConfig={shipConfig}
         onUpdateShipConfig={setShipConfig}
         pingColor={pingColor}
         onUpdatePingColor={setPingColor}
         readOnly={!canEdit}
      />

    </div>
  );
};