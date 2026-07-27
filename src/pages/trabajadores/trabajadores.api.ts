// src/pages/trabajadores/trabajadores.api.ts
import { apiClient } from "../../api/apiClient";

type ApiResponse<T> = {
  ok: boolean;
  data: T;
  message?: string;
};

export type Trabajador = {
  id: number;
  nombres: string;
  apellidos?: string | null;
  dni: string;
  rol?: string | null;
  telefono?: string | null;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTrabajadorDTO = {
  nombres: string;
  apellidos?: string | null;
  dni: string;
  rol?: string | null;
  telefono?: string | null;
  activo?: boolean;
};

export type UpdateTrabajadorDTO = Partial<CreateTrabajadorDTO>;

export async function getTrabajadoresApi(): Promise<Trabajador[]> {
  const response = await apiClient.get<ApiResponse<Trabajador[]> | Trabajador[]>(
    "/trabajadores",
  );

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.data ?? [];
}

export async function createTrabajadorApi(
  data: CreateTrabajadorDTO,
): Promise<Trabajador> {
  const response = await apiClient.post<ApiResponse<Trabajador>>(
    "/trabajadores",
    data,
  );

  return response.data.data;
}

export async function updateTrabajadorApi(
  id: number,
  data: UpdateTrabajadorDTO,
): Promise<Trabajador> {
  const response = await apiClient.put<ApiResponse<Trabajador>>(
    `/trabajadores/${id}`,
    data,
  );

  return response.data.data;
}

export async function deleteTrabajadorApi(id: number): Promise<void> {
  await apiClient.delete(`/trabajadores/${id}`);
}