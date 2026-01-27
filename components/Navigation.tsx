
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Navigation: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { label: t('nav.dashboard'), path: '/dashboard', icon: 'home' },
    { label: t('nav.search'), path: '/search', icon: 'search' },
    { label: t('nav.cart'), path: '/cart', icon: 'receipt_long' },
    { label: t('nav.planner'), path: '/planner', icon: 'calendar_month' },
    { label: t('nav.profile'), path: '/profile', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/95 dark:bg-background-dark/95 backdrop-blur-lg border-t border-slate-200 dark:border-white/5 pb-2 pt-2 px-6 shadow-2xl">
      <div className="flex justify-between items-center h-14 max-w-md mx-auto relative">
        {navItems.map((item) => (
          <button
            key={item.path}
            id={`nav-${item.path.replace('/', '')}`}
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
});

export default Navigation;
