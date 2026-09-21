// src/api/secado.api.ts
import { apiClient } from "../../api/apiClient";
import type { Lote } from "../lotes/lotes.api";

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
  /** Identificación de la infraestructura de secado (ej. "Secadora 01", "Patio Solar A") */
  secadora?: string | null;
  /** Temperatura mínima registrada durante el proceso (°C) */
  tempMinima?: number | null;
  /** Temperatura máxima registrada durante el proceso (°C) */
  tempMaxima?: number | null;
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
  secadora?: string | null;
  tempMinima?: number | null;
  tempMaxima?: number | null;
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
