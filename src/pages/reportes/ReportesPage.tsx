// src/pages/reportes/ReportesPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
    Card,
    Col,
    DatePicker,
    Empty,
    message,
    Row,
    Skeleton,
    Space,
    Table,
    Tabs,
    Tag,
    Typography,
    theme,
    Statistic,
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
import {
    getCosechasReporteApi,
    type CosechasReporte,
    type ReportePorDia,
    type ReportePorLote,
    type ReportePorQuincena,
    type ReportePorTipoCosecha,
    type ReportePorTrabajador,
} from "./reportes.api";

dayjs.locale("es");

function formatDate(fecha: string): string {
    return dayjs(fecha).format("DD/MM/YYYY");
}

function formatDateShort(fecha: string): string {
    return dayjs(fecha).format("DD/MM");
}

function formatMonth(mes: string): string {
    return dayjs(`${mes}-01`).format("MMMM YYYY");
}

function formatQuincena(quincena: string): string {
    const [anio, mes, q] = quincena.split("-");
    const textoMes = dayjs(`${anio}-${mes}-01`).format("MMMM YYYY");

    return q === "Q1"
        ? `1ª quincena ${textoMes}`
        : `2ª quincena ${textoMes}`;
}

function formatNumber(value: number): string {
    return value.toLocaleString("es-CL");
}

function getTipoCosechaColor(tipo?: string | null) {
    switch (tipo?.toLowerCase()) {
        case "selectiva":
            return "gold";
        case "rebusca":
            return "purple";
        case "plena":
        default:
            return "green";
    }
}

const emptyReporte: CosechasReporte = {
    porDia: [],
    porMes: [],
    porQuincena: [],
    porTipoCosecha: [],
    porTrabajador: [],
    porLote: [],
};

