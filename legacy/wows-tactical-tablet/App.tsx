import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { TabletView } from './components/TabletView';
import { Tablet, User } from './types';

// Initial Mock Data
const INITIAL_TABLETS: Tablet[] = [
  {
    id: 'tablet-1',
    ownerId: 'user-commander-1', // Owned by the mock user
    name: 'North Atlantic Operation',
    layers: [
      {
        id: 'layer-1-alpha',
        name: 'Main Strategy',
        items: [],
        isVisible: true,
        backgroundImage: null
      }
    ],
    lastModified: Date.now()
  },
  {
    id: 'tablet-public-1',
    ownerId: 'user-admiral-2', // Owned by someone else
    name: 'Public Training Drill',
    layers: [
      {
        id: 'layer-drill',
        name: 'Drill Zone',
        items: [],
        isVisible: true,
        backgroundImage: null
      }
    ],
    lastModified: Date.now() - 100000
  }
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tablets, setTablets] = useState<Tablet[]>(INITIAL_TABLETS);
  const [activeTabletId, setActiveTabletId] = useState<string | null>(null);

  // --- Routing (Simple Hash Router) ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const id = hash.replace('#/tablet/', '');
      if (id && tablets.find(t => t.id === id)) {
        setActiveTabletId(id);
      } else {
        setActiveTabletId(null);
      }
    };

    // Initial check
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [tablets]);

  const navigateToTablet = (id: string) => {
    window.location.hash = `#/tablet/${id}`;
  };

  const navigateToDashboard = () => {
    window.location.hash = '';
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    navigateToDashboard();
  };

  // --- Actions ---

  const handleCreateTablet = (name: string) => {
    if (!user) return;
    const newTablet: Tablet = {
      id: crypto.randomUUID(),
      ownerId: user.id,
      name: name,
      layers: [
        {
          id: crypto.randomUUID(),
          name: 'Base Layer',
          items: [],
          isVisible: true
        }
      ],
      lastModified: Date.now()
    };
    setTablets(prev => [...prev, newTablet]);
  };

  const handleEditTablet = (id: string, newName: string) => {
    setTablets(prev => prev.map(t => t.id === id ? { ...t, name: newName, lastModified: Date.now() } : t));
  };

  const handleDeleteTablet = (id: string) => {
    setTablets(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTablet = (updatedTablet: Tablet) => {
    setTablets(prev => prev.map(t => t.id === updatedTablet.id ? updatedTablet : t));
  };

  // --- Render ---

  const activeTablet = tablets.find(t => t.id === activeTabletId);

  if (activeTablet) {
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
      onLogin={handleLogin}
      onLogout={handleLogout}
      tablets={tablets}
      onCreate={handleCreateTablet}
      onEdit={handleEditTablet}
      onDelete={handleDeleteTablet}
      onOpen={navigateToTablet}
    />
  );
}

export default App;