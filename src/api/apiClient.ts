// src/api/apiClient.ts
import axios from "axios";
import { getToken } from "./auth";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);