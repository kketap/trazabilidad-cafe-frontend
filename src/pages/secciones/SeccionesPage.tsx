// src/pages/secciones/SeccionesPage.tsx
import { useCallback, useEffect, useState } from "react";
import {
    Button,
    Card,
    Empty,
    message,
    Modal,
    Progress,
    Select,
    Space,
    Table,
    Tooltip,
    Typography,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import {
    compararSecciones,
    createSeccion,
    deleteSeccion,
    getSecciones,
    updateSeccion,
    type CompararSeccionesResponse,
    type CreateSeccionDto,
    type SeccionCosecha,
} from "./secciones.api";

import SeccionModal from "../../components/secciones-modals/SeccionModal";

export default function SeccionesPage() {
    const [secciones, setSecciones] = useState<SeccionCosecha[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSeccion, setEditingSeccion] = useState<SeccionCosecha | null>(null);

    const [selectedSecciones, setSelectedSecciones] = useState<number[]>([]);
    const [comparacion, setComparacion] = useState<CompararSeccionesResponse | null>(null);
    const [comparando, setComparando] = useState(false);

    const cargarSecciones = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getSecciones();
            setSecciones(data);
        } catch (error) {
            message.error("No se pudieron cargar las secciones.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarSecciones();
    }, [cargarSecciones]);

    async function handleComparar(ids: number[]) {
        setSelectedSecciones(ids);
        if (ids.length === 0) {
            setComparacion(null);
            return;
        }
        try {
            setComparando(true);
            const resultado = await compararSecciones(ids);
            setComparacion(resultado);
        } catch (error) {
            message.error("No se pudo obtener la comparación de secciones.");
        } finally {
            setComparando(false);
        }
    }

    function abrirModalCrear() {
        setEditingSeccion(null);
        setIsModalOpen(true);
    }

    function cerrarModal() {
        setIsModalOpen(false);
        setEditingSeccion(null);
    }

    function handleEdit(seccion: SeccionCosecha) {
        setEditingSeccion(seccion);
        setIsModalOpen(true);
    }

    async function handleFinish(values: CreateSeccionDto) {
        try {
            setSaving(true);

            if (editingSeccion) {
                const seccionActualizada = await updateSeccion(editingSeccion.id, values);
                setSecciones((current) =>
                    current.map((s) =>
                        s.id === editingSeccion.id ? seccionActualizada : s,
                    ),
                );
                message.success("Sección actualizada correctamente.");
            } else {
                const nuevaSeccion = await createSeccion(values);
                setSecciones((current) => [nuevaSeccion, ...current]);
                message.success("Sección creada correctamente.");
            }

            cerrarModal();
        } catch (error) {
            message.error("No se pudo guardar la sección.");
        } finally {
            setSaving(false);
        }
    }

    function handleDelete(id: number) {
        Modal.confirm({
            title: "Eliminar sección",
            content: "¿Seguro que deseas eliminar esta sección?",
            okText: "Eliminar",
            cancelText: "Cancelar",
            okButtonProps: { danger: true },
            async onOk() {
                try {
                    await deleteSeccion(id);
                    setSecciones((current) => current.filter((s) => s.id !== id));
                    message.success("Sección eliminada correctamente.");
                } catch (error) {
                    message.error("No se pudo eliminar la sección.");
                }
            },
        });
    }

    const columns: ColumnsType<SeccionCosecha> = [
        {
            title: "Título",
            dataIndex: "titulo",
            key: "titulo",
            render: (titulo: string) => <strong>{titulo}</strong>,
        },
        {
            title: "Descripción",
            dataIndex: "descripcion",
            key: "descripcion",
            render: (descripcion?: string | null) => descripcion || "-",
        },
        {
            title: "Color",
            dataIndex: "color",
            key: "color",
            render: (color: string) => (
                <Space size="small">
                    <span
                        style={{
                            display: "inline-block",
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            backgroundColor: color,
                            border: "1px solid rgba(0,0,0,0.15)",
                            flexShrink: 0,
                        }}
                    />
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                        {color}
                    </Typography.Text>
                </Space>
            ),
        },
        {
            title: "Acciones",
            key: "acciones",
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Editar">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Eliminar">
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record.id)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
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
                        Secciones de Cosecha
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        Administración de secciones para agrupar cosechas.
                    </Typography.Text>
                </div>

                <Button type="primary" icon={<PlusOutlined />} onClick={abrirModalCrear}>
                    Nueva Sección
                </Button>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={secciones}
                    rowKey="id"
                    loading={loading}
                    bordered
                    pagination={{ pageSize: 8 }}
                />
            </Card>

            <Card title="Comparativa de Producción">
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <Typography.Text type="secondary">
                        Seleccione una o más secciones para comparar su producción.
                    </Typography.Text>

                    <Select
                        mode="multiple"
                        placeholder="Seleccionar secciones"
                        style={{ width: "100%" }}
                        value={selectedSecciones}
                        onChange={handleComparar}
                        loading={comparando}
                        options={secciones.map((s) => ({
                            value: s.id,
                            label: s.titulo,
                        }))}
                        showSearch
                        optionFilterProp="label"
                    />

                    {comparando ? (
                        <Progress type="dashboard" percent={100} status="active" />
                    ) : comparacion ? (
                        <>
                            <Progress
                                type="dashboard"
                                percent={comparacion.porcentaje}
                                format={(percent) => `${percent}%`}
                            />
                            <Typography.Text type="secondary">
                                Las secciones seleccionadas representan el{" "}
                                <Typography.Text strong>
                                    {comparacion.porcentaje}%
                                </Typography.Text>{" "}
                                de la producción total de la finca.
                            </Typography.Text>
                            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                {comparacion.totalSeccionesKilos.toLocaleString("es-CL")} kg{" "}
                                de {comparacion.totalGeneralKilos.toLocaleString("es-CL")} kg{" "}
                                totales.
                            </Typography.Text>
                        </>
                    ) : (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="Seleccione secciones para ver la comparativa"
                        />
                    )}
                </Space>
            </Card>

            <SeccionModal
                open={isModalOpen}
                editingSeccion={editingSeccion}
                saving={saving}
                onCancel={cerrarModal}
                onFinish={handleFinish}
            />
        </Space>
    );
}
