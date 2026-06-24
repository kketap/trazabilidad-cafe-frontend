// src/pages/configuracion/ConfiguracionPage.tsx
import { Button, Card, Col, Form, Input, Row, message } from "antd";

export default function ConfiguracionPage() {
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();

    const handleProfileFinish = (values: { nombreUsuario: string }) => {
        message.success(`Perfil de ${values.nombreUsuario} guardado correctamente.`);
    };

    const handlePasswordFinish = (values: {
        contrasenaActual: string;
        nuevaContrasena: string;
        confirmarContrasena: string;
    }) => {
        if (values.nuevaContrasena !== values.confirmarContrasena) {
            passwordForm.setFields([
                {
                    name: "confirmarContrasena",
                    errors: ["Las contraseñas nuevas no coinciden."],
                },
            ]);
            return;
        }

        message.success("Contraseña actualizada correctamente.");
        passwordForm.resetFields();
    };

    return (
        <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
                <Card title="Perfil de Usuario" bordered={false}>
                    <Form
                        form={profileForm}
                        layout="vertical"
                        onFinish={handleProfileFinish}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Nombre de Usuario"
                            name="nombreUsuario"
                            rules={[{ required: true, message: "Ingresa tu nombre de usuario." }]}
                        >
                            <Input placeholder="Ej: juan.perez" />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Guardar Perfil
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Col>

            <Col xs={24} lg={12}>
                <Card title="Seguridad" bordered={false}>
                    <Form
                        form={passwordForm}
                        layout="vertical"
                        onFinish={handlePasswordFinish}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Contraseña Actual"
                            name="contrasenaActual"
                            rules={[{ required: true, message: "Ingresa tu contraseña actual." }]}
                        >
                            <Input.Password placeholder="Contraseña actual" />
                        </Form.Item>

                        <Form.Item
                            label="Nueva Contraseña"
                            name="nuevaContrasena"
                            rules={[{ required: true, message: "Ingresa una nueva contraseña." }]}
                        >
                            <Input.Password placeholder="Nueva contraseña" />
                        </Form.Item>

                        <Form.Item
                            label="Confirmar Nueva Contraseña"
                            name="confirmarContrasena"
                            rules={[{ required: true, message: "Confirma la nueva contraseña." }]}
                        >
                            <Input.Password placeholder="Confirmar nueva contraseña" />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Actualizar Contraseña
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Col>
        </Row>
    );
}
