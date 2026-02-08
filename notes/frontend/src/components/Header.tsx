import React from 'react';
// Note: We need to ensure lucide-react is installed in notes/frontend. It probably is not.
// We will check and install if needed.
import { FileText, User, Scissors } from 'lucide-react';

const Header = () => {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-30 flex-shrink-0">
      <div className="flex items-center space-x-6">
        <a href="/" className="text-gray-900 font-bold text-lg tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-xs font-bold">K</div>
          <span>kwent.me</span>
        </a>
        
        <nav className="hidden md:flex items-center space-x-1">
          <NavLink href="/notes" icon={<FileText size={16} />} label="Notes" active />
          <NavLink href="/imedit" icon={<Scissors size={16} />} label="Snap" />
          <NavLink href="/me" icon={<User size={16} />} label="Identity" />
        </nav>
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
        ? 'bg-gray-100 text-gray-900' 
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
    `}
  >
    {icon}
    <span>{label}</span>
  </a>
);

export default Header;
