// src/pages/lotes/LotesPage.tsx
import { useEffect, useState } from "react";
import {
    Button,
    Card,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Space,
    Switch,
    Table,
    Tag,
    Typography,
    Col,
    Row
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import {
    createLote,
    deleteLote,
    getLotes,
    updateLote,
    type CreateLoteDto,
    type Lote,
} from "./lotes.api";

type LoteFormValues = {
    codigo: string;
    nombre?: string;
    hectareas?: number;
    ubicacion?: string;
    observacion?: string;
    activo: boolean;
};

export default function LotesPage() {
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLote, setEditingLote] = useState<Lote | null>(null);

    const [form] = Form.useForm<LoteFormValues>();

    useEffect(() => {
        cargarLotes();
    }, []);

    async function cargarLotes() {
        try {
            setLoading(true);
            const data = await getLotes();
            setLotes(data);
        } catch (error) {
            console.error("Error cargando lotes:", error);
            message.error("No se pudieron cargar los lotes.");
        } finally {
            setLoading(false);
        }
    }

    function abrirModalCrear() {
        setEditingLote(null);
        form.setFieldsValue({
            activo: true,
        });
        setIsModalOpen(true);
    }

    function cerrarModal() {
        setIsModalOpen(false);
        setEditingLote(null);
        form.resetFields();
    }

    function handleEdit(lote: Lote) {
        setEditingLote(lote);

        form.setFieldsValue({
            codigo: lote.codigo,
            nombre: lote.nombre ?? undefined,
            hectareas: lote.hectareas ?? undefined,
            ubicacion: lote.ubicacion ?? undefined,
            observacion: lote.observacion ?? undefined,
            activo: lote.activo,
        });

        setIsModalOpen(true);
    }

    async function onFinish(values: LoteFormValues) {
        try {
            setSaving(true);

            const payload: CreateLoteDto = {
                codigo: values.codigo,
                nombre: values.nombre,
                hectareas: values.hectareas,
                ubicacion: values.ubicacion,
                observacion: values.observacion,
                activo: values.activo,
            };

            if (editingLote) {
                const loteActualizado = await updateLote(editingLote.id, payload);

                setLotes((current) =>
                    current.map((lote) =>
                        lote.id === editingLote.id ? loteActualizado : lote,
                    ),
                );

                message.success("Lote actualizado correctamente.");
            } else {
                const nuevoLote = await createLote(payload);

                setLotes((current) => [nuevoLote, ...current]);

                message.success("Lote creado correctamente.");
            }

            cerrarModal();
        } catch (error) {
            console.error("Error guardando lote:", error);
            message.error("No se pudo guardar el lote.");
        } finally {
            setSaving(false);
        }
    }

    function handleDelete(id: number) {
        Modal.confirm({
            title: "Eliminar lote",
            content:
                "¿Seguro que deseas eliminar este lote?",
            okText: "Eliminar",
            cancelText: "Cancelar",
            okButtonProps: {
                danger: true,
            },
            async onOk() {
                try {
                    await deleteLote(id);

                    setLotes((current) => current.filter((lote) => lote.id !== id));

                    message.success("Lote eliminado correctamente.");
                } catch (error) {
                    console.error("Error eliminando lote:", error);
                    message.error(
                        "No se pudo eliminar el lote. Puede estar asociado a una cosecha.",
                    );
                }
            },
        });
    }

    const columns: ColumnsType<Lote> = [
        {
            title: "Código",
            dataIndex: "codigo",
            key: "codigo",
            render: (codigo: string) => <strong>{codigo}</strong>,
        },
        {
            title: "Nombre",
            dataIndex: "nombre",
            key: "nombre",
            render: (nombre?: string | null) => nombre || "-",
        },
        {
            title: "Hectáreas",
            dataIndex: "hectareas",
            key: "hectareas",
            render: (hectareas?: number | null) =>
                hectareas !== null && hectareas !== undefined
                    ? hectareas.toLocaleString("es-CL")
                    : "-",
        },
        {
            title: "Ubicación",
            dataIndex: "ubicacion",
            key: "ubicacion",
            render: (ubicacion?: string | null) => ubicacion || "-",
        },
        {
            title: "Estado",
            dataIndex: "activo",
            key: "activo",
            render: (activo: boolean) =>
                activo ? <Tag color="green">Activo</Tag> : <Tag>Inactivo</Tag>,
        },
        {
            title: "Observación",
            dataIndex: "observacion",
            key: "observacion",
            render: (observacion?: string | null) => observacion || "-",
        },
        {
            title: "Acciones",
            key: "acciones",
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />

                    <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                }}
            >
                <div>
                    <Typography.Title level={2} style={{ margin: 0 }}>
                        Lotes
                    </Typography.Title>

                    <Typography.Text type="secondary">
                        Administración de lotes utilizados en las cosechas.
                    </Typography.Text>
                </div>

                <Button type="primary" icon={<PlusOutlined />} onClick={abrirModalCrear}>
                    Crear Lote
                </Button>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={lotes}
                    rowKey="id"
                    loading={loading}
                    bordered
                    pagination={{
                        pageSize: 8,
                    }}
                />
            </Card>

            <Modal
                title={editingLote ? "Editar Lote" : "Crear Lote"}
                open={isModalOpen}
                onCancel={cerrarModal}
                footer={null}
                destroyOnHidden
                centered
                width="min(780px, 95vw)"
                styles={{
                    body: {
                        maxHeight: "70vh",
                        overflowY: "auto",
                        paddingRight: 8,
                    },
                }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                    initialValues={{
                        activo: true,
                    }}
                >
                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Código"
                                name="codigo"
                                rules={[
                                    {
                                        required: true,
                                        message: "El código del lote es obligatorio",
                                    },
                                ]}
                            >
                                <Input placeholder="Ej: A-01" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item label="Nombre" name="nombre">
                                <Input placeholder="Ej: Lote A-01" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item label="Hectáreas" name="hectareas">
                                <InputNumber
                                    style={{ width: "100%" }}
                                    min={0}
                                    placeholder="Ej: 2.5"
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item label="Ubicación" name="ubicacion">
                                <Input placeholder="Ej: Sector norte" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Activo"
                                name="activo"
                                valuePropName="checked"
                            >
                                <Switch checkedChildren="Sí" unCheckedChildren="No" />
                            </Form.Item>
                        </Col>

                        <Col xs={24}>
                            <Form.Item label="Observación" name="observacion">
                                <Input.TextArea
                                    rows={3}
                                    placeholder="Observaciones del lote"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        style={{
                            marginBottom: 0,
                            paddingTop: 8,
                        }}
                    >
                        <Space>
                            <Button type="primary" htmlType="submit" loading={saving}>
                                {editingLote ? "Actualizar" : "Guardar"}
                            </Button>

                            <Button onClick={cerrarModal}>
                                Cancelar
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    );
}