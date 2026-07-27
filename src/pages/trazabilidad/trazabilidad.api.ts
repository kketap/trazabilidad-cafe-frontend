// src/pages/trazabilidad/trazabilidad.api.ts
import { apiClient } from "./../../api/apiClient";
import type { Lote } from "../lotes/lotes.api";

type ApiResponse<T> = {
    ok: boolean;
    data: T;
    message?: string;
};

export type CreateProcesoTrazabilidadDto = {
    fecha: string;
    fechaInicio: string;
    duracionHoras: number;

    loteId: number;

    etapa: string;
    kilosIngresados: number;
    kilosResultantes: number;
};

export type ProcesoLote = {
    id: number;
    codigo: string;
    nombre?: string | null;
    kilosIniciales?: number | null;
    kilosActuales?: number | null;
    saldoTemporal?: number | null;

    cosechaLotes?: Array<{
        id: number;
        cosechaId: number;
        loteId: number;
        lote: Lote;
        cosecha: {
            id: number;
            fecha: string;
            kilosCosechados: number;
            tipoCosecha: string;
        };
    }>;
};

export type ProcesoTrazabilidad = {
    id: number;
    codigo?: string | null;

    fecha: string;
    fechaInicio?: string | null;
    duracionHoras?: number | null;

    etapa: string;
    kilosIngresados: number;
    kilosResultantes: number;
    porcentajeMerma: number;

    loteId?: number | null;
    lote?: ProcesoLote | null;

    cosechaId?: number | null;
    cosecha?: {
        id: number;
        fecha: string;
        kilosCosechados: number;
        tipoCosecha: string;
        lotes: string;
        cosechaLotes?: Array<{
            id: number;
            lote: {
                id: number;
                codigo: string;
                nombre?: string | null;
            };
        }>;
    } | null;

    createdAt?: string;
    updatedAt?: string;
};

export type TrazabilidadResumen = {
    totalProcesos: number;
    totalIngresado: number;
    totalResultante: number;
    mermaPromedio: number;
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