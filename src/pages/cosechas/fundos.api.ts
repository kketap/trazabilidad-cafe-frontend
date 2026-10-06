// src/pages/cosechas/fundos.api.ts
import { apiClient } from "../../api/apiClient";

export type LoteFisico = {
  id: number;
  codigo: string;
  numero: number;
  fundoId: number;
  hectareas?: number | null;
  activo: boolean;
};

export type Fundo = {
  id: number;
  codigo: string; // FSC, FSS, FDS
  nombre?: string | null;
  activo: boolean;
  lotesFisicos: LoteFisico[];
};

type ApiResponse<T> = {
  ok: boolean;
  data: T;
  message?: string;
};

export async function getFundosApi(): Promise<Fundo[]> {
  const response = await apiClient.get<ApiResponse<Fundo[]>>("/fundos");
  return response.data.data;
}

export async function updateFundoApi(
  id: number,
  payload: { nombre?: string | null; activo?: boolean }
): Promise<Fundo> {
  const response = await apiClient.put<ApiResponse<Fundo>>(`/fundos/${id}`, payload);
  return response.data.data;
}

export async function updateLoteFisicoApi(
  id: number,
  payload: { hectareas?: number | null; activo?: boolean }
): Promise<LoteFisico> {
  const response = await apiClient.put<ApiResponse<LoteFisico>>(
    `/fundos/lotes-fisicos/${id}`,
    payload
  );
  return response.data.data;
}
