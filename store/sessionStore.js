import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

const useSessionStore = create(
  persist(
    (set, get) => ({
      sessionState: null,
      sessionLength: 5,
      increment: 1,
      endTimeHour: new Date().getHours(),
      endTimeMinute: new Date().getMinutes(),
      streak: 0,
      
      setSessionState: (state) => set({ sessionState: state }),
      setSessionLength: (length) => set({ sessionLength: parseInt(length) }),
      setIncrement: (inc) => set({ increment: parseInt(inc) }),
      setEndTimeHour: (hour) => set({ endTimeHour: parseInt(hour) }),
      setEndTimeMinute: (minute) => set({ endTimeMinute: parseInt(minute) }),
      setStreak: (count) => set({ streak: count }),
      
      updateStreak: (success) => {
        const { streak, sessionLength, increment } = get()
        if (success) {
          set({
            streak: streak + 1,
            sessionLength: sessionLength + increment
          })
        } else {
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
