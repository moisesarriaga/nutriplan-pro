import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const AlertModal: React.FC = () => {
    const { notification, hideNotification } = useNotification();

    if (!notification.visible) return null;

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
                    <div className="mb-4 p-3 bg-primary/10 rounded-full text-primary">
                        <CheckCircle2 size={32} />
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
