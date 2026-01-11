import { useEffect, useState } from 'react';

export const useWaterNotifications = (iconPath = '/favicon.svg') => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            alert('Este navegador não suporta notificações');
            return false;
        }

        const result = await Notification.requestPermission();
        setPermission(result);

        if (result === 'granted') {
            setNotificationsEnabled(true);
            return true;
        }
        return false;
    };

    const sendNotification = (title: string, body: string) => {
        if (permission === 'granted') {
            // Garante que o caminho seja uma URL absoluta (ex: http://localhost:3000/favicon.ico)
            const fullIconPath = new URL(iconPath, window.location.origin).href;

            new Notification(title, {
                body,
                icon: fullIconPath,
                badge: fullIconPath,
                tag: 'water-reminder',
            });
        }
    };

    const scheduleWaterReminders = () => {
        if (permission !== 'granted') return;

        // Send reminder every 2 hours (7200000 ms)
        const interval = setInterval(() => {
            sendNotification(
                '💧 Hora de beber água!',
                'Lembre-se de se manter hidratado. Beba um copo de água agora!'
            );
        }, 7200000); // 2 hours

        return () => clearInterval(interval);
    };

    return {
        notificationsEnabled,
        permission,
        requestPermission,
        sendNotification,
        scheduleWaterReminders,
    };
};
