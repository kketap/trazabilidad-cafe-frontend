// src/pages/cosechas/CosechasPage.tsx
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Typography,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";

import {
    createCosecha,
    deleteCosecha,
    getCosechas,
    updateCosecha,
    type Cosecha,
    type CreateCosechaDto,
} from "./cosechas.api";

type CosechaFormValues = {
    fecha: Dayjs;
    kilosCosechados: number;
    cantidadCosechadores: number;
    lotes: string;
    totalHectareas: number;
    tipoCosecha: string;
};

export default function CosechasPage() {
    const [cosechas, setCosechas] = useState<Cosecha[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCosecha, setEditingCosecha] = useState<Cosecha | null>(null);

    const [form] = Form.useForm<CosechaFormValues>();

    useEffect(() => {
        cargarCosechas();
    }, []);

    async function cargarCosechas() {
        try {
            setLoading(true);
            const data = await getCosechas();
            setCosechas(data);
        } catch (error) {
            console.error("Error cargando cosechas:", error);
            message.error("No se pudieron cargar las cosechas.");
        } finally {
            setLoading(false);
        }
    }

    function showModal() {
        setEditingCosecha(null);
        form.resetFields();
        setIsModalVisible(true);
    }

    function handleCancel() {
        setIsModalVisible(false);
        setEditingCosecha(null);
        form.resetFields();
    }

    async function onFinish(values: CosechaFormValues) {
        try {
            setSaving(true);

            const payload: CreateCosechaDto = {
                fecha: values.fecha.format("YYYY-MM-DD"),
                kilosCosechados: values.kilosCosechados,
                cantidadCosechadores: values.cantidadCosechadores,
                lotes: values.lotes,
                totalHectareas: values.totalHectareas,
                tipoCosecha: values.tipoCosecha,
            };

            if (editingCosecha) {
                const cosechaActualizada = await updateCosecha(
                    editingCosecha.id,
                    payload,
                );

                setCosechas((currentCosechas) =>
                    currentCosechas.map((cosecha) =>
                        cosecha.id === editingCosecha.id ? cosechaActualizada : cosecha,
                    ),
                );

                message.success("Cosecha actualizada correctamente.");
            } else {
                const nuevaCosecha = await createCosecha(payload);

                setCosechas((currentCosechas) => [nuevaCosecha, ...currentCosechas]);

                message.success("Cosecha registrada correctamente.");
            }

            setIsModalVisible(false);
            setEditingCosecha(null);
            form.resetFields();
        } catch (error) {
            console.error("Error guardando cosecha:", error);
            message.error("No se pudo guardar la cosecha.");
        } finally {
            setSaving(false);
        }
    }

    function handleEdit(cosecha: Cosecha) {
        setEditingCosecha(cosecha);

        form.setFieldsValue({
            fecha: dayjs(cosecha.fecha),
            kilosCosechados: cosecha.kilosCosechados,
            cantidadCosechadores: cosecha.cantidadCosechadores,
            lotes: cosecha.lotes,
            totalHectareas: cosecha.totalHectareas,
            tipoCosecha: cosecha.tipoCosecha,
        });

        setIsModalVisible(true);
    }

    function handleDelete(id: number) {
        Modal.confirm({
            title: "Eliminar cosecha",
            content:
                "¿Seguro que deseas eliminar esta cosecha? Si tiene procesos de trazabilidad asociados, también podrían eliminarse.",
            okText: "Eliminar",
            cancelText: "Cancelar",
            okButtonProps: {
                danger: true,
            },
            async onOk() {
                try {
                    await deleteCosecha(id);

                    setCosechas((currentCosechas) =>
                        currentCosechas.filter((cosecha) => cosecha.id !== id),
                    );

                    message.success("Cosecha eliminada correctamente.");
                } catch (error) {
                    console.error("Error eliminando cosecha:", error);
                    message.error("No se pudo eliminar la cosecha.");
                }
            },
        });
    }

    const kilosTotales = cosechas.reduce(
        (total, cosecha) => total + cosecha.kilosCosechados,
        0,
    );

    const totalHectareas = cosechas.reduce(
        (total, cosecha) => total + cosecha.totalHectareas,
        0,
    );

    const rendimiento = totalHectareas > 0 ? kilosTotales / totalHectareas : 0;

    const columns: ColumnsType<Cosecha> = [
        {
            title: "Fecha",
            dataIndex: "fecha",
            key: "fecha",
            render: (fecha: string) => fecha.slice(0, 10),
        },
        {
            title: "Kilos Cosechados",
            dataIndex: "kilosCosechados",
            key: "kilosCosechados",
            render: (kilosCosechados: number) =>
                kilosCosechados.toLocaleString("es-CL"),
        },
        {
            title: "Cantidad Cosechadores",
            dataIndex: "cantidadCosechadores",
            key: "cantidadCosechadores",
        },
        {
            title: "Lotes",
            dataIndex: "lotes",
            key: "lotes",
        },
        {
            title: "Total Hectáreas",
            dataIndex: "totalHectareas",
            key: "totalHectareas",
            render: (totalHectareas: number) =>
                totalHectareas.toLocaleString("es-CL"),
        },
        {
            title: "Tipo Cosecha",
            dataIndex: "tipoCosecha",
            key: "tipoCosecha",
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
        <div>
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
                            Cosechas
                        </Typography.Title>

                        <Typography.Text type="secondary">
                            Registro y gestión de las cosechas realizadas.
                        </Typography.Text>
                    </div>

                    <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                        Registrar Cosecha
                    </Button>
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                        <Card hoverable>
                            <Statistic
                                title="Kilos Totales"
                                value={kilosTotales}
                                suffix="kg"
                                formatter={(value) => Number(value).toLocaleString("es-CL")}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} md={8}>
                        <Card hoverable>
                            <Statistic
                                title="Total Hectáreas"
                                value={totalHectareas}
                                suffix="ha"
                                precision={2}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} md={8}>
                        <Card hoverable>
                            <Statistic
                                title="Rendimiento (Kg/Ha)"
                                value={rendimiento}
                                suffix="kg/ha"
                                precision={2}
                            />
                        </Card>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={cosechas}
                    rowKey="id"
                    bordered
                    loading={loading}
                    pagination={false}
                />
            </Space>

            <Modal
                title={editingCosecha ? "Editar Cosecha" : "Registrar Cosecha"}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                destroyOnHidden
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        label="Fecha"
                        name="fecha"
                        rules={[{ required: true, message: "La fecha es obligatoria" }]}
                    >
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item
                        label="Kilos Cosechados"
                        name="kilosCosechados"
                        rules={[
                            {
                                required: true,
                                message: "Los kilos cosechados son obligatorios",
                            },
                        ]}
                    >
                        <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            placeholder="Ej: 150"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Cantidad Cosechadores"
                        name="cantidadCosechadores"
                        rules={[
                            {
                                required: true,
                                message: "La cantidad de cosechadores es obligatoria",
                            },
                        ]}
                    >
                        <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            placeholder="Ej: 4"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Lotes"
                        name="lotes"
                        rules={[{ required: true, message: "Los lotes son obligatorios" }]}
                    >
                        <Input placeholder="Ej: Lote A-01" />
                    </Form.Item>

                    <Form.Item
                        label="Total Hectáreas"
                        name="totalHectareas"
                        rules={[
                            {
                                required: true,
                                message: "El total de hectáreas es obligatorio",
                            },
                        ]}
                    >
                        <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            placeholder="Ej: 2.5"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Tipo Cosecha"
                        name="tipoCosecha"
                        rules={[
                            {
                                required: true,
                                message: "El tipo de cosecha es obligatorio",
                            },
                        ]}
                    >
                        <Select
                            placeholder="Seleccione un tipo de cosecha"
                            options={[
                                { value: "Rebusque", label: "Rebusque" },
                                { value: "Selectiva", label: "Selectiva" },
                                { value: "Manual", label: "Manual" },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={saving}>
                            {editingCosecha ? "Actualizar" : "Guardar"}
                        </Button>

                        <Button style={{ marginLeft: 8 }} onClick={handleCancel}>
                            Cancelar
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}