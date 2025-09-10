import * as SecureStore from 'expo-secure-store';

export async function getAccessToken() {
  return await SecureStore.getItemAsync('mipi-user-data');
}

export function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (!decoded.exp) return false;
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}