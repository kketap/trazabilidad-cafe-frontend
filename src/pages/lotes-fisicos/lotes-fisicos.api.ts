
import { apiClient } from "../../api/apiClient";

interface ApiResponse<T> {
    ok: boolean;
    message?: string;
    data: T;
}

export interface FundoLoteFisico {
    id: number;
    codigo: string;
    nombre: string | null;
    activo: boolean;
}

export interface CosechaAsociada {
    id: number;
    cosechaId: number;
    loteFisicoId: number;
    createdAt: string;
    cosecha: {
        id: number;
        fecha: string;
        kilosCosechados: number;
        tipoCosecha: string;
    };
}

export interface LoteFisico {
    id: number;
    codigo: string;
    numero: number;
    fundoId: number;
    hectareas: number | null;
    activo: boolean;
    createdAt: string;
    updatedAt: string;

    fundo: FundoLoteFisico;

    _count: {
        cosechas: number;
    };

    cosechas?: CosechaAsociada[];
}

export interface CrearLoteFisicoDTO {
    numero: number;
    fundoId: number;
    codigo?: string;
    hectareas?: number | null;
    activo?: boolean;
}

export type ActualizarLoteFisicoDTO =
    Partial<CrearLoteFisicoDTO>;

export interface FiltrosLotesFisicos {
    search?: string;
    fundoId?: number;
    activo?: boolean;
}

export interface ResultadoEliminarLoteFisico {
    accion: "ELIMINADO" | "DESACTIVADO";
    lote: LoteFisico;
}

/* ================= LISTAR ================= */

export async function getLotesFisicosApi(
    filtros: FiltrosLotesFisicos = {},
): Promise<LoteFisico[]> {
    const response = await apiClient.get<
        ApiResponse<LoteFisico[]>
    >("/lotes-fisicos", {
        params: filtros,
    });

    return response.data.data ?? [];
}

/* ================= DETALLE ================= */

export async function getLoteFisicoApi(
    id: number,
): Promise<LoteFisico> {
    const response = await apiClient.get<
        ApiResponse<LoteFisico>
    >(`/lotes-fisicos/${id}`);

    return response.data.data;
}

/* ================= CREAR ================= */

export async function crearLoteFisicoApi(
    payload: CrearLoteFisicoDTO,
): Promise<LoteFisico> {
    const response = await apiClient.post<
        ApiResponse<LoteFisico>
    >("/lotes-fisicos", payload);

    return response.data.data;
}

/* ================= ACTUALIZAR ================= */

export async function actualizarLoteFisicoApi(
    id: number,
    payload: ActualizarLoteFisicoDTO,
): Promise<LoteFisico> {
    const response = await apiClient.put<
        ApiResponse<LoteFisico>
    >(`/lotes-fisicos/${id}`, payload);

    return response.data.data;
}

/* ================= ELIMINAR ================= */

export async function eliminarLoteFisicoApi(
    id: number,
): Promise<{
    message: string;
    data: ResultadoEliminarLoteFisico;
}> {
    const response = await apiClient.delete<
        ApiResponse<ResultadoEliminarLoteFisico>
    >(`/lotes-fisicos/${id}`);

    return {
        message: response.data.message ?? "",
        data: response.data.data,
    };
}
