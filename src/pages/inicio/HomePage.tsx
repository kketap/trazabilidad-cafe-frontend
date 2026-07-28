// src/pages/inicio/HomePage.tsx
import { useEffect, useState, type ReactNode } from "react";
import {
    Button,
    Card,
    Col,
    Grid,
    message,
    Row,
    Skeleton,
    Space,
    Statistic,
    Tag,
    Typography,
} from "antd";
import {
    AppstoreOutlined,
    BarChartOutlined,
    EnvironmentOutlined,
    FileExcelOutlined,
    HomeOutlined,
    PartitionOutlined,
    PlusOutlined,
    RiseOutlined,
    SafetyCertificateOutlined,
    ShopOutlined,
    TrophyOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import {
    getHomeResumen,
    type HomeResumen,
} from "./home.api";

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const emptyStats = {
    totalCosechas: 0,
    kilosTotales: 0,
    totalHectareas: 0,
    rendimiento: 0,
    totalProcesos: 0,
    totalIngresado: 0,
    totalResultante: 0,
    mermaPromedio: 0,
};

const initialResumen: HomeResumen = {
    general: emptyStats,
    mesActual: emptyStats,
};

type MetricCardProps = {
    loading: boolean;
    title: string;
    value: number;
    suffix?: string;
    prefix?: ReactNode;
    precision?: number;
    formatter?: (value: string | number) => ReactNode;
};

function MetricCard({
    loading,
    title,
    value,
    suffix,
    prefix,
    precision,
    formatter,
}: MetricCardProps) {
    return (
        <Card
            variant="borderless"
            style={{
                borderRadius: 14,
                minHeight: 116,
            }}
        >
            {loading ? (
                <Space direction="vertical" style={{ width: "100%" }}>
                    <Skeleton.Input active size="small" style={{ width: 160 }} />
                    <Skeleton.Input active size="large" style={{ width: 120 }} />
                </Space>
            ) : (
                <Statistic
                    title={title}
                    value={value}
                    suffix={suffix}
                    prefix={prefix}
                    precision={precision}
                    formatter={formatter}
                />
            )}
        </Card>
    );
}

export default function HomePage() {
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const navigate = useNavigate();

    const [resumen, setResumen] = useState<HomeResumen>(initialResumen);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarResumen();
    }, []);

    async function cargarResumen() {
        try {
            setLoading(true);
            const data = await getHomeResumen();
            setResumen(data);
        } catch (error) {
            console.error("Error cargando resumen del home:", error);
            message.error("No se pudieron cargar los indicadores de producción.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ width: "100%" }}>
            <Card
                style={{
                    borderRadius: 18,
                    marginBottom: 24,
                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                }}
                styles={{ body: { padding: isMobile ? 20 : 36 } }}
            >
                <Row gutter={[24, 24]} align="middle">
                    <Col xs={24} lg={16}>
                        <Space
                            orientation="vertical"
                            size={14}
                            style={{
                                width: "100%",
                                textAlign: isMobile ? "center" : "left",
                            }}
                        >
                            <Tag
                                color="green"
                                style={{
                                    alignSelf: isMobile ? "center" : "flex-start",
                                }}
                            >
                                Gestión de producción cafetera
                            </Tag>

                            <Title
                                level={1}
                                style={{
                                    margin: 0,
                                    fontSize: isMobile ? 32 : 48,
                                    lineHeight: 1.12,
                                }}
                            >
                                Producción y trazabilidad de Fundos Noche
                            </Title>

                            <Paragraph
                                style={{
                                    fontSize: isMobile ? 15 : 18,
                                    marginBottom: 0,
                                    maxWidth: 980,
                                }}
                            >
                                Sistema para registrar lotes, cosechas, procesos productivos,
                                mermas y reportes de producción, manteniendo el seguimiento del
                                café desde el campo hasta sus etapas de transformación.
                            </Paragraph>

                            <Space
                                wrap
                                size={[12, 12]}
                                style={{
                                    justifyContent: isMobile ? "center" : "flex-start",
                                    width: "100%",
                                }}
                            >
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => navigate("/cosechas")}
                                >
                                    Registrar cosecha
                                </Button>

                                <Button
                                    icon={<AppstoreOutlined />}
                                    onClick={() => navigate("/lotes")}
                                >
                                    Administrar lotes
                                </Button>

                                <Button
                                    icon={<PartitionOutlined />}
                                    onClick={() => navigate("/trazabilidad")}
                                >
                                    Ver trazabilidad
                                </Button>
                            </Space>
                        </Space>
                    </Col>

                    <Col xs={24} lg={8}>
                        <Card
                            style={{
                                background: "#111827",
                                color: "white",
                                borderRadius: 16,
                                maxWidth: isMobile ? "100%" : 420,
                                marginLeft: isMobile ? 0 : "auto",
                            }}
                            styles={{ body: { padding: isMobile ? 24 : 32 } }}
                        >
                            <Space
                                orientation="vertical"
                                size={12}
                                style={{
                                    width: "100%",
                                    textAlign: "center",
                                }}
                            >
                                <Text style={{ color: "#d1d5db" }}>
                                    Estado de producción
                                </Text>

                                <Title
                                    level={3}
                                    style={{
                                        color: "white",
                                        margin: 0,
                                        fontSize: isMobile ? 26 : 32,
                                    }}
                                >
                                    Operación activa
                                </Title>

                                <Paragraph
                                    style={{
                                        color: "#d1d5db",
                                        marginBottom: 0,
                                        fontSize: 16,
                                        lineHeight: 1.7,
                                    }}
                                >
                                    Los módulos de lotes, cosechas y trazabilidad están
                                    disponibles para registrar y controlar la producción de café.
                                </Paragraph>
                            </Space>
                        </Card>
                    </Col>
                </Row>
            </Card>

            <Title level={3} style={{ marginTop: 24 }}>
                Producción del mes actual
            </Title>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} md={12}>
                    <Card
                        variant="borderless"
                        style={{
                            borderRadius: 14,
                            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                            color: "#ffffff",
                        }}
                    >
                        <Space size={16} align="center">
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: "50%",
                                    background: "rgba(234, 179, 8, 0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 24,
                                    color: "#eab308",
                                }}
                            >
                                <TrophyOutlined />
                            </div>
                            <div>
                                <Text style={{ color: "#94a3b8", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                    Mejor Trabajador del Mes
                                </Text>
                                <Title level={4} style={{ color: "#ffffff", margin: "2px 0 0 0" }}>
                                    {resumen.mesActual.mejorTrabajador?.nombre ?? "Sin datos suficientes"}
                                </Title>
                                {resumen.mesActual.mejorTrabajador && (
                                    <Text style={{ color: "#38bdf8", fontWeight: 600 }}>
                                        {resumen.mesActual.mejorTrabajador.kilos.toLocaleString("es-CL")} kg cosechados
                                    </Text>
                                )}
                            </div>
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card
                        variant="borderless"
                        style={{
                            borderRadius: 14,
                            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                            color: "#ffffff",
                        }}
                    >
                        <Space size={16} align="center">
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: "50%",
                                    background: "rgba(34, 197, 94, 0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 24,
                                    color: "#22c55e",
                                }}
                            >
                                <EnvironmentOutlined />
                            </div>
                            <div>
                                <Text style={{ color: "#94a3b8", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                    Lote Más Productivo (Mes)
                                </Text>
                                <Title level={4} style={{ color: "#ffffff", margin: "2px 0 0 0" }}>
                                    {resumen.mesActual.mejorLote
                                        ? (resumen.mesActual.mejorLote.nombre
                                            ? `${resumen.mesActual.mejorLote.codigo} - ${resumen.mesActual.mejorLote.nombre}`
                                            : resumen.mesActual.mejorLote.codigo)
                                        : "Sin datos suficientes"}
                                </Title>
                                {resumen.mesActual.mejorLote && (
                                    <Text style={{ color: "#4ade80", fontWeight: 600 }}>
                                        {resumen.mesActual.mejorLote.kilos.toLocaleString("es-CL")} kg recolectados
                                    </Text>
                                )}
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} xl={6}>
                    <MetricCard
                        loading={loading}
                        title="Cosechas del mes"
                        value={resumen.mesActual.totalCosechas}
                        prefix={<HomeOutlined />}
                    />
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <MetricCard
                        loading={loading}
                        title="Kg cosechados del mes"
                        value={resumen.mesActual.kilosTotales}
                        suffix="kg"
                        prefix={<BarChartOutlined />}
                        formatter={(value) => Number(value).toLocaleString("es-CL")}
                    />
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <MetricCard
                        loading={loading}
                        title="Procesos registrados"
                        value={resumen.mesActual.totalProcesos}
                        prefix={<PartitionOutlined />}
                    />
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <MetricCard
                        loading={loading}
                        title="Merma promedio"
                        value={resumen.mesActual.mermaPromedio}
                        suffix="%"
                        precision={2}
                        prefix={<RiseOutlined />}
                    />
                </Col>
            </Row>

            <Title level={3} style={{ marginTop: 8 }}>
                Resumen acumulado
            </Title>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} xl={6}>
                    <MetricCard
                        loading={loading}
                        title="Cosechas registradas"
                        value={resumen.general.totalCosechas}
                        prefix={<ShopOutlined />}
                    />
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <MetricCard
                        loading={loading}
                        title="Kg cosechados acumulados"
                        value={resumen.general.kilosTotales}
                        suffix="kg"
                        prefix={<BarChartOutlined />}
                        formatter={(value) => Number(value).toLocaleString("es-CL")}
                    />
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <MetricCard
                        loading={loading}
                        title="Hectáreas cosechadas"
                        value={resumen.general.totalHectareas}
                        suffix="ha"
                        precision={2}
                        prefix={<AppstoreOutlined />}
                    />
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <MetricCard
                        loading={loading}
                        title="Rendimiento promedio"
                        value={resumen.general.rendimiento}
                        suffix="kg/ha"
                        precision={2}
                        prefix={<RiseOutlined />}
                    />
                </Col>
            </Row>

            <Title level={3} style={{ marginTop: 8 }}>
                Módulos de gestión
            </Title>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                    <Card
                        title="Lotes"
                        extra={<Tag color="gold">Campo</Tag>}
                        style={{ height: "100%", borderRadius: 14 }}
                    >
                        <Paragraph>
                            Administración de los lotes productivos, sus hectáreas,
                            ubicación, estado y observaciones relevantes para la cosecha.
                        </Paragraph>

                        <Button block onClick={() => navigate("/lotes")}>
                            Gestionar lotes
                        </Button>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card
                        title="Cosechas"
                        extra={<Tag color="blue">Producción</Tag>}
                        style={{ height: "100%", borderRadius: 14 }}
                    >
                        <Paragraph>
                            Registro de fechas de cosecha, kilos recolectados, cantidad de
                            cosechadores, tipo de cosecha y lotes asociados.
                        </Paragraph>

                        <Button block onClick={() => navigate("/cosechas")}>
                            Registrar cosecha
                        </Button>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card
                        title="Trazabilidad"
                        extra={<Tag color="purple">Seguimiento</Tag>}
                        style={{ height: "100%", borderRadius: 14 }}
                    >
                        <Paragraph>
                            Control de procesos como despulpado, lavado, secado, trilla,
                            kilos ingresados, kilos resultantes y porcentaje de merma.
                        </Paragraph>

                        <Button block onClick={() => navigate("/trazabilidad")}>
                            Ver procesos
                        </Button>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} lg={8}>
                    <Card
                        title="Clientes"
                        extra={<Tag color="cyan">Comercial</Tag>}
                        style={{ height: "100%", borderRadius: 14 }}
                    >
                        <Paragraph>
                            Registro de clientes vinculados a ventas, salidas de café,
                            facturación y seguimiento comercial de la producción.
                        </Paragraph>

                        <Button block onClick={() => navigate("/clientes")}>
                            Ver clientes
                        </Button>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card
                        title="Facturación"
                        extra={<Tag color="orange">Ventas</Tag>}
                        style={{ height: "100%", borderRadius: 14 }}
                    >
                        <Paragraph>
                            Módulo preparado para asociar ventas, documentos, montos,
                            estados de pago y movimientos comerciales del café.
                        </Paragraph>

                        <Button block onClick={() => navigate("/facturacion")}>
                            Ir a facturación
                        </Button>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card
                        title="Reportes"
                        extra={<Tag color="green">Análisis</Tag>}
                        style={{ height: "100%", borderRadius: 14 }}
                    >
                        <Paragraph>
                            Consulta de indicadores de producción, rendimiento por lote,
                            mermas, kilos procesados y datos acumulados del sistema.
                        </Paragraph>

                        <Button
                            block
                            icon={<FileExcelOutlined />}
                            onClick={() => navigate("/reportes")}
                        >
                            Ver reportes
                        </Button>
                    </Card>
                </Col>
            </Row>

            <Card
                style={{
                    marginTop: 24,
                    borderRadius: 16,
                }}
            >
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={4}>
                        <div
                            style={{
                                textAlign: isMobile ? "center" : "left",
                            }}
                        >
                            <SafetyCertificateOutlined
                                style={{ fontSize: 42, color: "#c4b795" }}
                            />
                        </div>
                    </Col>

                    <Col xs={24} md={20}>
                        <Title
                            level={4}
                            style={{
                                marginTop: 0,
                                textAlign: isMobile ? "center" : "left",
                            }}
                        >
                            Gestión productiva basada en datos
                        </Title>

                        <Paragraph
                            style={{
                                marginBottom: 0,
                                textAlign: isMobile ? "center" : "left",
                            }}
                        >
                            Fundos Noche puede mantener un control ordenado de su producción,
                            relacionando lotes, cosechas y procesos para obtener información
                            clara sobre rendimiento, mermas y evolución productiva.
                        </Paragraph>
                    </Col>
                </Row>
            </Card>
        </div>
    );
}