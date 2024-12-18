import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from "expo-notifications";

// Set up notifications configuration
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Notification permissions not granted');
    }
    return status;
};

export const scheduleNotification = async (endTime) => {
    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Calculate the next notification time
    const now = new Date();
    const startTime = new Date(endTime);
    startTime.setMinutes(startTime.getMinutes() - 5);

    // If the time has already passed today, schedule for tomorrow
    if (now > startTime) {
        startTime.setDate(startTime.getDate() + 1);
    }

    // Calculate seconds until next notification
    const secondsUntilNotification = Math.floor((startTime - now) / 1000);

    // Debug log the seconds until notification
    console.log('Seconds until notification:', secondsUntilNotification);

    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Time to Work on Posture!',
            body: 'Maintain good posture for 5 minutes',
        },
        trigger: {
            type: SchedulableTriggerInputTypes.DAILY_INTERVAL,
            hour: startTime.getHours(),
            minute: startTime.getMinutes(),
            repeats: true,
        },
    });

    return startTime;
};

export const setupNotificationListener = (onNotificationReceived) => {
    const subscription = Notifications.addNotificationReceivedListener(onNotificationReceived);
    return subscription;
};
