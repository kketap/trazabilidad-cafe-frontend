// src/components/secciones-modals/SeccionModal.tsx
import { useEffect } from "react";
import { Button, Col, ColorPicker, Form, Input, Modal, Row, Space } from "antd";
import type { Color } from "antd/es/color-picker";

import type { SeccionCosecha, CreateSeccionDto } from "../../pages/secciones/secciones.api";

export type SeccionFormValues = {
    titulo: string;
    descripcion?: string;
    color: Color;
};

type SeccionModalProps = {
    open: boolean;
    editingSeccion: SeccionCosecha | null;
    saving: boolean;
    onCancel: () => void;
    onFinish: (values: CreateSeccionDto) => Promise<void> | void;
};

export default function SeccionModal({
    open,
    editingSeccion,
    saving,
    onCancel,
    onFinish,
}: SeccionModalProps) {
    const [form] = Form.useForm<SeccionFormValues>();

    useEffect(() => {
        if (open && editingSeccion) {
            form.setFieldsValue({
                titulo: editingSeccion.titulo,
                descripcion: editingSeccion.descripcion ?? undefined,
                color: editingSeccion.color as unknown as Color,
            });
        } else if (open) {
            form.resetFields();
        }
    }, [open, editingSeccion, form]);

    function handleFinish(values: SeccionFormValues) {
        const payload: CreateSeccionDto = {
            titulo: values.titulo,
            descripcion: values.descripcion || null,
            color: typeof values.color === "string"
                ? values.color
                : (values.color as Color).toHexString(),
        };
        onFinish(payload);
    }

    return (
        <Modal
            title={editingSeccion ? "Editar Sección" : "Nueva Sección"}
            open={open}
            onCancel={onCancel}
            footer={null}
            destroyOnHidden
            centered
            width="min(560px, 95vw)"
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                autoComplete="off"
            >
                <Row gutter={[16, 0]}>
                    <Col xs={24}>
                        <Form.Item
                            label="Título"
                            name="titulo"
                            rules={[{ required: true, message: "El título es obligatorio" }]}
                        >
                            <Input placeholder="Ej: Sección Norte" />
                        </Form.Item>
                    </Col>

                    <Col xs={24}>
                        <Form.Item
                            label="Descripción"
                            name="descripcion"
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="Descripción opcional de la sección"
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24}>
                        <Form.Item
                            label="Color"
                            name="color"
                            rules={[{ required: true, message: "El color es obligatorio" }]}
                            getValueFromEvent={(e) => e.color}
                            getValueProps={(value) => ({
                                value: value as unknown as Color,
                            })}
                        >
                            <ColorPicker
                                showText
                                format="hex"
                                defaultFormat="hex"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item style={{ marginBottom: 0, paddingTop: 8 }}>
                    <Space>
                        <Button type="primary" htmlType="submit" loading={saving}>
                            {editingSeccion ? "Actualizar" : "Guardar"}
                        </Button>
                        <Button onClick={onCancel}>
                            Cancelar
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
}
