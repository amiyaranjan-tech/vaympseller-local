import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { Colors } from '../theme/color';
import { DarkColors } from '../theme/darkColor';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

// Only the user's explicit choice is persisted — resolving 'system' against
// the live OS scheme happens in useThemeColors below, not here, so a
// backgrounded OS-level theme switch is picked up on next render without a
// stale persisted value getting in the way.
export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      mode: 'system',
      setMode: mode => set({ mode }),
    }),
    {
      name: 'vaymp-seller/theme',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// The one hook screens/components use to go theme-aware — no Context
// Provider needed, Zustand hooks work standalone anywhere in the tree.
// Name/shape (`{ mode, colors }`) matches the Consumer app's
// useThemeColors for familiarity across the two codebases.
export function useThemeColors() {
  const mode = useThemeStore(state => state.mode);
  const systemScheme = useColorScheme();
  const resolvedDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  return {
    mode,
    colors: resolvedDark ? DarkColors : Colors,
  };
}
