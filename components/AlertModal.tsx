import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

const AlertModal: React.FC = () => {
    const { notification, hideNotification } = useNotification();

    if (!notification.visible) return null;

    // Determine icon type - default to success
    const iconType = notification.options?.iconType || 'success';

    // Icon configuration based on type
    const iconConfig = {
        success: {
            Icon: CheckCircle2,
            bgColor: 'bg-primary/10',
            textColor: 'text-primary'
        },
        warning: {
            Icon: AlertTriangle,
            bgColor: 'bg-primary/10',
            textColor: 'text-primary'
        },
        error: {
            Icon: AlertCircle,
            bgColor: 'bg-red-500/10',
            textColor: 'text-red-500'
        }
    };

    const { Icon, bgColor, textColor } = iconConfig[iconType];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={hideNotification}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-sm transform animate-in zoom-in-95 duration-200 bg-white dark:bg-surface-dark rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-gray-800">
                <div className="p-6 flex flex-col items-center text-center">
                    <div className={`mb-4 p-3 ${bgColor} rounded-full ${textColor}`}>
                        <Icon size={32} />
                    </div>

                    {notification.options?.title && (
                        <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">
                            {notification.options.title}
                        </h3>
                    )}

                    <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium leading-relaxed">
                        {notification.message}
                    </p>

                    <button
                        onClick={hideNotification}
                        className="w-full py-3.5 px-6 bg-primary hover:bg-primary-dark text-black font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] focus:ring-2 focus:ring-primary/50"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
