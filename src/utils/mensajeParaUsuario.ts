const detalleTecnico = /\b(?:Prisma\w*Error|ConnectorError|QueryError|PostgresError|SQLSTATE|ECONNREFUSED|ENOTFOUND)\b|foreign key constraint|violates RESTRICT|\binvocation\b|\bP20\d{2}\b|\bnode_modules\b|[A-Z]:[\\/]|^\s*at\s+\S|^\s*<(!DOCTYPE|html)/im;

export function mensajeParaUsuario(
    valor: unknown,
    alternativa = "No se pudo completar la operación. Intenta nuevamente.",
    estado?: number,
): string {
    if (estado !== undefined && estado >= 500) return alternativa;
    if (typeof valor !== "string" || !valor.trim()) return alternativa;

    const mensaje = valor.trim();
    if (/foreign key constraint|violates RESTRICT|\bfkey\b|_fkey\b/i.test(mensaje)) {
        return "Este registro está asociado a otros datos. Revisa sus vínculos antes de volver a intentar.";
    }

    return detalleTecnico.test(mensaje) ? alternativa : mensaje;
}
