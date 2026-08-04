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
  const response = await apiClient.post<LoginResponse>(
    "/auth/login",
    {
      email,
      password,
    },
  );

  return response.data;
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