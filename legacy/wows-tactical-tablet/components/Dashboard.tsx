import React, { useState } from 'react';
import { Tablet, User } from '../types';
import { Tablet as TabletIcon, Plus, Trash2, Edit2, Play, X, AlertTriangle, LogOut, Shield, Bug } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

interface DashboardProps {
  user: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
  tablets: Tablet[];
  onCreate: (name: string) => void;
  onEdit: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  onLogin, 
  onLogout, 
  tablets, 
  onCreate, 
  onEdit, 
  onDelete, 
  onOpen 
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTablet, setEditingTablet] = useState<{ id: string; name: string } | null>(null);
  const [deletingTabletId, setDeletingTabletId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');

  // Filter tablets: Show all, but only highlight editable ones
  const userTablets = user ? tablets.filter(t => t.ownerId === user.id) : [];
  const otherTablets = user ? tablets.filter(t => t.ownerId !== user.id) : tablets;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onCreate(nameInput.trim());
      setNameInput('');
      setIsCreateModalOpen(false);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTablet && nameInput.trim()) {
      onEdit(editingTablet.id, nameInput.trim());
      setNameInput('');
      setEditingTablet(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingTabletId) {
      onDelete(deletingTabletId);
      setDeletingTabletId(null);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());

        const appUser: User = {
          id: userInfo.sub,
          name: userInfo.name,
          email: userInfo.email,
          avatarUrl: userInfo.picture,
        };
        
        onLogin(appUser);
      } catch (error) {
        console.error("Failed to fetch user info", error);
      }
    },
    onError: errorResponse => console.log('Login failed', errorResponse),
  });

  const handleDevLogin = () => {
    onLogin({
        id: 'dev-commander',
        name: 'Dev Commander',
        email: 'dev@tactical.local',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=DEV'
    });
  };

  // --- Login Screen ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[100px] animate-pulse"></div>
             <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-slate-700 rounded-full blur-[80px]"></div>
        </div>

        <div className="z-10 bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-900/50">
                <TabletIcon size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">WoWS Tactical Tablet</h1>
            <p className="text-slate-400 mb-8">Secure Login Required. Access restricted to authorized personnel.</p>
            
            <button 
                onClick={() => googleLogin()}
                className="w-full bg-white text-slate-900 font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-3 hover:bg-slate-200 transition-colors"
            >
                 <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                 </svg>
                 Sign in with Google
            </button>

            <div className="mt-4 pt-4 border-t border-slate-800/50">
                <button 
                    onClick={handleDevLogin}
                    className="w-full text-slate-500 hover:text-slate-300 text-xs py-2 flex items-center justify-center gap-2 transition-colors"
                >
                    <Bug size={14} /> Developer Bypass (Login as Guest)
                </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-800">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Public Access</h3>
                <div className="space-y-2">
                    {tablets.map(t => (
                        <button
                            key={t.id}
                            onClick={() => onOpen(t.id)}
                            className="w-full text-left px-4 py-3 rounded bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all flex items-center justify-between group"
                        >
                            <span className="text-slate-300 text-sm font-medium">{t.name}</span>
                            <Play size={14} className="text-slate-500 group-hover:text-blue-400" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>
    );
  }

  // --- Dashboard (Logged In) ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="w-3 h-8 bg-blue-600 rounded"></span>
              Tactical Command Center
            </h1>
            <p className="text-slate-400 mt-2 ml-4">Welcome back, {user.name}</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
                 <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-700" />
                 <span className="text-sm font-medium">{user.name}</span>
             </div>
             <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                title="Sign Out"
             >
                <LogOut size={20} />
             </button>
          </div>
        </header>

        {/* My Tablets Section */}
        <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <Shield size={20} className="text-green-500" /> My Operations
                </h2>
                <button
                    onClick={() => {
                        setNameInput('');
                        setIsCreateModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm shadow-lg shadow-blue-900/20"
                >
                    <Plus size={16} /> Create Operation
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userTablets.map((tablet) => (
                    <TabletCard 
                        key={tablet.id} 
                        tablet={tablet} 
                        isOwner={true}
                        onOpen={() => onOpen(tablet.id)}
                        onEdit={(e) => { e.stopPropagation(); setEditingTablet({ id: tablet.id, name: tablet.name }); setNameInput(tablet.name); }}
                        onDelete={(e) => { e.stopPropagation(); setDeletingTabletId(tablet.id); }}
                    />
                ))}
                {userTablets.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                        No operations found. Create one to get started.
                    </div>
                )}
            </div>
        </div>

        {/* Other Tablets Section */}
        <div>
            <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                <UsersIcon /> Public Operations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {otherTablets.map((tablet) => (
                    <TabletCard 
                        key={tablet.id} 
                        tablet={tablet} 
                        isOwner={false}
                        onOpen={() => onOpen(tablet.id)}
                        onEdit={() => {}}
                        onDelete={() => {}}
                    />
                ))}
            </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h3 className="font-bold text-lg text-white">New Tablet</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6">
              <label className="block text-sm font-medium text-slate-400 mb-2">Tablet Name</label>
              <input
                type="text"
                autoFocus
                placeholder="Operation Alpha..."
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-6 placeholder-slate-600"
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingTablet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h3 className="font-bold text-lg text-white">Edit Tablet Name</h3>
              <button onClick={() => setEditingTablet(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6">
              <label className="block text-sm font-medium text-slate-400 mb-2">Tablet Name</label>
              <input
                type="text"
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-6 placeholder-slate-600"
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditingTablet(null)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingTabletId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-red-900/50 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden scale-100">
             <div className="p-6 text-center">
               <div className="w-16 h-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <AlertTriangle size={32} />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Delete Tablet?</h3>
               <p className="text-slate-400 mb-6">Are you sure you want to delete this tablet? This action cannot be undone.</p>
               
               <div className="flex gap-3 justify-center">
                 <button 
                   onClick={() => setDeletingTabletId(null)}
                   className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleDeleteConfirm}
                   className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-colors font-medium"
                 >
                   Yes, Delete
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for Card
const TabletCard: React.FC<{ tablet: Tablet; isOwner: boolean; onOpen: () => void; onEdit: (e: any) => void; onDelete: (e: any) => void }> = ({ tablet, isOwner, onOpen, onEdit, onDelete }) => (
    <div 
      className="group relative bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300"
    >
      {isOwner && (
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={onEdit}
              className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
              title="Edit Name"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 bg-slate-800 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-700"
              title="Delete Tablet"
            >
              <Trash2 size={16} />
            </button>
          </div>
      )}

      <div 
        className="flex flex-col h-full cursor-pointer"
        onClick={onOpen}
      >
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${isOwner ? 'bg-blue-900/20 text-blue-500' : 'bg-slate-800 text-slate-500'}`}>
          <TabletIcon size={24} />
        </div>
        
        <h3 className="text-xl font-bold text-slate-100 mb-2 truncate pr-12">{tablet.name}</h3>
        
        <div className="mt-auto pt-4 space-y-2 text-sm text-slate-500 font-mono">
           <div className="flex justify-between">
             <span>ID:</span>
             <span>{tablet.id.substring(0, 8)}</span>
           </div>
           <div className="flex justify-between">
             <span>OWNER:</span>
             <span>{isOwner ? 'YOU' : 'OTHER'}</span>
           </div>
           <div className="flex justify-between">
             <span>UPDATED:</span>
             <span>{new Date(tablet.lastModified).toLocaleDateString()}</span>
           </div>
        </div>

        <div className="mt-6">
          <span className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${isOwner ? 'bg-slate-800 text-slate-300 group-hover:bg-blue-600 group-hover:text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'}`}>
            <Play size={16} className="fill-current" /> {isOwner ? 'Command' : 'View'}
          </span>
        </div>
      </div>
    </div>
);

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);