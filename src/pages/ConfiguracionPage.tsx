import { Button, Card, Form, Input, InputNumber, Space, Tabs, Typography } from "antd";

export default function ConfiguracionPage() {
    const handleEmpresaFinish = (values: unknown) => {
        console.log("Perfil de empresa:", values);
    };

    const handleParametrosFinish = (values: unknown) => {
        console.log("Parámetros del sistema:", values);
    };

    return (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Typography.Title level={2} style={{ margin: 0 }}>
                Configuración
            </Typography.Title>

            <Card>
                <Tabs
                    items={[
                        {
                            key: "perfil-empresa",
                            label: "Perfil de Empresa",
                            children: (
                                <Form layout="vertical" onFinish={handleEmpresaFinish}>
                                    <Form.Item label="Nombre" name="nombre">
                                        <Input placeholder="Nombre de la empresa" />
                                    </Form.Item>

                                    <Form.Item label="RUT" name="rut">
                                        <Input placeholder="RUT de la empresa" />
                                    </Form.Item>

                                    <Form.Item label="Dirección" name="direccion">
                                        <Input placeholder="Dirección comercial" />
                                    </Form.Item>

                                    <Form.Item label="Teléfono" name="telefono">
                                        <Input placeholder="Teléfono de contacto" />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button type="primary" htmlType="submit">
                                            Guardar Cambios
                                        </Button>
                                    </Form.Item>
                                </Form>
                            ),
                        },
                        {
                            key: "parametros-sistema",
                            label: "Parámetros del Sistema",
                            children: (
                                <Form layout="vertical" onFinish={handleParametrosFinish}>
                                    <Form.Item label="Precio Base por Kilo" name="precioBasePorKilo">
                                        <InputNumber
                                            style={{ width: "100%" }}
                                            min={0}
                                            placeholder="Ej: 125000"
                                        />
                                    </Form.Item>

                                    <Form.Item label="Porcentaje de Merma Esperado" name="porcentajeMermaEsperado">
                                        <InputNumber
                                            style={{ width: "100%" }}
                                            min={0}
                                            max={100}
                                            placeholder="Ej: 18"
                                        />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button type="primary" htmlType="submit">
                                            Guardar Cambios
                                        </Button>
                                    </Form.Item>
                                </Form>
                            ),
                        },
                    ]}
                />
            </Card>
        </Space>
    );
}
