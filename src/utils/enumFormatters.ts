// src/utils/enumFormatters.ts

/**
 * Formatea cadenas en formato ENUM (ej: EN_PROCESO, EN_ALMACEN, TRILLADO)
 * a una versión legible para el usuario en español (ej: "En Proceso", "En Almacén", "Trillado").
 */
export function formatEstadoEnum(estado?: string | null): string {
  if (!estado) return "-";

  const mapaEstados: Record<string, string> = {
    EN_PROCESO: "En Proceso",
    EN_SECADO: "En Secado",
    EN_ALMACEN: "En Almacén",
    TRILLADO: "Trillado",
    VENDIDO: "Vendido",
    CERRADO: "Cerrado",
    INACTIVO: "Inactivo",
    COMPLETADO: "Completado",
    CANCELADO: "Cancelado",
    PENDIENTE: "Pendiente",
    EN_TRANSITO: "En Tránsito",
    ENTREGADO: "Entregado",
    PLENA: "Plena",
    REBUSCA: "Rebusca",
    SELECTIVA: "Selectiva",
    ESPECIAL: "Especial",
    COMERCIAL: "Comercial",
  };

  if (mapaEstados[estado.toUpperCase()]) {
    return mapaEstados[estado.toUpperCase()];
  }

  // Fallback: reemplazar guiones bajos y capitalizar cada palabra
  return estado
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
