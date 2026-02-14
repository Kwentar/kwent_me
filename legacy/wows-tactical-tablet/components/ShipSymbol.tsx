import React from 'react';
import { ShipClass } from '../types';

interface ShipSymbolProps {
  type: ShipClass;
  color: string;
  size?: number;
  className?: string;
}

// Tactical Map Symbols based on World of Warships style (Tag shape for capital ships, Triangle for light ships)
export const ShipSymbol: React.FC<ShipSymbolProps> = ({ type, color, size = 32, className = '' }) => {
  const style = { fill: color, stroke: '#000', strokeWidth: 2, strokeLinejoin: 'round' as const };
  const lineStyle = { stroke: '#000', strokeWidth: 2, strokeCap: 'round' as const };
  
  let content = null;

  // Common Shapes
  // Tag Shape: Rect with arrow point on right
  const tagPath = "M 2,8 L 20,8 L 30,16 L 20,24 L 2,24 Z";
  
  // Triangle Shape: Isosceles triangle pointing right
  const trianglePath = "M 2,8 L 30,16 L 2,24 Z";

  switch (type) {
    case 'BB': // Battleship: Tag shape with 2 diagonal lines
      content = (
        <g>
          <path d={tagPath} {...style} />
          {/* Two diagonal lines */}
          <line x1="8" y1="24" x2="14" y2="8" {...lineStyle} />
          <line x1="14" y1="24" x2="20" y2="8" {...lineStyle} />
        </g>
      );
      break;
      
    case 'CV': // Carrier: Tag shape with horizontal deck line
      content = (
        <g>
          <path d={tagPath} {...style} />
          {/* Horizontal line */}
          <line x1="2" y1="16" x2="20" y2="16" {...lineStyle} />
          {/* Small vertical tail at the back? Or just the line. The image shows a rectangle with a split. */}
          <line x1="20" y1="8" x2="20" y2="24" {...lineStyle} /> 
        </g>
      );
      break;
      
    case 'CL': // Cruiser: Tag shape with 1 diagonal line
      content = (
        <g>
          <path d={tagPath} {...style} />
          {/* One diagonal line */}
          <line x1="11" y1="24" x2="17" y2="8" {...lineStyle} />
        </g>
      );
      break;
      
    case 'DD': // Destroyer: Triangle
      content = (
        <g>
           <path d={trianglePath} {...style} />
        </g>
      );
      break;
      
    case 'SUB': // Submarine: Triangle with vertical line on left
      content = (
        <g>
           <path d={trianglePath} transform="translate(4,0)" {...style} />
           {/* Vertical line on the left */}
           <line x1="12" y1="10" x2="12" y2="22" {...lineStyle} />
        </g>
      );
      break;
  }

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      className={`drop-shadow-md ${className}`}
      style={{ overflow: 'visible' }}
    >
      {content}
    </svg>
  );
};