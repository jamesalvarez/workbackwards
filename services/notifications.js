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

export const hasScheduledNotifications = async () => {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications.length > 0;
};

export const scheduleNotification = async (sessionLength, endTimeHour, endTimeMinute) => {
    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Calculate startTime by subtracting sessionLength from endTime
    const now = new Date();
    const endTime = new Date(now);
    endTime.setHours(endTimeHour, endTimeMinute, 0, 0);
    const startTime = new Date(endTime);
    startTime.setMinutes(startTime.getMinutes() - sessionLength);

    console.log('Session length:', sessionLength);
    console.log('Scheduling notification for:', startTime.toLocaleTimeString());
    console.log('Ending at:', endTime.toLocaleTimeString());

    // Schedule start notification
    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Time to Work on Posture!',
            body: 'Maintain good posture for the next period!',
            data: { type: 'start' }
        },
        trigger: {
            type: SchedulableTriggerInputTypes.DAILY,
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
            type: SchedulableTriggerInputTypes.DAILY,
            hour: endTime.getHours(),
            minute: endTime.getMinutes(),
            repeats: true,
        },
    });

    return startTime;
};

export const cancelNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
}
