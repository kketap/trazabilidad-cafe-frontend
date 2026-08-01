// src/api/ventas.api.ts
import { apiClient } from "../../api/apiClient";
import type { Cliente } from "../clientes/clientes.api";
import type { OrdenTrilla } from "../trilla/trilla.api";

export type Venta = {
  id: string;
  fechaVenta: string;
  producto: string;
  kilosVendidos: number;
  presentacionSacos: string;
  precioVentaKilo: number;
  precioCompra?: number | null;
  numeroFactura?: string | null;
  numeroGuiaRemision?: string | null;
  fincaOrigen?: string | null;
  clienteId: number;
  ordenTrillaId: string;
  cliente?: Cliente;
  ordenTrilla?: OrdenTrilla;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateVentaDTO = {
  fechaVenta?: string;
  producto: string;
  kilosVendidos: number;
  presentacionSacos: string;
  precioVentaKilo: number;
  precioCompra?: number | null;
  numeroFactura?: string | null;
  numeroGuiaRemision?: string | null;
  fincaOrigen?: string | null;
  clienteId: number;
  ordenTrillaId: string;
};

export type UpdateVentaDTO = Partial<CreateVentaDTO>;

export async function getVentasApi(): Promise<Venta[]> {
  const response = await apiClient.get("/ventas");
  return response.data.data;
}

export async function getVentaByIdApi(id: string): Promise<Venta> {
  const response = await apiClient.get(`/ventas/${id}`);
  return response.data.data;
}

export async function createVentaApi(data: CreateVentaDTO): Promise<Venta> {
  const response = await apiClient.post("/ventas", data);
  return response.data.data;
}

export async function updateVentaApi(id: string, data: UpdateVentaDTO): Promise<Venta> {
  const response = await apiClient.put(`/ventas/${id}`, data);
  return response.data.data;
}

export async function deleteVentaApi(id: string): Promise<void> {
  await apiClient.delete(`/ventas/${id}`);
}
