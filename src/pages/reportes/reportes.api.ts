// src/pages/reportes/reportes.api.ts
import { apiClient } from "../../api/apiClient";

type ApiResponse<T> = {
    ok: boolean;
    data: T;
    message?: string;
};

export type CosechaDetalleItem = {
    id: number;
    kilosCosechados: number;
    totalHectareas: number;
    tipoCosecha: string;
    varietal: string | null;
    lotes: { id: number; codigo: string; nombre: string | null; hectareas: number | null }[];
    trabajadores: { id: number; nombre: string; dni: string; kilosAsignados: number | null }[];
};

export type ReportePorDia = {
    fecha: string;
    kilos: number;
    cantidadRegistros?: number;
    detalles?: CosechaDetalleItem[];
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

export type ProcesoDetalleItem = {
    id: number;
    codigo: string;
    fecha: string;
    etapa: string | null;
    duracionHoras: number;
    kilosIngresados: number;
    loteCodigo: string | null;
};

export type SecadoDetalleItem = {
    id: number;
    fechaInicio: string;
    fechaFin: string | null;
    kilosIngresados: number;
    kilosResultantes: number;
    merma: number;
    observaciones: string | null;
    loteCodigo: string | null;
};

export type TrillaDetalleItem = {
    id: string;
    codigoTrilla: string;
    fechaDespacho: string;
    fechaIngreso: string | null;
    calidad: string | null;
    tipoSaco: string | null;
    kilosEnviados: number;
    kilosNetos: number | null;
    lotes: string[];
};

export type KpisTrazabilidadData = {
    resumen: {
        totalIngresadoProcesos: number;
        totalProcesos: number;
        duracionPromedioHoras: number;
        totalIngresadoSecado: number;
        totalResultanteSecado: number;
        totalMermaSecado: number;
        porcMermaSecadoPromedio: number;
        totalKilosEnviadosTrilla: number;
        totalKilosNetosTrilla: number;
        totalOrdenesTrilla: number;
        totalKilosVendidos: number;
        totalIngresosVentas: number;
        totalVentas: number;
    };
    porTipoProceso: {
        tipo: string;
        kilos: number;
        duracionHoras: number;
        cantidad: number;
        duracionPromedio: number;
        detalles?: ProcesoDetalleItem[];
    }[];
    porPerfilSecado: {
        perfil: string;
        kilosIngresados: number;
        kilosResultantes: number;
        merma: number;
        cantidad: number;
        porcentajeMerma: number;
        detalles?: SecadoDetalleItem[];
    }[];
    porCalidadTrilla: {
        calidad: string;
        kilosEnviados: number;
        kilosNetos: number;
        cantidad: number;
        detalles?: TrillaDetalleItem[];
    }[];
};

export async function getKpisTrazabilidadApi(): Promise<KpisTrazabilidadData> {
    const response = await apiClient.get<ApiResponse<KpisTrazabilidadData>>(
        "/kpis/trazabilidad",
    );

    return response.data.data;
}
