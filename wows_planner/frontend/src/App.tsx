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
  
  // State for shared tablet (loaded individually)
  const [sharedTablet, setSharedTablet] = useState<Tablet | null>(null);

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

  // --- Shared Tablet Loader ---
  useEffect(() => {
      const loadShared = async () => {
          if (!activeTabletId) {
              setSharedTablet(null);
              return;
          }

          // Check if we already have it in "my tablets"
          if (tablets.find(t => t.id === activeTabletId)) {
              setSharedTablet(null); // It's in main list, no need for shared state
              return;
          }

          // Try to load
          try {
              const t = await api.getTablet(activeTabletId);
              setSharedTablet(t);
          } catch (e) {
              console.error("Failed to load shared tablet", e);
              // If failed, redirect to dashboard
              window.location.hash = '';
          }
      };

      if (!loading) {
          loadShared();
      }
  }, [activeTabletId, tablets, loading]);

  // --- Routing ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const id = hash.replace('#/tablet/', '');
      setActiveTabletId(id || null);
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

  const handleLogin = () => {
     window.location.href = '/oauth2/sign_in?rd=/wows_planner/';
  };

  const handleLogout = () => {
     window.location.href = '/oauth2/sign_out?rd=/wows_planner/';
  };

  if (loading) {
      return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading Command Center...</div>;
  }

  // Determine active tablet (from My list OR Shared loaded)
  const activeTablet = tablets.find(t => t.id === activeTabletId) || (sharedTablet?.id === activeTabletId ? sharedTablet : null);

  if (activeTabletId && activeTablet) {
    return (
      <TabletView 
        user={user}
        tablet={activeTablet}
        onBack={navigateToDashboard}
      />
    );
  } else if (activeTabletId && !activeTablet) {
      // Loading shared... or failed (handled in useEffect)
      return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-slate-500">Connecting to Operation...</div>;
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