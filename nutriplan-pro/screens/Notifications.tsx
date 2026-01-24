import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, Utensils, BadgeCheck, BellOff } from 'lucide-react';

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

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
            <header className="p-4 flex items-center justify-between sticky top-0 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md z-10 w-full">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Notificações</h1>
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        className="flex size-10 items-center justify-center rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-90"
                        title="Limpar tudo"
                    >
                        <span className="material-symbols-outlined text-[24px]">delete_sweep</span>
                    </button>
                )}
            </header>

            <div className="flex-1 p-4 divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((notif) => (
                    <div key={notif.id} className="py-4 flex gap-4 animate-in slide-in-from-right duration-300">
                        <div className={`size-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center ${notif.color}`}>
                            <notif.icon className="fill-current" size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-sm">{notif.title}</h3>
                                <span className="text-[10px] text-slate-400">{notif.time}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{notif.description}</p>
                        </div>
                    </div>
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
