import type { User } from '../types/auth';

export const STORAGE_KEYS = {
  TOKEN: 'singslot_token',
  USER: 'singslot_user'
} as const;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Saves authenticated session credentials into client storage.
 */
export const saveClientSession = (
  token: string,
  user: User,
  storage: StorageLike = localStorage
): void => {
  storage.setItem(STORAGE_KEYS.TOKEN, token);
  storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

/**
 * Clears stored credentials and terminates client-side session.
 * Conforms to AC-01e.
 */
export const clearClientSession = (
  storage: StorageLike = localStorage
): void => {
  storage.removeItem(STORAGE_KEYS.TOKEN);
  storage.removeItem(STORAGE_KEYS.USER);
};

/**
 * Retrieves raw stored session from storage if present.
 */
export const getStoredSession = (
  storage: StorageLike = localStorage
): { token: string | null; user: User | null } => {
  try {
    const token = storage.getItem(STORAGE_KEYS.TOKEN);
    const rawUser = storage.getItem(STORAGE_KEYS.USER);
    const user = rawUser ? (JSON.parse(rawUser) as User) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

/**
 * Validates stored token with backend /api/auth/me.
 * Clears stale/expired storage if verification fails.
 */
export const validateAndRestoreSession = async (
  storage: StorageLike = localStorage,
  fetchFn: typeof fetch = fetch
): Promise<{ token: string | null; user: User | null }> => {
  const { token, user } = getStoredSession(storage);
  if (!token || !user) {
    clearClientSession(storage);
    return { token: null, user: null };
  }

  try {
    const res = await fetchFn('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        saveClientSession(token, data.user, storage);
        return { token, user: data.user };
      }
    }

    // Token rejected (401 UNAUTHENTICATED or expired) -> purge storage
    clearClientSession(storage);
    return { token: null, user: null };
  } catch (err) {
    console.warn('Network failure during session validation', err);
    // Keep optimistic session or purge based on policy
    return { token, user };
  }
};
