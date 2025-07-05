import { create } from 'zustand';

interface AppState {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  darkMode: false,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode, toggleDarkMode: state.toggleDarkMode })),
})); 