
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { label: 'Início', path: '/', icon: 'home' },
    { label: 'Buscar', path: '/search', icon: 'search' },
    { label: 'Cart', path: '/cart', icon: 'shopping_cart', isCenter: true },
    { label: 'Plano', path: '/planner', icon: 'calendar_month' },
    { label: 'Perfil', path: '/profile', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/95 dark:bg-background-dark/95 backdrop-blur-lg border-t border-slate-200 dark:border-white/5 pb-6 pt-2 px-6 shadow-2xl">
      <div className="flex justify-between items-center h-14 max-w-md mx-auto">
        {navItems.map((item) => (
          item.isCenter ? (
            <div key={item.path} className="relative">
              <button
                onClick={() => navigate(item.path)}
                className={`flex items-center justify-center w-14 h-14 rounded-full bg-primary text-black -mt-8 shadow-lg shadow-primary/30 active:scale-95 transition-transform border-4 border-white dark:border-background-dark`}
              >
                <span className="material-symbols-outlined filled">{item.icon}</span>
              </button>
            </div>
          ) : (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 w-12 transition-colors ${
                isActive(item.path) ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive(item.path) ? 'filled' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
