// src/api/clientes.ts
import { apiClient } from "./apiClient";

export type Cliente = {
  id: number;
  dni_rut: string;
  nombre: string;
  persona_juridica: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateClienteDTO = {
  dni_rut: string;
  nombre: string;
  persona_juridica?: boolean;
};

export async function getClientesApi(): Promise<Cliente[]> {
  const response = await apiClient.get("/clientes");
  return response.data.data;
}

export async function createClienteApi(data: CreateClienteDTO): Promise<Cliente> {
  const response = await apiClient.post("/clientes", data);
  return response.data.data;
}

export async function updateClienteApi(id: number, data: CreateClienteDTO): Promise<Cliente> {
  const response = await apiClient.put(`/clientes/${id}`, data);
  return response.data.data;
}

export async function deleteClienteApi(id: number): Promise<void> {
  await apiClient.delete(`/clientes/${id}`);
}