export default function ReportesPage() {
    const { token } = theme.useToken();

    const [reporte, setReporte] = useState<CosechasReporte>(emptyReporte);
    const [loading, setLoading] = useState(true);
    const [mesSeleccionado, setMesSeleccionado] = useState<Dayjs | null>(null);

    useEffect(() => {
        cargarReporte();
    }, []);

    async function cargarReporte() {
        try {
            setLoading(true);
            const data = await getCosechasReporteApi();
            setReporte(data);
        } catch (error) {
            console.error("Error cargando reporte de cosechas:", error);
            message.error("No se pudo cargar el reporte de cosechas.");
        } finally {
            setLoading(false);
        }
    }

    const porDiaFiltrado = useMemo(() => {
        if (!mesSeleccionado) {
            return reporte.porDia;
        }

        return reporte.porDia.filter((item) => {
            const fecha = dayjs(item.fecha);

            return (
                fecha.month() === mesSeleccionado.month() &&
                fecha.year() === mesSeleccionado.year()
            );
        });
    }, [reporte.porDia, mesSeleccionado]);

    const porQuincenaFiltrado = useMemo(() => {
        if (!mesSeleccionado) {
            return reporte.porQuincena;
        }

        const prefix = mesSeleccionado.format("YYYY-MM");

        return reporte.porQuincena.filter((item) =>
            item.quincena.startsWith(prefix),
        );
    }, [reporte.porQuincena, mesSeleccionado]);

    const lineData = useMemo(() => {
        return [...porDiaFiltrado]
            .sort((a, b) => dayjs(a.fecha).valueOf() - dayjs(b.fecha).valueOf())
            .map((item) => ({
                fecha: formatDateShort(item.fecha),
                kilos: item.kilos,
            }));
    }, [porDiaFiltrado]);

    const barDataMes = useMemo(() => {
        return reporte.porMes.map((item) => ({
            periodo: formatMonth(item.mes),
            kilos: item.kilos,
        }));
    }, [reporte.porMes]);

    const barDataTipo = useMemo(() => {
        return reporte.porTipoCosecha.map((item) => ({
            tipoCosecha: item.tipoCosecha,
            kilos: item.kilos,
        }));
    }, [reporte.porTipoCosecha]);

    const kpisGenerales = useMemo(() => {
        const totalKilos = porDiaFiltrado.reduce(
            (total, item) => total + item.kilos,
            0,
        );

        const totalRegistros = porDiaFiltrado.length;

        const promedioDiario =
            totalRegistros > 0 ? totalKilos / totalRegistros : 0;

        const mejorDia = porDiaFiltrado.reduce<ReportePorDia | null>(
            (mejor, item) => {
                if (!mejor || item.kilos > mejor.kilos) return item;
                return mejor;
            },
            null,
        );

        const totalHistorico = reporte.porMes.reduce(
            (total, item) => total + item.kilos,
            0,
        );

        return {
            totalKilos,
            totalRegistros,
            promedioDiario,
            mejorDia,
            totalHistorico,
        };
    }, [porDiaFiltrado, reporte.porMes]);

    const columnsDia: ColumnsType<ReportePorDia> = [
        {
            title: "Fecha",
            dataIndex: "fecha",
            key: "fecha",
            render: (fecha: string) => formatDate(fecha),
        },
        {
            title: "Kilos cosechados",
            dataIndex: "kilos",
            key: "kilos",
            align: "right",
            render: (value: number) => `${formatNumber(value)} kg`,
            sorter: (a, b) => a.kilos - b.kilos,
        },
    ];

    const columnsQuincena: ColumnsType<ReportePorQuincena> = [
        {
            title: "Quincena",
            dataIndex: "quincena",
            key: "quincena",
            render: (value: string) => formatQuincena(value),
        },
        {
            title: "Kilos",
            dataIndex: "kilos",
            key: "kilos",
            align: "right",
            render: (value: number) => `${formatNumber(value)} kg`,
            sorter: (a, b) => a.kilos - b.kilos,
        },
    ];

    const columnsTipo: ColumnsType<ReportePorTipoCosecha> = [
        {
            title: "Tipo de cosecha",
            dataIndex: "tipoCosecha",
            key: "tipoCosecha",
            render: (value: string) => (
                <Tag color={getTipoCosechaColor(value)}>
                    {value.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Kilos",
            dataIndex: "kilos",
            key: "kilos",
            align: "right",
            render: (value: number) => `${formatNumber(value)} kg`,
            sorter: (a, b) => a.kilos - b.kilos,
        },
    ];

    const columnsTrabajador: ColumnsType<ReportePorTrabajador> = [
        {
            title: "Trabajador",
            dataIndex: "nombre",
            key: "nombre",
            render: (value: string, record) => (
                <Space orientation="vertical" size={0}>
                    <Typography.Text strong>{value}</Typography.Text>
                    <Typography.Text type="secondary">
                        DNI: {record.dni}
                    </Typography.Text>
                </Space>
            ),
        },
        {
            title: "Cosechas",
            dataIndex: "cosechas",
            key: "cosechas",
            align: "right",
            sorter: (a, b) => a.cosechas - b.cosechas,
        },
        {
            title: "Kilos asignados",
            dataIndex: "kilos",
            key: "kilos",
            align: "right",
            render: (value: number) => `${formatNumber(value)} kg`,
            sorter: (a, b) => a.kilos - b.kilos,
        },
    ];

    const columnsLote: ColumnsType<ReportePorLote> = [
        {
            title: "Código lote",
            dataIndex: "codigo",
            key: "codigo",
            render: (value: string, record) => (
                <Space orientation="vertical" size={0}>
                    <Tag color="gold">{value}</Tag>
                    <Typography.Text type="secondary">
                        {record.nombre || "Sin nombre"}
                    </Typography.Text>
                </Space>
            ),
        },
        {
            title: "Cosechas",
            dataIndex: "cosechas",
            key: "cosechas",
            align: "right",
            sorter: (a, b) => a.cosechas - b.cosechas,
        },
        {
            title: "Kilos asociados",
            dataIndex: "kilos",
            key: "kilos",
            align: "right",
            render: (value: number) => `${formatNumber(value)} kg`,
            sorter: (a, b) => a.kilos - b.kilos,
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
                            <Space
                                orientation="vertical"
                                size="large"
                                style={{ width: "100%" }}
                            >
                                <Card
                                    variant="borderless"
                                    style={{ borderRadius: 14 }}
                                >
                                    <Space align="center" wrap>
                                        <Typography.Text strong>
                                            Filtrar por mes:
                                        </Typography.Text>

                                        <DatePicker
                                            picker="month"
                                            value={mesSeleccionado}
                                            onChange={(value) =>
                                                setMesSeleccionado(value)
                                            }
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
                                                    Number(
                                                        value ?? 0,
                                                    ).toLocaleString("es-CL")
                                                }
                                            />
                                        </Card>
                                    </Col>

                                    <Col xs={24} sm={12} lg={6}>
                                        <Card className="report-kpi-card report-kpi-card-plantation">
                                            <Statistic
                                                title="Días con cosecha"
                                                value={
                                                    kpisGenerales.totalRegistros
                                                }
                                            />
                                        </Card>
                                    </Col>

                                    <Col xs={24} sm={12} lg={6}>
                                        <Card className="report-kpi-card report-kpi-card-earth">
                                            <Statistic
                                                title="Promedio diario"
                                                value={
                                                    kpisGenerales.promedioDiario
                                                }
                                                precision={2}
                                                suffix="kg"
                                            />
                                        </Card>
                                    </Col>

                                    <Col xs={24} sm={12} lg={6}>
                                        <Card className="report-kpi-card report-kpi-card-gold">
                                            <Statistic
                                                title="Mejor día"
                                                value={
                                                    kpisGenerales.mejorDia
                                                        ?.kilos ?? 0
                                                }
                                                suffix="kg"
                                                formatter={(value) =>
                                                    Number(
                                                        value ?? 0,
                                                    ).toLocaleString("es-CL")
                                                }
                                            />

                                            <Typography.Text type="secondary">
                                                {kpisGenerales.mejorDia
                                                    ? formatDate(
                                                        kpisGenerales.mejorDia
                                                            .fecha,
                                                    )
                                                    : "Sin datos"}
                                            </Typography.Text>
                                        </Card>
                                    </Col>
                                </Row>

                                <Row gutter={[16, 16]}>
                                    <Col xs={24} lg={12}>
                                        <Card
                                            title="Kilos cosechados por mes"
                                            variant="borderless"
                                            style={{ borderRadius: 14 }}
                                        >
                                            {loading ? (
                                                <Skeleton.Input
                                                    active
                                                    style={{
                                                        width: "100%",
                                                        height: 250,
                                                    }}
                                                />
                                            ) : barDataMes.length === 0 ? (
                                                <Empty
                                                    description="Sin datos"
                                                    style={{
                                                        padding: "40px 0",
                                                    }}
                                                />
                                            ) : (
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height={250}
                                                >
                                                    <BarChart
                                                        data={barDataMes}
                                                    >
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            vertical={false}
                                                            stroke={
                                                                token.colorBorder
                                                            }
                                                        />

                                                        <XAxis
                                                            dataKey="periodo"
                                                            tick={{
                                                                fontSize: 12,
                                                                fill: token.colorTextSecondary,
                                                            }}
                                                        />

                                                        <YAxis
                                                            tick={{
                                                                fontSize: 12,
                                                                fill: token.colorTextSecondary,
                                                            }}
                                                        />

                                                        <RTooltip
                                                            formatter={(
                                                                value: any,
                                                            ) =>
                                                                `${formatNumber(
                                                                    Number(
                                                                        value ||
                                                                        0,
                                                                    ),
                                                                )} kg`
                                                            }
                                                            contentStyle={{
                                                                background:
                                                                    token.colorBgElevated,
                                                                border: `1px solid ${token.colorBorder}`,
                                                                borderRadius:
                                                                    token.borderRadius,
                                                                color: token.colorText,
                                                            }}
                                                        />

                                                        <Bar
                                                            dataKey="kilos"
                                                            fill={
                                                                token.colorPrimary
                                                            }
                                                            fillOpacity={0.65}
                                                            radius={[
                                                                4, 4, 0, 0,
                                                            ]}
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
                                                    ? `Evolución diaria - ${mesSeleccionado.format(
                                                        "MMMM YYYY",
                                                    )}`
                                                    : "Evolución diaria - Todos los meses"
                                            }
                                            variant="borderless"
                                            style={{ borderRadius: 14 }}
                                        >
                                            {loading ? (
                                                <Skeleton.Input
                                                    active
                                                    style={{
                                                        width: "100%",
                                                        height: 250,
                                                    }}
                                                />
                                            ) : lineData.length === 0 ? (
                                                <Empty
                                                    description="Sin cosechas en este periodo"
                                                    style={{
                                                        padding: "40px 0",
                                                    }}
                                                />
                                            ) : (
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height={250}
                                                >
                                                    <LineChart
                                                        data={lineData}
                                                    >
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            vertical={false}
                                                            stroke={
                                                                token.colorBorder
                                                            }
                                                        />

                                                        <XAxis
                                                            dataKey="fecha"
                                                            tick={{
                                                                fontSize: 12,
                                                                fill: token.colorTextSecondary,
                                                            }}
                                                        />

                                                        <YAxis
                                                            tick={{
                                                                fontSize: 12,
                                                                fill: token.colorTextSecondary,
                                                            }}
                                                        />

                                                        <RTooltip
                                                            formatter={(
                                                                value: any,
                                                            ) =>
                                                                `${formatNumber(
                                                                    Number(
                                                                        value ||
                                                                        0,
                                                                    ),
                                                                )} kg`
                                                            }
                                                            contentStyle={{
                                                                background:
                                                                    token.colorBgElevated,
                                                                border: `1px solid ${token.colorBorder}`,
                                                                borderRadius:
                                                                    token.borderRadius,
                                                                color: token.colorText,
                                                            }}
                                                        />

                                                        <Line
                                                            type="monotone"
                                                            dataKey="kilos"
                                                            stroke={
                                                                token.colorPrimary
                                                            }
                                                            strokeWidth={2}
                                                            dot={{
                                                                r: 3,
                                                                fill: token.colorPrimary,
                                                            }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            )}
                                        </Card>
                                    </Col>
                                </Row>

                                <Row gutter={[16, 16]}>
                                    <Col xs={24} lg={12}>
                                        <Card
                                            title="Distribución por tipo de cosecha"
                                            variant="borderless"
                                            style={{ borderRadius: 14 }}
                                        >
                                            {loading ? (
                                                <Skeleton active />
                                            ) : barDataTipo.length === 0 ? (
                                                <Empty description="Sin datos" />
                                            ) : (
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height={260}
                                                >
                                                    <BarChart
                                                        data={barDataTipo}
                                                    >
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            vertical={false}
                                                            stroke={
                                                                token.colorBorder
                                                            }
                                                        />

                                                        <XAxis
                                                            dataKey="tipoCosecha"
                                                            tick={{
                                                                fontSize: 12,
                                                                fill: token.colorTextSecondary,
                                                            }}
                                                        />

                                                        <YAxis
                                                            tick={{
                                                                fontSize: 12,
                                                                fill: token.colorTextSecondary,
                                                            }}
                                                        />

                                                        <RTooltip
                                                            formatter={(
                                                                value: any,
                                                            ) =>
                                                                `${formatNumber(
                                                                    Number(
                                                                        value ||
                                                                        0,
                                                                    ),
                                                                )} kg`
                                                            }
                                                            contentStyle={{
                                                                background:
                                                                    token.colorBgElevated,
                                                                border: `1px solid ${token.colorBorder}`,
                                                                borderRadius:
                                                                    token.borderRadius,
                                                                color: token.colorText,
                                                            }}
                                                        />

                                                        <Bar
                                                            dataKey="kilos"
                                                            fill={
                                                                token.colorPrimary
                                                            }
                                                            fillOpacity={0.65}
                                                            radius={[
                                                                4, 4, 0, 0,
                                                            ]}
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
                                                    ? `Resumen por quincena - ${mesSeleccionado.format(
                                                        "MMMM YYYY",
                                                    )}`
                                                    : "Resumen por quincena"
                                            }
                                            variant="borderless"
                                            style={{ borderRadius: 14 }}
                                        >
                                            <Table
                                                columns={columnsQuincena}
                                                dataSource={
                                                    porQuincenaFiltrado
                                                }
                                                rowKey="quincena"
                                                loading={loading}
                                                pagination={false}
                                                locale={{
                                                    emptyText:
                                                        "No hay datos por quincena",
                                                }}
                                            />
                                        </Card>
                                    </Col>
                                </Row>

                                <Row gutter={[16, 16]}>
                                    <Col xs={24} lg={12}>
                                        <Card
                                            title="Ranking por trabajador"
                                            variant="borderless"
                                            style={{ borderRadius: 14 }}
                                        >
                                            <Table
                                                columns={columnsTrabajador}
                                                dataSource={
                                                    reporte.porTrabajador
                                                }
                                                rowKey="trabajadorId"
                                                loading={loading}
                                                pagination={{ pageSize: 5 }}
                                                locale={{
                                                    emptyText:
                                                        "No hay trabajadores asociados a cosechas",
                                                }}
                                            />
                                        </Card>
                                    </Col>

                                    <Col xs={24} lg={12}>
                                        <Card
                                            title="Ranking por lote"
                                            variant="borderless"
                                            style={{ borderRadius: 14 }}
                                        >
                                            <Table
                                                columns={columnsLote}
                                                dataSource={reporte.porLote}
                                                rowKey="loteId"
                                                loading={loading}
                                                pagination={{ pageSize: 5 }}
                                                locale={{
                                                    emptyText:
                                                        "No hay lotes asociados a cosechas",
                                                }}
                                            />
                                        </Card>
                                    </Col>
                                </Row>

                                <Row gutter={[16, 16]}>
                                    <Col xs={24} lg={12}>
                                        <Card
                                            title="Detalle diario"
                                            variant="borderless"
                                            style={{ borderRadius: 14 }}
                                        >
                                            <Table
                                                columns={columnsDia}
                                                dataSource={porDiaFiltrado}
                                                rowKey="fecha"
                                                loading={loading}
                                                pagination={{ pageSize: 10 }}
                                                locale={{
                                                    emptyText:
                                                        "No hay cosechas registradas en este periodo",
                                                }}
                                            />
                                        </Card>
                                    </Col>

                                    <Col xs={24} lg={12}>
                                        <Card
                                            title="Detalle por tipo de cosecha"
                                            variant="borderless"
                                            style={{ borderRadius: 14 }}
                                        >
                                            <Table
                                                columns={columnsTipo}
                                                dataSource={
                                                    reporte.porTipoCosecha
                                                }
                                                rowKey="tipoCosecha"
                                                loading={loading}
                                                pagination={false}
                                                locale={{
                                                    emptyText:
                                                        "No hay datos por tipo de cosecha",
                                                }}
                                            />
                                        </Card>
                                    </Col>
                                </Row>
                            </Space>
                        ),
                    },
                    {
                        key: "trazabilidad",
                        label: "KPIs Trazabilidad",
                        children: (
                            <Card
                                variant="borderless"
                                style={{ borderRadius: 14 }}
                            >
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