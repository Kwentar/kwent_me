import React, { useRef, useState } from 'react';
import { Layer, TacticalItem, ToolType, Ping } from '../types';
import { ShipSymbol } from './ShipSymbol';

interface TacticalMapProps {
  activeLayer: Layer | undefined;
  selectedTool: ToolType;
  onUpdateLayer: (layerId: string, items: TacticalItem[]) => void;
  shipConfig: { color: string; label: string };
  pings: Ping[];
  onPing: (x: number, y: number) => void;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  activeLayer,
  selectedTool,
  onUpdateLayer,
  shipConfig,
  pings,
  onPing,
  onInteractionStart,
  onInteractionEnd
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragItem, setDragItem] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [rotateItem, setRotateItem] = useState<{ id: string; startAngle: number; initialRotation: number } | null>(null);

  // Helper to get coordinates in 0-100 percentage relative to container
  const getCoords = (e: React.PointerEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    
    // Clamp values to inside the box
    const relativeX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const relativeY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    return { x: relativeX * 100, y: relativeY * 100 };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only handle primary pointer (mouse left click or single touch)
    if (!e.isPrimary) return;
    if (!activeLayer) return;

    const coords = getCoords(e);
    
    if (selectedTool === ToolType.PING) {
      onPing(coords.x, coords.y);
      return;
    }

    // Placing Ships
    if (
      [
        ToolType.SHIP_BB,
        ToolType.SHIP_CL,
        ToolType.SHIP_DD,
        ToolType.SHIP_CV,
        ToolType.SHIP_SUB
      ].includes(selectedTool)
    ) {
      onInteractionStart(); // Started placing
      const shipType = 
        selectedTool === ToolType.SHIP_BB ? 'BB' :
        selectedTool === ToolType.SHIP_CL ? 'CL' :
        selectedTool === ToolType.SHIP_DD ? 'DD' :
        selectedTool === ToolType.SHIP_CV ? 'CV' : 'SUB';

      const newItem: TacticalItem = {
        id: crypto.randomUUID(),
        type: 'ship',
        x: coords.x,
        y: coords.y,
        rotation: 0,
        shipClass: shipType,
        color: shipConfig.color,
        label: shipConfig.label
      };
      
      onUpdateLayer(activeLayer.id, [...activeLayer.items, newItem]);
      onInteractionEnd(); // Done placing (single click action)
    }
  };

  const handleItemPointerDown = (e: React.PointerEvent, item: TacticalItem) => {
    e.stopPropagation(); // Prevent map click
    if (!e.isPrimary) return;
    if (!activeLayer) return;

    // Eraser
    if (selectedTool === ToolType.ERASER) {
      onInteractionStart();
      const newItems = activeLayer.items.filter(i => i.id !== item.id);
      onUpdateLayer(activeLayer.id, newItems);
      onInteractionEnd();
      return;
    }

    // Rotation (Smooth)
    if (selectedTool === ToolType.ROTATE) {
      if (!containerRef.current) return;
      onInteractionStart();
      // Capture pointer for smooth dragging outside element bounds
      (e.target as Element).setPointerCapture(e.pointerId);
      
      const rect = containerRef.current.getBoundingClientRect();
      const itemCenterX = rect.left + rect.width * (item.x / 100);
      const itemCenterY = rect.top + rect.height * (item.y / 100);
      
      // Calculate start angle
      const angleRad = Math.atan2(e.clientY - itemCenterY, e.clientX - itemCenterX);
      const angleDeg = angleRad * (180 / Math.PI);

      setRotateItem({
        id: item.id,
        startAngle: angleDeg,
        initialRotation: item.rotation
      });
      return;
    }
    
    // Drag (Pointer OR Ship Placement Tools)
    const isShipTool = [
        ToolType.SHIP_BB, ToolType.SHIP_CL, ToolType.SHIP_DD, ToolType.SHIP_CV, ToolType.SHIP_SUB
    ].includes(selectedTool);

    if (selectedTool === ToolType.POINTER || isShipTool) {
       onInteractionStart();
       (e.target as Element).setPointerCapture(e.pointerId);
       setDragItem({ id: item.id, offsetX: 0, offsetY: 0 }); 
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    if ((!dragItem && !rotateItem) || !activeLayer) return;
    
    // Handle Rotation
    if (rotateItem) {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        const item = activeLayer.items.find(i => i.id === rotateItem.id);
        if (!item) return;

        const itemCenterX = rect.left + rect.width * (item.x / 100);
        const itemCenterY = rect.top + rect.height * (item.y / 100);

        const angleRad = Math.atan2(e.clientY - itemCenterY, e.clientX - itemCenterX);
        const currentAngleDeg = angleRad * (180 / Math.PI);
        
        // Calculate delta
        const delta = currentAngleDeg - rotateItem.startAngle;
        const newRotation = (rotateItem.initialRotation + delta + 360) % 360;

        const newItems = activeLayer.items.map(i => 
             i.id === rotateItem.id ? { ...i, rotation: newRotation } : i
        );
        onUpdateLayer(activeLayer.id, newItems);
        return;
    }

    // Handle Drag
    const coords = getCoords(e);
    
    const newItems = activeLayer.items.map(i => {
      if (i.id === dragItem!.id) {
        return { ...i, x: coords.x, y: coords.y };
      }
      return i;
    });
    
    onUpdateLayer(activeLayer.id, newItems);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragItem || rotateItem) {
        onInteractionEnd();
    }
    setDragItem(null);
    setRotateItem(null);
    if (e.target instanceof Element) {
        try {
            e.target.releasePointerCapture(e.pointerId);
        } catch (err) {
            // Ignore if not captured
            console.error(err)
        }
    }
  };

  // Background Style
  const backgroundStyle: React.CSSProperties = {
    backgroundImage: activeLayer?.backgroundImage ? `url(${activeLayer.backgroundImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    touchAction: 'none' // Critical for Pointer Events to work properly without scrolling
  };

  return (
    <div className="relative flex-grow flex items-center justify-center bg-slate-900 p-4 overflow-hidden h-full">
      {/* Aspect Ratio Container - Keeps it Square */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-[85vh] aspect-square bg-slate-800 shadow-2xl border border-slate-700 overflow-hidden cursor-crosshair group select-none"
        style={backgroundStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Grid Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ 
               backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
               backgroundSize: '10% 10%' 
             }}>
        </div>

        {/* Empty State */}
        {!activeLayer && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 pointer-events-none">
                <span className="bg-slate-900/80 px-4 py-2 rounded">Select or Create a Layer</span>
            </div>
        )}

        {/* Items */}
        {activeLayer?.items.map(item => (
          <div
            key={item.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none touch-none 
              ${selectedTool === ToolType.POINTER || [ToolType.SHIP_BB, ToolType.SHIP_CL, ToolType.SHIP_DD, ToolType.SHIP_CV, ToolType.SHIP_SUB].includes(selectedTool) ? 'cursor-move hover:scale-110' : ''}
              ${selectedTool === ToolType.ROTATE ? 'cursor-alias hover:opacity-80' : ''}
              ${selectedTool === ToolType.ERASER ? 'cursor-not-allowed hover:opacity-50' : ''}
            `}
            style={{ 
              left: `${item.x}%`, 
              top: `${item.y}%`, 
              zIndex: 10
            }}
            onPointerDown={(e) => handleItemPointerDown(e, item)}
          >
            <div style={{ transform: `rotate(${item.rotation}deg)` }}>
              {item.type === 'ship' && item.shipClass && (
                <ShipSymbol type={item.shipClass} color={item.color || '#fff'} size={32} />
              )}
            </div>
            {item.label && (
              <span 
                className="mt-1 text-[10px] font-bold px-1 py-0.5 rounded bg-black/60 text-white whitespace-nowrap pointer-events-none"
                style={{ textShadow: '0px 1px 2px black' }}
              >
                {item.label}
              </span>
            )}
          </div>
        ))}

        {/* Pings - Fixed Positioning Wrapper */}
        {pings.map(ping => (
           <div
             key={ping.id}
             className="absolute pointer-events-none"
             style={{
                left: `${ping.x}%`, 
                top: `${ping.y}%`, 
                transform: 'translate(-50%, -50%)', // Static centering
             }}
           >
              <div 
                className="w-8 h-8 rounded-full border-4 animate-ping-once"
                style={{
                    borderColor: ping.color || 'white'
                }}
              />
           </div>
        ))}
      </div>
    </div>
  );
};
