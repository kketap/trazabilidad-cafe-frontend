// src/pages/cosechas/DashboardCosechas.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  InputNumber,
  Row,
  Segmented,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  ReferenceLine,
} from "recharts";
import {
  AimOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  FilterOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import type { Cosecha, CosechaTrabajador } from "./cosechas.api";
import { getCosechasApi } from "./cosechas.api";
import type { Lote } from "../lotes/lotes.api";
import { getLotesApi } from "../lotes/lotes.api";

const { Title, Text } = Typography;

// ─── Paleta ──────────────────────────────────────────────────────────────────
const C_PRIMARY  = "#6366f1";
const C_SUCCESS  = "#10b981";
const C_WARNING  = "#f59e0b";
const C_DANGER   = "#ef4444";
const C_INFO     = "#06b6d4";
const C_PROYECT  = "#94a3b8";

const PIE_COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#06b6d4","#8b5cf6","#f97316","#ec4899"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtKg(v: number | null | undefined) {
  return `${Number(v ?? 0).toLocaleString("es-CL")} kg`;
}
function fmtPct(v: number) {
  return `${v.toFixed(1)}%`;
}
function getTipoCosecha(c: Cosecha) {
  return (c.tipoCosecha || (c as any).tipo_cosecha || "plena") as string;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function DarkTooltip({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(15,15,30,0.93)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10,
      padding: "10px 16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
    }}>
      {label && (
        <Text style={{ color: "#fff", fontWeight: 600, display: "block", marginBottom: 6 }}>
          {label}
        </Text>
      )}
      {payload.map((e) => (
        <div key={e.name} style={{ color: e.color, fontSize: 13, lineHeight: "22px" }}>
          {e.name}: <strong>{fmtKg(e.value)}</strong>
        </div>
      ))}
    </div>
  );
}

