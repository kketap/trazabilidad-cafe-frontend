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
import { EyeOutlined, CoffeeOutlined, ExperimentOutlined, SunOutlined, DollarOutlined, ToolOutlined } from "@ant-design/icons";
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
    getKpisTrazabilidadApi,
    type CosechasReporte,
    type KpisTrazabilidadData,
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

function formatCurrency(value: number): string {
    return `$${value.toLocaleString("es-CL")}`;
}

const emptyReporte: CosechasReporte = {
    porDia: [],
    porMes: [],
    porQuincena: [],
    porTipoCosecha: [],
    porTrabajador: [],
    porLote: [],
};

const emptyTrazabilidad: KpisTrazabilidadData = {
    resumen: {
        totalIngresadoProcesos: 0,
        totalProcesos: 0,
        duracionPromedioHoras: 0,
        totalIngresadoSecado: 0,
        totalResultanteSecado: 0,
        totalMermaSecado: 0,
        porcMermaSecadoPromedio: 0,
        totalKilosEnviadosTrilla: 0,
        totalKilosNetosTrilla: 0,
        totalOrdenesTrilla: 0,
        totalKilosVendidos: 0,
        totalIngresosVentas: 0,
        totalVentas: 0,
    },
    porTipoProceso: [],
    porPerfilSecado: [],
    porCalidadTrilla: [],
};

