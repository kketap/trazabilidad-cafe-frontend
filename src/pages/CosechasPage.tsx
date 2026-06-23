import { useState } from "react";
import { Button, Card, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select, Space, Statistic, Table, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";

// Tipo de datos usado en la tabla de cosechas.
type Cosecha = {
    id: string;
    fecha: string;
    kilosCosechados: number;
    cantidadCosechadores: number;
    lotes: string;
    totalHectareas: number;
    tipoCosecha: string;
};

// Tipo de datos capturados por el formulario del modal.
type CosechaFormValues = {
    fecha: Dayjs;
    kilosCosechados: number;
    cantidadCosechadores: number;
    lotes: string;
    totalHectareas: number;
    tipoCosecha: string;
};

// Datos de prueba para mostrar la tabla mientras no haya backend.
const MOCK_COSECHAS: Cosecha[] = [
    {
        id: "1",
        fecha: "2026-06-15",
        kilosCosechados: 180,
        cantidadCosechadores: 4,
        lotes: "Lote A-01",
        totalHectareas: 2.5,
        tipoCosecha: "Rebusque",
    },
    {
        id: "2",
        fecha: "2026-06-18",
        kilosCosechados: 320,
        cantidadCosechadores: 6,
        lotes: "Lote B-03",
        totalHectareas: 4.0,
        tipoCosecha: "Rebusque",
    },
    {
        id: "3",
        fecha: "2026-06-20",
        kilosCosechados: 95,
        cantidadCosechadores: 3,
        lotes: "Lote C-02",
        totalHectareas: 1.8,
        tipoCosecha: "Rebusque",
    },
];

export default function CosechasPage() {
    // Estado local que contiene las cosechas visibles en la tabla.
    const [cosechas, setCosechas] = useState<Cosecha[]>(MOCK_COSECHAS);
    // Estado que controla si el modal de registro está abierto o cerrado.
    const [isModalVisible, setIsModalVisible] = useState(false);
    // Instancia del formulario para manejar validación, envío y limpieza.
    const [form] = Form.useForm<CosechaFormValues>();

    // Abre el modal al hacer clic en "Registrar Cosecha".
    const showModal = () => {
        setIsModalVisible(true);
    };

    // Cierra el modal y limpia los campos del formulario.
    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    // Se ejecuta cuando el formulario es válido; agrega la nueva cosecha al estado local.
    const onFinish = (values: CosechaFormValues) => {
        const nuevaCosecha: Cosecha = {
            id: Date.now().toString(),
            fecha: values.fecha.format("YYYY-MM-DD"),
            kilosCosechados: values.kilosCosechados,
            cantidadCosechadores: values.cantidadCosechadores,
            lotes: values.lotes,
            totalHectareas: values.totalHectareas,
            tipoCosecha: values.tipoCosecha,
        };

        console.log("Datos de la cosecha:", nuevaCosecha);
        setCosechas((currentCosechas) => [...currentCosechas, nuevaCosecha]);
        setIsModalVisible(false);
        form.resetFields();
    };

    // Por ahora solo imprime en consola la cosecha seleccionada para edición.
    const handleEdit = (cosecha: Cosecha) => {
        console.log("Editar cosecha:", cosecha);
    };

    // Elimina visualmente la cosecha filtrándola del estado local.
    const handleDelete = (id: string) => {
        setCosechas((currentCosechas) =>
            currentCosechas.filter((cosecha) => cosecha.id !== id),
        );
    };

    const kilosTotales = cosechas.reduce((total, cosecha) => total + cosecha.kilosCosechados, 0);
    const totalHectareas = cosechas.reduce((total, cosecha) => total + cosecha.totalHectareas, 0);
    const rendimiento = totalHectareas > 0 ? kilosTotales / totalHectareas : 0;

    // Columnas de la tabla: Fecha, Kilos Cosechados, Cantidad Cosechadores, Lotes, Total Hectáreas, Tipo Cosecha y Acciones.
    const columns: ColumnsType<Cosecha> = [
        {
            title: "Fecha",
            dataIndex: "fecha",
            key: "fecha",
        },
        {
            title: "Kilos Cosechados",
            dataIndex: "kilosCosechados",
            key: "kilosCosechados",
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
                    <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
                </Space>
            ),
        },
    ];

    return (
        <div>
            {/* Encabezado de la vista con título, subtítulo y botón para registrar. */}
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

                {/* Tabla que muestra las cosechas almacenadas en el estado local. */}
                <Table
                    columns={columns}
                    dataSource={cosechas}
                    rowKey="id"
                    bordered
                    pagination={false}
                />
            </Space>

            {/* Modal con el formulario para registrar una nueva cosecha. */}
            <Modal
                title="Registrar Cosecha"
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                {/* Formulario con validaciones de campos requeridos. */}
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        label="Fecha"
                        name="fecha"
                        rules={[
                            { required: true, message: "La fecha es obligatoria" },
                        ]}
                    >
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item
                        label="Kilos Cosechados"
                        name="kilosCosechados"
                        rules={[
                            { required: true, message: "Los kilos cosechados son obligatorios" },
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
                            { required: true, message: "La cantidad de cosechadores es obligatoria" },
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
                        rules={[
                            { required: true, message: "Los lotes son obligatorios" },
                        ]}
                    >
                        <Input placeholder="Ej: Lote 1" />
                    </Form.Item>

                    <Form.Item
                        label="Total Hectáreas"
                        name="totalHectareas"
                        rules={[
                            { required: true, message: "El total de hectáreas es obligatorio" },
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
                            { required: true, message: "El tipo de cosecha es obligatorio" },
                        ]}
                    >
                        <Select
                            placeholder="Seleccione un tipo de cosecha"
                            options={[
                                { value: "Rebusque", label: "Rebusque" },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Guardar
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
