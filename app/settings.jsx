import React, { useState } from 'react';
import useSessionStore from '../store/sessionStore';
import { useFocusEffect } from 'expo-router';
import { scheduleNotification } from '../services/notifications';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';


export default function Settings() {
    const {
        lastSessionDate, setLastSessionDate,
        sessionState, setSessionState,
        sessionLength, setSessionLength,
        increment, setIncrement,
        endTimeHour, setEndTimeHour,
        endTimeMinute, setEndTimeMinute
    } = useSessionStore()

    const [localSessionLength, setLocalSessionLength] = useState(sessionLength?.toString() || '5');
    const [localIncrement, setLocalIncrement] = useState(increment?.toString() || '1');
    const [localEndTimeHour, setLocalEndTimeHour] = useState(endTimeHour);
    const [localEndTimeMinute, setLocalEndTimeMinute] = useState(endTimeMinute);


    const resetLocalState = () => {
        setLocalSessionLength(sessionLength?.toString() || '5');
        setLocalIncrement(increment?.toString() || '1');
        setLocalEndTimeHour(endTimeHour);
        setLocalEndTimeMinute(endTimeMinute);
    }

    useFocusEffect(
        React.useCallback(() => {
            resetLocalState();
        }, [])
    );



    const handleSave = async () => {
        try {
            const newSessionLength = parseInt(localSessionLength) || 5;
            const newIncrement = parseInt(localIncrement) || 1;

            setSessionLength(newSessionLength);
            setIncrement(newIncrement);
            setEndTimeHour(localEndTimeHour);
            setEndTimeMinute(localEndTimeMinute);
            setSessionState('WAITING');
            setLastSessionDate(null);

            // Schedule notification with new end time
            const notificationTime = await scheduleNotification(newSessionLength, localEndTimeHour, localEndTimeMinute);

            alert(`Settings saved successfully! Next notification scheduled for ${notificationTime.toLocaleTimeString()}`);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        }
    };

    const handleCancel = () => {
        resetLocalState();
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Settings</Text>

            <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>Timer Settings</Text>
                <Text style={styles.label}>Session Length (minutes)</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={localSessionLength}
                    onChangeText={(text) => {
                        setLocalSessionLength(text);
                    }}
                />

                <Text style={styles.label}>Daily Increment (minutes)</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={localIncrement}
                    onChangeText={(text) => {
                        setLocalIncrement(text);
                    }}
                />

            </View>

            <View style={[styles.formContainer, styles.timeContainer]}>
                <Text style={styles.sectionTitle}>End Time Settings</Text>
                <Text style={styles.label}>Daily End Time</Text>
                <DateTimePicker
                    value={new Date(new Date().setHours(localEndTimeHour || endTimeHour, localEndTimeMinute || endTimeMinute))}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={(event, selectedTime) => {
                        if (selectedTime) {
                            setLocalEndTimeHour(selectedTime.getHours());
                            setLocalEndTimeMinute(selectedTime.getMinutes());
                            console.log('Setting local end times to:', selectedTime.getHours(), selectedTime.getMinutes());
                        }
                    }}
                />
            </View>

            <View style={styles.bottomButtonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                >
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSave}
                >
                    <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    timeContainer: {
        marginTop: 20,
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 60,
        marginBottom: 30,
    },
    formContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
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
    bottomButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    button: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#ff6b6b',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
