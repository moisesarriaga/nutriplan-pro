import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { AlertTriangle } from 'lucide-react';

const ConfirmationModal: React.FC = () => {
    const { confirmation, hideConfirmation } = useNotification();

    if (!confirmation.visible) return null;

    const handleConfirm = () => {
        if (confirmation.options?.onConfirm) {
            confirmation.options.onConfirm();
        }
        hideConfirmation();
    };

    const variant = confirmation.options?.variant || 'danger';
    const confirmLabel = confirmation.options?.confirmLabel || 'Confirmar';
    const cancelLabel = confirmation.options?.cancelLabel || 'Cancelar';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={hideConfirmation}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-sm transform animate-in zoom-in-95 duration-200 bg-white dark:bg-surface-dark rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-gray-800">
                <div className="p-6 flex flex-col items-center text-center">
                    <div className="mb-4 p-3 bg-primary/10 rounded-full text-primary">
                        <AlertTriangle size={32} />
                    </div>

                    {confirmation.options?.title && (
                        <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">
                            {confirmation.options.title}
                        </h3>
                    )}

                    <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium leading-relaxed">
                        {confirmation.message}
                    </p>

                    <div className="flex gap-4 w-full">
                        <button
                            onClick={hideConfirmation}
                            className="flex-1 h-14 rounded-2xl font-bold text-slate-500 border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-[0.98]"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={`flex-1 h-14 rounded-2xl text-white font-bold shadow-lg transition-all active:scale-[0.98] ${variant === 'danger'
                                    ? 'bg-red-500 shadow-red-500/20'
                                    : 'bg-primary shadow-primary/20 !text-background-dark'
                                }`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
