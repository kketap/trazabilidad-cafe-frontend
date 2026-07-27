// src/pages/reportes/reportes.api.ts
import { apiClient } from "../../api/apiClient";

type ApiResponse<T> = {
    ok: boolean;
    data: T;
    message?: string;
};

export type ReportePorDia = {
    fecha: string;
    kilos: number;
};

export type ReportePorMes = {
    mes: string;
    kilos: number;
};

export type ReportePorQuincena = {
    quincena: string;
    kilos: number;
};

export type ReportePorTipoCosecha = {
    tipoCosecha: string;
    kilos: number;
};

export type ReportePorTrabajador = {
    trabajadorId: number;
    nombre: string;
    dni: string;
    kilos: number;
    cosechas: number;
};

export type ReportePorLote = {
    loteId: number;
    codigo: string;
    nombre: string | null;
    kilos: number;
    cosechas: number;
};

export type CosechasReporte = {
    porDia: ReportePorDia[];
    porMes: ReportePorMes[];
    porQuincena: ReportePorQuincena[];
    porTipoCosecha: ReportePorTipoCosecha[];
    porTrabajador: ReportePorTrabajador[];
    porLote: ReportePorLote[];
};

export async function getCosechasReporteApi(): Promise<CosechasReporte> {
    const response = await apiClient.get<ApiResponse<CosechasReporte>>(
        "/cosechas/reporte",
    );

    return response.data.data;
}