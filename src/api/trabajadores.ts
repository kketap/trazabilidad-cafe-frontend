// src/api/trabajadores.ts
import { apiClient } from "./apiClient";

export type Trabajador = {
  id: number;
  nombres: string;
  dni: string;
  rol?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTrabajadorDTO = {
  nombres: string;
  dni: string;
  rol?: string;
};

export async function getTrabajadoresApi(): Promise<Trabajador[]> {
  const response = await apiClient.get("/trabajadores");
  return response.data.data;
}

export async function createTrabajadorApi(data: CreateTrabajadorDTO): Promise<Trabajador> {
  const response = await apiClient.post("/trabajadores", data);
  return response.data.data;
}

export async function updateTrabajadorApi(id: number, data: CreateTrabajadorDTO): Promise<Trabajador> {
  const response = await apiClient.put(`/trabajadores/${id}`, data);
  return response.data.data;
}

export async function deleteTrabajadorApi(id: number): Promise<void> {
  await apiClient.delete(`/trabajadores/${id}`);
}
