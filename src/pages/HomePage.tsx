import {
    Button,
    Card,
    Col,
    Grid,
    Row,
    Space,
    Statistic,
    Tag,
    Typography,
} from "antd";
import {
    BarChartOutlined,
    FileExcelOutlined,
    HomeOutlined,
    PartitionOutlined,
    PlusOutlined,
    RiseOutlined,
    SafetyCertificateOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

export default function HomePage() {
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    return (
        <div style={{ width: "100%" }}>
            <Card
                style={{
                    borderRadius: 18,
                    marginBottom: 24,
                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                }}
                bodyStyle={{
                    padding: isMobile ? 20 : 36,
                }}
            >
                <Row gutter={[24, 24]} align="middle">
                    <Col xs={24} lg={16}>
                        <Space
                            direction="vertical"
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
                                Sistema de gestión agrícola
                            </Tag>

                            <Title
                                level={1}
                                style={{
                                    margin: 0,
                                    fontSize: isMobile ? 32 : 48,
                                    lineHeight: 1.12,
                                }}
                            >
                                Sistema de Trazabilidad de Café
                            </Title>

                            <Paragraph
                                style={{
                                    fontSize: isMobile ? 15 : 18,
                                    marginBottom: 0,
                                    maxWidth: 980,
                                }}
                            >
                                Plataforma para registrar cosechas, controlar procesos de
                                beneficio, trilla, ventas, mermas y saldos disponibles.
                            </Paragraph>

                            <Space
                                wrap
                                size={[12, 12]}
                                style={{
                                    justifyContent: isMobile ? "center" : "flex-start",
                                    width: "100%",
                                }}
                            >
                                <Button type="primary" icon={<PlusOutlined />} disabled>
                                    Nueva cosecha
                                </Button>

                                <Button icon={<PartitionOutlined />} disabled>
                                    Ver trazabilidad
                                </Button>

                                <Button icon={<FileExcelOutlined />} disabled>
                                    Generar reporte
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
                            bodyStyle={{
                                padding: isMobile ? 24 : 32,
                            }}
                        >
                            <Space
                                direction="vertical"
                                size={12}
                                style={{
                                    width: "100%",
                                    textAlign: "center",
                                }}
                            >
                                <Text style={{ color: "#d1d5db" }}>Estado general</Text>

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
                                    Los módulos principales del sistema se encuentran preparados
                                    para el registro y seguimiento de la producción.
                                </Paragraph>
                            </Space>
                        </Card>
                    </Col>
                </Row>
            </Card>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} xl={6}>
                    <Card bordered={false} style={{ borderRadius: 14 }}>
                        <Statistic
                            title="Cosechas registradas"
                            value={0}
                            prefix={<HomeOutlined />}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card bordered={false} style={{ borderRadius: 14 }}>
                        <Statistic
                            title="Kg cosechados"
                            value={0}
                            suffix="kg"
                            prefix={<BarChartOutlined />}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card bordered={false} style={{ borderRadius: 14 }}>
                        <Statistic
                            title="Procesos controlados"
                            value={0}
                            prefix={<PartitionOutlined />}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6}>
                    <Card bordered={false} style={{ borderRadius: 14 }}>
                        <Statistic
                            title="Rendimiento promedio"
                            value={0}
                            suffix="%"
                            prefix={<RiseOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                    <Card
                        title="Cosechas"
                        extra={<Tag color="blue">Registro</Tag>}
                        style={{ height: "100%", borderRadius: 14 }}
                    >
                        <Paragraph>
                            Registro diario de cosecha por fecha, lote, variedad, tipo de
                            cosecha, hectáreas, cosechadores y kilos cosechados.
                        </Paragraph>

                        <Button disabled block>
                            Ingresar cosecha
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
                            Control del flujo desde el ingreso a beneficio, café pergamino,
                            trilla, calidades obtenidas, ventas, mermas y saldos.
                        </Paragraph>

                        <Button disabled block>
                            Ver seguimiento
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
                            Consulta de indicadores de producción, rendimientos, ventas,
                            mermas y disponibilidad de café por etapa.
                        </Paragraph>

                        <Button disabled block>
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
                                style={{ fontSize: 42, color: "#1677ff" }}
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
                            Control integral de la producción
                        </Title>

                        <Paragraph
                            style={{
                                marginBottom: 0,
                                textAlign: isMobile ? "center" : "left",
                            }}
                        >
                            El sistema permite mantener un registro ordenado de cada etapa del
                            proceso productivo, facilitando la consulta de información, el
                            seguimiento de lotes y la toma de decisiones basada en datos.
                        </Paragraph>
                    </Col>
                </Row>
            </Card>
        </div>
    );
}