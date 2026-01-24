import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, Utensils, BadgeCheck, BellOff, Trash2 } from 'lucide-react';

interface NotificationItemProps {
    notif: any;
    onDelete: (id: number) => void;
}

const SwipeableNotification: React.FC<NotificationItemProps> = ({ notif, onDelete }) => {
    const [startX, setStartX] = useState(0);
    const [offsetX, setOffsetX] = useState(0);
    const [isDeleting, setIsDeleting] = useState<'left' | 'right' | null>(null);
    const itemRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartX(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        setOffsetX(diff);
    };

    const handleTouchEnd = () => {
        const threshold = 100;
        if (offsetX < -threshold) {
            setIsDeleting('left');
            setTimeout(() => {
                onDelete(notif.id);
            }, 300);
        } else if (offsetX > threshold) {
            setIsDeleting('right');
            setTimeout(() => {
                onDelete(notif.id);
            }, 300);
        } else {
            setOffsetX(0);
        }
    };

    return (
        <div className="relative overflow-hidden bg-red-500 dark:bg-red-900/40">
            {/* Background Action (Left side - shows when swiping right) */}
            <div className={`absolute inset-y-0 left-0 flex items-center px-6 text-white transition-opacity ${offsetX > 20 ? 'opacity-100' : 'opacity-0'}`}>
                <div className={`flex flex-col items-center gap-1 transition-transform duration-200 ${offsetX > 60 ? 'scale-110' : 'scale-90 opacity-50'}`}>
                    <Trash2 size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Excluir</span>
                </div>
            </div>

            {/* Background Action (Right side - shows when swiping left) */}
            <div className={`absolute inset-y-0 right-0 flex items-center px-6 text-white transition-opacity ${offsetX < -20 ? 'opacity-100' : 'opacity-0'}`}>
                <div className={`flex flex-col items-center gap-1 transition-transform duration-200 ${offsetX < -60 ? 'scale-110' : 'scale-90 opacity-50'}`}>
                    <Trash2 size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Excluir</span>
                </div>
            </div>

            {/* Foreground Content */}
            <div
                ref={itemRef}
                className={`flex gap-4 p-4 bg-background-light dark:bg-background-dark transition-transform relative z-10 ${isDeleting ? 'opacity-0' : ''}`}
                style={{
                    transform: isDeleting === 'left' ? 'translateX(-100%)' : isDeleting === 'right' ? 'translateX(100%)' : `translateX(${offsetX}px)`,
                    transition: (offsetX === 0 || isDeleting) ? 'transform 0.3s ease-out, opacity 0.3s ease' : 'none'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className={`size-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center ${notif.color} shrink-0`}>
                    <notif.icon className="fill-current" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{notif.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{notif.description}</p>
                </div>

                <div className="flex flex-col items-end justify-between shrink-0 gap-1 mt-0.5">
                    <span className="text-[10px] text-slate-400">{notif.time}</span>
                    <button
                        onClick={() => onDelete(notif.id)}
                        className="hidden md:flex size-7 items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-90"
                        title="Remover"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const Notifications: React.FC = () => {
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: 'Meta de água atingida!',
            description: 'Parabéns! Você bebeu 2L de água hoje.',
            time: '2h atrás',
            icon: Droplets,
            color: 'text-blue-500'
        },
        {
            id: 2,
            title: 'Hora do Almoço',
            description: 'Não esqueça de registrar sua refeição no planejador.',
            time: '4h atrás',
            icon: Utensils,
            color: 'text-orange-500'
        },
        {
            id: 3,
            title: 'Bem-vindo ao NutriPlan Pro',
            description: 'Comece configurando seu perfil para uma experiência personalizada.',
            time: '1 dia atrás',
            icon: BadgeCheck,
            color: 'text-primary'
        }
    ]);

    const handleClearAll = () => {
        setNotifications([]);
    };

    const handleDelete = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
            <header className="p-4 flex items-center justify-between sticky top-0 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md z-20 w-full border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Notificações</h1>
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        className="flex size-10 items-center justify-center rounded-full text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-90"
                        title="Limpar tudo"
                    >
                        <span className="material-symbols-outlined text-[28px]">clear_all</span>
                    </button>
                )}
            </header>

            <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((notif) => (
                    <SwipeableNotification
                        key={notif.id}
                        notif={notif}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {notifications.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-10 mt-[-10vh] animate-in fade-in zoom-in duration-500">
                    <div className="size-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-4">
                        <BellOff size={40} />
                    </div>
                    <p className="text-slate-500 font-medium">Nenhuma notificação por enquanto</p>
                </div>
            )}
        </div>
    );
};

export default Notifications;
