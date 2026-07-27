// src/api/cosechas.ts
import { apiClient } from "./apiClient";
import type { Trabajador } from "./trabajadores";

export type Cosecha = {
  id: number;
  fecha: string;
  kilosCosechados: number;
  cantidadCosechadores: number;
  lotes: string;
  totalHectareas: number;
  tipoCosecha: string;
  trabajadorId?: number | null;
  trabajador?: Trabajador | null;
  tipo_cosecha?: string | null;
  kilos_diarios?: number | null;
  kilos_quincena?: number | null;
  kilos_mensuales?: number | null;
  cosechaLotes?: any[];
  createdAt?: string;
  updatedAt?: string;
};

export type CreateCosechaDTO = {
  fecha: string;
  kilosCosechados: number;
  cantidadCosechadores: number;
  totalHectareas: number;
  lotes?: string;
  trabajadorId: number;
  tipo_cosecha?: string;
  kilos_diarios?: number;
  kilos_quincena?: number;
  kilos_mensuales?: number;
  loteIds?: number[];
};

export async function getCosechasApi(): Promise<Cosecha[]> {
  const response = await apiClient.get("/cosechas");
  return response.data.data;
}

export async function createCosechaApi(data: CreateCosechaDTO): Promise<Cosecha> {
  const response = await apiClient.post("/cosechas", data);
  return response.data.data;
}

export async function updateCosechaApi(id: number, data: Partial<CreateCosechaDTO>): Promise<Cosecha> {
  const response = await apiClient.put(`/cosechas/${id}`, data);
  return response.data.data;
}

export async function deleteCosechaApi(id: number): Promise<void> {
  await apiClient.delete(`/cosechas/${id}`);
}
