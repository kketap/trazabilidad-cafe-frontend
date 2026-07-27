// src/api/auth.ts
import { apiClient } from "./apiClient";

const TOKEN_KEY = "fn_auth_token";
const USER_NAME_KEY = "fn_user_name";

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

export function saveUserName(nombre: string) {
  localStorage.setItem(USER_NAME_KEY, nombre);
}

export function getUserName(): string | null {
  return localStorage.getItem(USER_NAME_KEY);
}

export async function actualizarPerfilApi(nombre: string) {
  const { data } = await apiClient.put("/auth/perfil", { nombre });
  return data;
}

export async function cambiarPasswordApi(
  contrasenaActual: string,
  nuevaContrasena: string,
) {
  const { data } = await apiClient.put("/auth/password", {
    contrasenaActual,
    nuevaContrasena,
  });
  return data;
}
