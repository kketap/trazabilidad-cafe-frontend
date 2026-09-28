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

export type UsuarioPerfil = {
  id: number;
  email: string;
  nombre: string;
  rol: string;
};

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const { data } =
    await apiClient.post<LoginResponse>(
      "/auth/login",
      {
        email,
        password,
      },
    );

  return data;
}

/**
 * Actualiza el nombre del usuario autenticado.
 */
export async function actualizarPerfilApi(
  nombre: string,
): Promise<UsuarioPerfil> {
  const response =
    await apiClient.put<UsuarioPerfil>(
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
  await apiClient.put(
    "/auth/password",
    {
      contrasenaActual,
      nuevaContrasena,
    },
  );
}

/**
 * Cierra la sesión en backend.
 * Será utilizado cuando implementes refresh token.
 */
export async function logoutApi(): Promise<void> {
  await apiClient.post(
    "/auth/logout",
  );
}