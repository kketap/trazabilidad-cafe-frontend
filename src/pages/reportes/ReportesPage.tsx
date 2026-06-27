// src/pages/reportes/ReportesPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
    Card,
    Col,
    DatePicker,
    Empty,
    message,
    Progress,
    Row,
    Skeleton,
    Space,
    Table,
    Tabs,
    Typography,
    theme,
    Statistic
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/es";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip as RTooltip,
    XAxis,
    YAxis,
} from "recharts";
import { getKpisCosechas, type KpiCosecha } from "./reportes.api";

dayjs.locale("es");

function formatDate(fecha: string): string {
    const d = new Date(fecha);
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

function formatDateShort(fecha: string): string {
    const d = new Date(fecha);
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    return `${dia}/${mes}`;
}

function formatNumber(value: number): string {
    return value.toLocaleString("es-CL");
}

type BarChartData = {
    periodo: string;
    kilos: number;
};

type LineChartData = {
    fecha: string;
    kilos: number;
};

export default function ReportesPage() {
    const { token } = theme.useToken();
    const [data, setData] = useState<KpiCosecha[]>([]);
    const [loading, setLoading] = useState(true);
    const [mesSeleccionado, setMesSeleccionado] = useState<Dayjs | null>(dayjs());

    useEffect(() => {
        cargarKpis();
    }, []);

    async function cargarKpis() {
        try {
            setLoading(true);
            const kpis = await getKpisCosechas();
            setData(kpis);
        } catch (error) {
            console.error("Error cargando KPIs de cosechas:", error);
            message.error("No se pudieron cargar los KPIs de cosechas.");
        } finally {
            setLoading(false);
        }
    }

    const dataFiltrada = useMemo(() => {
        if (!mesSeleccionado) return data;

        return data.filter((item) => {
            const fecha = dayjs(item.fecha);
            return (
                fecha.month() === mesSeleccionado.month() &&
                fecha.year() === mesSeleccionado.year()
            );
        });
    }, [data, mesSeleccionado]);

    const barData: BarChartData[] = useMemo(() => {
        const map = new Map<string, number>();
        for (const item of data) {
            const key = `${item.mes.charAt(0).toUpperCase()}${item.mes.slice(1)} ${item.anio}`;
            map.set(key, (map.get(key) ?? 0) + item.kilosDia);
        }
        return Array.from(map.entries()).map(([periodo, kilos]) => ({
            periodo,
            kilos,
        }));
    }, [data]);

    const lineData: LineChartData[] = useMemo(() => {
        return [...dataFiltrada]
            .sort((a, b) => dayjs(a.fecha).valueOf() - dayjs(b.fecha).valueOf())
            .map((item) => ({
                fecha: formatDateShort(item.fecha),
                kilos: item.kilosDia,
            }));
    }, [dataFiltrada]);

    const kpisGenerales = useMemo(() => {
        const totalKilos = dataFiltrada.reduce(
            (total, item) => total + item.kilosDia,
            0,
        );

        const totalRegistros = dataFiltrada.length;

        const promedioDiario =
            totalRegistros > 0 ? totalKilos / totalRegistros : 0;

        const mejorDia = dataFiltrada.reduce<KpiCosecha | null>((mejor, item) => {
            if (!mejor || item.kilosDia > mejor.kilosDia) return item;
            return mejor;
        }, null);

        const kilosMesHistorico = barData.reduce(
            (total, item) => total + item.kilos,
            0,
        );

        return {
            totalKilos,
            totalRegistros,
            promedioDiario,
            mejorDia,
            kilosMesHistorico,
        };
    }, [dataFiltrada, barData]);

    const columns: ColumnsType<KpiCosecha> = [
        {
            title: "Fecha de Cosecha",
            dataIndex: "fecha",
            key: "fecha",
            render: (fecha: string) => formatDate(fecha),
        },
        {
            title: "Periodo",
            key: "periodo",
            render: (_, record) =>
                `${record.mes.charAt(0).toUpperCase()}${record.mes.slice(1)} ${record.anio}`,
        },
        {
            title: "Kilos Recolectados",
            dataIndex: "kilosDia",
            key: "kilosDia",
            align: "right",
            render: (value: number) => `${formatNumber(value)} kg`,
        },
        {
            title: "Kilos del Mes",
            dataIndex: "kilosTotalesMes",
            key: "kilosTotalesMes",
            align: "right",
            render: (value: number) => `${formatNumber(value)} kg`,
        },
        {
            title: "Peso Porcentual",
            dataIndex: "porcentaje",
            key: "porcentaje",
            width: 200,
            render: (porcentaje: number) => (
                <Progress
                    percent={porcentaje}
                    size="small"
                    format={(p) => `${p}%`}
                />
            ),
        },
    ];

    return (
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
            <Typography.Title level={2} style={{ margin: 0 }}>
                Reportes y Estadísticas
            </Typography.Title>

            <Tabs
                defaultActiveKey="cosechas"
                items={[
                    {
                        key: "cosechas",
                        label: "KPIs Cosechas",
                        children: (
                            <Space orientation="vertical" size="large" style={{ width: "100%" }}>
                                <Card variant="borderless" style={{ borderRadius: 14 }}>
                                    <Space align="center">
                                        <Typography.Text strong>
                                            Filtrar por mes:
                                        </Typography.Text>
                                        <DatePicker
                                            picker="month"
                                            value={mesSeleccionado}
                                            onChange={(value) => setMesSeleccionado(value)}
                                            format="MMMM YYYY"
                                            placeholder="Todos los meses"
                                            allowClear
                                        />
                                    </Space>
                                </Card>

                                <Row gutter={[16, 16]}>
                                    <Col xs={24} sm={12} lg={6}>
                                        <Card className="report-kpi-card report-kpi-card-coffee">
                                            <Statistic
                                                title="Kg cosechados"
                                                value={kpisGenerales.totalKilos}
                                                suffix="kg"
                                                formatter={(value) =>
                                                    Number(value ?? 0).toLocaleString("es-CL")
                                                }
                                            />
                                        </Card>
                                    </Col>

                                    <Col xs={24} sm={12} lg={6}>
                                        <Card className="report-kpi-card report-kpi-card-plantation">
                                            <Statistic
                                                title="Registros"
                                                value={kpisGenerales.totalRegistros}
                                            />
                                        </Card>
                                    </Col>

                                    <Col xs={24} sm={12} lg={6}>
                                        <Card className="report-kpi-card report-kpi-card-earth">
                                            <Statistic
                                                title="Promedio diario"
                                                value={kpisGenerales.promedioDiario}
                                                precision={2}
                                                suffix="kg"
                                            />
                                        </Card>
                                    </Col>

                                    <Col xs={24} sm={12} lg={6}>
                                        <Card className="report-kpi-card report-kpi-card-gold">
                                            <Statistic
                                                title="Mejor día"
                                                value={kpisGenerales.mejorDia?.kilosDia ?? 0}
                                                suffix="kg"
                                                formatter={(value) =>
                                                    Number(value ?? 0).toLocaleString("es-CL")
                                                }
                                            />
                                            <Typography.Text type="secondary">
                                                {kpisGenerales.mejorDia
                                                    ? formatDate(kpisGenerales.mejorDia.fecha)
                                                    : "Sin datos"}
                                            </Typography.Text>
                                        </Card>
                                    </Col>
                                </Row>

                                <Row gutter={[16, 16]}>
                                    <Col xs={24} lg={12}>
                                        <Card
                                            title="Kilos recolectados por mes (histórico)"
                                            variant="borderless"
                                            style={{ borderRadius: 14 }}
                                        >
                                            {loading ? (
                                                <Skeleton.Input
                                                    active
                                                    style={{ width: "100%", height: 250 }}
                                                />
                                            ) : barData.length === 0 ? (
                                                <Empty
                                                    description="Sin datos"
                                                    style={{ padding: "40px 0" }}
                                                />
                                            ) : (
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <BarChart data={barData}>
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            vertical={false}
                                                            stroke={token.colorBorder}
                                                        />
                                                        <XAxis
                                                            dataKey="periodo"
                                                            tick={{ fontSize: 12, fill: token.colorTextSecondary }}
                                                        />
                                                        <YAxis tick={{ fontSize: 12, fill: token.colorTextSecondary }} />
                                                        <RTooltip
                                                            formatter={(value) => {
                                                                const numero = Number(value ?? 0);
                                                                return `${formatNumber(numero)} kg`;
                                                            }}
                                                            contentStyle={{
                                                                background: token.colorBgElevated,
                                                                border: `1px solid ${token.colorBorder}`,
                                                                borderRadius: token.borderRadius,
                                                                color: token.colorText,
                                                            }}
                                                        />
                                                        <Bar
                                                            dataKey="kilos"
                                                            fill={token.colorPrimary}
                                                            fillOpacity={0.65}
                                                            radius={[4, 4, 0, 0]}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        </Card>
                                    </Col>

                                    <Col xs={24} lg={12}>
                                        <Card
                                            title={
                                                mesSeleccionado
                                                    ? `Evolución diaria - ${mesSeleccionado.format("MMMM YYYY")}`
                                                    : "Evolución diaria - Todos los meses"
                                            }
                                            variant="borderless"
                                            style={{ borderRadius: 14 }}
                                        >
                                            {loading ? (
                                                <Skeleton.Input
                                                    active
                                                    style={{ width: "100%", height: 250 }}
                                                />
                                            ) : lineData.length === 0 ? (
                                                <Empty
                                                    description="Sin cosechas en este mes"
                                                    style={{ padding: "40px 0" }}
                                                />
                                            ) : (
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <LineChart data={lineData}>
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            vertical={false}
                                                            stroke={token.colorBorder}
                                                        />
                                                        <XAxis
                                                            dataKey="fecha"
                                                            tick={{ fontSize: 12, fill: token.colorTextSecondary }}
                                                        />
                                                        <YAxis tick={{ fontSize: 12, fill: token.colorTextSecondary }} />
                                                        <RTooltip
                                                            formatter={(value) => {
                                                                const numero = Number(value ?? 0);
                                                                return `${formatNumber(numero)} kg`;
                                                            }}
                                                            contentStyle={{
                                                                background: token.colorBgElevated,
                                                                border: `1px solid ${token.colorBorder}`,
                                                                borderRadius: token.borderRadius,
                                                                color: token.colorText,
                                                            }}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="kilos"
                                                            stroke={token.colorPrimary}
                                                            strokeWidth={2}
                                                            dot={{ r: 3, fill: token.colorPrimary }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            )}
                                        </Card>
                                    </Col>
                                </Row>

                                <Card
                                    title={
                                        mesSeleccionado
                                            ? `Detalle de cosechas - ${mesSeleccionado.format("MMMM YYYY")}`
                                            : "Detalle de cosechas - Todos los meses"
                                    }
                                    variant="borderless"
                                    style={{ borderRadius: 14 }}
                                >
                                    {loading ? (
                                        <Skeleton active paragraph={{ rows: 6 }} />
                                    ) : (
                                        <Table
                                            columns={columns}
                                            dataSource={dataFiltrada}
                                            rowKey="id"
                                            pagination={{ pageSize: 10 }}
                                            locale={{
                                                emptyText: "No hay cosechas registradas en este mes",
                                            }}
                                        />
                                    )}
                                </Card>
                            </Space>
                        ),
                    },
                    {
                        key: "trazabilidad",
                        label: "KPIs Trazabilidad",
                        children: (
                            <Card variant="borderless" style={{ borderRadius: 14 }}>
                                <Empty
                                    description="Módulo en construcción"
                                    style={{ padding: "48px 0" }}
                                />
                            </Card>
                        ),
                    },
                ]}
            />
        </Space>
    );
}
