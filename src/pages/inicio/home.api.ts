// src/pages/inicio/home.api.ts
import { apiClient } from "../../api/apiClient";

export type HomeStats = {
    totalCosechas: number;
    kilosTotales: number;
    totalHectareas: number;
    rendimiento: number;
    totalProcesos: number;
    totalIngresado: number;
    totalResultante: number;
    mermaPromedio: number;
};

export type HomeResumen = {
    general: HomeStats;
    mesActual: HomeStats;
};

type CosechasResumenResponse = {
    totalCosechas: number;
    kilosTotales: number;
    totalHectareas: number;
    rendimiento: number;
};

type TrazabilidadResumenResponse = {
    totalProcesos: number;
    totalIngresado: number;
    totalResultante: number;
    mermaPromedio: number;
};

function combinarResumen(
    cosechas: CosechasResumenResponse,
    trazabilidad: TrazabilidadResumenResponse,
): HomeStats {
    return {
        totalCosechas: cosechas.totalCosechas,
        kilosTotales: cosechas.kilosTotales,
        totalHectareas: cosechas.totalHectareas,
        rendimiento: cosechas.rendimiento,

        totalProcesos: trazabilidad.totalProcesos,
        totalIngresado: trazabilidad.totalIngresado,
        totalResultante: trazabilidad.totalResultante,
        mermaPromedio: trazabilidad.mermaPromedio,
    };
}

export async function getHomeResumen(): Promise<HomeResumen> {
    const [
        cosechasGeneralResponse,
        trazabilidadGeneralResponse,
        cosechasMesResponse,
        trazabilidadMesResponse,
    ] = await Promise.all([
        apiClient.get<CosechasResumenResponse>("/cosechas/resumen"),
        apiClient.get<TrazabilidadResumenResponse>("/trazabilidad/resumen"),
        apiClient.get<CosechasResumenResponse>("/cosechas/resumen?periodo=mes-actual"),
        apiClient.get<TrazabilidadResumenResponse>(
            "/trazabilidad/resumen?periodo=mes-actual",
        ),
    ]);

    return {
        general: combinarResumen(
            cosechasGeneralResponse.data,
            trazabilidadGeneralResponse.data,
        ),
        mesActual: combinarResumen(
            cosechasMesResponse.data,
            trazabilidadMesResponse.data,
        ),
    };
}