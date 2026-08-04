// src/pages/configuracion/ConfiguracionPage.tsx
import { useEffect, useState } from "react";
import { Button, Card, Col, Form, Input, Row, message } from "antd";
import type { AxiosError } from "axios";
import {
    actualizarPerfilApi,
    cambiarPasswordApi,
    getUserName,
    saveUserName,
} from "../../api/auth";

export default function ConfiguracionPage() {
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);

    useEffect(() => {
        const nombreGuardado = getUserName();

        if (nombreGuardado) {
            profileForm.setFieldsValue({ nombreUsuario: nombreGuardado });
        }
    }, [profileForm]);

    const handleProfileFinish = async (
        values: {
            nombreUsuario: string;
        },
    ) => {
        setLoadingProfile(true);

        try {
            const nombreLimpio =
                values.nombreUsuario.trim();

            await actualizarPerfilApi(nombreLimpio);

            saveUserName(nombreLimpio);

            message.success(
                "Perfil guardado correctamente.",
            );
        } catch (error) {
            const axiosError =
                error as AxiosError<{
                    message?: string;
                }>;

            message.error(
                axiosError.response?.data?.message ??
                "Error al guardar el perfil.",
            );
        } finally {
            setLoadingProfile(false);
        }
    };

    const handlePasswordFinish = async (values: {
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

        setLoadingPassword(true);

        try {
            await cambiarPasswordApi(values.contrasenaActual, values.nuevaContrasena);

            message.success("Contraseña actualizada correctamente.");
            passwordForm.resetFields();
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;

            message.error(axiosError.response?.data?.message ?? "Error al cambiar la contraseña.");
        } finally {
            setLoadingPassword(false);
        }
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
                            <Button type="primary" htmlType="submit" loading={loadingProfile}>
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
                            rules={[
                                {
                                    required: true,
                                    message: "Ingresa una nueva contraseña.",
                                },
                                {
                                    min: 6,
                                    message:
                                        "La nueva contraseña debe tener al menos 6 caracteres.",
                                },
                            ]}
                        >
                        </Form.Item>

                        <Form.Item
                            label="Confirmar Nueva Contraseña"
                            name="confirmarContrasena"
                            dependencies={["nuevaContrasena"]}
                            rules={[
                                {
                                    required: true,
                                    message: "Confirma la nueva contraseña.",
                                },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (
                                            !value ||
                                            getFieldValue("nuevaContrasena") === value
                                        ) {
                                            return Promise.resolve();
                                        }

                                        return Promise.reject(
                                            new Error(
                                                "Las contraseñas nuevas no coinciden.",
                                            ),
                                        );
                                    },
                                }),
                            ]}
                        >
                            <Input.Password placeholder="Confirmar nueva contraseña" />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loadingPassword}>
                                Actualizar Contraseña
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Col>
        </Row>
    );
}