// ─── Pie label ────────────────────────────────────────────────────────────────
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  title, value, suffix, color, icon, loading,
}: {
  title: string; value: string | number; suffix?: string;
  color: string; icon: React.ReactNode; loading: boolean;
}) {
  return (
    <Card
      style={{
        borderRadius: 14,
        background: `linear-gradient(135deg, ${color}15 0%, ${color}06 100%)`,
        border: `1px solid ${color}28`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        height: "100%",
      }}
      styles={{ body: { padding: "18px 20px" } }}
    >
      {loading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 11,
            background: `${color}18`, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 20, color, flexShrink: 0,
          }}>
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: "#8c8c8c", fontSize: 11, fontWeight: 500, display: "block", marginBottom: 2 }}>
              {title}
            </Text>
            <Statistic
              value={value}
              suffix={suffix}
              valueStyle={{ fontSize: 20, fontWeight: 700, color: "#1a1a2e", lineHeight: 1.2 }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Barra de progreso por lote ───────────────────────────────────────────────
function ProgressBarLote({
  label, real, capacidad,
}: { label: string; real: number; capacidad: number }) {
  const pct = capacidad > 0 ? Math.min((real / capacidad) * 100, 100) : 0;
  const color = pct >= 100 ? C_SUCCESS : pct >= 70 ? C_WARNING : C_PRIMARY;

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <Text style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{label}</Text>
        <Space size={6}>
          <Text style={{ fontSize: 12, color: "#6b7280" }}>{fmtKg(real)}</Text>
          {capacidad > 0 && (
            <Tag style={{ margin: 0, fontSize: 11, color, borderColor: color, background: `${color}12` }}>
              {fmtPct(pct)}
            </Tag>
          )}
        </Space>
      </div>
      <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 4,
          transition: "width 0.6s ease",
          minWidth: pct > 0 ? 4 : 0,
        }} />
      </div>
      {capacidad > 0 && (
        <Text style={{ fontSize: 11, color: "#9ca3af" }}>
          Meta: {fmtKg(capacidad)}
        </Text>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function DashboardCosechas() {
  // ── Datos crudos ────────────────────────────────────────────────────────────
  const [cosechas, setCosechas] = useState<Cosecha[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filtros ─────────────────────────────────────────────────────────────────
  const [filtroFinca, setFiltroFinca] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [metaDiaria, setMetaDiaria] = useState<number>(500);
  const [vistaRanking, setVistaRanking] = useState<"cosechador" | "lote">("cosechador");

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [cosData, lotesData] = await Promise.all([
          getCosechasApi(),
          getLotesApi(),
        ]);
        setCosechas(cosData);
        setLotes(lotesData);
      } catch {
        setError("No se pudieron cargar los datos del dashboard.");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // ── Fincas disponibles (de ubicacion de lotes) ───────────────────────────────
  const fincasDisponibles = useMemo(() => {
    const fincas = new Set<string>();
    cosechas.forEach((c) => {
      (c.cosechaLotes ?? []).forEach((cl) => {
        const loteCompleto = lotes.find((l) => l.id === cl.loteId);
        const ub = loteCompleto?.ubicacion ?? (cl.lote as any)?.ubicacion;
        if (ub) fincas.add(ub);
      });
    });
    return Array.from(fincas).sort();
  }, [cosechas, lotes]);

  // ── Tipos disponibles ─────────────────────────────────────────────────────────
  const tiposDisponibles = useMemo(() => {
    const tipos = new Set<string>();
    cosechas.forEach((c) => tipos.add(getTipoCosecha(c)));
    return Array.from(tipos).sort();
  }, [cosechas]);

  // ── Cosechas filtradas ────────────────────────────────────────────────────────
  const filtradas = useMemo(() => {
    return cosechas.filter((c) => {
      if (filtroFinca) {
        const tieneUbicacion = (c.cosechaLotes ?? []).some((cl) => {
          const loteCompleto = lotes.find((l) => l.id === cl.loteId);
          const ub = loteCompleto?.ubicacion ?? (cl.lote as any)?.ubicacion;
          return ub === filtroFinca;
        });
        if (!tieneUbicacion) return false;
      }
      if (filtroTipo) {
        if (getTipoCosecha(c).toLowerCase() !== filtroTipo.toLowerCase()) return false;
      }
      return true;
    });
  }, [cosechas, lotes, filtroFinca, filtroTipo]);

  // ── KPIs ──────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const kilosTotales = filtradas.reduce((s, c) => s + Number(c.kilosCosechados ?? 0), 0);
    const totalHectareas = filtradas.reduce((s, c) => s + Number(c.totalHectareas ?? 0), 0);
    const rendimiento = totalHectareas > 0 ? kilosTotales / totalHectareas : 0;
    return { kilosTotales, totalHectareas, rendimiento, totalCosechas: filtradas.length };
  }, [filtradas]);

  // ── Real vs Proyectado (por día) ──────────────────────────────────────────────
  const datosRealVsProyectado = useMemo(() => {
    const map = new Map<string, number>();
    filtradas.forEach((c) => {
      const fecha = dayjs(c.fecha).format("DD/MM");
      map.set(fecha, (map.get(fecha) ?? 0) + Number(c.kilosCosechados ?? 0));
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        const da = a.split("/").reverse().join("-");
        const db = b.split("/").reverse().join("-");
        return da.localeCompare(db);
      })
      .map(([fecha, real]) => ({ fecha, real, proyectado: metaDiaria }));
  }, [filtradas, metaDiaria]);

  // ── Avance por Lote ───────────────────────────────────────────────────────────
  const datosAvanceLote = useMemo(() => {
    const map = new Map<number, {
      loteId: number; etiqueta: string; real: number; capacidad: number;
    }>();

    filtradas.forEach((c) => {
      const lotesC = c.cosechaLotes ?? [];
      const kilosPerLote = Number(c.kilosCosechados ?? 0) / Math.max(lotesC.length, 1);

      lotesC.forEach((cl) => {
        const loteCompleto = lotes.find((l) => l.id === cl.loteId);
        const codigo = loteCompleto?.codigo ?? cl.lote?.codigo ?? `L-${cl.loteId}`;
        const nombre = loteCompleto?.nombre ?? cl.lote?.nombre ?? null;
        const capacidad = Number(loteCompleto?.kilosIniciales ?? 0);

        const actual = map.get(cl.loteId) ?? {
          loteId: cl.loteId,
          etiqueta: `${codigo}${nombre ? ` - ${nombre}` : ""}`,
          real: 0,
          capacidad,
        };
        actual.real += kilosPerLote;
        map.set(cl.loteId, actual);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.real - a.real)
      .slice(0, 10);
  }, [filtradas, lotes]);

  // ── Avance por Varietal ───────────────────────────────────────────────────────
  const datosVarietal = useMemo(() => {
    const map = new Map<string, number>();
    filtradas.forEach((c) => {
      if (!c.varietal) return;
      const varietales = String(c.varietal)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const kpv = Number(c.kilosCosechados ?? 0) / Math.max(varietales.length, 1);
      varietales.forEach((v) => map.set(v, (map.get(v) ?? 0) + kpv));
    });
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([varietal, kilos]) => ({ varietal, kilos }));
  }, [filtradas]);

  // ── Avance por Cosechador ─────────────────────────────────────────────────────
  const datosCosechador = useMemo(() => {
    const map = new Map<number, { nombre: string; kilos: number }>();
    filtradas.forEach((c) => {
      const trabList = (c.cosechaTrabajadores ?? []) as CosechaTrabajador[];
      trabList.forEach((ct) => {
        const kilosTrab =
          ct.kilosAsignados != null
            ? Number(ct.kilosAsignados)
            : Number(c.kilosCosechados ?? 0) / Math.max(trabList.length, 1);

        const nombre = `${ct.trabajador.nombres}${ct.trabajador.apellidos ? " " + ct.trabajador.apellidos : ""}`;
        const actual = map.get(ct.trabajadorId) ?? { nombre, kilos: 0 };
        actual.kilos += kilosTrab;
        map.set(ct.trabajadorId, actual);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.kilos - a.kilos)
      .slice(0, 10);
  }, [filtradas]);

  // ── Datos ranking (cosechador o lote) ─────────────────────────────────────────
  const datosRanking = useMemo(() => {
    if (vistaRanking === "cosechador") {
      return datosCosechador.map((d) => ({ nombre: d.nombre, kilos: d.kilos }));
    }
    return datosAvanceLote.map((d) => ({ nombre: d.etiqueta, kilos: d.real }));
  }, [vistaRanking, datosCosechador, datosAvanceLote]);

  // ── Mejor cosechador y lote ───────────────────────────────────────────────────
  const mejorCosechador = datosCosechador[0];
  const mejorLote = datosAvanceLote[0];

  const chartSkeleton = <Skeleton active paragraph={{ rows: 5 }} style={{ padding: "12px 0" }} />;

  const noData = (
    <div style={{ textAlign: "center", padding: "40px 0", color: "#bfbfbf" }}>
      Sin datos para los filtros seleccionados
    </div>
  );

  return (
    <div style={{ paddingBottom: 32 }}>
      {error && (
        <Alert message={error} type="error" showIcon
          style={{ marginBottom: 20, borderRadius: 10 }} />
      )}

      {/* ── Barra de filtros ────────────────────────────────────────────────── */}
      <Card
        style={{ borderRadius: 14, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
        styles={{ body: { padding: "16px 24px" } }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-end" }}>
          {/* Finca */}
          {fincasDisponibles.length > 0 && (
            <div>
              <Text style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 6 }}>
                <FilterOutlined style={{ marginRight: 4 }} />FINCA
              </Text>
              <Space size={6} wrap>
                <Button
                  size="small"
                  type={filtroFinca === null ? "primary" : "default"}
                  onClick={() => setFiltroFinca(null)}
                  style={{ borderRadius: 6, fontSize: 12 }}
                >
                  Todas
                </Button>
                {fincasDisponibles.map((f) => (
                  <Button
                    key={f}
                    size="small"
                    type={filtroFinca === f ? "primary" : "default"}
                    onClick={() => setFiltroFinca(filtroFinca === f ? null : f)}
                    style={{ borderRadius: 6, fontSize: 12 }}
                  >
                    {f}
                  </Button>
                ))}
              </Space>
            </div>
          )}

          {/* Tipo Cosecha */}
          {tiposDisponibles.length > 0 && (
            <div>
              <Text style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 6 }}>
                TIPO DE COSECHA
              </Text>
              <Space size={6} wrap>
                <Button
                  size="small"
                  type={filtroTipo === null ? "primary" : "default"}
                  onClick={() => setFiltroTipo(null)}
                  style={{ borderRadius: 6, fontSize: 12 }}
                >
                  Todos
                </Button>
                {tiposDisponibles.map((t) => (
                  <Button
                    key={t}
                    size="small"
                    type={filtroTipo === t ? "primary" : "default"}
                    onClick={() => setFiltroTipo(filtroTipo === t ? null : t)}
                    style={{ borderRadius: 6, fontSize: 12, textTransform: "capitalize" }}
                  >
                    {t}
                  </Button>
                ))}
              </Space>
            </div>
          )}

          {/* Meta Diaria */}
          <div style={{ marginLeft: "auto" }}>
            <Text style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 6 }}>
              <AimOutlined style={{ marginRight: 4, color: C_PROYECT }} />
              META DIARIA PROYECTADA
            </Text>
            <InputNumber
              value={metaDiaria}
              onChange={(v) => setMetaDiaria(Number(v ?? 0))}
              min={0}
              addonAfter="kg/día"
              style={{ width: 190 }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              parser={(v) => Number(v?.replace(/\./g, "") ?? 0) as 0}
            />
          </div>
        </div>
      </Card>

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <Row gutter={[14, 14]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <KpiCard title="Kilos Cosechados" value={Number(kpis.kilosTotales.toFixed(0)).toLocaleString("es-CL")}
            suffix="kg" color={C_PRIMARY} icon="⚖️" loading={loading} />
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <KpiCard title="Total Hectáreas" value={Number(kpis.totalHectareas.toFixed(1)).toLocaleString("es-CL", { minimumFractionDigits: 1 })}
            suffix="ha" color={C_SUCCESS} icon="🌿" loading={loading} />
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <KpiCard title="Rendimiento" value={`${kpis.rendimiento.toLocaleString("es-CL", { maximumFractionDigits: 1 })} kg/ha`}
            color={C_WARNING} icon="📈" loading={loading} />
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <KpiCard title="Registros" value={kpis.totalCosechas}
            color={C_INFO} icon="☕" loading={loading} />
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <KpiCard title="Mejor Cosechador"
            value={mejorCosechador?.nombre ?? "—"}
            suffix={mejorCosechador ? `· ${fmtKg(mejorCosechador.kilos)}` : ""}
            color={C_DANGER} icon={<TrophyOutlined />} loading={loading} />
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <KpiCard title="Mejor Lote"
            value={mejorLote?.etiqueta ?? "—"}
            suffix={mejorLote ? `· ${fmtKg(mejorLote.real)}` : ""}
            color="#8b5cf6" icon={<AppstoreOutlined />} loading={loading} />
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <KpiCard title="Total Varietales"
            value={datosVarietal.length}
            color="#f97316" icon="🍃" loading={loading} />
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <KpiCard title="Cosechadores Activos"
            value={datosCosechador.length}
            color="#ec4899" icon={<UserOutlined />} loading={loading} />
        </Col>
      </Row>

      {/* ── Real vs Proyectado ───────────────────────────────────────────────── */}
      <Card
        style={{ borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", marginBottom: 20 }}
        styles={{ body: { padding: "20px 24px" } }}
        title={
          <div>
            <Title level={5} style={{ margin: 0 }}>
              <BarChartOutlined style={{ marginRight: 8, color: C_PRIMARY }} />
              Avance General — Real vs Proyectado (por día)
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Barras azules = kilos reales · Línea gris punteada = meta diaria ({fmtKg(metaDiaria)})
            </Text>
          </div>
        }
      >
        {loading ? chartSkeleton : datosRealVsProyectado.length === 0 ? noData : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={datosRealVsProyectado} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C_PRIMARY} stopOpacity={0.95} />
                  <stop offset="95%" stopColor={C_PRIMARY} stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: "#8c8c8c" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8c8c8c" }} tickLine={false} axisLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}t` : `${v}`} />
              <ReTooltip content={<DarkTooltip />} />
              <Legend
                formatter={(value) => value === "real" ? "Kilos reales" : "Meta diaria"}
                wrapperStyle={{ fontSize: 12 }}
              />
              {metaDiaria > 0 && (
                <ReferenceLine
                  y={metaDiaria}
                  stroke={C_PROYECT}
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  label={{ value: `Meta ${fmtKg(metaDiaria)}`, position: "insideTopRight", fontSize: 11, fill: C_PROYECT }}
                />
              )}
              <Bar dataKey="real" name="real" fill="url(#gradReal)" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Line dataKey="proyectado" name="proyectado" stroke={C_PROYECT} strokeWidth={0} dot={false} legendType="line" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ── Avance por Lote + Varietal ───────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* Avance por Lote — progress bars */}
        <Col xs={24} lg={12}>
          <Card
            style={{ borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", height: "100%" }}
            styles={{ body: { padding: "20px 24px" } }}
            title={
              <div>
                <Title level={5} style={{ margin: 0 }}>
                  <AppstoreOutlined style={{ marginRight: 8, color: "#8b5cf6" }} />
                  Avance por Lote
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Kilos reales vs capacidad (kilosIniciales)
                </Text>
              </div>
            }
          >
            {loading ? chartSkeleton : datosAvanceLote.length === 0 ? noData : (
              <div style={{ maxHeight: 380, overflowY: "auto", paddingRight: 4 }}>
                {datosAvanceLote.map((d) => (
                  <ProgressBarLote
                    key={d.loteId}
                    label={d.etiqueta}
                    real={d.real}
                    capacidad={d.capacidad}
                  />
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* Avance por Varietal — Pie */}
        <Col xs={24} lg={12}>
          <Card
            style={{ borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", height: "100%" }}
            styles={{ body: { padding: "20px 24px" } }}
            title={
              <div>
                <Title level={5} style={{ margin: 0 }}>
                  🍃 Avance por Varietal
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Distribución de kilos por varietal de café
                </Text>
              </div>
            }
          >
            {loading ? chartSkeleton : datosVarietal.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#bfbfbf" }}>
                Sin datos de varietal registrados
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={datosVarietal}
                      dataKey="kilos"
                      nameKey="varietal"
                      cx="50%" cy="50%"
                      outerRadius={85}
                      innerRadius={38}
                      labelLine={false}
                      label={PieLabel}
                    >
                      {datosVarietal.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip
                      formatter={(v: number) => fmtKg(v)}
                      contentStyle={{
                        borderRadius: 10,
                        background: "rgba(15,15,30,0.92)",
                        border: "none",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Leyenda */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", justifyContent: "center", marginTop: 8 }}>
                  {datosVarietal.map((d, i) => {
                    const color = PIE_COLORS[i % PIE_COLORS.length];
                    const total = datosVarietal.reduce((s, x) => s + x.kilos, 0);
                    const pct = total > 0 ? ((d.kilos / total) * 100).toFixed(1) : "0";
                    return (
                      <Tooltip key={d.varietal} title={fmtKg(d.kilos)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "default" }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                          <Text style={{ fontSize: 12, color: "#374151" }}>{d.varietal}</Text>
                          <Tag style={{ margin: 0, fontSize: 10, color, borderColor: `${color}60`, background: `${color}12` }}>
                            {pct}%
                          </Tag>
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Avance por Cosechador / Lote (ranking) ──────────────────────────── */}
      <Card
        style={{ borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
        styles={{ body: { padding: "20px 24px" } }}
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <Title level={5} style={{ margin: 0 }}>
                <UserOutlined style={{ marginRight: 8, color: C_DANGER }} />
                Ranking de Productores
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Top 10 por kilos cosechados
              </Text>
            </div>
            <Segmented
              value={vistaRanking}
              onChange={(v) => setVistaRanking(v as "cosechador" | "lote")}
              options={[
                { label: "Por Cosechador", value: "cosechador" },
                { label: "Por Lote", value: "lote" },
              ]}
            />
          </div>
        }
      >
        {loading ? chartSkeleton : datosRanking.length === 0 ? noData : (
          <ResponsiveContainer width="100%" height={Math.max(240, datosRanking.length * 36)}>
            <BarChart
              layout="vertical"
              data={datosRanking}
              margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#8c8c8c" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}t` : `${v}`}
              />
              <YAxis
                type="category"
                dataKey="nombre"
                width={140}
                tick={{ fontSize: 11, fill: "#374151" }}
                tickLine={false}
                axisLine={false}
              />
              <ReTooltip content={<DarkTooltip />} />
              <Bar
                dataKey="kilos"
                name="Kilos"
                radius={[0, 6, 6, 0]}
                maxBarSize={24}
                label={{
                  position: "right",
                  formatter: (v: number) => fmtKg(v),
                  fontSize: 11,
                  fill: "#6b7280",
                }}
              >
                {datosRanking.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      i === 0 ? C_PRIMARY
                      : i === 1 ? C_SUCCESS
                      : i === 2 ? C_WARNING
                      : "#cbd5e1"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
