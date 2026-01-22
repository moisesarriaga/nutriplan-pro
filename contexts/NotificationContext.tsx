import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NotificationOptions {
    onConfirm?: () => void;
    title?: string;
}

interface ConfirmationOptions {
    onConfirm?: () => void;
    title?: string;
}

interface NotificationContextType {
    showNotification: (message: string, options?: NotificationOptions) => void;
    hideNotification: () => void;
    notification: {
        visible: boolean;
        message: string;
        options?: NotificationOptions;
    };
    showConfirmation: (message: string, options?: ConfirmationOptions) => void;
    hideConfirmation: () => void;
    confirmation: {
        visible: boolean;
        message: string;
        options?: ConfirmationOptions;
    };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notification, setNotification] = useState<{
        visible: boolean;
        message: string;
        options?: NotificationOptions;
    }>({
        visible: false,
        message: '',
    });

    const [confirmation, setConfirmation] = useState<{
        visible: boolean;
        message: string;
        options?: ConfirmationOptions;
    }>({
        visible: false,
        message: '',
    });

    const showNotification = useCallback((message: string, options?: NotificationOptions) => {
        setNotification({
            visible: true,
            message,
            options,
        });
    }, []);

    const hideNotification = useCallback(() => {
        if (notification.options?.onConfirm) {
            notification.options.onConfirm();
        }
        setNotification((prev) => ({ ...prev, visible: false }));
    }, [notification]);

    const showConfirmation = useCallback((message: string, options?: ConfirmationOptions) => {
        setConfirmation({
            visible: true,
            message,
            options,
        });
    }, []);

    const hideConfirmation = useCallback(() => {
        setConfirmation((prev) => ({ ...prev, visible: false }));
    }, []);

    return (
        <NotificationContext.Provider value={{
            showNotification,
            hideNotification,
            notification,
            showConfirmation,
            hideConfirmation,
            confirmation
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
