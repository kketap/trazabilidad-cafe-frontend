// src/api/secado.api.ts
import { apiClient } from "./apiClient";
import type { Lote } from "./lotes";

export type Secado = {
  id: number;
  loteId: number;
  fechaInicio: string;
  fechaFin?: string | null;
  kilosIngresados: number;
  kilosResultantes: number;
  merma: number;
  observaciones?: string | null;
  perfilProceso?: string;
  createdAt?: string;
  updatedAt?: string;
  lote?: Lote;
};

export type CreateSecadoDTO = {
  loteId: number;
  fechaInicio: string;
  fechaFin?: string | null;
  kilosIngresados: number;
  kilosResultantes: number;
  observaciones?: string | null;
  perfilProceso?: string;
};

export type UpdateSecadoDTO = Partial<CreateSecadoDTO>;

export async function getSecadosApi(): Promise<Secado[]> {
  const response = await apiClient.get("/secado");
  return response.data.data;
}

export async function getSecadoByIdApi(id: number): Promise<Secado> {
  const response = await apiClient.get(`/secado/${id}`);
  return response.data.data;
}

export async function createSecadoApi(data: CreateSecadoDTO): Promise<Secado> {
  const response = await apiClient.post("/secado", data);
  return response.data.data;
}

export async function updateSecadoApi(id: number, data: UpdateSecadoDTO): Promise<Secado> {
  const response = await apiClient.put(`/secado/${id}`, data);
  return response.data.data;
}

export async function deleteSecadoApi(id: number): Promise<void> {
  await apiClient.delete(`/secado/${id}`);
}
