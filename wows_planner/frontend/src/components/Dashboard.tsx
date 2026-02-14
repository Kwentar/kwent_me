import React, { useState } from 'react';
import { Tablet, User } from '../types';
import { Tablet as TabletIcon, Plus, Trash2, Edit2, Play, X, AlertTriangle, LogOut, Shield } from 'lucide-react';

interface DashboardProps {
  user: User | null;
  isAnonymous: boolean;
  onLogin: () => void;
  onLogout: () => void;
  tablets: Tablet[];
  onCreate: (name: string) => void;
  onEdit: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  user,
  isAnonymous,
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="w-3 h-8 bg-blue-600 rounded"></span>
              Tactical Command Center
            </h1>
            <p className="text-slate-400 mt-2 ml-4">
                {isAnonymous ? 'Guest Mode (Anonymous)' : `Welcome back, ${user?.name}`}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             {isAnonymous ? (
                 <button
                    onClick={onLogin}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-full border border-slate-700 transition-colors text-sm font-medium"
                 >
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    Login with Google
                 </button>
             ) : (
                 <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
                     {user?.avatarUrl ? (
                       <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-700" />
                     ) : (
                       <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold">
                         {user?.name.charAt(0)}
                       </div>
                     )}
                     <span className="text-sm font-medium">{user?.name}</span>
                 </div>
             )}
             
             {!isAnonymous && (
                 <button
                    onClick={onLogout}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                    title="Sign Out"
                 >
                    <LogOut size={20} />
                 </button>
             )}
          </div>
        </header>

        {/* Tablets Section */}
        <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <Shield size={20} className="text-green-500" /> Active Operations
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
                {tablets.map((tablet) => (
                    <TabletCard 
                        key={tablet.id} 
                        tablet={tablet} 
                        isOwner={true} // For now everyone is owner of their list
                        onOpen={() => onOpen(tablet.id)}
                        onEdit={(e) => { e.stopPropagation(); setEditingTablet({ id: tablet.id, name: tablet.name }); setNameInput(tablet.name); }}
                        onDelete={(e) => { e.stopPropagation(); setDeletingTabletId(tablet.id); }}
                    />
                ))}
                
                {/* Empty State / Create Button Card */}
                <button 
                    onClick={() => {
                        setNameInput('');
                        setIsCreateModalOpen(true);
                    }}
                    className="group border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:border-blue-500 hover:text-blue-500 hover:bg-slate-900/50 transition-all h-full min-h-[200px]"
                >
                    <Plus size={40} className="mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <span className="font-medium">New Operation</span>
                </button>
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