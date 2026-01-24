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
            const fullIconPath = new URL(iconPath, window.location.origin).href;

            new Notification(title, {
                body,
                icon: fullIconPath,
                badge: fullIconPath,
                tag: 'water-reminder',
            });
        }
    };

    const isInsideSleepWindow = (start: string, end: string) => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);

        const startTime = startH * 60 + startM;
        const endTime = endH * 60 + endM;

        if (startTime < endTime) {
            // Sleep window is within the same day (e.g., 22:00 to 23:59)
            return currentTime >= startTime && currentTime <= endTime;
        } else {
            // Sleep window spans midnight (e.g., 22:00 to 07:00)
            return currentTime >= startTime || currentTime <= endTime;
        }
    };

    const scheduleWaterReminders = (
        intervalMinutes: number = 120,
        sleepStart: string = '22:00',
        sleepEnd: string = '07:00'
    ) => {
        if (permission !== 'granted') return;

        // Clear existing interval if any (managed by the component usually, but good to be safe)
        const interval = setInterval(() => {
            if (!isInsideSleepWindow(sleepStart, sleepEnd)) {
                sendNotification(
                    '💧 Hora de beber água!',
                    'Lembre-se de se manter hidratado. Beba um copo de água agora!'
                );
            } else {
                console.log('Skipping water reminder due to sleep window');
            }
        }, intervalMinutes * 60 * 1000);

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
