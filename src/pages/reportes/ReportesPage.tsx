// src/pages/reportes/ReportesPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Empty,
    Modal,
    Row,
    Skeleton,
    Space,
    Statistic,
    Table,
    Tabs,
    Tag,
    Typography,
    message,
    theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/es";
import { EyeOutlined, CoffeeOutlined } from "@ant-design/icons";
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

function formatNumber(value: number): string {
    return value.toLocaleString("es-CL");
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

    // Estado del modal de detalles por día
    const [modalVisible, setModalVisible] = useState(false);
    const [diaSeleccionado, setDiaSeleccionado] = useState<ReportePorDia | null>(null);

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

    const abrirModalDetalle = (record: ReportePorDia) => {
        setDiaSeleccionado(record);
        setModalVisible(true);
    };

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

    // Extraer lotes únicos del día seleccionado
    const lotesUnicosDia = useMemo(() => {
        if (!diaSeleccionado?.detalles) return [];
        const map = new Map<number, { id: number; codigo: string; nombre: string | null; hectareas: number | null }>();
        diaSeleccionado.detalles.forEach((d) => {
            d.lotes.forEach((l) => {
                if (!map.has(l.id)) map.set(l.id, l);
            });
        });
        return Array.from(map.values());
    }, [diaSeleccionado]);

    // Extraer trabajadores únicos del día seleccionado
    const trabajadoresUnicosDia = useMemo(() => {
        if (!diaSeleccionado?.detalles) return [];
        const map = new Map<number, { id: number; nombre: string; dni: string; kilosAsignados: number | null }>();
        diaSeleccionado.detalles.forEach((d) => {
            d.trabajadores.forEach((t) => {
                if (!map.has(t.id)) map.set(t.id, t);
            });
        });
        return Array.from(map.values());
    }, [diaSeleccionado]);

    const columnsDia: ColumnsType<ReportePorDia> = [
        {
            title: "Fecha",
            dataIndex: "fecha",
            key: "fecha",
            render: (fecha: string) => <strong>{formatDate(fecha)}</strong>,
        },
        {
            title: "Registros",
            dataIndex: "cantidadRegistros",
            key: "cantidadRegistros",
            align: "center",
            render: (cnt: number, record: ReportePorDia) => {
                const total = cnt || record.detalles?.length || 1;
                return (
                    <Tag color="gold">
                        {total} {total === 1 ? "cosecha" : "cosechas"}
                    </Tag>
                );
            },
        },
        {
            title: "Kilos cosechados",
            dataIndex: "kilos",
            key: "kilos",
            align: "right",
            render: (value: number) => `${formatNumber(value)} kg`,
            sorter: (a, b) => a.kilos - b.kilos,
        },
        {
            title: "Acción",
            key: "accion",
            align: "center",
            render: (_, record: ReportePorDia) => (
                <Button
                    type="primary"
                    ghost
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                        e.stopPropagation();
                        abrirModalDetalle(record);
                    }}
                >
                    Ver detalle
                </Button>
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
                                            columns={columnsDia}
                                            dataSource={porDiaFiltrado}
                                            rowKey="fecha"
                                            pagination={{ pageSize: 10 }}
                                            scroll={{ x: "max-content" }}
                                            onRow={(record) => ({
                                                onClick: () => abrirModalDetalle(record),
                                                style: { cursor: "pointer" },
                                            })}
                                            locale={{
                                                emptyText: mesSeleccionado
                                                    ? "No hay cosechas registradas en este mes"
                                                    : "No hay cosechas registradas",
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

            {/* Modal de Detalle Completo de Cosecha por Día */}
            <Modal
                title={
                    <Space align="center">
                        <CoffeeOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
                        <span>
                            Detalle de Cosecha - {diaSeleccionado ? formatDate(diaSeleccionado.fecha) : ""}
                        </span>
                    </Space>
                }
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button key="cerrar" onClick={() => setModalVisible(false)}>
                        Cerrar
                    </Button>,
                ]}
                width={780}
                style={{ top: 30 }}
            >
                {diaSeleccionado && (
                    <Space orientation="vertical" size="middle" style={{ width: "100%", marginTop: 16 }}>
                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <Card size="small" style={{ background: token.colorBgLayout }}>
                                    <Statistic
                                        title="Total Kilos Cosechados"
                                        value={diaSeleccionado.kilos}
                                        suffix="kg"
                                        valueStyle={{ color: token.colorPrimary, fontWeight: "bold" }}
                                        formatter={(val) => formatNumber(Number(val))}
                                    />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small" style={{ background: token.colorBgLayout }}>
                                    <Statistic
                                        title="Lotes Cosechados"
                                        value={lotesUnicosDia.length}
                                        suffix="lote(s)"
                                    />
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small" style={{ background: token.colorBgLayout }}>
                                    <Statistic
                                        title="Recolectores"
                                        value={trabajadoresUnicosDia.length}
                                        suffix="persona(s)"
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Tabs
                            defaultActiveKey="registros"
                            items={[
                                {
                                    key: "registros",
                                    label: `Registros de Cosecha (${diaSeleccionado.detalles?.length || 0})`,
                                    children: (
                                        <Table
                                            dataSource={diaSeleccionado.detalles || []}
                                            rowKey="id"
                                            pagination={false}
                                            size="small"
                                            columns={[
                                                {
                                                    title: "ID",
                                                    dataIndex: "id",
                                                    key: "id",
                                                    width: 60,
                                                },
                                                {
                                                    title: "Tipo Cosecha",
                                                    dataIndex: "tipoCosecha",
                                                    key: "tipoCosecha",
                                                    render: (t: string) => <Tag color="brown">{t}</Tag>,
                                                },
                                                {
                                                    title: "Varietal",
                                                    dataIndex: "varietal",
                                                    key: "varietal",
                                                    render: (v: string | null) => v || "No especificado",
                                                },
                                                {
                                                    title: "Hectáreas",
                                                    dataIndex: "totalHectareas",
                                                    key: "totalHectareas",
                                                    align: "right",
                                                    render: (h: number) => `${h} ha`,
                                                },
                                                {
                                                    title: "Kilos",
                                                    dataIndex: "kilosCosechados",
                                                    key: "kilosCosechados",
                                                    align: "right",
                                                    render: (k: number) => <strong>{formatNumber(k)} kg</strong>,
                                                },
                                            ]}
                                        />
                                    ),
                                },
                                {
                                    key: "lotes",
                                    label: `Lotes (${lotesUnicosDia.length})`,
                                    children: (
                                        <Table
                                            dataSource={lotesUnicosDia}
                                            rowKey="id"
                                            pagination={false}
                                            size="small"
                                            columns={[
                                                {
                                                    title: "Código Lote",
                                                    dataIndex: "codigo",
                                                    key: "codigo",
                                                    render: (code: string) => <Tag color="green">{code}</Tag>,
                                                },
                                                {
                                                    title: "Nombre",
                                                    dataIndex: "nombre",
                                                    key: "nombre",
                                                    render: (n: string | null) => n || "Sin nombre",
                                                },
                                                {
                                                    title: "Hectáreas",
                                                    dataIndex: "hectareas",
                                                    key: "hectareas",
                                                    align: "right",
                                                    render: (h: number | null) => (h ? `${h} ha` : "-"),
                                                },
                                            ]}
                                        />
                                    ),
                                },
                                {
                                    key: "trabajadores",
                                    label: `Recolectores (${trabajadoresUnicosDia.length})`,
                                    children: (
                                        <Table
                                            dataSource={trabajadoresUnicosDia}
                                            rowKey="id"
                                            pagination={false}
                                            size="small"
                                            columns={[
                                                {
                                                    title: "Nombre Recolector",
                                                    dataIndex: "nombre",
                                                    key: "nombre",
                                                },
                                                {
                                                    title: "DNI",
                                                    dataIndex: "dni",
                                                    key: "dni",
                                                    render: (dni: string) => <Tag>{dni || "-"}</Tag>,
                                                },
                                                {
                                                    title: "Kilos Asignados",
                                                    dataIndex: "kilosAsignados",
                                                    key: "kilosAsignados",
                                                    align: "right",
                                                    render: (k: number | null) => (k ? `${formatNumber(k)} kg` : "-"),
                                                },
                                            ]}
                                        />
                                    ),
                                },
                            ]}
                        />
                    </Space>
                )}
            </Modal>
        </Space>
    );
}