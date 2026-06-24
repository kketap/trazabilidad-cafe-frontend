// src/pages/cosechas/CosechasPage.tsx
import { useState } from "react";
import { Button, Card, Col, Row, Space, Statistic, Table, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import CrearCosechaModal, { type CosechaFormValues } from "../../components/cosechas-modals/CrearCosechaModal";

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

    // Abre el modal al hacer clic en "Registrar Cosecha".
    const showModal = () => {
        setIsModalVisible(true);
    };

    // Cierra el modal.
    const handleCancel = () => {
        setIsModalVisible(false);
    };

    // Se ejecuta cuando el formulario es válido; agrega la nueva cosecha al estado local.
    const handleSubmit = (values: CosechaFormValues) => {
        const nuevaCosecha: Cosecha = {
            id: Date.now().toString(),
            fecha: values.fecha.format("YYYY-MM-DD"),
            kilosCosechados: values.kilosCosechados,
            cantidadCosechadores: values.cantidadCosechadores,
            lotes: values.lotes,
            totalHectareas: values.totalHectareas,
            tipoCosecha: values.tipoCosecha,
        };

        setCosechas((currentCosechas) => [...currentCosechas, nuevaCosecha]);
        setIsModalVisible(false);
    };

    // Placeholder para la edición de cosechas.
    const handleEdit = (_cosecha: Cosecha) => {
        // TODO: implementar edición de cosecha.
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

            <CrearCosechaModal
                open={isModalVisible}
                onClose={handleCancel}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
