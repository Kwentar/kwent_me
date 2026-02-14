import { Tablet, User, Ping } from './types';

const API_BASE = '/wows_planner/api';

export const api = {
  async getMe(): Promise<User & { isAnonymous: boolean }> {
    const res = await fetch(`${API_BASE}/me`);
    if (!res.ok) throw new Error('Failed to fetch user info');
    return res.json();
  },

  async getTablets(): Promise<Tablet[]> {
    const res = await fetch(`${API_BASE}/planners`);
    if (!res.ok) throw new Error('Failed to fetch tablets');
    const data = await res.json();
    return data.map((d: any) => ({
      id: d.id.toString(),
      ownerId: d.user_id.toString(), // Use actual user_id from backend
      name: d.title,
      layers: d.state?.layers || [],
      lastModified: new Date(d.updated_at).getTime()
    }));
  },

  async createTablet(name: string): Promise<Tablet> {
    const res = await fetch(`${API_BASE}/planners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: name,
        state: { layers: [
          {
            id: crypto.randomUUID(),
            name: 'Base Layer',
            items: [],
            isVisible: true
          }
        ]}
      })
    });
    if (!res.ok) throw new Error('Failed to create tablet');
    const d = await res.json();
    console.log('API Create Response:', d);
    return {
      id: d.id.toString(),
      ownerId: d.user_id ? d.user_id.toString() : '0', // Fallback if missing
      name: d.title,
      layers: d.state.layers,
      lastModified: new Date(d.created_at).getTime()
    };
  },

  async updateMe(name: string): Promise<void> {
    await fetch(`${API_BASE}/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
  },

  async getTablet(id: string): Promise<Tablet & { canEdit: boolean }> {
      const res = await fetch(`${API_BASE}/planners/${id}`);
      if (!res.ok) throw new Error('Failed to fetch tablet');
      const d = await res.json();
      return {
          id: d.id.toString(),
          ownerId: d.user_id.toString(),
          name: d.title,
          layers: d.state?.layers || [],
          lastModified: new Date(d.updated_at).getTime(),
          canEdit: d.can_edit
      };
  },

  async sendHeartbeat(id: string): Promise<void> {
      await fetch(`${API_BASE}/planners/${id}/heartbeat`, { method: 'POST' });
  },

  async getSessionUsers(id: string): Promise<any[]> {
      const res = await fetch(`${API_BASE}/planners/${id}/users`);
      if (!res.ok) return [];
      return res.json();
  },

  async setPermission(tabletId: string, userId: string, canEdit: boolean): Promise<void> {
      await fetch(`${API_BASE}/planners/${tabletId}/permissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, canEdit })
      });
  },

  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url;
  },

  async updateTablet(id: string, data: Partial<Tablet> & { pings?: Ping[] }): Promise<void> {
    const payload: any = {};
    if (data.name) payload.title = data.name;
    if (data.layers) payload.state = { layers: data.layers };
    if (data.pings) payload.pings = data.pings;

    await fetch(`${API_BASE}/planners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async deleteTablet(id: string): Promise<void> {
    await fetch(`${API_BASE}/planners/${id}`, {
      method: 'DELETE'
    });
  }
};
