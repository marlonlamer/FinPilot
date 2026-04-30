import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getToken = () => localStorage.getItem("token");

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
