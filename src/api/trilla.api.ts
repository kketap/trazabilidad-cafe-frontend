// src/api/trilla.api.ts
import { apiClient } from "./apiClient";
import type { Lote } from "./lotes";

export type OrdenTrilla = {
  id: string;
  codigoTrilla: string;
  fechaDespacho: string;
  fechaIngreso?: string | null;
  calidad?: string | null;
  tipoSaco?: string | null;
  kilosEnviados: number;
  kilosNetos?: number | null;
  createdAt?: string;
  updatedAt?: string;
  lotes?: Lote[];
};

export type CreateOrdenTrillaDTO = {
  loteIds: number[];
  kilosEnviados: number;
  fechaDespacho?: string;
  codigoTrilla?: string;
};

export type UpdateOrdenTrillaDTO = {
  codigoTrilla?: string;
  fechaDespacho?: string;
  fechaIngreso?: string | null;
  calidad?: string | null;
  tipoSaco?: string | null;
  kilosEnviados?: number;
  kilosNetos?: number | null;
  loteIds?: number[];
};

export async function getOrdenesTrilaApi(): Promise<OrdenTrilla[]> {
  const response = await apiClient.get("/trilla");
  return response.data.data;
}

export async function getOrdenTrillaByIdApi(id: string): Promise<OrdenTrilla> {
  const response = await apiClient.get(`/trilla/${id}`);
  return response.data.data;
}

export async function createOrdenTrillaApi(data: CreateOrdenTrillaDTO): Promise<OrdenTrilla> {
  const response = await apiClient.post("/trilla", data);
  return response.data.data;
}

export async function updateOrdenTrillaApi(id: string, data: UpdateOrdenTrillaDTO): Promise<OrdenTrilla> {
  const response = await apiClient.put(`/trilla/${id}`, data);
  return response.data.data;
}

export async function deleteOrdenTrillaApi(id: string): Promise<void> {
  await apiClient.delete(`/trilla/${id}`);
}
