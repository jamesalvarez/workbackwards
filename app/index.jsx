// app/(tabs)/index.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import {SchedulableTriggerInputTypes} from "expo-notifications";

// Set up notifications configuration
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default function Index() {
    const [endTime, setEndTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [countdown, setCountdown] = useState('');
    const [tempTime, setTempTime] = useState(new Date());

    useEffect(() => {
        requestNotificationPermissions();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const notificationTime = new Date(endTime);
            notificationTime.setMinutes(notificationTime.getMinutes() - 5);

            if (now > notificationTime) {
                // If current time is past notification time, calculate for next day
                notificationTime.setDate(notificationTime.getDate() + 1);
            }

            const diff = notificationTime - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(timer);
    }, [endTime]);

    const requestNotificationPermissions = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            alert('You need to enable notifications for this app to work!');
        }
    };

    const scheduleNotification = async () => {
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
                type: SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: secondsUntilNotification,
                repeats: false,
            },
        });

        alert('Notification scheduled for ' + startTime.toLocaleTimeString());
    };

    const handleTimeChange = (event, selectedTime) => {
        if (selectedTime) {
            setTempTime(selectedTime);
        }
    };

    const handleSetTime = () => {
        setEndTime(tempTime);
        setShowTimePicker(false);
    };

    const handleCancelTime = () => {
        setTempTime(endTime);
        setShowTimePicker(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Work Backwards</Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => setShowTimePicker(true)}
            >
                <Text style={styles.buttonText}>
                    Set End Time: {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </TouchableOpacity>

            {showTimePicker && (
                <View style={styles.timePickerContainer}>
                    <DateTimePicker
                        value={tempTime}
                        mode="time"
                        is24Hour={true}
                        display="spinner"
                        onChange={handleTimeChange}
                    />
                    <View style={styles.timePickerButtons}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleCancelTime}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.setButton]}
                            onPress={handleSetTime}
                        >
                            <Text style={styles.buttonText}>Set Time</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <TouchableOpacity
                style={[styles.button, styles.scheduleButton]}
                onPress={scheduleNotification}
            >
                <Text style={styles.buttonText}>Schedule Notification</Text>
            </TouchableOpacity>

            <Text style={styles.countdownText}>Next notification in: {countdown}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
    },
    button: {
        backgroundColor: '#4a90e2',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    scheduleButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
    countdownText: {
        textAlign: 'center',
        fontSize: 18,
        marginTop: 20,
        color: '#666',
    },
    timePickerContainer: {
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        marginVertical: 20,
    },
    timePickerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20,
    },
    cancelButton: {
        backgroundColor: '#ff6b6b',
        flex: 1,
        marginRight: 10,
    },
    setButton: {
        backgroundColor: '#4CAF50',
        flex: 1,
        marginLeft: 10,
    },
});
