// src/pages/trazabilidad/TrazabilidadPage.tsx
import { Button, Card, Col, Row, Space, Statistic, Table, Typography } from "antd";
import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import type { ColumnsType } from "antd/es/table";
import CrearProcesoModal, { type ProcesoFormValues } from "../../components/trazabilidad-modals/CrearProcesoModal";

type ProcesoTrazabilidad = {
    id: string;
    fecha: string;
    loteOrigen: string;
    etapa: string;
    kilosIngresados: number;
    kilosResultantes: number;
    porcentajeMerma: number;
};

const MOCK_TRAZABILIDAD: ProcesoTrazabilidad[] = [
    {
        id: "1",
        fecha: "2026-06-11",
        loteOrigen: "COSECHA-2026-001",
        etapa: "Secado",
        kilosIngresados: 180,
        kilosResultantes: 145,
        porcentajeMerma: 19.44,
    },
    {
        id: "2",
        fecha: "2026-06-15",
        loteOrigen: "COSECHA-2026-002",
        etapa: "Trilla",
        kilosIngresados: 260,
        kilosResultantes: 208,
        porcentajeMerma: 20,
    },
    {
        id: "3",
        fecha: "2026-06-21",
        loteOrigen: "COSECHA-2026-003",
        etapa: "Clasificación",
        kilosIngresados: 95,
        kilosResultantes: 82,
        porcentajeMerma: 13.68,
    },
];

export default function TrazabilidadPage() {
    const [procesos, setProcesos] = useState<ProcesoTrazabilidad[]>(MOCK_TRAZABILIDAD);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleRegister = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = (values: ProcesoFormValues) => {
        const nuevoProceso: ProcesoTrazabilidad = {
            id: Date.now().toString(),
            fecha: values.fecha.format("YYYY-MM-DD"),
            loteOrigen: values.loteOrigen,
            etapa: values.etapa,
            kilosIngresados: values.kilosIngresados,
            kilosResultantes: values.kilosResultantes,
            porcentajeMerma: values.porcentajeMerma,
        };

        setProcesos((currentProcesos) => [...currentProcesos, nuevoProceso]);
        setIsModalOpen(false);
    };

    const handleView = (_proceso: ProcesoTrazabilidad) => {
        // TODO: implementar vista detalle de proceso.
    };

    const mermaPromedio = procesos.length > 0
        ? procesos.reduce((total, proceso) => total + proceso.porcentajeMerma, 0) / procesos.length
        : 0;
    const totalIngresado = procesos.reduce((total, proceso) => total + proceso.kilosIngresados, 0);
    const totalResultante = procesos.reduce((total, proceso) => total + proceso.kilosResultantes, 0);

    const columns: ColumnsType<ProcesoTrazabilidad> = [
        {
            title: "Fecha",
            dataIndex: "fecha",
            key: "fecha",
        },
        {
            title: "Lote Origen",
            dataIndex: "loteOrigen",
            key: "loteOrigen",
        },
        {
            title: "Etapa",
            dataIndex: "etapa",
            key: "etapa",
        },
        {
            title: "Kilos Ingresados",
            dataIndex: "kilosIngresados",
            key: "kilosIngresados",
            render: (kilosIngresados: number) => kilosIngresados.toLocaleString("es-CL"),
        },
        {
            title: "Kilos Resultantes",
            dataIndex: "kilosResultantes",
            key: "kilosResultantes",
            render: (kilosResultantes: number) => kilosResultantes.toLocaleString("es-CL"),
        },
        {
            title: "% Merma",
            dataIndex: "porcentajeMerma",
            key: "porcentajeMerma",
            render: (porcentajeMerma: number) => `${porcentajeMerma.toLocaleString("es-CL")}%`,
        },
        {
            title: "Acciones",
            key: "acciones",
            render: (_, record) => (
                <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)} />
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
                    <Typography.Title level={2} style={{ margin: 0 }}>
                        Control de Trazabilidad
                    </Typography.Title>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleRegister}>
                        Registrar Proceso
                    </Button>
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                        <Card hoverable>
                            <Statistic
                                title="Merma Promedio"
                                value={mermaPromedio}
                                suffix="%"
                                precision={2}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card hoverable>
                            <Statistic
                                title="Total Ingresado (Kg)"
                                value={totalIngresado}
                                suffix="kg"
                                formatter={(value) => Number(value).toLocaleString("es-CL")}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card hoverable>
                            <Statistic
                                title="Total Resultante (Kg)"
                                value={totalResultante}
                                suffix="kg"
                                formatter={(value) => Number(value).toLocaleString("es-CL")}
                            />
                        </Card>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={procesos}
                    rowKey="id"
                    bordered
                    pagination={false}
                />
            </Space>

            <CrearProcesoModal
                open={isModalOpen}
                onClose={handleCancel}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
