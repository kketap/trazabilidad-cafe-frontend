// src/pages/inicio/home.api.ts
import { apiClient } from "../../api/apiClient";

export type MejorTrabajador = {
    id?: number;
    nombre: string;
    kilos: number;
};

export type MejorLote = {
    id?: number;
    codigo: string;
    nombre?: string | null;
    kilos: number;
};

export type HomeStats = {
    totalCosechas: number;
    kilosTotales: number;
    totalHectareas: number;
    rendimiento: number;
    mejorTrabajador?: MejorTrabajador | null;
    mejorLote?: MejorLote | null;

    totalProcesos: number;
    totalIngresado: number;
    totalResultante: number;
    mermaPromedio: number;
};

/**
 * Información adicional proveniente del nuevo endpoint:
 * GET /cosechas/reporte
 *
 * Esto permite que el Home muestre información más alineada
 * con las nuevas relaciones:
 * Cosecha -> Trabajadores
 * Cosecha -> Lotes
 */
export type HomeReporteCosechas = {
    trabajadoresConCosechas: number;
    lotesConCosechas: number;
    mejorTrabajador: {
        trabajadorId: number;
        nombre: string;
        dni: string;
        kilos: number;
        cosechas: number;
    } | null;
    mejorLote: {
        loteId: number;
        codigo: string;
        nombre: string | null;
        kilos: number;
        cosechas: number;
    } | null;
};

/**
 * Resumen completo usado por HomePage.
 * general y mesActual se mantienen para no romper el Home actual.
 * reporteCosechas es el agregado nuevo.
 */
export type HomeResumen = {
    general: HomeStats;
    mesActual: HomeStats;
    reporteCosechas: HomeReporteCosechas;
};

type ApiResponse<T> = {
    ok: boolean;
    data: T;
    message?: string;
};

type CosechasResumenResponse = {
    totalCosechas: number;
    kilosTotales: number;
    totalHectareas: number;
    rendimiento: number;
    mejorTrabajador?: MejorTrabajador | null;
    mejorLote?: MejorLote | null;
};

type TrazabilidadResumenResponse = {
    totalProcesos: number;
    totalIngresado: number;
    totalResultante: number;
    mermaPromedio: number;
};

type CosechasReporteResponse = {
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

const emptyReporteCosechas: HomeReporteCosechas = {
    trabajadoresConCosechas: 0,
    lotesConCosechas: 0,
    mejorTrabajador: null,
    mejorLote: null,
};

/**
 * Soporta respuestas directas y respuestas envueltas.
 *
 * Ejemplo directo:
 * {
 *   totalCosechas: 10
 * }
 *
 * Ejemplo envuelto:
 * {
 *   ok: true,
 *   data: {
 *     totalCosechas: 10
 *   }
 * }
 */
function unwrapResponse<T>(responseData: T | ApiResponse<T>): T {
    if (
        responseData &&
        typeof responseData === "object" &&
        "data" in responseData
    ) {
        return (responseData as ApiResponse<T>).data;
    }

    return responseData as T;
}

/**
 * Combina el resumen de cosechas y trazabilidad en una sola estructura
 * que usa directamente el Home.
 */
function combinarResumen(
    cosechasRaw: any,
    trazabilidadRaw: any,
): HomeStats {
    const cosechas: CosechasResumenResponse = cosechasRaw?.data ?? cosechasRaw ?? {};
    const trazabilidad: TrazabilidadResumenResponse = trazabilidadRaw?.data ?? trazabilidadRaw ?? {};

    return {
        totalCosechas: cosechas.totalCosechas ?? 0,
        kilosTotales: cosechas.kilosTotales ?? 0,
        totalHectareas: cosechas.totalHectareas ?? 0,
        rendimiento: cosechas.rendimiento ?? 0,
        mejorTrabajador: cosechas.mejorTrabajador ?? null,
        mejorLote: cosechas.mejorLote ?? null,

        totalProcesos: trazabilidad.totalProcesos ?? 0,
        totalIngresado: trazabilidad.totalIngresado ?? 0,
        totalResultante: trazabilidad.totalResultante ?? 0,
        mermaPromedio: trazabilidad.mermaPromedio ?? 0,
    };
}

/**
 * Construye métricas adicionales desde el endpoint /cosechas/reporte.
 */
function construirReporteCosechas(
    reporte?: CosechasReporteResponse,
): HomeReporteCosechas {
    if (!reporte) {
        return emptyReporteCosechas;
    }

    const mejorTrabajador =
        reporte.porTrabajador.length > 0
            ? [...reporte.porTrabajador].sort((a, b) => b.kilos - a.kilos)[0]
            : null;

    const mejorLote =
        reporte.porLote.length > 0
            ? [...reporte.porLote].sort((a, b) => b.kilos - a.kilos)[0]
            : null;

    return {
        trabajadoresConCosechas: reporte.porTrabajador.length,
        lotesConCosechas: reporte.porLote.length,
        mejorTrabajador,
        mejorLote,
    };
}

/**
 * Carga el resumen del Home.
 *
 * Este método mantiene los 4 endpoints anteriores:
 * - resumen general de cosechas
 * - resumen general de trazabilidad
 * - resumen mensual de cosechas
 * - resumen mensual de trazabilidad
 *
 * Y agrega:
 * - reporte de cosechas para trabajadores/lotes/rankings
 */
export async function getHomeResumen(): Promise<HomeResumen> {
    const [
        cosechasGeneralResponse,
        trazabilidadGeneralResponse,
        cosechasMesResponse,
        trazabilidadMesResponse,
        cosechasReporteResponse,
    ] = await Promise.all([
        apiClient.get("/cosechas/resumen"),
        apiClient.get("/trazabilidad/resumen"),
        apiClient.get("/cosechas/resumen?periodo=mes-actual"),
        apiClient.get(
            "/trazabilidad/resumen?periodo=mes-actual",
        ),
    ]);

    const cosechasGeneral = unwrapResponse(cosechasGeneralResponse.data);
    const trazabilidadGeneral = unwrapResponse(trazabilidadGeneralResponse.data);
    const cosechasMes = unwrapResponse(cosechasMesResponse.data);
    const trazabilidadMes = unwrapResponse(trazabilidadMesResponse.data);
    const cosechasReporte = unwrapResponse(cosechasReporteResponse.data);

    return {
        general: combinarResumen(cosechasGeneral, trazabilidadGeneral),
        mesActual: combinarResumen(cosechasMes, trazabilidadMes),
        reporteCosechas: construirReporteCosechas(cosechasReporte),
    };
}