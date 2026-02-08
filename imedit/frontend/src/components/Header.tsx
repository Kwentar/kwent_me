import React from 'react';
import { Home, FileText, User, Scissors } from 'lucide-react';

const Header = () => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30 flex-shrink-0">
      <div className="flex items-center space-x-6">
        <a href="/" className="text-slate-900 font-bold text-lg tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-xs font-bold">K</div>
          <span>kwent.me</span>
        </a>
        
        <nav className="hidden md:flex items-center space-x-1">
          <NavLink href="/notes" icon={<FileText size={16} />} label="Notes" />
          <NavLink href="/imedit" icon={<Scissors size={16} />} label="Snap" active />
          <NavLink href="/me" icon={<User size={16} />} label="Identity" />
        </nav>
      </div>
      
      <div className="flex items-center">
        {/* User profile or actions could go here */}
      </div>
    </header>
  );
};

const NavLink = ({ href, icon, label, active }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) => (
  <a 
    href={href} 
    className={`
      flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
      ${active 
        ? 'bg-slate-100 text-slate-900' 
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
    `}
  >
    {icon}
    <span>{label}</span>
  </a>
);

export default Header;
