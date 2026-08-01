// src/pages/trazabilidad/trazabilidad.api.ts
import { apiClient } from "../../api/apiClient";
import type { Cosecha } from "../cosechas/cosechas.api";
import type { Lote } from "../lotes/lotes.api";

type ApiResponse<T> = {
    ok: boolean;
    data: T;
    message?: string;
};

export type TipoProceso =
    | "OXIDACION_CEREZA"
    | "OXIDACION_MUCILAGO"
    | "ANAEROBICO_CEREZA"
    | "ANAEROBICO_MUCILAGO";

export type ProcesoTrazabilidad = {
    id: number;
    codigo: string;

    fecha: string;
    fechaInicio?: string | null;
    fechaFin?: string | null;
    duracionHoras?: number | null;

    etapa?: string | null;
    tipoProceso?: TipoProceso | string | null;

    kilosIngresados: number;

    /**
     * Estos campos pueden venir undefined/null porque actualmente
     * no existen en tu schema Prisma de ProcesoTrazabilidad.
     */
    kilosResultantes?: number | null;
    porcentajeMerma?: number | null;

    loteId?: number | null;

    /**
     * El backend actual puede devolver la relación como "Lote"
     * porque en tu schema Prisma está definida con mayúscula:
     * Lote Lote? @relation(...)
     */
    Lote?: Lote | null;

    /**
     * Lo dejamos también como "lote" para compatibilidad con el front,
     * porque TrazabilidadPage normaliza Lote -> lote.
     */
    lote?: Lote | null;

    cosechaId?: number | null;
    cosecha?: Cosecha | null;

    createdAt?: string;
    updatedAt?: string;
};

export type CreateProcesoTrazabilidadDto = {
    fecha: string;

    fechaInicio?: string | null;
    fechaFin?: string | null;
    duracionHoras?: number | null;

    loteId?: number | null;
    cosechaId?: number | null;

    etapa?: string | null;
    tipoProceso?: TipoProceso | string | null;

    kilosIngresados: number;

    /**
     * El formulario puede enviarlo, pero el backend actual
     * no lo guarda si el schema no tiene kilosResultantes.
     */
    kilosResultantes?: number | null;
};

export type TrazabilidadResumen = {
    totalProcesos: number;
    totalIngresado: number;
    totalResultante: number;
    mermaPromedio: number;
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

export async function getProcesosTrazabilidad(): Promise<ProcesoTrazabilidad[]> {
    const response = await apiClient.get<
        ApiResponse<ProcesoTrazabilidad[]> | ProcesoTrazabilidad[]
    >("/trazabilidad");

    return unwrapResponse(response.data) ?? [];
}

export async function createProcesoTrazabilidad(
    data: CreateProcesoTrazabilidadDto,
): Promise<ProcesoTrazabilidad> {
    const response = await apiClient.post<
        ApiResponse<ProcesoTrazabilidad> | ProcesoTrazabilidad
    >("/trazabilidad", data);

    return unwrapResponse(response.data);
}

export async function getTrazabilidadResumen(): Promise<TrazabilidadResumen> {
    const response = await apiClient.get<
        ApiResponse<TrazabilidadResumen> | TrazabilidadResumen
    >("/trazabilidad/resumen");

    return unwrapResponse(response.data);
}

export async function updateProcesoTrazabilidad(
    id: number,
    data: Partial<CreateProcesoTrazabilidadDto>,
): Promise<ProcesoTrazabilidad> {
    const response = await apiClient.put<
        ApiResponse<ProcesoTrazabilidad> | ProcesoTrazabilidad
    >(`/trazabilidad/${id}`, data);

    return unwrapResponse(response.data);
}

export async function deleteProcesoTrazabilidad(id: number) {
    const response = await apiClient.delete(`/trazabilidad/${id}`);
    return response.data;
}