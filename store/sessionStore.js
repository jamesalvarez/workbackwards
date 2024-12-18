import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

console.log('Initializing sessionStore...');

const useSessionStore = create(
  persist(
    (set, get) => ({
      sessionState: null,
      sessionLength: 5,
      increment: 1,
      endTimeHour: new Date().getHours(),
      endTimeMinute: new Date().getMinutes(),
      streak: 0,
      
      setSessionState: (state) => {
        console.log('Setting sessionState:', state);
        set({ sessionState: state });
      },
      setSessionLength: (length) => {
        console.log('Setting sessionLength:', length);
        set({ sessionLength: parseInt(length) });
      },
      setIncrement: (inc) => {
        console.log('Setting increment:', inc);
        set({ increment: parseInt(inc) });
      },
      setEndTimeHour: (hour) => {
        console.log('Setting endTimeHour:', hour);
        set({ endTimeHour: parseInt(hour) });
      },
      setEndTimeMinute: (minute) => {
        console.log('Setting endTimeMinute:', minute);
        set({ endTimeMinute: parseInt(minute) });
      },
      setStreak: (count) => {
        console.log('Setting streak:', count);
        set({ streak: count });
      },
      
      updateStreak: (success) => {
        const { streak, sessionLength, increment } = get()
        console.log('Updating streak. Current values:', {
          success,
          currentStreak: streak,
          currentSessionLength: sessionLength,
          currentIncrement: increment
        });
        
        if (success) {
          const newStreak = streak + 1;
          const newSessionLength = sessionLength + increment;
          console.log('Success - New values:', {
            newStreak,
            newSessionLength
          });
          set({
            streak: newStreak,
            sessionLength: newSessionLength
          })
        } else {
          console.log('Failed - Resetting streak and session length');
          set({
            streak: 0,
            sessionLength: 5
          })
        }
      }
    }),
    {
      name: 'session-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

export default useSessionStore
