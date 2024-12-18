// app/(tabs)/index.js
import React, { useState, useEffect } from 'react';
import useSessionStore from '../store/sessionStore';
import { StyleSheet, View, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import {
    requestNotificationPermissions,
    scheduleNotification,
    hasScheduledNotifications,
    cancelNotifications
} from '../services/notifications';

const SessionState = {
    NOT_RUNNING: 'NOT_RUNNING',
    WAITING: 'WAITING',
    IN_SESSION: 'IN_SESSION',
    POST_SESSION: 'POST_SESSION'
};

export default function Index() {
    const {
        sessionState, setSessionState,
        sessionLength, setSessionLength,
        increment, setIncrement,
        endTimeHour, endTimeMinute,
        streak, setStreak,
        updateStreak
    } = useSessionStore()

    const [countdown, setCountdown] = useState('');


    useFocusEffect(
        React.useCallback(() => {
            const initialize = async () => {
                await requestNotificationPermissions();
                await determineSessionState();
            };

            initialize();
        }, [])
    );

    const getTodaysStartAndEndTime = () => {
        const now = new Date();

        // Get today's endTime
        const endTime = new Date(now);
        endTime.setHours(endTimeHour, endTimeMinute, 0, 0);

        // Get today's session start time
        const sessionStartTime = new Date(endTime);
        sessionStartTime.setMinutes(sessionStartTime.getMinutes() - sessionLength);

        return { sessionStartTime, endTime };
    }

    const determineSessionState = async () => {
        try {
            console.log('Determining session state: ', sessionState);
            const now = new Date();

            const { sessionStartTime, endTime } = getTodaysStartAndEndTime();

            switch (sessionState) {
                case SessionState.NOT_RUNNING:
                    break;
                case SessionState.WAITING:
                    if (now >= sessionStartTime) {
                        console.log('Setting session state to IN_SESSION');
                        setSessionState(SessionState.IN_SESSION);
                    }
                    break;
                case SessionState.IN_SESSION:
                    if (now > endTime) {
                        console.log('Setting session state to POST_SESSION');
                        setSessionState(SessionState.POST_SESSION);
                    }
                    break;
                case SessionState.POST_SESSION:
                    break;
            }

        } catch (error) {
            console.error('Error determining session state:', error);
            setSessionState(SessionState.NOT_RUNNING);
        }
    };



    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const { sessionStartTime, endTime } = getTodaysStartAndEndTime();



            // First determine whether we are waiting for the next session or in a session from the time
            const inSession = (now >= sessionStartTime && now <= endTime);

            if (inSession) {
                // Session countdown
                const diff = endTime - now;
                const minutes = Math.floor(diff / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setCountdown(`${minutes}m ${seconds}s remaining`);



            } else {
                // Next notification countdown
                const notificationTime = new Date(endTime);
                notificationTime.setMinutes(notificationTime.getMinutes() - sessionLength);

                if (now > notificationTime) {
                    // If current time is past notification time, calculate for next day
                    notificationTime.setDate(notificationTime.getDate() + 1);
                }

                const diff = notificationTime - now;
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                if (hours > 0) {
                    setCountdown(`${hours}h ${minutes}m  until next session`);
                } else {
                    setCountdown(`${minutes}m ${seconds}s until next session`);
                }

            }

            determineSessionState();
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleStart = async () => {
        await scheduleNotification(sessionLength, endTimeHour, endTimeMinute);
        setSessionState(SessionState.WAITING);
    };

    const handleStop = async () => {
        await cancelNotifications();
        setSessionState(SessionState.NOT_RUNNING);
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
                    </>
                );

            case SessionState.WAITING:
                return (
                    <>
                        <Text style={styles.countdownText}>Next session in: {countdown}</Text>
                        <Text style={styles.sessionText}>Next session length: {sessionLength} minutes</Text>
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
                                onPress={async () => {
                                    updateStreak(false);
                                    setSessionState(SessionState.WAITING);
                                }}
                            >
                                <Text style={styles.buttonText}>No</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.successButton]}
                                onPress={async () => {
                                    updateStreak(true);
                                    setSessionState(SessionState.WAITING);
                                }}
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
            {sessionState !== null && renderContent()}
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
