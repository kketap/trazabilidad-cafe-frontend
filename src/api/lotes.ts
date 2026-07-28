// src/api/lotes.ts
import { apiClient } from "./apiClient";

export type Lote = {
  id: number;
  codigo: string;
  nombre?: string | null;
  hectareas?: number | null;
  ubicacion?: string | null;
  observacion?: string | null;
  activo: boolean;
  tipo_cafe: string; // "comercial" | "especial"
  horas_oxidacion?: number | null;
  horas_fermentacion?: number | null;
  estado?: string;
  kilosActuales?: number | null;
  kilosIniciales?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateLoteDTO = {
  codigo: string;
  nombre?: string;
  hectareas?: number;
  ubicacion?: string;
  observacion?: string;
  activo?: boolean;
  tipo_cafe?: string;
  horas_oxidacion?: number;
  horas_fermentacion?: number;
};

export async function getLotesApi(): Promise<Lote[]> {
  const response = await apiClient.get("/lotes");
  return response.data.data;
}

export async function getSiguienteCorrelativoApi(codigoBase: string): Promise<string> {
  const response = await apiClient.get(`/lotes/correlativo/${codigoBase}`);
  return response.data.data.codigo;
}

export async function createLoteApi(data: CreateLoteDTO): Promise<Lote> {
  const response = await apiClient.post("/lotes", data);
  return response.data.data;
}

export async function updateLoteApi(id: number, data: Partial<CreateLoteDTO>): Promise<Lote> {
  const response = await apiClient.put(`/lotes/${id}`, data);
  return response.data.data;
}

export async function deleteLoteApi(id: number): Promise<void> {
  await apiClient.delete(`/lotes/${id}`);
}
