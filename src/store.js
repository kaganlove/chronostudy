import { create } from 'zustand'

export const useApp = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  availability: {
    1: [[18*60, 21*60]],
    2: [[18*60, 21*60]],
    3: [[18*60, 21*60]],
    4: [[18*60, 21*60]],
    5: [[10*60, 12*60]],
  },
  setAvailability: (availability) => set({ availability }),
}))
