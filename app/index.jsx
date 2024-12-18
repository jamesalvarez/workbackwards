// app/(tabs)/index.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';

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

    useEffect(() => {
        requestNotificationPermissions();
    }, []);

    const requestNotificationPermissions = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            alert('You need to enable notifications for this app to work!');
        }
    };

    const scheduleNotification = async () => {
        // Cancel existing notifications
        await Notifications.cancelAllScheduledNotificationsAsync();

        // Schedule notification 5 minutes before end time
        const startTime = new Date(endTime);
        startTime.setMinutes(startTime.getMinutes() - 5);

        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Time to Work on Posture!',
                body: 'Maintain good posture for 5 minutes',
            },
            trigger: {
                hour: startTime.getHours(),
                minute: startTime.getMinutes(),
                repeats: true,
            },
        });

        alert('Notification scheduled!');
    };

    const handleTimeChange = (event, selectedTime) => {
        setShowTimePicker(false);
        if (selectedTime) {
            setEndTime(selectedTime);
        }
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
                <DateTimePicker
                    value={endTime}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={handleTimeChange}
                />
            )}

            <TouchableOpacity
                style={[styles.button, styles.scheduleButton]}
                onPress={scheduleNotification}
            >
                <Text style={styles.buttonText}>Schedule Notification</Text>
            </TouchableOpacity>
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
});
