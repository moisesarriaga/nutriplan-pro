
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { label: 'Início', path: '/dashboard', icon: 'home' },
    { label: 'Buscar', path: '/search', icon: 'search' },
    { label: 'Lista', path: '/cart', icon: 'receipt_long', isCenter: true },
    { label: 'Plano', path: '/planner', icon: 'calendar_month' },
    { label: 'Perfil', path: '/profile', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/95 dark:bg-background-dark/95 backdrop-blur-lg border-t border-slate-200 dark:border-white/5 pb-2 pt-2 px-6 shadow-2xl">
      <div className="flex justify-between items-center h-14 max-w-md mx-auto relative">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center gap-1 w-12 transition-all duration-300 ${isActive(item.path) ? 'text-primary scale-110' : 'text-slate-400 dark:text-[#92c9a4]'
              }`}
          >
            <span className={`material-symbols-rounded text-[24px] ${isActive(item.path) ? 'fill-1' : ''}`}
              style={{ fontVariationSettings: `'FILL' ${isActive(item.path) ? 1 : 0}` }}>
              {item.icon}
            </span>
            <span className="text-[10px] font-bold leading-none">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
