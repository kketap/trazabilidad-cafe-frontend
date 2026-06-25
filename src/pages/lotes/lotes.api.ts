import { apiClient } from "../../api/apiClient";

export type Lote = {
    id: number;
    codigo: string;
    nombre?: string | null;
    hectareas?: number | null;
    ubicacion?: string | null;
    observacion?: string | null;
    activo: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export type CreateLoteDto = {
    codigo: string;
    nombre?: string;
    hectareas?: number;
    ubicacion?: string;
    observacion?: string;
    activo?: boolean;
};

export async function getLotes() {
    const response = await apiClient.get<Lote[]>("/lotes");
    return response.data;
}

export async function createLote(data: CreateLoteDto) {
    const response = await apiClient.post<Lote>("/lotes", data);
    return response.data;
}

export async function updateLote(id: number, data: Partial<CreateLoteDto>) {
    const response = await apiClient.put<Lote>(`/lotes/${id}`, data);
    return response.data;
}

export async function deleteLote(id: number) {
    const response = await apiClient.delete<{ message: string }>(`/lotes/${id}`);
    return response.data;
}