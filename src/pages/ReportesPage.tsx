import { Button, Card, Col, Row, Space, Typography } from "antd";
import { DownloadOutlined, FilePdfOutlined } from "@ant-design/icons";

export default function ReportesPage() {
    return (
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
            <Typography.Title level={2} style={{ margin: 0 }}>
                Reportes y Estadísticas
            </Typography.Title>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                    <Card title="Descarga de Datos">
                        <Space orientation="vertical" style={{ width: "100%" }}>
                            <Button icon={<DownloadOutlined />} block>
                                Exportar Cosechas (CSV)
                            </Button>
                            <Button icon={<FilePdfOutlined />} block>
                                Exportar Facturación (PDF)
                            </Button>
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title="Rendimiento de Cosechas (Gráfico)" style={{ minHeight: 170 }} />
                </Col>

                <Col xs={24} lg={8}>
                    <Card title="Distribución de Mermas" style={{ minHeight: 170 }} />
                </Col>
            </Row>
        </Space>
    );
}
