import type { Dayjs } from "dayjs";

export function formatearDuracionMinutos(minutos: number | null): string | null {
    if (minutos === null || !Number.isFinite(minutos) || minutos < 0) return null;

    return `${Math.floor(minutos / 60)} h ${minutos % 60} min`;
}

export function formatearDuracionHoras(horas?: number | null): string | null {
    if (horas == null || horas <= 0) return null;

    return formatearDuracionMinutos(Math.round(horas * 60));
}

export function formatearDuracionSecado(inicio?: Dayjs | null, fin?: Dayjs | null): string | null {
    if (!inicio || !fin) return null;

    const minutos = fin.diff(inicio, "minute");
    if (!Number.isFinite(minutos) || minutos < 0) return null;

    return `${Math.floor(minutos / 1440)} d ${Math.floor(minutos / 60) % 24} h ${minutos % 60} min`;
}
