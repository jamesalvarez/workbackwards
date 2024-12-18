// app/(tabs)/index.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    requestNotificationPermissions,
    scheduleNotification,
    hasScheduledNotifications,
    cancelNotifications
} from './services/notifications';

const SessionState = {
    NOT_RUNNING: 'NOT_RUNNING',
    WAITING: 'WAITING',
    IN_SESSION: 'IN_SESSION',
    POST_SESSION: 'POST_SESSION'
};

export default function Index() {
    const [sessionState, setSessionState] = useState(SessionState.NOT_RUNNING);
    const [sessionLength, setSessionLength] = useState(5);
    const [increment, setIncrement] = useState(1);
    const [endTime, setEndTime] = useState(new Date());

    const [showTimePicker, setShowTimePicker] = useState(false);
    const [countdown, setCountdown] = useState('');
    const [streak, setStreak] = useState(0);
    const [nextSessionLength, setNextSessionLength] = useState(5);

    const [sessionActive, setSessionActive] = useState(false);
    const [sessionEndTime, setSessionEndTime] = useState(null);

    const loadSettings = async () => {
        try {
            const savedSessionLength = await AsyncStorage.getItem('sessionLength');
            const savedIncrement = await AsyncStorage.getItem('increment');
            const savedEndTime = await AsyncStorage.getItem('endTime');
            const savedStreak = await AsyncStorage.getItem('streak');

            if (savedSessionLength !== null) {
                setSessionLength(parseInt(savedSessionLength));
            }

            if (savedIncrement !== null) {
                setIncrement(parseInt(savedIncrement));
            }

            if (savedEndTime !== null) {
                setEndTime(new Date(savedEndTime));
            }

            if (savedStreak !== null) {
                setStreak(parseInt(savedStreak));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };




    useEffect(() => {
        const initialize = async () => {
            await requestNotificationPermissions();
            await loadSettings();
            await determineSessionState();
        };

        initialize();
    }, []);

    const determineSessionState = async () => {
        const now = new Date();
        const sessionStartTime = new Date(endTime);
        sessionStartTime.setMinutes(sessionStartTime.getMinutes() - sessionLength);

        // If we're in the session window
        if (now >= sessionStartTime && now <= endTime) {
            setSessionState(SessionState.IN_SESSION);
            return;
        }

        // If we're past the end time but haven't logged success/failure
        if (now > endTime && sessionState === SessionState.IN_SESSION) {
            setSessionState(SessionState.POST_SESSION);
            return;
        }

        // Check if we have scheduled notifications
        const hasNotifications = await hasScheduledNotifications();
        setSessionState(hasNotifications ? SessionState.WAITING : SessionState.NOT_RUNNING);
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

    const handleStart = async () => {
        await scheduleNotification(endTime);
        await determineSessionState();
    };

    const handleStop = async () => {
        await cancelNotifications();
        await determineSessionState();;
    };

    const renderContent = () => {
        switch (sessionState) {
            case SessionState.NOT_RUNNING:
                return (
                    <>
                        <TouchableOpacity
                            style={[styles.button, styles.startButton]}
                            onPress={handleStart}
                        >
                            <Text style={styles.buttonText}>Start Daily Sessions</Text>
                        </TouchableOpacity>
                        <Text style={styles.streakText}>Current Streak: {streak} days</Text>
                    </>
                );

            case SessionState.WAITING:
                return (
                    <>
                        <Text style={styles.countdownText}>Next session in: {countdown}</Text>
                        <Text style={styles.sessionText}>Next session length: {nextSessionLength} minutes</Text>
                        <Text style={styles.streakText}>Current Streak: {streak} days</Text>
                        <TouchableOpacity
                            style={[styles.button, styles.stopButton]}
                            onPress={handleStop}
                        >
                            <Text style={styles.buttonText}>Stop Sessions</Text>
                        </TouchableOpacity>
                    </>
                );

            case SessionState.IN_SESSION:
                return (
                    <>
                        <Text style={styles.countdownText}>Session time remaining: {countdown}</Text>
                        <Text style={styles.streakText}>Current Streak: {streak} days</Text>
                        <TouchableOpacity
                            style={[styles.button, styles.completeButton]}
                            onPress={() => setSessionState(SessionState.POST_SESSION)}
                        >
                            <Text style={styles.buttonText}>End Session</Text>
                        </TouchableOpacity>
                    </>
                );

            case SessionState.POST_SESSION:
                return (
                    <>
                        <Text style={styles.title}>Did you maintain good posture?</Text>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.failButton]}
                                onPress={() => updateStreak(false)}
                            >
                                <Text style={styles.buttonText}>No</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.successButton]}
                                onPress={() => updateStreak(true)}
                            >
                                <Text style={styles.buttonText}>Yes</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                );
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Work Backwards</Text>
            {renderContent()}
        </View>
    );
}

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 20,
    },
    startButton: {
        backgroundColor: '#4CAF50',
    },
    stopButton: {
        backgroundColor: '#f44336',
    },
    failButton: {
        backgroundColor: '#f44336',
        flex: 1,
        marginRight: 10,
    },
    successButton: {
        backgroundColor: '#4CAF50',
        flex: 1,
        marginLeft: 10,
    },
    sessionText: {
        textAlign: 'center',
        fontSize: 16,
        marginTop: 10,
        color: '#666',
    },
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
