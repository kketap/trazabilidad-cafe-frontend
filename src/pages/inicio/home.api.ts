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

export type HomeResumen = {
    general: HomeStats;
    mesActual: HomeStats;
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

export async function getHomeResumen(): Promise<HomeResumen> {
    const [
        cosechasGeneralResponse,
        trazabilidadGeneralResponse,
        cosechasMesResponse,
        trazabilidadMesResponse,
    ] = await Promise.all([
        apiClient.get("/cosechas/resumen"),
        apiClient.get("/trazabilidad/resumen"),
        apiClient.get("/cosechas/resumen?periodo=mes-actual"),
        apiClient.get(
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