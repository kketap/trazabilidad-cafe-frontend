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
  cantidadCosechadores: number;
  lotes: string;
  totalHectareas: number;
  tipoCosecha: string;

  varietal?: string | string[] | null;
  observacion?: string | null;
  observaciones?: string | null;

  cosechaLotes?: CosechaLote[];
  cosechaTrabajadores?: CosechaTrabajador[];

  // Compatibilidad con datos antiguos si todavía llegan desde el backend
  trabajadorId?: number | null;
  trabajador?: Trabajador | null;
  tipo_cosecha?: string | null;
  kilos_diarios?: number | null;
  kilos_quincena?: number | null;
  kilos_mensuales?: number | null;

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
  totalHectareas: number;

  lotes?: string;
  loteIds?: number[];

  tipoCosecha: string;
  varietal?: string | string[] | null;
  observacion?: string | null;

  trabajadores?: CosechaTrabajadorPayload[];

  // Compatibilidad con versión antigua
  trabajadorId?: number | null;
  tipo_cosecha?: string | null;
  kilos_diarios?: number | null;
  kilos_quincena?: number | null;
  kilos_mensuales?: number | null;
};

export type UpdateCosechaDTO = Partial<CreateCosechaDTO>;

export type CosechasResumen = {
  totalCosechas: number;
  kilosTotales: number;
  totalHectareas: number;
  rendimiento: number;
};

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

function unwrapResponse<T>(responseData: ApiResponse<T> | T): T {
  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData
  ) {
    return (responseData as ApiResponse<T>).data;
  }

  return responseData as T;
}

export async function getCosechasApi(): Promise<Cosecha[]> {
  const response = await apiClient.get<ApiResponse<Cosecha[]> | Cosecha[]>(
    "/cosechas",
  );

  return unwrapResponse(response.data) ?? [];
}

export async function createCosechaApi(
  data: CreateCosechaDTO,
): Promise<Cosecha> {
  const response = await apiClient.post<ApiResponse<Cosecha> | Cosecha>(
    "/cosechas",
    data,
  );

  return unwrapResponse(response.data);
}

export async function updateCosechaApi(
  id: number,
  data: UpdateCosechaDTO,
): Promise<Cosecha> {
  const response = await apiClient.put<ApiResponse<Cosecha> | Cosecha>(
    `/cosechas/${id}`,
    data,
  );

  return unwrapResponse(response.data);
}

export async function deleteCosechaApi(id: number): Promise<void> {
  await apiClient.delete(`/cosechas/${id}`);
}

export async function getCosechasResumenApi(): Promise<CosechasResumen> {
  const response = await apiClient.get<
    ApiResponse<CosechasResumen> | CosechasResumen
  >("/cosechas/resumen");

  return unwrapResponse(response.data);
}

export async function getCosechasReporteApi(): Promise<CosechasReporte> {
  const response = await apiClient.get<
    ApiResponse<CosechasReporte> | CosechasReporte
  >("/cosechas/reporte");

  return unwrapResponse(response.data);
}