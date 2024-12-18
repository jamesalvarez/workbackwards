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

    // Calculate the start time (5 minutes before end time)
    const startTime = new Date(endTime);
    startTime.setMinutes(startTime.getMinutes() - 5);

    // Schedule start notification
    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Time to Work on Posture!',
            body: 'Maintain good posture for 5 minutes',
            data: { type: 'start' }
        },
        trigger: {
            type: SchedulableTriggerInputTypes.DAILY_INTERVAL,
            hour: startTime.getHours(),
            minute: startTime.getMinutes(),
            repeats: true,
        },
    });

    // Schedule end notification
    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Posture Session Complete!',
            body: 'Time to log your progress',
            data: { type: 'end', screen: 'index' }
        },
        trigger: {
            type: SchedulableTriggerInputTypes.DAILY_INTERVAL,
            hour: endTime.getHours(),
            minute: endTime.getMinutes(),
            repeats: true,
        },
    });

    return startTime;
};
