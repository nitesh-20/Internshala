import { getStoredAuth } from "./authStorage";

export const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend-tau-snowy-58.vercel.app";

export const getAuthHeaders = () => {
  const storedAuth = getStoredAuth();
  return storedAuth?.token
    ? { Authorization: `Bearer ${storedAuth.token}` }
    : {};
};
