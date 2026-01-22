import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NotificationOptions {
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

    return (
        <NotificationContext.Provider value={{ showNotification, hideNotification, notification }}>
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
