// src/pages/cosechas/cosechas.api.ts
import { apiClient } from "../../api/apiClient";

import type { Lote } from "../lotes/lotes.api";
import type { Trabajador } from "../trabajadores/trabajadores.api";

/**
 * Formato estándar de respuesta utilizado por el backend.
 */
type ApiResponse<T> = {
  ok: boolean;
  data: T;
  message?: string;
};

/**
 * Relación entre una cosecha y uno de sus lotes de origen.
 */
export type CosechaLote = {
  id: number;
  cosechaId: number;
  loteId: number;
  createdAt?: string;
  lote: Lote;
};

/**
 * Relación entre una cosecha y un trabajador asignado.
 */
export type CosechaTrabajador = {
  id: number;
  cosechaId: number;
  trabajadorId: number;
  kilosAsignados: number | null;
  createdAt?: string;
  trabajador: Trabajador;
};

/**
 * Cosecha devuelta por la API.
 *
 * cantidadCosechadores no se almacena directamente en Prisma.
 * El backend la calcula desde cosechaTrabajadores.length.
 */
export type Cosecha = {
  id: number;
  fecha: string;
  kilosCosechados: number;

  cantidadCosechadores: number;

  lotes: string;
  totalHectareas: number;
  tipoCosecha: string;

  varietal: string | null;
  observacion: string | null;

  cosechaLotes: CosechaLote[];
  cosechaTrabajadores: CosechaTrabajador[];

  createdAt: string;
  updatedAt: string;
};

/**
 * Trabajador enviado al crear o editar una cosecha.
 */
export type CosechaTrabajadorPayload = {
  trabajadorId: number;
  kilosAsignados?: number | null;
};

/**
 * Payload requerido para registrar una cosecha.
 */
export type CreateCosechaDTO = {
  fecha: string;
  kilosCosechados: number;
  totalHectareas: number;

  loteIds: number[];
  lotes?: string;

  tipoCosecha: string;
  varietal?: string | string[] | null;
  observacion?: string | null;

  trabajadores: CosechaTrabajadorPayload[];
};

/**
 * Payload parcial utilizado para actualizar una cosecha.
 */
export type UpdateCosechaDTO = Partial<CreateCosechaDTO>;

export type MejorTrabajadorCosecha = {
  id: number;
  nombre: string;
  kilos: number;
};

export type MejorLoteCosecha = {
  id: number;
  codigo: string;
  nombre: string | null;
  kilos: number;
};

/**
 * Resumen general o correspondiente al periodo solicitado.
 */
export type CosechasResumen = {
  totalCosechas: number;
  kilosTotales: number;
  totalHectareas: number;
  rendimiento: number;

  mejorTrabajador: MejorTrabajadorCosecha | null;
  mejorLote: MejorLoteCosecha | null;
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

/**
 * Admite temporalmente respuestas directas y respuestas envueltas
 * mediante el formato { ok, data }.
 */
function unwrapResponse<T>(
  responseData: ApiResponse<T> | T,
): T {
  if (
    responseData !== null &&
    typeof responseData === "object" &&
    "data" in responseData
  ) {
    return (responseData as ApiResponse<T>).data;
  }

  return responseData as T;
}

export async function getCosechasApi(): Promise<Cosecha[]> {
  const response = await apiClient.get<
    ApiResponse<Cosecha[]> | Cosecha[]
  >("/cosechas");

  return unwrapResponse(response.data) ?? [];
}

export async function createCosechaApi(
  data: CreateCosechaDTO,
): Promise<Cosecha> {
  const response = await apiClient.post<
    ApiResponse<Cosecha> | Cosecha
  >("/cosechas", data);

  return unwrapResponse(response.data);
}

export async function updateCosechaApi(
  id: number,
  data: UpdateCosechaDTO,
): Promise<Cosecha> {
  const response = await apiClient.put<
    ApiResponse<Cosecha> | Cosecha
  >(`/cosechas/${id}`, data);

  return unwrapResponse(response.data);
}

export async function deleteCosechaApi(
  id: number,
): Promise<void> {
  await apiClient.delete(`/cosechas/${id}`);
}

export async function getCosechasResumenApi(
  periodo?: "mes-actual",
): Promise<CosechasResumen> {
  const response = await apiClient.get<
    ApiResponse<CosechasResumen> | CosechasResumen
  >("/cosechas/resumen", {
    params: periodo ? { periodo } : undefined,
  });

  return unwrapResponse(response.data);
}

export async function getCosechasReporteApi(): Promise<CosechasReporte> {
  const response = await apiClient.get<
    ApiResponse<CosechasReporte> | CosechasReporte
  >("/cosechas/reporte");

  return unwrapResponse(response.data);
}