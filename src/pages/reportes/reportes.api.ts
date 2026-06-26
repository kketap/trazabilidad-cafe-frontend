// src/pages/reportes/reportes.api.ts
import { apiClient } from "../../api/apiClient";

export type KpiCosecha = {
    id: number;
    fecha: string;
    kilosDia: number;
    kilosTotalesMes: number;
    porcentaje: number;
    mes: string;
    anio: number;
};

export async function getKpisCosechas(): Promise<KpiCosecha[]> {
    const response = await apiClient.get<KpiCosecha[]>("/kpis/cosechas");
    return response.data;
}
