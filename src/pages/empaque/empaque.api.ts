import { apiClient } from "../../api/apiClient";
import type { Lote } from "../lotes/lotes.api";
import type { Secado } from "../secado/secado.api";

export type EmpaqueSecado = {
  id: number;
  empaqueId: number;
  secadoId: number;
  secado: Secado;
};

export type Empaque = {
  id: number;
  codigo?: string | null;
  loteId: number;
  fechaInicio: string;
  fechaFin?: string | null;
  kilosIngresados: number;
  kilosResultantes: number;
  merma: number;
  secadoId?: number | null;
  tipoEmpaque?: string | null;
  cantidadEmpaques?: number | null;
  rendimiento?: number | null;
  observaciones?: string | null;
  // Campos de calidad
  humedad?: number | null;
  actividadAgua?: number | null;
  puntajeSca?: number | null;
  perfilSensorial?: string | null;
  fueCatado?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
  lote?: Lote;
  secado?: Secado | null;
  empaqueSecados?: EmpaqueSecado[];
};

export type CreateEmpaqueDTO = {
  codigo?: string | null;
  loteId: number;
  fechaInicio: string;
  fechaFin?: string | null;
  kilosIngresados: number;
  kilosResultantes: number;
  secadoId?: number | null;
  secadoIds?: number[];
  tipoEmpaque?: string | null;
  cantidadEmpaques?: number | null;
  rendimiento?: number | null;
  observaciones?: string | null;
  // Campos de calidad
  humedad?: number | null;
  actividadAgua?: number | null;
  puntajeSca?: number | null;
  perfilSensorial?: string | null;
  fueCatado?: boolean | null;
};

export type UpdateEmpaqueDTO = Partial<CreateEmpaqueDTO>;

export async function getEmpaquesApi(): Promise<Empaque[]> {
  const response = await apiClient.get("/empaque");
  return response.data.data;
}

export async function getEmpaqueByIdApi(id: number): Promise<Empaque> {
  const response = await apiClient.get(`/empaque/${id}`);
  return response.data.data;
}

export async function createEmpaqueApi(data: CreateEmpaqueDTO): Promise<Empaque> {
  const response = await apiClient.post("/empaque", data);
  return response.data.data;
}

export async function updateEmpaqueApi(id: number, data: UpdateEmpaqueDTO): Promise<Empaque> {
  const response = await apiClient.put(`/empaque/${id}`, data);
  return response.data.data;
}

export async function deleteEmpaqueApi(id: number): Promise<void> {
  await apiClient.delete(`/empaque/${id}`);
}
