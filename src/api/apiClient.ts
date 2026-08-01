// src/api/apiClient.ts
import axios, { type AxiosError } from "axios";
import { getToken, clearSession } from "./auth";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

// ─── Interceptor de REQUEST ──────────────────────────────────────────────────
// Adjunta el token JWT en cada petición saliente.
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

// ─── Interceptor de RESPONSE ─────────────────────────────────────────────────
// Si el servidor responde con 401 (token vencido o inválido), limpia la sesión
// local y redirige al login automáticamente sin mostrar un error genérico.

/** Evita múltiples redirects simultáneos cuando varias peticiones fallan. */
let isRedirecting = false;

apiClient.interceptors.response.use(
  // Respuesta exitosa: la dejamos pasar sin cambios.
  (response) => response,

  // Error en la respuesta:
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401 && !isRedirecting) {
      isRedirecting = true;

      // 1. Elimina el token y datos de sesión del almacenamiento local.
      clearSession();

      // 2. Redirige al login.
      //    Usamos window.location para funcionar fuera del árbol de React.
      window.location.href = "/login";
    }

    // Para cualquier otro error, rechazamos la promesa normalmente
    // para que cada componente pueda manejarlo como considere.
    return Promise.reject(error);
  },
);