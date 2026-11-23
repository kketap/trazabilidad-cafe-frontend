// src/pages/trazabilidad/trazabilidad.api.ts

import { apiClient } from "../../api/apiClient";

import type { Cosecha } from "../cosechas/cosechas.api";
import type { Lote } from "../lotes/lotes.api";

/* =====================================================
   RESPUESTA GENERAL API
===================================================== */

type ApiResponse<T> = {
    ok: boolean;
    data: T;
    message?: string;
};

/* =====================================================
   TIPOS DE PROCESO
===================================================== */

export type TipoProceso =
    | "OXIDACION_CEREZA"
    | "OXIDACION_MUCILAGO"
    | "ANAEROBICO_CEREZA"
    | "ANAEROBICO_MUCILAGO";

/* =====================================================
   RELACIÓN PROCESO - LOTE
===================================================== */

export type ProcesoLote = {
    id: number;
    procesoId: number;
    loteId: number;
    kilosUsados: number;
    createdAt?: string;

    lote?: Lote | null;
};

/* =====================================================
   DTO DE LOTE UTILIZADO EN UN PROCESO
===================================================== */

export type ProcesoLoteInput = {
    loteId: number;
    kilosUsados: number;
};

/* =====================================================
   MODELO PROCESO TRAZABILIDAD
===================================================== */

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
    kilosResultantes?: number | null;

    /* =========================================
       PROCESO HÚMEDO / FERMENTACIÓN
    ========================================= */

    fueDespulpado?: boolean | null;

    tanqueFermentacion?: string | null;
    inicioOxidacion?: string | null;
    finOxidacion?: string | null;
    tanqueOxidacion?: string | null;

    inicioFermentacion?: string | null;
    finFermentacion?: string | null;

    nivelPh?: number | null;
    tempMaxima?: number | null;
    tempMinima?: number | null;

    fueLavado?: boolean | null;

    /* =========================================
       LOTES DE PROCESO - NUEVA RELACIÓN N:M
    ========================================= */

    procesoLotes: ProcesoLote[];

    /*
     * Compatibilidad con procesos antiguos
     * que utilizan un único loteId.
     */
    loteId?: number | null;

    /*
     * Prisma conserva esta relación
     * con nombre Lote.
     */
    Lote?: Lote | null;

    /*
     * Alias utilizado en el frontend.
     */
    lote?: Lote | null;

    /* =========================================
       COSECHA DE ORIGEN
    ========================================= */

    cosechaId?: number | null;
    cosecha?: Cosecha | null;

    createdAt?: string;
    updatedAt?: string;
};

/* =====================================================
   DTO CREAR PROCESO
===================================================== */

export type CreateProcesoTrazabilidadDto = {
    fecha: string;

    fechaInicio?: string | null;
    fechaFin?: string | null;

    duracionHoras?: number | null;

    /*
     * Uno o varios lotes.
     * Cada lote indica cuántos kilos aporta.
     */
    lotes: ProcesoLoteInput[];

    /*
     * Solo compatibilidad con clientes antiguos.
     * No enviar junto con lotes en el flujo nuevo.
     */
    loteId?: number | null;

    cosechaId?: number | null;

    etapa?: string | null;
    tipoProceso?: TipoProceso | string | null;

    /*
     * Debe coincidir con la suma de
     * lotes[].kilosUsados.
     */
    kilosIngresados: number;

    kilosResultantes?: number | null;

    /* =========================================
       PROCESO HÚMEDO / FERMENTACIÓN
    ========================================= */

    fueDespulpado?: boolean | null;

    tanqueFermentacion?: string | null;
    inicioOxidacion?: string | null;
    finOxidacion?: string | null;
    tanqueOxidacion?: string | null;

    inicioFermentacion?: string | null;
    finFermentacion?: string | null;

    nivelPh?: number | null;
    tempMaxima?: number | null;
    tempMinima?: number | null;

    fueLavado?: boolean | null;
};

/* =====================================================
   DTO ACTUALIZAR PROCESO
===================================================== */

export type UpdateProcesoTrazabilidadDto =
    Partial<CreateProcesoTrazabilidadDto>;

/* =====================================================
   RESUMEN
===================================================== */

export type TrazabilidadResumen = {
    totalProcesos: number;
    totalIngresado: number;
    totalResultante: number;
    mermaPromedio: number;
};

/* =====================================================
   DESENVOLVER RESPUESTA
===================================================== */

function unwrapResponse<T>(
    responseData: ApiResponse<T> | T,
): T {
    if (
        responseData &&
        typeof responseData === "object" &&
        "data" in responseData
    ) {
        return (responseData as ApiResponse<T>).data;
    }

    return responseData as T;
}

/* =====================================================
   NORMALIZACIÓN DE RELACIONES
===================================================== */

function normalizarProceso(
    proceso: ProcesoTrazabilidad,
): ProcesoTrazabilidad {
    /*
     * Las relaciones nuevas deben venir
     * desde el backend.
     */
    const relaciones = Array.isArray(
        proceso.procesoLotes,
    )
        ? proceso.procesoLotes
        : [];

    return {
        ...proceso,

        procesoLotes: relaciones.map(
            (relacion) => ({
                ...relacion,

                loteId: Number(
                    relacion.loteId,
                ),

                kilosUsados: Number(
                    relacion.kilosUsados,
                ),
            }),
        ),

        /*
         * Compatibilidad de nombres
         * Prisma Lote -> frontend lote.
         */
        lote:
            proceso.lote ??
            proceso.Lote ??
            null,
    };
}

/* =====================================================
   VALIDAR DISTRIBUCIÓN DE LOTES
===================================================== */

