// app/(tabs)/index.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { requestNotificationPermissions, scheduleNotification, setupNotificationListener } from './services/notifications';

export default function Index() {
    const [endTime, setEndTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [countdown, setCountdown] = useState('');
    const [tempTime, setTempTime] = useState(new Date());
    const [streak, setStreak] = useState(0);
    const [sessionLength, setSessionLength] = useState(5);
    const [increment, setIncrement] = useState(1);
    const [showSessionConfig, setShowSessionConfig] = useState(false);

    const loadSettings = async () => {
        try {
            const savedSessionLength = await AsyncStorage.getItem('sessionLength');
            const savedIncrement = await AsyncStorage.getItem('increment');
            if (savedSessionLength !== null) {
                setSessionLength(parseInt(savedSessionLength));
            }
            if (savedIncrement !== null) {
                setIncrement(parseInt(savedIncrement));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const loadEndTime = async () => {
        try {
            const savedEndTime = await AsyncStorage.getItem('endTime');
            if (savedEndTime !== null) {
                setEndTime(new Date(savedEndTime));
                setTempTime(new Date(savedEndTime));
            }
        } catch (error) {
            console.error('Error loading end time:', error);
        }
    };
    const [sessionActive, setSessionActive] = useState(false);
    const [sessionEndTime, setSessionEndTime] = useState(null);

    useEffect(() => {
        requestNotificationPermissions();
        loadStreak();
        loadEndTime();
        loadSettings();

        // Set up notification listener
        const subscription = Notifications.addNotificationReceivedListener(() => {
            setSessionActive(true);
            const endTime = new Date(Date.now() + sessionLength * 60 * 1000);
            setSessionEndTime(endTime);
            // Automatically end session after configured time
            setTimeout(() => {
                if (sessionActive) {
                    handleSessionEnd();
                }
            }, sessionLength * 60 * 1000);
        });

        // Cleanup subscription on unmount
        return () => subscription.remove();
    }, []);

    const loadStreak = async () => {
        try {
            const savedStreak = await AsyncStorage.getItem('streak');
            if (savedStreak !== null) {
                setStreak(parseInt(savedStreak));
            }
        } catch (error) {
            console.error('Error loading streak:', error);
        }
    };

    const updateStreak = async (success) => {
        try {
            if (success) {
                const newStreak = streak + 1;
                const newSessionLength = sessionLength + increment;
                await AsyncStorage.setItem('streak', newStreak.toString());
                await AsyncStorage.setItem('sessionLength', newSessionLength.toString());
                setStreak(newStreak);
                setSessionLength(newSessionLength);
            } else {
                await AsyncStorage.setItem('streak', '0');
                await AsyncStorage.setItem('sessionLength', '5');
                setStreak(0);
                setSessionLength(5);
            }
        } catch (error) {
            console.error('Error saving streak:', error);
        }
    };

    const handleSessionEnd = () => {
        Alert.alert(
            "Session Complete",
            "Did you maintain good posture for the full 5 minutes?",
            [
                {
                    text: "No",
                    onPress: () => updateStreak(false),
                    style: "cancel"
                },
                {
                    text: "Yes",
                    onPress: () => updateStreak(true)
                }
            ]
        );
        setSessionActive(false);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            
            if (sessionActive && sessionEndTime) {
                // Session countdown
                const diff = sessionEndTime - now;
                if (diff <= 0) {
                    setSessionActive(false);
                    setSessionEndTime(null);
                    return;
                }
                const minutes = Math.floor(diff / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setCountdown(`${minutes}m ${seconds}s remaining`);
            } else {
                // Next notification countdown
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

                setCountdown(`${hours}h ${minutes}m ${seconds}s until next session`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [endTime, sessionActive, sessionEndTime]);


    const handleTimeChange = (event, selectedTime) => {
        if (selectedTime) {
            setTempTime(selectedTime);
        }
    };

    const handleSetTime = async () => {
        try {
            await AsyncStorage.setItem('endTime', tempTime.toISOString());
            setEndTime(tempTime);
            setShowTimePicker(false);
            // Schedule notification automatically after setting time
            await scheduleNotification();
        } catch (error) {
            console.error('Error saving end time:', error);
        }
    };

    const handleCancelTime = () => {
        setTempTime(endTime);
        setShowTimePicker(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Work Backwards</Text>




            <Text style={styles.countdownText}>Next notification in: {countdown}</Text>
            <Text style={styles.streakText}>Current Streak: {streak} days</Text>
            
            {sessionActive && (
                <TouchableOpacity
                    style={[styles.button, styles.completeButton]}
                    onPress={handleSessionEnd}
                >
                    <Text style={styles.buttonText}>Complete Session</Text>
                </TouchableOpacity>
            )}
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
    completeButton: {
        backgroundColor: '#9C27B0',
    },
    streakText: {
        textAlign: 'center',
        fontSize: 16,
        marginTop: 10,
        color: '#9C27B0',
        fontWeight: 'bold',
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
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: '#333',
    },
    input: {
        width: '100%',
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 15,
        backgroundColor: 'white',
    },
});
