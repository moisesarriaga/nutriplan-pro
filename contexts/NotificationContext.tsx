import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface NotificationOptions {
    onConfirm?: () => void;
    title?: string;
    iconType?: 'success' | 'warning' | 'error';
}

interface ConfirmationOptions {
    onConfirm?: () => void;
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'primary' | 'danger';
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
    isNotificationsEnabled: boolean;
    updateNotificationPreference: (enabled: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(() => {
        const saved = localStorage.getItem('nutriplan_notifications_enabled');
        return saved !== null ? saved === 'true' : true;
    });

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

    const updateNotificationPreference = useCallback((enabled: boolean) => {
        setIsNotificationsEnabled(enabled);
        localStorage.setItem('nutriplan_notifications_enabled', String(enabled));
    }, []);

    const showNotification = useCallback((message: string, options?: NotificationOptions) => {
        if (!isNotificationsEnabled) return;
        setNotification({
            visible: true,
            message,
            options,
        });
    }, [isNotificationsEnabled]);

    const hideNotification = useCallback(() => {
        if (notification.options?.onConfirm) {
            notification.options.onConfirm();
        }
        setNotification((prev) => ({ ...prev, visible: false }));
    }, [notification]);

    const showConfirmation = useCallback((message: string, options?: ConfirmationOptions) => {
        if (!isNotificationsEnabled) return;
        setConfirmation({
            visible: true,
            message,
            options,
        });
    }, [isNotificationsEnabled]);

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
            confirmation,
            isNotificationsEnabled,
            updateNotificationPreference
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