function validarLotesProceso(
    lotes: ProcesoLoteInput[],
): number {
    if (
        !Array.isArray(lotes) ||
        lotes.length === 0
    ) {
        throw new Error(
            "Debe seleccionar al menos un lote de origen",
        );
    }

    const ids = new Set<number>();

    let total = 0;

    for (const item of lotes) {
        const loteId = Number(
            item.loteId,
        );

        const kilos = Number(
            item.kilosUsados,
        );

        if (
            !Number.isSafeInteger(loteId) ||
            loteId <= 0
        ) {
            throw new Error(
                "Uno de los lotes seleccionados tiene un ID inválido",
            );
        }

        if (ids.has(loteId)) {
            throw new Error(
                `El lote con ID ${loteId} está repetido`,
            );
        }

        if (
            !Number.isFinite(kilos) ||
            kilos <= 0
        ) {
            throw new Error(
                "Los kilos asignados a cada lote deben ser mayores que cero",
            );
        }

        ids.add(loteId);
        total += kilos;
    }

    return Number(total.toFixed(2));
}

/* =====================================================
   PREPARAR PAYLOAD
===================================================== */

function prepararPayload(
    data: CreateProcesoTrazabilidadDto,
): CreateProcesoTrazabilidadDto {
    const totalCalculado =
        validarLotesProceso(
            data.lotes,
        );

    const totalEnviado =
        Number(data.kilosIngresados);

    if (
        !Number.isFinite(totalEnviado) ||
        Math.abs(
            totalCalculado - totalEnviado,
        ) > 0.01
    ) {
        throw new Error(
            "Los kilos ingresados no coinciden con la suma de los lotes",
        );
    }

    if (
        data.kilosResultantes != null &&
        (
            !Number.isFinite(
                Number(data.kilosResultantes),
            ) ||
            Number(data.kilosResultantes) < 0 ||
            Number(data.kilosResultantes) >
            totalCalculado
        )
    ) {
        throw new Error(
            "Los kilos resultantes deben estar entre cero y los kilos ingresados",
        );
    }

    const {
        loteId: _loteIdAntiguo,
        ...rest
    } = data;

    return {
        ...rest,

        lotes: data.lotes.map(
            (item) => ({
                loteId: Number(
                    item.loteId,
                ),

                kilosUsados: Number(
                    item.kilosUsados,
                ),
            }),
        ),

        kilosIngresados:
            totalCalculado,
    };
}

/* =====================================================
   LISTAR PROCESOS
===================================================== */

export async function getProcesosTrazabilidad():
    Promise<ProcesoTrazabilidad[]> {
    const response = await apiClient.get<
        ApiResponse<ProcesoTrazabilidad[]> |
        ProcesoTrazabilidad[]
    >("/trazabilidad");

    const procesos =
        unwrapResponse(response.data) ?? [];

    return procesos.map(
        normalizarProceso,
    );
}

/* =====================================================
   CREAR PROCESO
===================================================== */

export async function createProcesoTrazabilidad(
    data: CreateProcesoTrazabilidadDto,
): Promise<ProcesoTrazabilidad> {
    const payload =
        prepararPayload(data);

    const response = await apiClient.post<
        ApiResponse<ProcesoTrazabilidad> |
        ProcesoTrazabilidad
    >("/trazabilidad", payload);

    return normalizarProceso(
        unwrapResponse(response.data),
    );
}

/* =====================================================
   OBTENER RESUMEN
===================================================== */

export async function getTrazabilidadResumen():
    Promise<TrazabilidadResumen> {
    const response = await apiClient.get<
        ApiResponse<TrazabilidadResumen> |
        TrazabilidadResumen
    >("/trazabilidad/resumen");

    return unwrapResponse(response.data);
}

/* =====================================================
   ACTUALIZAR PROCESO
===================================================== */


export async function updateProcesoTrazabilidad(
    id: number,
    data: UpdateProcesoTrazabilidadDto,
): Promise<ProcesoTrazabilidad> {
    if (
        !Number.isSafeInteger(id) ||
        id <= 0
    ) {
        throw new Error("ID de proceso inválido");
    }

    let payload: UpdateProcesoTrazabilidadDto = {
        ...data,
    };

    if (data.lotes !== undefined) {
        const totalCalculado =
            validarLotesProceso(data.lotes);

        if (
            data.kilosIngresados !== undefined &&
            Math.abs(
                Number(data.kilosIngresados) -
                totalCalculado,
            ) > 0.01
        ) {
            throw new Error(
                "Los kilos ingresados no coinciden con la suma de los lotes",
            );
        }

        if (
            data.kilosResultantes != null &&
            (
                !Number.isFinite(Number(data.kilosResultantes)) ||
                Number(data.kilosResultantes) < 0 ||
                Number(data.kilosResultantes) > totalCalculado
            )
        ) {
            throw new Error(
                "Los kilos resultantes deben estar entre cero y los kilos ingresados",
            );
        }

        const {
            loteId: _loteIdAnterior,
            ...rest
        } = data;

        payload = {
            ...rest,
            lotes: data.lotes.map((item) => ({
                loteId: Number(item.loteId),
                kilosUsados: Number(item.kilosUsados),
            })),
            kilosIngresados: totalCalculado,
        };
    }

    const response = await apiClient.put<
        ApiResponse<ProcesoTrazabilidad> |
        ProcesoTrazabilidad
    >(`/trazabilidad/${id}`, payload);

    return normalizarProceso(
        unwrapResponse(response.data),
    );
}


/* =====================================================
   ELIMINAR PROCESO
===================================================== */

export async function deleteProcesoTrazabilidad(
    id: number,
) {
    const response =
        await apiClient.delete(
            `/trazabilidad/${id}`,
        );

    return response.data;
}
