// src/api/auth.ts
import { apiClient } from "./apiClient";

export {
  clearAuth,
  getToken,
  getUserName,
  saveToken,
  saveUserName,
} from "./authStorage";

export type LoginResponse = {
  token: string;
  usuario: {
    id: number;
    email: string;
    nombre: string;
    rol: string;
  };
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", {
    email,
    password,
  });

  return data;
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_NAME_KEY);
}

/**
 * Limpia completamente la sesión del usuario:
 * elimina el token y el nombre del almacenamiento local.
 * Usar esta función como punto único de limpieza de sesión.
 */
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_NAME_KEY);
}

/**
 * Actualiza el nombre del usuario autenticado.
 */
export async function actualizarPerfilApi(
  nombre: string,
): Promise<UsuarioPerfil> {
  const response = await apiClient.put<UsuarioPerfil>(
    "/auth/perfil",
    {
      nombre,
    },
  );

  return response.data;
}

/**
 * Cambia la contraseña del usuario autenticado.
 */
export async function cambiarPasswordApi(
  contrasenaActual: string,
  nuevaContrasena: string,
): Promise<void> {
  await apiClient.put("/auth/password", {
    contrasenaActual,
    nuevaContrasena,
  });
}