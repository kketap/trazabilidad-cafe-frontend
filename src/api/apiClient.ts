// src/api/apiClient.ts
import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import {
  clearAuth,
  getToken,
  saveToken,
} from "./authStorage";

const baseURL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
});

/**
 * Cliente separado para renovar el access token.
 * Se usa para evitar que el interceptor principal
 * entre en un ciclo infinito.
 */
const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
});

type RetryConfig =
  InternalAxiosRequestConfig & {
    _retry?: boolean;
  };

type RefreshResponse = {
  ok: boolean;
  token: string;
};

/**
 * Adjunta el access token JWT a cada petición.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Si varias peticiones reciben 401 al mismo tiempo,
 * reutilizamos una única petición de refresh.
 */
let refreshPromise:
  Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<RefreshResponse>(
        "/auth/refresh",
      )
      .then((response) => {
        const nuevoToken =
          response.data.token;

        saveToken(nuevoToken);

        return nuevoToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

let isRedirecting = false;

function redirectToLogin(
  reason: "expired" | "invalid",
  message?: string,
) {
  if (isRedirecting) {
    return;
  }

  isRedirecting = true;

  clearAuth();

  sessionStorage.setItem(
    "authRedirectReason",
    reason,
  );

  if (message) {
    sessionStorage.setItem(
      "authRedirectMessage",
      message,
    );
  }

  window.location.replace("/login");
}

/**
 * Interceptor de respuestas.
 *
 * Si el access token expira:
 * 1. intenta renovarlo;
 * 2. guarda el nuevo token;
 * 3. repite la petición original.
 *
 * Si el refresh token también falla,
 * se limpia la sesión y se redirige al login.
 */
apiClient.interceptors.response.use(
  (response) => response,

  async (
    error: AxiosError<{
      code?: string;
      message?: string;
    }>,
  ) => {
    const originalRequest =
      error.config as
      | RetryConfig
      | undefined;

    const status =
      error.response?.status;

    const code =
      error.response?.data?.code;

    const requestUrl = String(
      originalRequest?.url ?? "",
    );

    const isLoginRequest =
      requestUrl.includes(
        "/auth/login",
      );

    const isRefreshRequest =
      requestUrl.includes(
        "/auth/refresh",
      );

    const isLogoutRequest =
      requestUrl.includes(
        "/auth/logout",
      );

    const isAuthRequest =
      isLoginRequest ||
      isRefreshRequest ||
      isLogoutRequest;

    if (
      status === 401 &&
      !isAuthRequest &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const nuevoToken =
          await refreshAccessToken();

        originalRequest.headers.Authorization =
          `Bearer ${nuevoToken}`;

        return apiClient(
          originalRequest,
        );
      } catch (refreshError) {
        const refreshAxiosError =
          refreshError as AxiosError<{
            code?: string;
            message?: string;
          }>;

        const refreshMessage =
          refreshAxiosError.response?.data
            ?.message;

        redirectToLogin(
          code === "TOKEN_EXPIRED"
            ? "expired"
            : "invalid",
          refreshMessage ||
          "Tu sesión ha finalizado. Inicia sesión nuevamente.",
        );

        return Promise.reject(
          refreshError,
        );
      }
    }

    return Promise.reject(error);
  },
);