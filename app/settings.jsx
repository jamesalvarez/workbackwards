import React, { useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { scheduleNotification } from './services/notifications';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Settings() {
    const [sessionLength, setSessionLength] = useState('5');
    const [increment, setIncrement] = useState('1');
    const [endTime, setEndTime] = useState(new Date());
    const [originalEndTime, setOriginalEndTime] = useState(new Date());
    const [originalSessionLength, setOriginalSessionLength] = useState('5');
    const [originalIncrement, setOriginalIncrement] = useState('1');

    useFocusEffect(
        React.useCallback(() => {
            loadSettings();
        }, [])
    );

    const loadSettings = async () => {
        try {
            const savedSessionLength = await AsyncStorage.getItem('sessionLength');
            const savedIncrement = await AsyncStorage.getItem('increment');
            const savedEndTime = await AsyncStorage.getItem('endTime');
            if (savedSessionLength !== null) {
                setSessionLength(savedSessionLength);
                setOriginalSessionLength(savedSessionLength);
            }
            if (savedIncrement !== null) {
                setIncrement(savedIncrement);
                setOriginalIncrement(savedIncrement);
            }
            if (savedEndTime !== null) {
                const parsedEndTime = new Date(savedEndTime);
                setEndTime(parsedEndTime);
                setOriginalEndTime(parsedEndTime);
            }
            console.log('Settings loaded successfully');
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const handleSave = async () => {
        try {
            await AsyncStorage.setItem('sessionLength', sessionLength);
            await AsyncStorage.setItem('increment', increment);
            await AsyncStorage.setItem('endTime', endTime.toISOString());
            setOriginalSessionLength(sessionLength);
            setOriginalIncrement(increment);
            setOriginalEndTime(endTime);

            // Schedule notification with new end time
            const notificationTime = await scheduleNotification(sessionLength, endTime);
            alert(`Settings saved successfully! Next notification scheduled for ${notificationTime.toLocaleTimeString()}`);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        }
    };

    const handleCancel = () => {
        setSessionLength(originalSessionLength);
        setIncrement(originalIncrement);
        setEndTime(originalEndTime);
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
                    value={sessionLength}
                    onChangeText={setSessionLength}
                />

                <Text style={styles.label}>Daily Increment (minutes)</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={increment}
                    onChangeText={setIncrement}
                />

            </View>

            <View style={[styles.formContainer, styles.timeContainer]}>
                <Text style={styles.sectionTitle}>End Time Settings</Text>
                <Text style={styles.label}>Daily End Time</Text>
                <DateTimePicker
                    value={endTime}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={(event, selectedTime) => {
                        if (selectedTime) {
                            setEndTime(selectedTime);
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
