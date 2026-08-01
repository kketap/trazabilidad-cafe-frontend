// src/api/empaque.api.ts
import { apiClient } from "./apiClient";
import type { Lote } from "./lotes";

export type Empaque = {
  id: number;
  loteId: number;
  fechaInicio: string;
  fechaFin?: string | null;
  kilosIngresados: number;
  kilosResultantes: number;
  merma: number;
  observaciones?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lote?: Lote;
};

export type CreateEmpaqueDTO = {
  loteId: number;
  fechaInicio: string;
  fechaFin?: string | null;
  kilosIngresados: number;
  kilosResultantes: number;
  observaciones?: string | null;
};

export type UpdateEmpaqueDTO = Partial<CreateEmpaqueDTO>;

export async function getEmpaquesApi(): Promise<Empaque[]> {
  const response = await apiClient.get("/empaque");
  return response.data.data;
}

export async function getEmpaqueByIdApi(id: number): Promise<Empaque> {
  const response = await apiClient.get(`/empaque/${id}`);
  return response.data.data;
}

export async function createEmpaqueApi(data: CreateEmpaqueDTO): Promise<Empaque> {
  const response = await apiClient.post("/empaque", data);
  return response.data.data;
}

export async function updateEmpaqueApi(id: number, data: UpdateEmpaqueDTO): Promise<Empaque> {
  const response = await apiClient.put(`/empaque/${id}`, data);
  return response.data.data;
}

export async function deleteEmpaqueApi(id: number): Promise<void> {
  await apiClient.delete(`/empaque/${id}`);
}
