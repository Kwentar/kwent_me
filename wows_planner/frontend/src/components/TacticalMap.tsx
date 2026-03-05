import React, { useRef, useState } from 'react';
import { Layer, TacticalItem, ToolType, Ping } from '../types';
import { ShipSymbol } from './ShipSymbol';

interface TacticalMapProps {
  activeLayer: Layer | undefined;
  selectedTool: ToolType;
  onUpdateLayer: (layerId: string, items: TacticalItem[]) => void;
  shipConfig: { color: string; label: string; radarRange?: number; hydroRange?: number };
  drawConfig: { color: string };
  pings: Ping[];
  showRadarCircles: boolean;
  showHydroCircles: boolean;
  onPing: (x: number, y: number) => void;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  activeLayer,
  selectedTool,
  onUpdateLayer,
  shipConfig,
  drawConfig,
  pings,
  showRadarCircles,
  showHydroCircles,
  onPing,
  onInteractionStart,
  onInteractionEnd
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragItem, setDragItem] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [rotateItem, setRotateItem] = useState<{ id: string; startAngle: number; initialRotation: number } | null>(null);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawItem, setCurrentDrawItem] = useState<Partial<TacticalItem> | null>(null);

  // Helper to get coordinates in percentage relative to map area
  const getCoords = (e: React.PointerEvent | PointerEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const relativeY = Math.max(-0.15, Math.min(1.15, (e.clientY - rect.top) / rect.height));
    return { x: relativeX * 100, y: relativeY * 100 };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    if (!activeLayer) return;

    const coords = getCoords(e);
    
    if (selectedTool === ToolType.PING) {
      if (coords.y < 0 || coords.y > 100) return;
      onPing(coords.x, coords.y);
      return;
    }

    if ([ToolType.ARROW, ToolType.CIRCLE, ToolType.PEN].includes(selectedTool)) {
        onInteractionStart();
        setIsDrawing(true);
        const id = crypto.randomUUID();
        
        if (selectedTool === ToolType.ARROW || selectedTool === ToolType.PEN) {
            setCurrentDrawItem({
                id,
                type: selectedTool === ToolType.ARROW ? 'arrow' : 'path',
                x: coords.x,
                y: coords.y,
                points: [{ x: coords.x, y: coords.y }],
                color: drawConfig.color,
                rotation: 0
            });
        } else if (selectedTool === ToolType.CIRCLE) {
            setCurrentDrawItem({
                id,
                type: 'circle',
                x: coords.x,
                y: coords.y,
                radiusKm: 0,
                color: drawConfig.color,
                rotation: 0
            });
        }
        (e.target as Element).setPointerCapture(e.pointerId);
        return;
    }

    if ([ToolType.SHIP_BB, ToolType.SHIP_CL, ToolType.SHIP_DD, ToolType.SHIP_CV, ToolType.SHIP_SUB].includes(selectedTool)) {
      onInteractionStart();
      const shipType = selectedTool.split('_')[1] as any;
      const newItem: TacticalItem = {
        id: crypto.randomUUID(),
        type: 'ship',
        x: coords.x,
        y: coords.y,
        rotation: 0,
        shipClass: shipType,
        color: shipConfig.color,
        label: shipConfig.label,
        radarRange: shipConfig.radarRange,
        hydroRange: shipConfig.hydroRange
      };
      onUpdateLayer(activeLayer.id, [...activeLayer.items, newItem]);
      onInteractionEnd();
    }
  };

  const handleItemPointerDown = (e: React.PointerEvent, item: TacticalItem) => {
    e.stopPropagation();
    if (!e.isPrimary) return;
    if (!activeLayer) return;

    if (selectedTool === ToolType.ERASER) {
      onInteractionStart();
      onUpdateLayer(activeLayer.id, activeLayer.items.filter(i => i.id !== item.id));
      onInteractionEnd();
      return;
    }

    const coords = getCoords(e);

    if (selectedTool === ToolType.ROTATE && item.type === 'ship') {
      if (!containerRef.current) return;
      onInteractionStart();
      (e.target as Element).setPointerCapture(e.pointerId);
      const rect = containerRef.current.getBoundingClientRect();
      const itemCenterX = rect.left + rect.width * (item.x / 100);
      const itemCenterY = rect.top + rect.height * (item.y / 100);
      const angleRad = Math.atan2(e.clientY - itemCenterY, e.clientX - itemCenterX);
      setRotateItem({ id: item.id, startAngle: angleRad * (180 / Math.PI), initialRotation: item.rotation });
      return;
    }
    
    if ([ToolType.POINTER, ToolType.SHIP_BB, ToolType.SHIP_CL, ToolType.SHIP_DD, ToolType.SHIP_CV, ToolType.SHIP_SUB, ToolType.ARROW, ToolType.CIRCLE, ToolType.PEN].includes(selectedTool)) {
       onInteractionStart();
       (e.target as Element).setPointerCapture(e.pointerId);
       setDragItem({ id: item.id, offsetX: coords.x - item.x, offsetY: coords.y - item.y }); 
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    if (!activeLayer) return;
    const coords = getCoords(e);

    if (isDrawing && currentDrawItem) {
        if (currentDrawItem.type === 'arrow' || currentDrawItem.type === 'path') {
            setCurrentDrawItem(prev => ({ 
                ...prev, 
                points: [...(prev?.points || []), { x: coords.x, y: coords.y }] 
            }));
        } else if (currentDrawItem.type === 'circle') {
            const dx = coords.x - (currentDrawItem.x || 0);
            const dy = coords.y - (currentDrawItem.y || 0);
            setCurrentDrawItem(prev => ({ ...prev, radiusKm: (Math.sqrt(dx*dx + dy*dy) / 100) * (activeLayer.sizeKm || 42) }));
        }
        return;
    }
    
    if (rotateItem) {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const item = activeLayer.items.find(i => i.id === rotateItem.id);
        if (!item) return;
        const centerX = rect.left + rect.width * (item.x / 100);
        const centerY = rect.top + rect.height * (item.y / 100);
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        const delta = currentAngle - rotateItem.startAngle;
        onUpdateLayer(activeLayer.id, activeLayer.items.map(i => i.id === rotateItem.id ? { ...i, rotation: (rotateItem.initialRotation + delta + 360) % 360 } : i));
        return;
    }

    if (dragItem) {
        const item = activeLayer.items.find(i => i.id === dragItem.id);
        if (!item) return;
        const newX = coords.x - dragItem.offsetX;
        const newY = coords.y - dragItem.offsetY;
        onUpdateLayer(activeLayer.id, activeLayer.items.map(i => {
          if (i.id === dragItem.id) {
            if (i.points) {
                const dx = newX - i.x;
                const dy = newY - i.y;
                return { ...i, x: newX, y: newY, points: i.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
            }
            return { ...i, x: newX, y: newY };
          }
          return i;
        }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDrawing && currentDrawItem) {
        onUpdateLayer(activeLayer!.id, [...activeLayer!.items, currentDrawItem as TacticalItem]);
        setCurrentDrawItem(null);
        setIsDrawing(false);
        onInteractionEnd();
    }
    if (dragItem || rotateItem) onInteractionEnd();
    setDragItem(null);
    setRotateItem(null);
    if (e.target instanceof Element) {
        try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}
    }
  };

  const renderArrow = (item: Partial<TacticalItem>, isGhost: boolean) => {
      const points = item.points || [];
      if (points.length < 3) return null;
      const color = item.color || '#fff';

      // 1. Smooth Points (Moving Average)
      const smoothed = [];
      const win = 4;
      for (let i = 0; i < points.length; i++) {
          let sx = 0, sy = 0, c = 0;
          for (let j = Math.max(0, i-win); j <= Math.min(points.length-1, i+win); j++) { sx += points[j].x; sy += points[j].y; c++; }
          smoothed.push({ x: sx/c, y: sy/c });
      }

      // 2. Generate Tapered Sides
      const leftSide: any[] = [];
      const rightSide: any[] = [];
      const baseWidth = 2.4; 
      
      for (let i = 0; i < smoothed.length; i++) {
          const p = smoothed[i];
          const next = smoothed[i+1] || p;
          const prev = smoothed[i-1] || p;
          let dx = next.x - prev.x;
          let dy = next.y - prev.y;
          const len = Math.sqrt(dx*dx + dy*dy) || 1;
          const nx = -dy/len, ny = dx/len;
          const t = i / (smoothed.length - 1);
          const w = baseWidth * (1 - t * 0.7); // Tapering
          leftSide.push({ x: p.x + nx * w, y: p.y + ny * w });
          rightSide.push({ x: p.x - nx * w, y: p.y - ny * w });
      }

      // 3. Arrow Head Calculation
      const last = smoothed[smoothed.length - 1];
      const prevHead = smoothed[Math.max(0, smoothed.length - 6)]; // Use more points for stability
      const hdx = last.x - prevHead.x, hdy = last.y - prevHead.y;
      const hlen = Math.sqrt(hdx*hdx + hdy*hdy) || 1;
      const hnx = -hdy/hlen, hny = hdx/hlen;
      const ux = hdx/hlen, uy = hdy/hlen;
      const hSize = 4.5;
      const hBase = { x: last.x - ux * hSize * 0.2, y: last.y - uy * hSize * 0.2 };
      const hL = { x: hBase.x + hnx * hSize * 0.8, y: hBase.y + hny * hSize * 0.8 };
      const hR = { x: hBase.x - hnx * hSize * 0.8, y: hBase.y - hny * hSize * 0.8 };
      const tip = { x: last.x + ux * hSize * 0.8, y: last.y + uy * hSize * 0.8 };

      const pathData = [
          `M ${leftSide[0].x},${leftSide[0].y}`,
          ...leftSide.slice(1).map(p => `L ${p.x},${p.y}`),
          `L ${hL.x},${hL.y}`,
          `L ${tip.x},${tip.y}`,
          `L ${hR.x},${hR.y}`,
          ...rightSide.reverse().map(p => `L ${p.x},${p.y}`),
          'Z'
      ].join(' ');

      const gradId = `arrow-grad-${item.id || 'ghost'}`;
      const startPoint = smoothed[0];

      return (
          <g key={item.id || 'ghost'}>
              <defs>
                  <linearGradient 
                    id={gradId} 
                    x1={startPoint.x} y1={startPoint.y} 
                    x2={tip.x} y2={tip.y} 
                    gradientUnits="userSpaceOnUse"
                  >
                      <stop offset="0%" stopColor={color} stopOpacity="0" />
                      <stop offset="100%" stopColor={color} stopOpacity="1" />
                  </linearGradient>
              </defs>
              <path 
                d={pathData} 
                fill={`url(#${gradId})`} 
                fillOpacity={isGhost ? 0.4 : 0.8} 
                stroke={color} 
                strokeWidth="0.1" 
                strokeOpacity="0.3"
                style={{ pointerEvents: 'auto', cursor: 'move' }} 
                onPointerDown={(e) => !isGhost && handleItemPointerDown(e, item as TacticalItem)} 
              />
              <path d={pathData} fill="none" stroke="#000" strokeWidth="0.1" strokeOpacity="0.4" />
          </g>
      );
  };

  const renderDrawItem = (item: Partial<TacticalItem>, isGhost = false) => {
      const color = item.color || '#fff';
      const mapSize = activeLayer?.sizeKm || 42;

      if (item.type === 'circle') {
          const radiusPercent = item.radiusKm ? (item.radiusKm / mapSize) * 100 : 0;
          return (
              <div key={item.id || 'ghost'} className="absolute inset-0 pointer-events-none">
                  <div 
                    className="absolute rounded-full border-2 pointer-events-auto cursor-move"
                    style={{ left: `${item.x}%`, top: `${item.y}%`, borderColor: color, backgroundColor: `${color}1A`, width: `${radiusPercent * 2}cqw`, height: `${radiusPercent * 2}cqw`, transform: 'translate(-50%, -50%)', opacity: isGhost ? 0.6 : 1, zIndex: 5 }}
                    onPointerDown={(e) => !isGhost && handleItemPointerDown(e, item as TacticalItem)}
                  />
                  {radiusPercent > 2 && (
                      <div 
                        className="absolute text-[10px] font-bold px-1 rounded bg-black/60 text-white whitespace-nowrap pointer-events-auto"
                        style={{ left: `calc(${item.x}% + ${radiusPercent}cqw)`, top: `${item.y}%`, transform: 'translateY(-50%)', cursor: isGhost ? 'default' : 'pointer', zIndex: 6 }}
                        onClick={(e) => {
                            if (isGhost) return; e.stopPropagation();
                            const val = prompt('Radius (km):', item.radiusKm?.toFixed(1));
                            if (val && activeLayer) {
                                const r = parseFloat(val);
                                if (!isNaN(r)) onUpdateLayer(activeLayer.id, activeLayer.items.map(i => i.id === item.id ? { ...i, radiusKm: r } : i));
                            }
                        }}
                      >
                          {item.radiusKm?.toFixed(1)} km
                      </div>
                  )}
              </div>
          );
      }

      if (item.type === 'arrow') return <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" style={{ zIndex: 5, overflow: 'visible' }}>{renderArrow(item, isGhost)}</svg>;

      if (item.type === 'path') {
          const pointsStr = item.points?.map(p => `${p.x},${p.y}`).join(' ');
          return (
              <svg key={item.id || 'ghost'} className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" style={{ zIndex: 5, overflow: 'visible' }}>
                  <polyline points={pointsStr} fill="none" stroke={color} strokeWidth="0.5" strokeLinejoin="round" strokeLinecap="round" style={{ opacity: isGhost ? 0.6 : 1 }} />
                  <polyline points={pointsStr} fill="none" stroke="transparent" strokeWidth="5" className="pointer-events-auto cursor-move" onPointerDown={(e) => !isGhost && handleItemPointerDown(e, item as TacticalItem)} />
              </svg>
          );
      }
      return null;
  };

  const backgroundStyle: React.CSSProperties = {
    backgroundImage: activeLayer?.backgroundImage ? `url(${activeLayer.backgroundImage})` : 'none',
    backgroundSize: 'cover', backgroundPosition: 'center', touchAction: 'none'
  };

  return (
    <div className="relative flex-grow flex items-center justify-center bg-slate-900 p-4 overflow-hidden h-full">
      <div className="relative w-full max-w-[85vh] flex flex-col items-center">
        <div className="w-full h-[8vh] bg-slate-900/50 border border-slate-800 rounded-t-lg flex items-center justify-center text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-1">Top Reserve</div>
        <div ref={containerRef} className="relative w-full aspect-square bg-slate-800 shadow-2xl border border-slate-700 cursor-crosshair select-none overflow-visible" style={{ containerType: 'inline-size' }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
          <div className="absolute inset-0 z-0 pointer-events-none" style={backgroundStyle}></div>
          <div className="absolute inset-0 opacity-20 pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '10% 10%' }}></div>
          {!activeLayer && <div className="absolute inset-0 flex items-center justify-center text-slate-500 pointer-events-none z-10"><span className="bg-slate-900/80 px-4 py-2 rounded">Select or Create a Layer</span></div>}
          {activeLayer?.items.filter(i => i.type !== 'ship').map(item => renderDrawItem(item))}
          {currentDrawItem && renderDrawItem(currentDrawItem, true)}
          {activeLayer?.items.filter(i => i.type === 'ship').map(item => {
            const mapSize = activeLayer.sizeKm || 42;
            const rRad = item.radarRange ? (item.radarRange / mapSize) * 100 : 0;
            const hRad = item.hydroRange ? (item.hydroRange / mapSize) * 100 : 0;
            return (
              <div key={item.id} className={`absolute group transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none touch-none ${[ToolType.POINTER, ToolType.SHIP_BB, ToolType.SHIP_CL, ToolType.SHIP_DD, ToolType.SHIP_CV, ToolType.SHIP_SUB].includes(selectedTool) ? 'cursor-move' : ''} ${selectedTool === ToolType.ROTATE ? 'cursor-alias hover:opacity-80' : ''} ${selectedTool === ToolType.ERASER ? 'cursor-not-allowed hover:opacity-50' : ''}`} style={{ left: `${item.x}%`, top: `${item.y}%`, zIndex: 20 }} onPointerDown={(e) => handleItemPointerDown(e, item)}>
                {showRadarCircles && rRad > 0 && <div className="absolute rounded-full border-2 border-blue-500/40 bg-blue-500/10 pointer-events-none" style={{ width: `${rRad * 2}cqw`, height: `${rRad * 2}cqw`, left: '50%', top: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)' }} />}
                {showHydroCircles && hRad > 0 && <div className="absolute rounded-full border-2 border-green-500/40 bg-green-500/10 pointer-events-none" style={{ width: `${hRad * 2}cqw`, height: `${hRad * 2}cqw`, left: '50%', top: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 0 15px rgba(34, 197, 94, 0.2)' }} />}
                <div className={`flex flex-col items-center transition-transform duration-200 ${(dragItem?.id === item.id || rotateItem?.id === item.id) ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <div style={{ transform: `rotate(${item.rotation}deg)` }}>{item.type === 'ship' && item.shipClass && <ShipSymbol type={item.shipClass} color={item.color || '#fff'} size={32} />}</div>
                  {item.label && <span className="mt-1 text-[10px] font-bold px-1 py-0.5 rounded bg-black/60 text-white whitespace-nowrap pointer-events-none" style={{ textShadow: '0px 1px 2px black' }}>{item.label}</span>}
                </div>
              </div>
            );
          })}
          {pings.map(ping => (
             <div key={ping.id} className="absolute pointer-events-none" style={{ left: `${ping.x}%`, top: `${ping.y}%`, transform: 'translate(-50%, -50%)', zIndex: 30 }}>
                <div className="w-8 h-8 rounded-full border-4 animate-ping-once" style={{ borderColor: ping.color || 'white' }} />
             </div>
          ))}
        </div>
        <div className="w-full h-[8vh] bg-slate-900/50 border border-slate-800 rounded-b-lg flex items-center justify-center text-[10px] uppercase tracking-widest text-slate-600 font-bold mt-1">Bottom Reserve</div>
      </div>
    </div>
  );
};
