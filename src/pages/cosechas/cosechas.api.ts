// src/api/cosechas.ts
import { apiClient } from "../../api/apiClient";
import type { Trabajador } from "../trabajadores/trabajadores.api";
import type { Lote } from "../lotes/lotes.api";

type ApiResponse<T> = {
  ok: boolean;
  data: T;
  message?: string;
};

export type CosechaLote = {
  id: number;
  cosechaId: number;
  loteId: number;
  lote: Lote;
};

export type CosechaTrabajador = {
  id: number;
  cosechaId: number;
  trabajadorId: number;
  kilosAsignados?: number | null;
  trabajador: Trabajador;
};

export type Cosecha = {
  id: number;
  fecha: string;
  kilosCosechados: number;
  cantidadCosechadores?: number;
  lotes: string;
  totalHectareas: number;
  tipoCosecha: string;
  varietal?: string;
  cosechaLotes?: CosechaLote[];
  cosechaTrabajadores?: CosechaTrabajador[];

  createdAt?: string;
  updatedAt?: string;
};

export type CosechaTrabajadorPayload = {
  trabajadorId: number;
  kilosAsignados?: number | null;
};

export type CreateCosechaDTO = {
  fecha: string;
  kilosCosechados: number;
  cantidadCosechadores?: number;
  lotes?: string;
  loteIds?: number[];
  totalHectareas: number;
  lotes?: string;
  tipoCosecha: string;
  varietal?: string;
};

export type UpdateCosechaDTO = Partial<CreateCosechaDTO>;

export type CosechasResumen = {
  totalCosechas: number;
  kilosTotales: number;
  totalHectareas: number;
  rendimiento: number;
};

export async function getCosechasApi(): Promise<Cosecha[]> {
  const response = await apiClient.get<ApiResponse<Cosecha[]> | Cosecha[]>(
    "/cosechas",
  );

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.data ?? [];
}

export async function createCosechaApi(
  data: CreateCosechaDTO,
): Promise<Cosecha> {
  const response = await apiClient.post<ApiResponse<Cosecha>>(
    "/cosechas",
    data,
  );

  return response.data.data;
}

export async function updateCosechaApi(
  id: number,
  data: UpdateCosechaDTO,
): Promise<Cosecha> {
  const response = await apiClient.put<ApiResponse<Cosecha>>(
    `/cosechas/${id}`,
    data,
  );

  return response.data.data;
}

export async function deleteCosechaApi(id: number): Promise<void> {
  await apiClient.delete(`/cosechas/${id}`);
}

export async function getCosechasResumenApi(): Promise<CosechasResumen> {
  const response = await apiClient.get<
    ApiResponse<CosechasResumen> | CosechasResumen
  >("/cosechas/resumen");

  if ("data" in response.data) {
    return response.data.data;
  }

  return response.data;
}

export type CosechasReporte = {
  porDia: {
    fecha: string;
    kilos: number;
  }[];
  porMes: {
    mes: string;
    kilos: number;
  }[];
  porQuincena: {
    quincena: string;
    kilos: number;
  }[];
  porTipoCosecha: {
    tipoCosecha: string;
    kilos: number;
  }[];
  porTrabajador: {
    trabajadorId: number;
    nombre: string;
    dni: string;
    kilos: number;
    cosechas: number;
  }[];
  porLote: {
    loteId: number;
    codigo: string;
    nombre: string | null;
    kilos: number;
    cosechas: number;
  }[];
};

export async function getCosechasReporteApi(): Promise<CosechasReporte> {
  const response = await apiClient.get<ApiResponse<CosechasReporte>>(
    "/cosechas/reporte",
  );

  return response.data.data;
}