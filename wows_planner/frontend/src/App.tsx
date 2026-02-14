import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { TabletView } from './components/TabletView';
import { Tablet, User } from './types';
import { api } from './api';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [tablets, setTablets] = useState<Tablet[]>([]);
  const [activeTabletId, setActiveTabletId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Auth & Data Load ---
  useEffect(() => {
    const init = async () => {
      try {
        const userInfo = await api.getMe();
        setUser(userInfo);
        setIsAnonymous(userInfo.isAnonymous);
        
        const myTablets = await api.getTablets();
        setTablets(myTablets);
      } catch (err) {
        console.error("Initialization failed", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // --- Routing ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const id = hash.replace('#/tablet/', '');
      if (id) {
        // If we have tablets loaded, verify ID
        // If it's a deep link, we might not have it in "my tablets" yet if it's public?
        // For MVP we assume we only see our tablets in dashboard list.
        // But for direct link, we should try to fetch it individually (backend GET /planners/:id supports checking permissions)
        // For now, let's just set ID and let TabletView handle loading/error ideally, 
        // OR simply require it to be in the list for now.
        setActiveTabletId(id);
      } else {
        setActiveTabletId(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToDashboard = () => {
    window.location.hash = '';
  };

  // --- Actions ---

  const handleCreateTablet = async (name: string) => {
    try {
      const newTablet = await api.createTablet(name);
      setTablets(prev => [newTablet, ...prev]);
    } catch (e) {
      console.error(e);
      alert('Failed to create tablet');
    }
  };

  const handleEditTablet = async (id: string, newName: string) => {
    try {
      await api.updateTablet(id, { name: newName });
      setTablets(prev => prev.map(t => t.id === id ? { ...t, name: newName, lastModified: Date.now() } : t));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTablet = async (id: string) => {
    try {
      await api.deleteTablet(id);
      setTablets(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTablet = async (updatedTablet: Tablet) => {
    // Optimistic update
    setTablets(prev => prev.map(t => t.id === updatedTablet.id ? updatedTablet : t));
    // Background save
    try {
        await api.updateTablet(updatedTablet.id, { 
            layers: updatedTablet.layers,
            name: updatedTablet.name
        });
    } catch (e) {
        console.error("Failed to auto-save", e);
    }
  };

  const handleLogin = () => {
     window.location.href = '/oauth2/sign_in?rd=/wows_planner/';
  };

  const handleLogout = () => {
     window.location.href = '/oauth2/sign_out?rd=/wows_planner/';
  };

  if (loading) {
      return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading Command Center...</div>;
  }

  const activeTablet = tablets.find(t => t.id === activeTabletId);

  // If ID exists but not in list, maybe it's a new shared tablet?
  // For MVP, if not found, redirect to dashboard.
  if (activeTabletId && !activeTablet) {
      // In real app: fetch single tablet by ID
      navigateToDashboard();
      return null; 
  }

  if (activeTablet && activeTabletId) {
    return (
      <TabletView 
        user={user}
        tablet={activeTablet}
        onUpdateTablet={handleUpdateTablet}
        onBack={navigateToDashboard}
      />
    );
  }

  return (
    <Dashboard 
      user={user}
      isAnonymous={isAnonymous}
      onLogin={handleLogin}
      onLogout={handleLogout}
      tablets={tablets}
      onCreate={handleCreateTablet}
      onEdit={handleEditTablet}
      onDelete={handleDeleteTablet}
      onOpen={(id) => window.location.hash = `#/tablet/${id}`}
    />
  );
}

export default App;
