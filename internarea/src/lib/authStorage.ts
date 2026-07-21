export const AUTH_STORAGE_KEY = "internarea_local_auth";

export type StoredAuthUser = {
  id?: string;
  uid?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  photo?: string;
  authProvider?: string;
  token?: string;
};

export const getStoredAuth = (): StoredAuthUser | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Failed to read stored auth state:", error);
    return null;
  }
};

export const setStoredAuth = (value: StoredAuthUser) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
};

export const clearStoredAuth = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};
