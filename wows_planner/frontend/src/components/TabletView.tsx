import { useState, useEffect, useRef } from 'react';
import { PanelLeft } from './PanelLeft';
import { PanelRight } from './PanelRight';
import { TacticalMap } from './TacticalMap';
import { Layer, ToolType, TacticalItem, ShipColor, Ping, Tablet, User, SessionUser } from '../types';
import { Wifi, ArrowLeft, ShieldCheck, Eye } from 'lucide-react';
import { api } from '../api';

interface TabletViewProps {
  user: User | null; // Current logged in user
  tablet: Tablet;
  onUpdateTablet: (updatedTablet: Tablet) => void;
  onBack: () => void;
}

export const TabletView: React.FC<TabletViewProps> = ({ user, tablet, onUpdateTablet, onBack }) => {
  // --- Permissions Logic ---
  const isOwner = user?.id.toString() === tablet.ownerId.toString();
  const [sessionUsers, setSessionUsers] = useState<SessionUser[]>([]);
  const [canEdit, setCanEdit] = useState(isOwner || (tablet as any).canEdit);

  // Anti-jitter: ignore updates for X ms after local action
  const lastActionRef = useRef(0);
  const markAction = () => { lastActionRef.current = Date.now(); };

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
  
  const [isOnline] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);

  // --- Session & Permissions Polling ---
  useEffect(() => {
      const poll = async () => {
          try {
              // 1. Send Heartbeat
              await api.sendHeartbeat(tablet.id);
              
              // 2. Refresh Users
              const users = await api.getSessionUsers(tablet.id);
              setSessionUsers(users);

              // 3. Refresh My Permissions (if not owner)
              if (!isOwner) {
                  const me = users.find((u: any) => u.id === user?.id.toString());
                  if (me) {
                      setCanEdit(me.canEdit);
                  }
              }

              // 4. SYNC DATA: Fetch tablet data to get changes from others
              const updated = await api.getTablet(tablet.id);
              
              // SYNC PINGS: (Always sync pings, even if interacting)
              const remotePings = (updated as any).state?.pings || [];
              const now = Date.now();
              const freshPings = remotePings.filter((p: any) => now - p.createdAt < 10000);
              setPings(prev => {
                  const localIds = new Set(prev.map(p => p.id));
                  const combined = [...prev, ...freshPings.filter((rp: any) => !localIds.has(rp.id))];
                  return combined.filter(p => Date.now() - p.createdAt < 10000);
              });

              // SYNC LAYERS: (Only sync layers if idle to avoid jitter)
              if (!isInteracting && Date.now() - lastActionRef.current > 3000) {
                  setLayers(updated.layers);
              }
          } catch (e) {
              console.error("Session poll error", e);
          }
      };

      poll(); 
      const interval = setInterval(poll, 3000); 
      return () => clearInterval(interval);
  }, [tablet.id, isOwner, user?.id, isInteracting]);

  // --- Handlers ---

  const handleUpdateName = async (name: string) => {
      markAction();
      if (user) {
          try {
              await api.updateMe(name);
              // Optimistic update local session users list
              setSessionUsers(prev => prev.map(u => u.id === user.id ? { ...u, name: name } : u));
          } catch (e) {
              console.error(e);
          }
      }
  };

  const handleToggleUserPermission = async (userId: string) => {
      markAction();
      if (!isOwner) return;
      const targetUser = sessionUsers.find(u => u.id === userId);
      if (!targetUser) return;

      const newPerm = !targetUser.canEdit;
      
      // Optimistic
      setSessionUsers(prev => prev.map(u => u.id === userId ? { ...u, canEdit: newPerm } : u));

      try {
          await api.setPermission(tablet.id, userId, newPerm);
      } catch (e) {
          console.error(e);
          // Revert on error
          setSessionUsers(prev => prev.map(u => u.id === userId ? { ...u, canEdit: !newPerm } : u));
      }
  };

  const updateTabletData = (newLayers: Layer[]) => {
      if (!canEdit) return; 
      markAction();
      setLayers(newLayers);
      onUpdateTablet({
          ...tablet,
          layers: newLayers,
          lastModified: Date.now()
      });
  };

  const handleUpdateLayer = (layerId: string, items: TacticalItem[]) => {
    if (!canEdit) return;
    markAction();
    const newLayers = layers.map(l => l.id === layerId ? { ...l, items } : l);
    updateTabletData(newLayers);
  };

  const handleUpdateLayerMap = async (layerId: string, fileOrUrl: string | File) => {
    if (!canEdit) return;
    markAction();
    
    let url = typeof fileOrUrl === 'string' ? fileOrUrl : '';
    if (fileOrUrl instanceof File) {
        try {
            url = await api.uploadFile(fileOrUrl);
        } catch (e) {
            console.error("Upload failed", e);
            return;
        }
    }

    const newLayers = layers.map(l => l.id === layerId ? { ...l, backgroundImage: url } : l);
    updateTabletData(newLayers);
  };

  const handleAddLayer = () => {
    if (!canEdit) return;
    markAction();
    const newLayer: Layer = {
      id: crypto.randomUUID(),
      name: `Tactic ${layers.length + 1}`,
      items: [],
      isVisible: true,
      backgroundImage: undefined
    };
    const newLayers = [...layers, newLayer];
    updateTabletData(newLayers);
    setActiveLayerId(newLayer.id);
  };

  const handleDeleteLayer = (id: string) => {
    if (!canEdit) return;
    markAction();
    if (layers.length <= 1) return;
    const newLayers = layers.filter(l => l.id !== id);
    updateTabletData(newLayers);
    if (activeLayerId === id) {
        setActiveLayerId(newLayers[0].id);
    }
  };

  const handlePing = (x: number, y: number) => {
    console.log('handlePing triggered', x, y);
    markAction();
    const newPing: Ping = {
        id: crypto.randomUUID(),
        x,
        y,
        color: pingColor,
        createdAt: Date.now()
    };
    setPings(prev => [...prev, newPing]);
    setTimeout(() => {
        setPings(prev => prev.filter(p => p.id !== newPing.id));
    }, 1500);
    
    // Send to server
    api.updateTablet(tablet.id, { pings: [newPing] } as any)
       .then(() => console.log('Ping sent success'))
       .catch(e => console.error('Ping send error', e));
  };

  // --- Effects ---

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
             if (!canEdit) return; 
             const newLayers = layers.map(l => l.id === id ? { ...l, isVisible: !l.isVisible } : l);
             updateTabletData(newLayers);
        }}
        currentUser={user}
        sessionUsers={sessionUsers}
        isOwner={isOwner}
        onToggleUserPermission={handleToggleUserPermission}
        onUpdateUserName={handleUpdateName}
        readOnly={!canEdit}
      />

      {/* CENTER STAGE */}
      <main className="flex-grow flex flex-col relative z-0">
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

        <div className="flex-grow relative bg-slate-950">
            <TacticalMap 
                activeLayer={activeLayer}
                selectedTool={canEdit ? selectedTool : ToolType.PING} 
                onUpdateLayer={handleUpdateLayer}
                shipConfig={shipConfig}
                pings={pings}
                onPing={handlePing}
                onInteractionStart={() => setIsInteracting(true)}
                onInteractionEnd={() => setIsInteracting(false)}
            />
            
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