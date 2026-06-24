// src/pages/trazabilidad/TrazabilidadPage.tsx
import { useEffect, useState } from "react";
import {
    Button,
    Card,
    Col,
    message,
    Row,
    Space,
    Statistic,
    Table,
    Typography,
} from "antd";
import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import CrearProcesoModal, {
    type ProcesoFormValues,
} from "../../components/trazabilidad-modals/CrearProcesoModal";

import { getCosechas, type Cosecha } from "../cosechas/cosechas.api";

import {
    createProcesoTrazabilidad,
    getProcesosTrazabilidad,
    type CreateProcesoTrazabilidadDto,
    type ProcesoTrazabilidad,
} from "./trazabilidad.api";

export default function TrazabilidadPage() {
    const [procesos, setProcesos] = useState<ProcesoTrazabilidad[]>([]);
    const [cosechas, setCosechas] = useState<Cosecha[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, []);

    async function cargarDatos() {
        try {
            setLoading(true);

            const [procesosData, cosechasData] = await Promise.all([
                getProcesosTrazabilidad(),
                getCosechas(),
            ]);

            setProcesos(procesosData);
            setCosechas(cosechasData);
        } catch (error) {
            console.error("Error cargando trazabilidad:", error);
            message.error("No se pudieron cargar los datos de trazabilidad.");
        } finally {
            setLoading(false);
        }
    }

    function handleRegister() {
        setIsModalOpen(true);
    }

    function handleCancel() {
        setIsModalOpen(false);
    }

    async function onFinish(values: ProcesoFormValues) {
        try {
            setSaving(true);

            const payload: CreateProcesoTrazabilidadDto = {
                fecha: values.fecha.format("YYYY-MM-DD"),
                cosechaId: values.cosechaId,
                etapa: values.etapa,
                kilosIngresados: values.kilosIngresados,
                kilosResultantes: values.kilosResultantes,
            };

            const nuevoProceso = await createProcesoTrazabilidad(payload);

            setProcesos((currentProcesos) => [nuevoProceso, ...currentProcesos]);
            message.success("Proceso registrado correctamente.");

            setIsModalOpen(false);
        } catch (error) {
            console.error("Error registrando proceso:", error);
            message.error("No se pudo registrar el proceso.");
        } finally {
            setSaving(false);
        }
    }

    function handleView(proceso: ProcesoTrazabilidad) {
        console.log("Ver proceso:", proceso);
    }

    const mermaPromedio =
        procesos.length > 0
            ? procesos.reduce(
                (total, proceso) => total + proceso.porcentajeMerma,
                0,
            ) / procesos.length
            : 0;

    const totalIngresado = procesos.reduce(
        (total, proceso) => total + proceso.kilosIngresados,
        0,
    );

    const totalResultante = procesos.reduce(
        (total, proceso) => total + proceso.kilosResultantes,
        0,
    );

    const columns: ColumnsType<ProcesoTrazabilidad> = [
        {
            title: "Fecha",
            dataIndex: "fecha",
            key: "fecha",
            render: (fecha: string) => fecha.slice(0, 10),
        },
        {
            title: "Lote Origen",
            key: "loteOrigen",
            render: (_, record) =>
                record.cosecha?.lotes ?? `Cosecha #${record.cosechaId}`,
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
            render: (kilosIngresados: number) =>
                kilosIngresados.toLocaleString("es-CL"),
        },
        {
            title: "Kilos Resultantes",
            dataIndex: "kilosResultantes",
            key: "kilosResultantes",
            render: (kilosResultantes: number) =>
                kilosResultantes.toLocaleString("es-CL"),
        },
        {
            title: "% Merma",
            dataIndex: "porcentajeMerma",
            key: "porcentajeMerma",
            render: (porcentajeMerma: number) =>
                `${porcentajeMerma.toLocaleString("es-CL", {
                    maximumFractionDigits: 2,
                })}%`,
        },
        {
            title: "Acciones",
            key: "acciones",
            render: (_, record) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => handleView(record)}
                />
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
                    loading={loading}
                    pagination={false}
                />
            </Space>

            <CrearProcesoModal
                open={isModalOpen}
                cosechas={cosechas}
                loading={loading}
                saving={saving}
                onClose={handleCancel}
                onSubmit={onFinish}
            />
        </div>
    );
}