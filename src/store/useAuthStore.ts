import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SellerProfile } from '../types/seller';

interface AuthState {
  isAuthenticated: boolean;
  seller: SellerProfile | null;
  setSession: (seller: SellerProfile) => void;
  updateSeller: (seller: SellerProfile) => void;
  clearSession: () => void;
}

// The JWT itself lives in Keychain (utils/tokenStorage.ts), never here —
// this only caches the last-known seller profile so the UI has something
// to render instantly on relaunch, before useMe() re-confirms it from the
// server. isAuthenticated reflects "we have a token", not "the shop is
// active" — see hooks/useSellerAccess.ts for the verification-state gate.
export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      isAuthenticated: false,
      seller: null,
      setSession: seller => set({ isAuthenticated: true, seller }),
      updateSeller: seller => set({ seller }),
      clearSession: () => set({ isAuthenticated: false, seller: null }),
    }),
    {
      name: 'vaymp-seller/auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        isAuthenticated: state.isAuthenticated,
        seller: state.seller,
      }),
    },
  ),
);
