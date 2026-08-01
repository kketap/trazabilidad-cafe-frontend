// src/pages/trazabilidad/trazabilidad.api.ts
import { apiClient } from "./../../api/apiClient";
import type { Cosecha } from "./../cosechas/cosechas.api";
import type { Lote } from "../lotes/lotes.api";

export type ProcesoTrazabilidad = {
    id: number;
    codigo?: string | null;

    fecha: string;
    etapa?: string;
    tipoProceso?: string;
    kilosIngresados: number;
    kilosResultantes?: number;
    porcentajeMerma?: number;
    loteId?: number | null;
    lote?: Lote;
    cosechaId?: number | null;
    cosecha?: Cosecha;
    duracionHoras?: number;
    fechaInicio?: string;
    fechaFin?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type CreateProcesoTrazabilidadDto = {
    fecha: string;
    loteId?: number | null;
    cosechaId?: number | null;
    etapa?: string;
    tipoProceso?: string;
    kilosIngresados: number;
    kilosResultantes?: number;
    fechaInicio?: string;
    fechaFin?: string;
};

export type TrazabilidadResumen = {
    totalProcesos: number;
    totalIngresado: number;
    totalResultante?: number;
    mermaPromedio?: number;
};

/**
 * Lista procesos de trazabilidad.
 * Soporta respuesta directa o respuesta envuelta en { ok, data }.
 */
export async function getProcesosTrazabilidad(): Promise<ProcesoTrazabilidad[]> {
    const response = await apiClient.get<
        ApiResponse<ProcesoTrazabilidad[]> | ProcesoTrazabilidad[]
    >("/trazabilidad");

    if (Array.isArray(response.data)) {
        return response.data;
    }

    return response.data.data ?? [];
}

/**
 * Crea un proceso de trazabilidad asociado a loteId.
 */
export async function createProcesoTrazabilidad(
    data: CreateProcesoTrazabilidadDto,
): Promise<ProcesoTrazabilidad> {
    const response = await apiClient.post<
        ApiResponse<ProcesoTrazabilidad> | ProcesoTrazabilidad
    >("/trazabilidad", data);

    if ("data" in response.data) {
        return response.data.data;
    }

    return response.data;
}

/**
 * Obtiene resumen para métricas de trazabilidad.
 */
export async function getTrazabilidadResumen(): Promise<TrazabilidadResumen> {
    const response = await apiClient.get<TrazabilidadResumen>(
        "/trazabilidad/resumen",
    );

    return response.data;
}

/**
 * Actualiza proceso de trazabilidad.
 */
export async function updateProcesoTrazabilidad(
    id: number,
    data: Partial<CreateProcesoTrazabilidadDto>,
): Promise<ProcesoTrazabilidad> {
    const response = await apiClient.put<
        ApiResponse<ProcesoTrazabilidad> | ProcesoTrazabilidad
    >(`/trazabilidad/${id}`, data);

    if ("data" in response.data) {
        return response.data.data;
    }

    return response.data;
}

/**
 * Elimina proceso de trazabilidad.
 */
export async function deleteProcesoTrazabilidad(id: number) {
    const response = await apiClient.delete(`/trazabilidad/${id}`);
    return response.data;
}