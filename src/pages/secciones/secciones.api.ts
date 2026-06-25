// src/pages/secciones/secciones.api.ts
import { apiClient } from "../../api/apiClient";

export type SeccionCosecha = {
    id: number;
    titulo: string;
    descripcion?: string | null;
    color: string;
    createdAt?: string;
    updatedAt?: string;
};

export type CreateSeccionDto = {
    titulo: string;
    descripcion?: string | null;
    color: string;
};

export async function getSecciones() {
    const response = await apiClient.get<SeccionCosecha[]>("/secciones");
    return response.data;
}

export async function createSeccion(data: CreateSeccionDto) {
    const response = await apiClient.post<SeccionCosecha>("/secciones", data);
    return response.data;
}

export async function updateSeccion(id: number, data: Partial<CreateSeccionDto>) {
    const response = await apiClient.put<SeccionCosecha>(`/secciones/${id}`, data);
    return response.data;
}

export async function deleteSeccion(id: number) {
    const response = await apiClient.delete<{ message: string }>(`/secciones/${id}`);
    return response.data;
}

export type CompararSeccionesResponse = {
    seccionesIds: number[];
    totalGeneralKilos: number;
    totalSeccionesKilos: number;
    porcentaje: number;
};

export async function compararSecciones(seccionesIds: number[]) {
    const response = await apiClient.post<CompararSeccionesResponse>(
        "/cosechas/analiticas/comparar-secciones",
        { seccionesIds },
    );
    return response.data;
}
