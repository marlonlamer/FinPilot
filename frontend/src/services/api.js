import axios from "axios";

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = rawApiUrl.replace(/\/$/, "") + "/api";

const getToken = () => localStorage.getItem("token");

const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setCurrentUser = (user) => {
  try {
    if (user == null) return;
    localStorage.setItem("currentUser", JSON.stringify(user));
  } catch {}
};

const clearCurrentUser = () => {
  try { localStorage.removeItem("currentUser"); } catch {}
};

const getCurrentUserId = () => {
  const u = getCurrentUser();
  return u && u.id != null ? u.id : null;
};

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  return config;
});

const handleResponse = (response) => response.data;

export const api = {
  get: (endpoint, config) => apiClient.get(endpoint, config).then(handleResponse),
  post: (endpoint, body, config) => apiClient.post(endpoint, body, config).then(handleResponse),
  put: (endpoint, body, config) => apiClient.put(endpoint, body, config).then(handleResponse),
  delete: (endpoint, config) => apiClient.delete(endpoint, config).then(handleResponse),
  setBaseURL: (url) => {
    apiClient.defaults.baseURL = url;
  },
};

export { getCurrentUser, setCurrentUser, clearCurrentUser, getCurrentUserId };
