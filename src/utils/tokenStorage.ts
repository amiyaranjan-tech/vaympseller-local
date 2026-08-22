import * as Keychain from 'react-native-keychain';

// The JWT guards bank/financial data, so it lives in the OS keystore
// (Keychain/Keystore) via react-native-keychain, never in AsyncStorage or
// persisted Zustand state.
const SERVICE = 'vaymp-seller-auth-token';

export async function getToken(): Promise<string | null> {
  const result = await Keychain.getGenericPassword({ service: SERVICE });
  return result ? result.password : null;
}

export async function setToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('seller', token, { service: SERVICE });
}

export async function clearToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
