import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { AlertCircle } from 'lucide-react';

const ConfirmationModal: React.FC = () => {
    const { confirmation, hideConfirmation } = useNotification();

    if (!confirmation.visible) return null;

    const handleConfirm = () => {
        if (confirmation.options?.onConfirm) {
            confirmation.options.onConfirm();
        }
        hideConfirmation();
    };

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
                    <div className="mb-4 p-3 bg-red-500/10 rounded-full text-red-500">
                        <AlertCircle size={32} />
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
                            className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 h-12 rounded-2xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
