import { apiClient } from "./../../api/apiClient";

export type Cosecha = {
  id: number;
  fecha: string;
  kilosCosechados: number;
  cantidadCosechadores: number;
  lotes: string;
  totalHectareas: number;
  tipoCosecha: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateCosechaDto = {
  fecha: string;
  kilosCosechados: number;
  cantidadCosechadores: number;
  lotes: string;
  totalHectareas: number;
  tipoCosecha: string;
};

export type CosechasResumen = {
  totalCosechas: number;
  kilosTotales: number;
  totalHectareas: number;
  rendimiento: number;
};

export async function getCosechas() {
  const response = await apiClient.get<Cosecha[]>("/cosechas");
  return response.data;
}

export async function createCosecha(data: CreateCosechaDto) {
  const response = await apiClient.post<Cosecha>("/cosechas", data);
  return response.data;
}

export async function updateCosecha(id: number, data: Partial<CreateCosechaDto>) {
  const response = await apiClient.put<Cosecha>(`/cosechas/${id}`, data);
  return response.data;
}

export async function deleteCosecha(id: number) {
  const response = await apiClient.delete<{ message: string }>(`/cosechas/${id}`);
  return response.data;
}

export async function getCosechasResumen() {
  const response = await apiClient.get<CosechasResumen>("/cosechas/resumen");
  return response.data;
}