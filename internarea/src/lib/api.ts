import { getStoredAuth } from "./authStorage";

export const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export const getAuthHeaders = () => {
  const storedAuth = getStoredAuth();
  return storedAuth?.token
    ? { Authorization: `Bearer ${storedAuth.token}` }
    : {};
};
