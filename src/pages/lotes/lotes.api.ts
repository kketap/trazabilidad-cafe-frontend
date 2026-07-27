// src/api/lotes.ts
import { apiClient } from "../../api/apiClient";

type ApiResponse<T> = {
    ok: boolean;
    data: T;
    message?: string;
};

export type TipoCodigoLote = "COMERCIAL" | "ESPECIAL" | "PERSONALIZADO";

export type EstadoLote =
    | "EN_PROCESO"
    | "EN_SECADO"
    | "EN_ALMACEN"
    | "TRILLADO"
    | "VENDIDO"
    | "CERRADO"
    | "INACTIVO";

export type Lote = {
    id: number;
    codigo: string;
    nombre?: string | null;
    tipoCodigo: TipoCodigoLote;
    estado: EstadoLote;
    kilosIniciales?: number | null;
    kilosActuales?: number | null;
    saldoTemporal?: number | null;

    // Campos antiguos mantenidos como opcionales por compatibilidad.
    hectareas?: number | null;
    ubicacion?: string | null;

    observacion?: string | null;
    activo: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export type CreateLoteDTO = {
    codigo?: string;
    nombre?: string | null;
    tipoCodigo?: TipoCodigoLote;
    estado?: EstadoLote;
    kilosIniciales?: number | null;
    kilosActuales?: number | null;
    saldoTemporal?: number | null;
    hectareas?: number | null;
    ubicacion?: string | null;
    observacion?: string | null;
    activo?: boolean;
};

export type UpdateLoteDTO = Partial<CreateLoteDTO>;

export async function getLotesApi(): Promise<Lote[]> {
    const response = await apiClient.get<ApiResponse<Lote[]> | Lote[]>("/lotes");

    if (Array.isArray(response.data)) {
        return response.data;
    }

    return response.data.data ?? [];
}

/**
 * Genera código principal:
 * COMERCIAL -> CONV-001
 * ESPECIAL -> ESC-001
 */
export async function getSiguienteCodigoLoteApi(
    tipoCodigo: Exclude<TipoCodigoLote, "PERSONALIZADO">,
): Promise<string> {
    const response = await apiClient.get<ApiResponse<{ codigo: string }>>(
        `/lotes/codigo/siguiente?tipoCodigo=${tipoCodigo}`,
    );

    return response.data.data.codigo;
}

/**
 * Genera sublote:
 * ESC-001 -> ESC-001-1
 */
export async function getSiguienteCorrelativoApi(
    codigoBase: string,
): Promise<string> {
    const response = await apiClient.get<ApiResponse<{ codigo: string }>>(
        `/lotes/correlativo/${codigoBase}`,
    );

    return response.data.data.codigo;
}

export async function createLoteApi(data: CreateLoteDTO): Promise<Lote> {
    const response = await apiClient.post<ApiResponse<Lote>>("/lotes", data);
    return response.data.data;
}

export async function updateLoteApi(
    id: number,
    data: UpdateLoteDTO,
): Promise<Lote> {
    const response = await apiClient.put<ApiResponse<Lote>>(
        `/lotes/${id}`,
        data,
    );

    return response.data.data;
}

export async function deleteLoteApi(id: number): Promise<void> {
    await apiClient.delete(`/lotes/${id}`);
}