export default function ReportesPage() {
    const { token } = theme.useToken();

    const [reporte, setReporte] = useState<CosechasReporte>(emptyReporte);
    const [trazabilidad, setTrazabilidad] = useState<KpisTrazabilidadData>(emptyTrazabilidad);
    const [loading, setLoading] = useState(true);
    const [loadingTrazabilidad, setLoadingTrazabilidad] = useState(true);
    const [mesSeleccionado, setMesSeleccionado] = useState<Dayjs | null>(null);

    // Estado del modal de detalles por día (Cosechas)
    const [modalVisible, setModalVisible] = useState(false);
    const [diaSeleccionado, setDiaSeleccionado] = useState<ReportePorDia | null>(null);

    // Estados de modales para Trazabilidad
    const [modalSecadoVisible, setModalSecadoVisible] = useState(false);
    const [secadoSeleccionado, setSecadoSeleccionado] = useState<KpisTrazabilidadData["porPerfilSecado"][0] | null>(null);

    const [modalTrillaVisible, setModalTrillaVisible] = useState(false);
    const [trillaSeleccionada, setTrillaSeleccionada] = useState<KpisTrazabilidadData["porCalidadTrilla"][0] | null>(null);

    const [modalProcesosVisible, setModalProcesosVisible] = useState(false);
    const [procesoSeleccionado, setProcesoSeleccionado] = useState<KpisTrazabilidadData["porTipoProceso"][0] | null>(null);

    useEffect(() => {
        cargarReportes();
    }, []);

    async function cargarReportes() {
        try {
            setLoading(true);
            setLoadingTrazabilidad(true);
            const [dataCosechas, dataTrazabilidad] = await Promise.all([
                getCosechasReporteApi(),
                getKpisTrazabilidadApi(),
            ]);
            setReporte(dataCosechas);
            setTrazabilidad(dataTrazabilidad);
        } catch (error) {
            console.error("Error cargando reportes:", error);
            message.error("No se pudieron cargar todos los datos de reportes.");
        } finally {
            setLoading(false);
            setLoadingTrazabilidad(false);
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

    // Datos procesados para gráficos de Trazabilidad
    const dataSecadoChart = useMemo(() => {
        return trazabilidad.porPerfilSecado.map((p) => ({
            perfil: p.perfil.replace(/_/g, " "),
            Ingresado: p.kilosIngresados,
            Resultante: p.kilosResultantes,
            MermaPorc: p.porcentajeMerma,
        }));
    }, [trazabilidad.porPerfilSecado]);

    const dataProcesosChart = useMemo(() => {
        return trazabilidad.porTipoProceso.map((p) => ({
            tipo: p.tipo.replace(/_/g, " "),
            Kilos: p.kilos,
            HorasPromedio: p.duracionPromedio,
        }));
    }, [trazabilidad.porTipoProceso]);

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
                            <Space
                                orientation="vertical"
                                size="large"
                                style={{ width: "100%" }}
                            >
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} sm={12} lg={6}>
                                        <Card className="report-kpi-card report-kpi-card-coffee">
                                            <Statistic
                                                title="Procesos Húmedos"
                                                value={trazabilidad.resumen.totalIngresadoProcesos}
                                                suffix="kg"
                                                prefix={<ExperimentOutlined />}
                                                formatter={(val) => formatNumber(Number(val))}
                                            />
                                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                                {trazabilidad.resumen.totalProcesos} procesos ({trazabilidad.resumen.duracionPromedioHoras}h prom.)
                                            </Typography.Text>
                                        </Card>
                                    </Col>

                                    <Col xs={24} sm={12} lg={6}>
                                        <Card className="report-kpi-card report-kpi-card-earth">
                                            <Statistic
                                                title="Merma Prom. Secado"
                                                value={trazabilidad.resumen.porcMermaSecadoPromedio}
                                                suffix="%"
                                                prefix={<SunOutlined />}
                                                precision={2}
                                            />
                                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                                Resultante: {formatNumber(trazabilidad.resumen.totalResultanteSecado)} kg
                                            </Typography.Text>
                                        </Card>
                                    </Col>

                                    <Col xs={24} sm={12} lg={6}>
                                        <Card className="report-kpi-card report-kpi-card-plantation">
                                            <Statistic
                                                title="Café Trillado Neto"
                                                value={trazabilidad.resumen.totalKilosNetosTrilla}
                                                suffix="kg"
                                                prefix={<ToolOutlined />}
                                                formatter={(val) => formatNumber(Number(val))}
                                            />
                                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                                {trazabilidad.resumen.totalOrdenesTrilla} órdenes de trilla
                                            </Typography.Text>
                                        </Card>
                                    </Col>

                                    <Col xs={24} sm={12} lg={6}>
                                        <Card className="report-kpi-card report-kpi-card-gold">
                                            <Statistic
                                                title="Ingresos por Ventas"
                                                value={trazabilidad.resumen.totalIngresosVentas}
                                                prefix={<DollarOutlined />}
                                                formatter={(val) => formatCurrency(Number(val))}
                                            />
                                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                                {formatNumber(trazabilidad.resumen.totalKilosVendidos)} kg en {trazabilidad.resumen.totalVentas} ventas
                                            </Typography.Text>
                                        </Card>
                                    </Col>
                                </Row>

                                <Row gutter={[16, 16]}>
                                    <Col xs={24} lg={12}>
                                        <Card
                                            title="Eficiencia por Perfil de Secado (Ingresado vs Resultante)"
                                            variant="borderless"
                                            style={{ borderRadius: 14 }}
                                        >
                                            {loadingTrazabilidad ? (
                                                <Skeleton.Input active style={{ width: "100%", height: 250 }} />
                                            ) : dataSecadoChart.length === 0 ? (
                                                <Empty description="Sin datos de secado" style={{ padding: "40px 0" }} />
                                            ) : (
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <BarChart data={dataSecadoChart}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={token.colorBorder} />
                                                        <XAxis dataKey="perfil" tick={{ fontSize: 12, fill: token.colorTextSecondary }} />
                                                        <YAxis tick={{ fontSize: 12, fill: token.colorTextSecondary }} />
                                                        <RTooltip
                                                            formatter={(val: any, name: any) =>
                                                                name === "MermaPorc" ? `${val}%` : `${formatNumber(Number(val))} kg`
                                                            }
                                                        />
                                                        <Bar dataKey="Ingresado" fill="#8c6d58" radius={[4, 4, 0, 0]} />
                                                        <Bar dataKey="Resultante" fill="#52c41a" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        </Card>
                                    </Col>

                                    <Col xs={24} lg={12}>
                                        <Card
                                            title="Procesos Húmedos por Tipo (Kilos & Duración)"
                                            variant="borderless"
                                            style={{ borderRadius: 14 }}
                                        >
                                            {loadingTrazabilidad ? (
                                                <Skeleton.Input active style={{ width: "100%", height: 250 }} />
                                            ) : dataProcesosChart.length === 0 ? (
                                                <Empty description="Sin datos de procesos húmedos" style={{ padding: "40px 0" }} />
                                            ) : (
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <BarChart data={dataProcesosChart}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={token.colorBorder} />
                                                        <XAxis dataKey="tipo" tick={{ fontSize: 11, fill: token.colorTextSecondary }} />
                                                        <YAxis tick={{ fontSize: 12, fill: token.colorTextSecondary }} />
                                                        <RTooltip
                                                            formatter={(val: any, name: any) =>
                                                                name === "HorasPromedio" ? `${val} hrs` : `${formatNumber(Number(val))} kg`
                                                            }
                                                        />
                                                        <Bar dataKey="Kilos" fill={token.colorPrimary} radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        </Card>
                                    </Col>
                                </Row>

                                <Row gutter={[16, 16]}>
                                    <Col xs={24} lg={8}>
                                        <Card
                                            title="Procesos Húmedos (Detalles)"
                                            variant="borderless"
                                            style={{ borderRadius: 14 }}
                                        >
                                            <Table
                                                dataSource={trazabilidad.porTipoProceso}
                                                rowKey="tipo"
                                                pagination={false}
                                                size="small"
                                                onRow={(record) => ({
                                                    onClick: () => {
                                                        setProcesoSeleccionado(record);
                                                        setModalProcesosVisible(true);
                                                    },
                                                    style: { cursor: "pointer" },
                                                })}
                                                columns={[
                                                    {
                                                        title: "Etapa / Tipo",
                                                        dataIndex: "tipo",
                                                        key: "tipo",
                                                        render: (t: string) => <Tag color="purple">{t.replace(/_/g, " ")}</Tag>,
                                                    },
                                                    {
                                                        title: "Kilos",
                                                        dataIndex: "kilos",
                                                        key: "kilos",
                                                        align: "right",
                                                        render: (k: number) => `${formatNumber(k)} kg`,
                                                    },
                                                    {
                                                        title: "Acción",
                                                        key: "acc",
                                                        align: "center",
                                                        render: (_, record) => (
                                                            <Button
                                                                type="link"
                                                                size="small"
                                                                icon={<EyeOutlined />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setProcesoSeleccionado(record);
                                                                    setModalProcesosVisible(true);
                                                                }}
                                                            />
                                                        ),
                                                    },
                                                ]}
                                            />
                                        </Card>
                                    </Col>

                                    <Col xs={24} lg={8}>
                                        <Card
                                            title="Desglose por Perfil de Secado"
                                            variant="borderless"
                                            style={{ borderRadius: 14 }}
                                        >
                                            <Table
                                                dataSource={trazabilidad.porPerfilSecado}
                                                rowKey="perfil"
                                                pagination={false}
                                                size="small"
                                                onRow={(record) => ({
                                                    onClick: () => {
                                                        setSecadoSeleccionado(record);
                                                        setModalSecadoVisible(true);
                                                    },
                                                    style: { cursor: "pointer" },
                                                })}
                                                columns={[
                                                    {
                                                        title: "Perfil",
                                                        dataIndex: "perfil",
                                                        key: "perfil",
                                                        render: (p: string) => <Tag color="orange">{p.replace(/_/g, " ")}</Tag>,
                                                    },
                                                    {
                                                        title: "Resultante",
                                                        dataIndex: "kilosResultantes",
                                                        key: "kilosResultantes",
                                                        align: "right",
                                                        render: (k: number) => `${formatNumber(k)} kg`,
                                                    },
                                                    {
                                                        title: "% Merma",
                                                        dataIndex: "porcentajeMerma",
                                                        key: "porcentajeMerma",
                                                        align: "right",
                                                        render: (p: number) => <Tag color={p > 20 ? "volcano" : "green"}>{p}%</Tag>,
                                                    },
                                                    {
                                                        title: "Acción",
                                                        key: "acc",
                                                        align: "center",
                                                        render: (_, record) => (
                                                            <Button
                                                                type="link"
                                                                size="small"
                                                                icon={<EyeOutlined />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSecadoSeleccionado(record);
                                                                    setModalSecadoVisible(true);
                                                                }}
                                                            />
                                                        ),
                                                    },
                                                ]}
                                            />
                                        </Card>
                                    </Col>

                                    <Col xs={24} lg={8}>
                                        <Card
                                            title="Desglose por Calidad en Trilla"
                                            variant="borderless"
                                            style={{ borderRadius: 14 }}
                                        >
                                            <Table
                                                dataSource={trazabilidad.porCalidadTrilla}
                                                rowKey="calidad"
                                                pagination={false}
                                                size="small"
                                                onRow={(record) => ({
                                                    onClick: () => {
                                                        setTrillaSeleccionada(record);
                                                        setModalTrillaVisible(true);
                                                    },
                                                    style: { cursor: "pointer" },
                                                })}
                                                columns={[
                                                    {
                                                        title: "Calidad",
                                                        dataIndex: "calidad",
                                                        key: "calidad",
                                                        render: (c: string) => <Tag color="blue">{c}</Tag>,
                                                    },
                                                    {
                                                        title: "Kg Netos",
                                                        dataIndex: "kilosNetos",
                                                        key: "kilosNetos",
                                                        align: "right",
                                                        render: (k: number) => <strong>{formatNumber(k)} kg</strong>,
                                                    },
                                                    {
                                                        title: "Acción",
                                                        key: "acc",
                                                        align: "center",
                                                        render: (_, record) => (
                                                            <Button
                                                                type="link"
                                                                size="small"
                                                                icon={<EyeOutlined />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setTrillaSeleccionada(record);
                                                                    setModalTrillaVisible(true);
                                                                }}
                                                            />
                                                        ),
                                                    },
                                                ]}
                                            />
                                        </Card>
                                    </Col>
                                </Row>
                            </Space>
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

            {/* Modal de Detalle de Secado */}
            <Modal
                title={
                    <Space align="center">
                        <SunOutlined style={{ color: "#fa8c16", fontSize: 20 }} />
                        <span>Detalle de Secado - {secadoSeleccionado?.perfil.replace(/_/g, " ")}</span>
                    </Space>
                }
                open={modalSecadoVisible}
                onCancel={() => setModalSecadoVisible(false)}
                footer={[<Button key="cerrar" onClick={() => setModalSecadoVisible(false)}>Cerrar</Button>]}
                width={780}
            >
                {secadoSeleccionado && (
                    <Table
                        dataSource={secadoSeleccionado.detalles || []}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        style={{ marginTop: 16 }}
                        columns={[
                            { title: "ID", dataIndex: "id", key: "id", width: 50 },
                            { title: "Lote", dataIndex: "loteCodigo", key: "loteCodigo", render: (c: string | null) => (c ? <Tag color="green">{c}</Tag> : "-") },
                            { title: "Fecha Inicio", dataIndex: "fechaInicio", key: "fechaInicio", render: (f: string) => formatDate(f) },
                            { title: "Fecha Fin", dataIndex: "fechaFin", key: "fechaFin", render: (f: string | null) => (f ? formatDate(f) : "-") },
                            { title: "Ingresado", dataIndex: "kilosIngresados", key: "kilosIngresados", align: "right", render: (k: number) => `${formatNumber(k)} kg` },
                            { title: "Resultante", dataIndex: "kilosResultantes", key: "kilosResultantes", align: "right", render: (k: number) => `${formatNumber(k)} kg` },
                            { title: "Merma", dataIndex: "merma", key: "merma", align: "right", render: (m: number) => <Tag color="volcano">{formatNumber(m)} kg</Tag> },
                        ]}
                    />
                )}
            </Modal>

            {/* Modal de Detalle de Trilla */}
            <Modal
                title={
                    <Space align="center">
                        <ToolOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
                        <span>Detalle de Orden de Trilla - Calidad {trillaSeleccionada?.calidad}</span>
                    </Space>
                }
                open={modalTrillaVisible}
                onCancel={() => setModalTrillaVisible(false)}
                footer={[<Button key="cerrar" onClick={() => setModalTrillaVisible(false)}>Cerrar</Button>]}
                width={780}
            >
                {trillaSeleccionada && (
                    <Table
                        dataSource={trillaSeleccionada.detalles || []}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        style={{ marginTop: 16 }}
                        columns={[
                            { title: "Código Trilla", dataIndex: "codigoTrilla", key: "codigoTrilla", render: (c: string) => <Tag color="blue">{c}</Tag> },
                            { title: "Fecha Despacho", dataIndex: "fechaDespacho", key: "fechaDespacho", render: (f: string) => formatDate(f) },
                            { title: "Tipo Saco", dataIndex: "tipoSaco", key: "tipoSaco", render: (s: string | null) => s || "Estándar" },
                            { title: "Kg Enviados", dataIndex: "kilosEnviados", key: "kilosEnviados", align: "right", render: (k: number) => `${formatNumber(k)} kg` },
                            { title: "Kg Netos", dataIndex: "kilosNetos", key: "kilosNetos", align: "right", render: (k: number | null) => (k ? <strong>{formatNumber(k)} kg</strong> : "-") },
                            { title: "Lotes", dataIndex: "lotes", key: "lotes", render: (l: string[]) => l.map((code) => <Tag key={code} color="green">{code}</Tag>) },
                        ]}
                    />
                )}
            </Modal>

            {/* Modal de Detalle de Procesos Húmedos */}
            <Modal
                title={
                    <Space align="center">
                        <ExperimentOutlined style={{ color: "#722ed1", fontSize: 20 }} />
                        <span>Detalle de Procesos Húmedos - {procesoSeleccionado?.tipo.replace(/_/g, " ")}</span>
                    </Space>
                }
                open={modalProcesosVisible}
                onCancel={() => setModalProcesosVisible(false)}
                footer={[<Button key="cerrar" onClick={() => setModalProcesosVisible(false)}>Cerrar</Button>]}
                width={780}
            >
                {procesoSeleccionado && (
                    <Table
                        dataSource={procesoSeleccionado.detalles || []}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        style={{ marginTop: 16 }}
                        columns={[
                            { title: "Código Proceso", dataIndex: "codigo", key: "codigo", render: (c: string) => <Tag color="purple">{c}</Tag> },
                            { title: "Fecha", dataIndex: "fecha", key: "fecha", render: (f: string) => formatDate(f) },
                            { title: "Etapa", dataIndex: "etapa", key: "etapa", render: (e: string | null) => e || "-" },
                            { title: "Duración", dataIndex: "duracionHoras", key: "duracionHoras", align: "right", render: (h: number) => `${h} hrs` },
                            { title: "Kg Ingresados", dataIndex: "kilosIngresados", key: "kilosIngresados", align: "right", render: (k: number) => <strong>{formatNumber(k)} kg</strong> },
                            { title: "Lote", dataIndex: "loteCodigo", key: "loteCodigo", render: (c: string | null) => (c ? <Tag color="green">{c}</Tag> : "-") },
                        ]}
                    />
                )}
            </Modal>
        </Space>
    );
}