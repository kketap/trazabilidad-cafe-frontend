// src/api/apiClient.ts
import axios from "axios";

import {
  clearAuth,
  getToken,
} from "./authStorage";

export const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:4000/api",
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

let redirectingToLogin = false;

apiClient.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error?.response?.status;
    const code = error?.response?.data?.code;
    const backendMessage =
      error?.response?.data?.message;

    const requestUrl = String(
      error?.config?.url ?? "",
    );

    const isLoginRequest =
      requestUrl.includes("/auth/login");

    if (
      status === 401 &&
      !isLoginRequest &&
      !redirectingToLogin
    ) {
      redirectingToLogin = true;

      clearAuth();

      sessionStorage.setItem(
        "authRedirectReason",
        code === "TOKEN_EXPIRED"
          ? "expired"
          : "invalid",
      );

      if (backendMessage) {
        sessionStorage.setItem(
          "authRedirectMessage",
          backendMessage,
        );
      }

      window.location.replace("/login");
    }

    return Promise.reject(error);
  },
);