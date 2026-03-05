export interface ShellData {
    name: string;
    type: string;
    damage: number;
    bullet_mass: number;
    bullet_speed: number;
    burn_probability?: number | null;
}

export interface ArtillerySlot {
    guns: number;
    name: string;
    barrels: number;
}

export interface ArtilleryData {
    slots: Record<string, ArtillerySlot>;
    shells: {
        AP?: ShellData;
        HE?: ShellData;
        CS?: ShellData;
    };
    distance: number;
    gun_rate: number;
    shot_delay: number;
    rotation_time: number;
    max_dispersion: number;
}

export interface ShipData {
    id: number;
    name: string;
    tier: number;
    type: string;
    nation: string;
    is_premium: boolean;
    is_special: boolean;
    has_demo_profile: boolean;
    default_profile?: {
        armour?: { health?: number; flood_damage?: number };
        concealment?: { detect_distance_by_ship?: number; detect_distance_by_plane?: number };
        mobility?: { max_speed?: number; rudder_time?: number; turning_radius?: number };
        artillery?: ArtilleryData;
    };
    [key: string]: any; 
}

// Since the app runs under /shiptools/ path and Vite proxies /shiptools/api
const API_BASE = '/shiptools/api';

export async function fetchShips(): Promise<ShipData[]> {
    const res = await fetch(`${API_BASE}/ships`);
    if (!res.ok) {
        throw new Error(`Failed to fetch ships: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data;
}

export async function fetchStats(): Promise<{total_ships: number, total_modules: number, total_arenas: number, total_consumables: number, last_sync: string}> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) {
        throw new Error(`Failed to fetch stats`);
    }
    return res.json();
}
