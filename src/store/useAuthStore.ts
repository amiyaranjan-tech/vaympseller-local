import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SellerRole } from '../features/auth/types';
import type { SellerProfile } from '../types/seller';

interface AuthState {
  isAuthenticated: boolean;
  seller: SellerProfile | null;
  // "owner" (models/Seller.js) or "helper" (models/SellerStaff.js) — see
  // hooks/useSellerAccess.ts and per-screen gating for what a helper can't
  // see (finance, offers, shop settings, notifications). Defaults to
  // "owner" so any code that runs before the first login/me response
  // (there shouldn't be any, but belt-and-suspenders) fails open to full
  // access rather than silently hiding things for a real owner.
  role: SellerRole;
  staffName: string | null;
  // True once the persisted value has actually been read back from
  // AsyncStorage. Before that, isAuthenticated is still its in-memory
  // `false` default, NOT yet the real persisted state — a fresh launch's
  // AsyncStorage read is inherently async, so it can't be ready on the
  // very first render. AppNavigator gates its Auth/AccountStatus/Main
  // switch on this so an already-logged-in (or pending-verification)
  // seller never sees a flash of the Login/Register screen before the
  // real state arrives.
  hasHydrated: boolean;
  setSession: (seller: SellerProfile, role?: SellerRole, staffName?: string | null) => void;
  updateSeller: (seller: SellerProfile, role?: SellerRole, staffName?: string | null) => void;
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
      role: 'owner',
      staffName: null,
      hasHydrated: false,
      setSession: (seller, role = 'owner', staffName = null) =>
        set({ isAuthenticated: true, seller, role, staffName }),
      updateSeller: (seller, role, staffName) =>
        set(state => ({
          seller,
          role: role ?? state.role,
          staffName: staffName === undefined ? state.staffName : staffName,
        })),
      clearSession: () =>
        set({ isAuthenticated: false, seller: null, role: 'owner', staffName: null }),
    }),
    {
      name: 'vaymp-seller/auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        isAuthenticated: state.isAuthenticated,
        seller: state.seller,
        role: state.role,
        staffName: state.staffName,
      }),
    },
  ),
);

// Registered once, at module load — always fires later (the AsyncStorage
// read behind it can't resolve synchronously in the same tick this file
// evaluates in), so `useAuthStore` is guaranteed to already be assigned by
// the time it actually runs. The `hasHydrated()` check right after covers
// the (largely theoretical, but cheap to guard) case where hydration
// somehow already finished before this line ran.
useAuthStore.persist.onFinishHydration(() => useAuthStore.setState({ hasHydrated: true }));
if (useAuthStore.persist.hasHydrated()) {
  useAuthStore.setState({ hasHydrated: true });
}
