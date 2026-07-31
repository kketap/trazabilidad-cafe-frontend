// src/pages/trazabilidad/TrazabilidadPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Card,
    Col,
    DatePicker,
    message,
    Popconfirm,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Typography,
    Tag,
    Descriptions,
    Modal,
} from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, ClearOutlined, ClockCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import CrearProcesoModal, {
    type ProcesoFormValues,
} from "../../components/trazabilidad-modals/CrearProcesoModal";
import EditarProcesoModal from "../../components/trazabilidad-modals/EditarProcesoModal";

import { getCosechas, type Cosecha } from "../cosechas/cosechas.api";
import { getLotes, type Lote } from "../lotes/lotes.api";

import {
    createProcesoTrazabilidad,
    deleteProcesoTrazabilidad,
    getProcesosTrazabilidad,
    updateProcesoTrazabilidad,
    type CreateProcesoTrazabilidadDto,
    type ProcesoTrazabilidad,
} from "./trazabilidad.api";

import dayjs from "dayjs";
import "dayjs/locale/es";
import esES from "antd/es/date-picker/locale/es_ES";

dayjs.locale("es");

export default function TrazabilidadPage() {
    const [procesos, setProcesos] = useState<ProcesoTrazabilidad[]>([]);
    const [cosechas, setCosechas] = useState<Cosecha[]>([]);
    const [lotes, setLotes] = useState<Lote[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProceso, setEditingProceso] = useState<ProcesoTrazabilidad | null>(null);

    const [selectedProceso, setSelectedProceso] =
        useState<ProcesoTrazabilidad | null>(null);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [filtroEtapa, setFiltroEtapa] = useState<string | undefined>(undefined);
    const [filtroLote, setFiltroLote] = useState<string | undefined>(undefined);
    const [filtroFecha, setFiltroFecha] = useState<[Dayjs, Dayjs] | null>(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    async function cargarDatos() {
        try {
            setLoading(true);

            const [procesosRes, cosechasRes, lotesRes] = await Promise.all([
                getProcesosTrazabilidad(),
                getCosechas(),
                getLotes(),
            ]);

            const procesosArr = Array.isArray(procesosRes)
                ? procesosRes
                : Array.isArray((procesosRes as any)?.data)
                ? (procesosRes as any).data
                : [];

            const cosechasArr = Array.isArray(cosechasRes)
                ? cosechasRes
                : Array.isArray((cosechasRes as any)?.data)
                ? (cosechasRes as any).data
                : [];

            const lotesArr = Array.isArray(lotesRes)
                ? lotesRes
                : Array.isArray((lotesRes as any)?.data)
                ? (lotesRes as any).data
                : [];

            setProcesos(procesosArr);
            setCosechas(cosechasArr);
            setLotes(lotesArr);
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
                loteId: values.loteId,
                cosechaId: values.cosechaId,
                etapa: values.etapa,
                tipoProceso: values.tipoProceso,
                fechaInicio: values.fechaInicio ? values.fechaInicio.toISOString() : undefined,
                fechaFin: values.fechaFin ? values.fechaFin.toISOString() : undefined,
                kilosIngresados: values.kilosIngresados,
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
        setSelectedProceso(proceso);
        setIsDetailModalOpen(true);
    }

    function handleEdit(proceso: ProcesoTrazabilidad) {
        setEditingProceso(proceso);
        setIsEditModalOpen(true);
    }

    function handleCloseEditModal() {
        setEditingProceso(null);
        setIsEditModalOpen(false);
    }

    async function handleEditSubmit(id: number, values: ProcesoFormValues) {
        try {
            setSaving(true);
            const payload: Partial<CreateProcesoTrazabilidadDto> = {
                fecha: values.fecha.format("YYYY-MM-DD"),
                loteId: values.loteId,
                cosechaId: values.cosechaId,
                etapa: values.etapa,
                tipoProceso: values.tipoProceso,
                fechaInicio: values.fechaInicio ? values.fechaInicio.toISOString() : undefined,
                fechaFin: values.fechaFin ? values.fechaFin.toISOString() : undefined,
                kilosIngresados: values.kilosIngresados,
            };

            const procesoActualizado = await updateProcesoTrazabilidad(id, payload);

            setProcesos((current) =>
                current.map((p) => (p.id === id ? procesoActualizado : p)),
            );
            message.success("Proceso actualizado correctamente.");
            setIsEditModalOpen(false);
            setEditingProceso(null);
        } catch (error) {
            console.error("Error actualizando proceso:", error);
            message.error("No se pudo actualizar el proceso.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number) {
        try {
            await deleteProcesoTrazabilidad(id);
            setProcesos((current) => current.filter((p) => p.id !== id));
            message.success("Proceso eliminado correctamente.");
        } catch (error) {
            console.error("Error eliminando proceso:", error);
            message.error("No se pudo eliminar el proceso.");
        }
    }

    function handleCloseDetailModal() {
        setSelectedProceso(null);
        setIsDetailModalOpen(false);
    }

    const totalIngresado = procesos.reduce(
        (total, proceso) => total + proceso.kilosIngresados,
        0,
    );

    const etapaOptions = useMemo(() => {
        const etapas = Array.from(new Set(procesos.map((p) => p.etapa))).sort();
        return etapas.map((etapa) => ({ value: etapa, label: etapa }));
    }, [procesos]);

    const loteOptions = useMemo(() => {
        const lotesUnicos = Array.from(
            new Set(
                procesos.map((p) =>
                    p.lote
                        ? (p.lote.nombre ? `${p.lote.codigo} - ${p.lote.nombre}` : p.lote.codigo)
                        : p.cosecha?.lotes ?? (p.cosechaId ? `Cosecha #${p.cosechaId}` : `Proceso #${p.id}`)
                )
            )
        ).sort();
        return lotesUnicos.map((lote) => ({ value: lote, label: lote }));
    }, [procesos]);

    const procesosFiltrados = useMemo(() => {
        return procesos.filter((proceso) => {
            if (filtroEtapa && proceso.etapa !== filtroEtapa) return false;

            const loteProceso = proceso.lote
                ? (proceso.lote.nombre ? `${proceso.lote.codigo} - ${proceso.lote.nombre}` : proceso.lote.codigo)
                : proceso.cosecha?.lotes ?? (proceso.cosechaId ? `Cosecha #${proceso.cosechaId}` : `Proceso #${proceso.id}`);
            if (filtroLote && loteProceso !== filtroLote) return false;

            if (filtroFecha) {
                const fechaProceso = dayjs(proceso.fecha);
                if (
                    fechaProceso.isBefore(filtroFecha[0], "day") ||
                    fechaProceso.isAfter(filtroFecha[1], "day")
                )
                    return false;
            }

            return true;
        });
    }, [procesos, filtroEtapa, filtroLote, filtroFecha]);

    function handleLimpiarFiltros() {
        setFiltroEtapa(undefined);
        setFiltroLote(undefined);
        setFiltroFecha(null);
    }

    function calcularDuracionProceso(fechaInicio?: string, fechaFin?: string) {
        if (!fechaInicio || !fechaFin) return "-";
        const inicio = dayjs(fechaInicio);
        const fin = dayjs(fechaFin);
        const diffMinutos = fin.diff(inicio, "minute");
        if (diffMinutos <= 0) return "0 min";
        const horas = Math.floor(diffMinutos / 60);
        const mins = diffMinutos % 60;
        if (horas >= 24) {
            const dias = Math.floor(horas / 24);
            const horasRestantes = horas % 24;
            return `${dias}d ${horasRestantes}h`;
        }
        if (horas > 0) {
            return mins > 0 ? `${horas}h ${mins}m` : `${horas} hrs`;
        }
        return `${mins} min`;
    }

    const columns: ColumnsType<ProcesoTrazabilidad> = [
        {
            title: "Código Proceso",
            dataIndex: "id",
            key: "codigo",
            render: (id: number) => (
                <Tag color="purple" style={{ fontWeight: "bold", fontSize: 13 }}>
                    PRO-{String(id).padStart(3, "0")}
                </Tag>
            ),
        },
        {
            title: "Fecha",
            dataIndex: "fecha",
            key: "fecha",
            render: (fecha: string) => dayjs(fecha).format("DD/MM/YYYY"),
        },
        {
            title: "Lote Origen",
            key: "loteOrigen",
            render: (_, record) =>
                record.lote
                    ? (record.lote.nombre ? `${record.lote.codigo} - ${record.lote.nombre}` : record.lote.codigo)
                    : record.cosecha?.lotes ?? (record.cosechaId ? `COS-${String(record.cosechaId).padStart(3, "0")}` : "-"),
        },
        {
            title: "Tipo de Proceso",
            dataIndex: "tipoProceso",
            key: "tipoProceso",
            render: (tipo: string) => tipo ? <Tag color="blue">{tipo.replace("_", " ")}</Tag> : "-",
        },
        {
            title: "Duración",
            key: "duracion",
            render: (_, record) => {
                const duracion = calcularDuracionProceso(record.fechaInicio, record.fechaFin);
                return (
                    <Tag icon={<ClockCircleOutlined />} color={duracion !== "-" ? "cyan" : "default"}>
                        {duracion}
                    </Tag>
                );
            },
        },
        {
            title: "Kilos Ingresados",
            dataIndex: "kilosIngresados",
            key: "kilosIngresados",
            render: (kilosIngresados: number) =>
                kilosIngresados ? `${kilosIngresados.toLocaleString("es-CL")} kg` : "0 kg",
        },
        {
            title: "Acciones",
            key: "acciones",
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => handleView(record)}
                        title="Ver detalle"
                    />
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        title="Editar proceso"
                    />
                    <Popconfirm
                        title="Eliminar proceso"
                        description="¿Seguro que deseas eliminar este proceso?"
                        okText="Eliminar"
                        cancelText="Cancelar"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            title="Eliminar"
                        />
                    </Popconfirm>
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
                    <Typography.Title level={2} style={{ margin: 0 }}>
                        Proceso Húmedo
                    </Typography.Title>

                    <Button type="primary" icon={<PlusOutlined />} onClick={handleRegister}>
                        Registrar Proceso
                    </Button>
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                        <Card hoverable>
                            <Statistic
                                title="Total Procesos Registrados"
                                value={procesos.length}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} md={12}>
                        <Card hoverable>
                            <Statistic
                                title="Total Ingresado (Kg)"
                                value={totalIngresado}
                                suffix="kg"
                                formatter={(value) => Number(value).toLocaleString("es-CL")}
                            />
                        </Card>
                    </Col>
                </Row>

                <Card variant="borderless" style={{ borderRadius: 12 }}>
                    <Row gutter={[12, 12]} align="middle">
                        <Col xs={24} sm={12} md={6}>
                            <Select
                                placeholder="Filtrar por etapa"
                                value={filtroEtapa}
                                onChange={setFiltroEtapa}
                                options={etapaOptions}
                                allowClear
                                style={{ width: "100%" }}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Select
                                placeholder="Filtrar por lote origen"
                                value={filtroLote}
                                onChange={setFiltroLote}
                                options={loteOptions}
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                style={{ width: "100%" }}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={7}>
                            <DatePicker.RangePicker
                                value={filtroFecha}
                                onChange={(values) =>
                                    setFiltroFecha(values as [Dayjs, Dayjs] | null)
                                }
                                locale={esES}
                                format="DD/MM/YYYY"
                                style={{ width: "100%" }}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={5}>
                            <Button
                                icon={<ClearOutlined />}
                                onClick={handleLimpiarFiltros}
                                block
                            >
                                Limpiar Filtros
                            </Button>
                        </Col>
                    </Row>
                </Card>

                <Table
                    columns={columns}
                    dataSource={procesosFiltrados}
                    rowKey="id"
                    bordered
                    loading={loading}
                    pagination={false}
                    scroll={{ x: "max-content" }}
                />
            </Space>

            <CrearProcesoModal
                open={isModalOpen}
                cosechas={Array.isArray(cosechas) ? cosechas : []}
                lotes={Array.isArray(lotes) ? lotes : []}
                loading={loading}
                saving={saving}
                onClose={handleCancel}
                onSubmit={onFinish}
            />
            <EditarProcesoModal
                open={isEditModalOpen}
                proceso={editingProceso}
                cosechas={Array.isArray(cosechas) ? cosechas : []}
                lotes={Array.isArray(lotes) ? lotes : []}
                saving={saving}
                onClose={handleCloseEditModal}
                onSubmit={handleEditSubmit}
            />
            <Modal
                title={`Detalle del Proceso - PRO-${String(selectedProceso?.id ?? 0).padStart(3, "0")}`}
                open={isDetailModalOpen}
                onCancel={handleCloseDetailModal}
                footer={[
                    <Button key="close" onClick={handleCloseDetailModal}>
                        Cerrar
                    </Button>,
                ]}
                centered
                width="min(780px, 95vw)"
            >
                {selectedProceso && (
                    <Descriptions
                        bordered
                        column={{
                            xs: 1,
                            sm: 1,
                            md: 2,
                        }}
                        size="middle"
                    >
                        <Descriptions.Item label="Código de Proceso">
                            <Tag color="purple" style={{ fontWeight: "bold", fontSize: 13 }}>
                                PRO-{String(selectedProceso.id).padStart(3, "0")}
                            </Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Fecha">
                            {dayjs(selectedProceso.fecha).format("DD/MM/YYYY")}
                        </Descriptions.Item>

                        <Descriptions.Item label="Duración">
                            <Tag icon={<ClockCircleOutlined />} color="cyan">
                                {calcularDuracionProceso(selectedProceso.fechaInicio, selectedProceso.fechaFin)}
                            </Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Lote Origen">
                            {selectedProceso.lote
                                ? (selectedProceso.lote.nombre ? `${selectedProceso.lote.codigo} - ${selectedProceso.lote.nombre}` : selectedProceso.lote.codigo)
                                : selectedProceso.cosecha?.lotes ?? (selectedProceso.cosechaId ? `COS-${String(selectedProceso.cosechaId).padStart(3, "0")}` : "-")}
                        </Descriptions.Item>

                        <Descriptions.Item label="Tipo de Cosecha">
                            {selectedProceso.cosecha?.tipoCosecha ?? "-"}
                        </Descriptions.Item>

                        <Descriptions.Item label="Kg Cosechados">
                            {selectedProceso.cosecha?.kilosCosechados?.toLocaleString(
                                "es-CL",
                            ) ?? "-"}{" "}
                            kg
                        </Descriptions.Item>

                        <Descriptions.Item label="Kg Ingresados">
                            {selectedProceso.kilosIngresados.toLocaleString("es-CL")} kg
                        </Descriptions.Item>

                        <Descriptions.Item label="Fecha de Registro">
                            {selectedProceso.createdAt
                                ? dayjs(selectedProceso.createdAt).format(
                                    "DD/MM/YYYY HH:mm",
                                )
                                : "-"}
                        </Descriptions.Item>

                        <Descriptions.Item label="Última Actualización">
                            {selectedProceso.updatedAt
                                ? dayjs(selectedProceso.updatedAt).format(
                                    "DD/MM/YYYY HH:mm",
                                )
                                : "-"}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>

    );
}