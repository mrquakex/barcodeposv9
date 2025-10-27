import { create } from 'zustand';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  // İlk tema kontrolü
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
  const initialTheme = savedTheme || 'light';

  return {
    theme: initialTheme,

    toggleTheme: () =>
      set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        return { theme: newTheme };
      }),

    setTheme: (theme: 'light' | 'dark') => {
      localStorage.setItem('theme', theme);
      set({ theme });
    },
  };
});


