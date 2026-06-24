import { apiClient } from "./../../api/apiClient";
import type { Cosecha } from "./../cosechas/cosechas.api";

export type ProcesoTrazabilidad = {
    id: number;
    fecha: string;
    etapa: string;
    kilosIngresados: number;
    kilosResultantes: number;
    porcentajeMerma: number;
    cosechaId: number;
    cosecha?: Cosecha;
    createdAt?: string;
    updatedAt?: string;
};

export type CreateProcesoTrazabilidadDto = {
    fecha: string;
    cosechaId: number;
    etapa: string;
    kilosIngresados: number;
    kilosResultantes: number;
};

export type TrazabilidadResumen = {
    totalProcesos: number;
    totalIngresado: number;
    totalResultante: number;
    mermaPromedio: number;
};

export async function getProcesosTrazabilidad() {
    const response = await apiClient.get<ProcesoTrazabilidad[]>("/trazabilidad");
    return response.data;
}

export async function createProcesoTrazabilidad(data: CreateProcesoTrazabilidadDto) {
    const response = await apiClient.post<ProcesoTrazabilidad>("/trazabilidad", data);
    return response.data;
}

export async function getTrazabilidadResumen() {
    const response = await apiClient.get<TrazabilidadResumen>("/trazabilidad/resumen");
    return response.data;
}