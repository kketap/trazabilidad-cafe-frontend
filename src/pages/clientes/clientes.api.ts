// src/pages/clientes/clientes.api.ts
import { apiClient } from "../../api/apiClient";

type ApiResponse<T> = {
  ok: boolean;
  data: T;
  message?: string;
};

export type Cliente = {
  id: number;
  dniRut: string;
  nombre: string;
  personaJuridica: boolean;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateClienteDTO = {
  dniRut: string;
  nombre: string;
  personaJuridica?: boolean;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo?: boolean;
};

export type UpdateClienteDTO = Partial<CreateClienteDTO>;

export async function getClientesApi(): Promise<Cliente[]> {
  const response = await apiClient.get<ApiResponse<Cliente[]> | Cliente[]>(
    "/clientes",
  );

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.data ?? [];
}

export async function getClientesActivosApi(): Promise<
  Cliente[]
> {
  const response = await apiClient.get<
    ApiResponse<Cliente[]> | Cliente[]
  >("/clientes/activos");

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.data ?? [];
}

export async function createClienteApi(
  data: CreateClienteDTO,
): Promise<Cliente> {
  const response = await apiClient.post<ApiResponse<Cliente>>(
    "/clientes",
    data,
  );

  return response.data.data;
}

export async function updateClienteApi(
  id: number,
  data: UpdateClienteDTO,
): Promise<Cliente> {
  const response = await apiClient.put<ApiResponse<Cliente>>(
    `/clientes/${id}`,
    data,
  );

  return response.data.data;
}

export async function deleteClienteApi(id: number): Promise<void> {
  await apiClient.delete(`/clientes/${id}`);
}