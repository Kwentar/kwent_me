export enum ToolType {
  POINTER = 'POINTER',
  SHIP_BB = 'SHIP_BB',
  SHIP_CL = 'SHIP_CL',
  SHIP_DD = 'SHIP_DD',
  SHIP_CV = 'SHIP_CV',
  SHIP_SUB = 'SHIP_SUB',
  ROTATE = 'ROTATE',
  ERASER = 'ERASER',
  PING = 'PING',
  TEXT = 'TEXT' // Bonus: Text annotation tool
}

export enum ShipColor {
  GREEN = '#22c55e', // Team / Friendly
  RED = '#ef4444',   // Enemy
  YELLOW = '#eab308',
  BLUE = '#3b82f6',
  WHITE = '#f8fafc',
  BLACK = '#0f172a'
}

export type ShipClass = 'BB' | 'CL' | 'DD' | 'CV' | 'SUB';

export interface TacticalItem {
  id: string;
  type: 'ship' | 'text' | 'arrow'; // Simplified for this MVP
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  rotation: number; // Degrees
  
  // Ship specific
  shipClass?: ShipClass;
  color?: string;
  label?: string;

  // Text specific
  textContent?: string;
}

export interface Layer {
  id: string;
  name: string;
  items: TacticalItem[];
  backgroundImage?: string; // URL or Base64
  isVisible: boolean;
}

export interface Ping {
  id: string;
  x: number;
  y: number;
  color: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface SessionUser extends User {
  isOnline: boolean;
  canEdit: boolean;
  isOwner: boolean;
}

export interface Tablet {
  id: string;
  ownerId: string; // ID of the user who created it
  name: string;
  layers: Layer[];
  lastModified: number;
}
