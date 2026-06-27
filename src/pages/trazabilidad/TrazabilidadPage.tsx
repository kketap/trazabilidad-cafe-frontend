// src/pages/trazabilidad/TrazabilidadPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    message,
    Popconfirm,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Typography,
    Tag,
    Modal,
} from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, ClearOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import CrearProcesoModal, {
    type ProcesoFormValues,
} from "../../components/trazabilidad-modals/CrearProcesoModal";
import EditarProcesoModal from "../../components/trazabilidad-modals/EditarProcesoModal";

import { getCosechas, type Cosecha } from "../cosechas/cosechas.api";

import {
    createProcesoTrazabilidad,
    deleteProcesoTrazabilidad,
    getProcesosTrazabilidad,
    updateProcesoTrazabilidad,
    type CreateProcesoTrazabilidadDto,
    type ProcesoTrazabilidad,
} from "./trazabilidad.api";

import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/es";
import esES from "antd/es/date-picker/locale/es_ES";

dayjs.locale("es");

type SortField = "fecha" | "kilosIngresados" | "kilosResultantes" | "porcentajeMerma";
type SortOrder = "asc" | "desc";

export default function TrazabilidadPage() {
    const [procesos, setProcesos] = useState<ProcesoTrazabilidad[]>([]);
    const [cosechas, setCosechas] = useState<Cosecha[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProceso, setEditingProceso] = useState<ProcesoTrazabilidad | null>(null);

    const [selectedProceso, setSelectedProceso] =
        useState<ProcesoTrazabilidad | null>(null);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [filtroFecha, setFiltroFecha] = useState<[Dayjs, Dayjs] | null>(null);

    const [filtroMes, setFiltroMes] = useState<Dayjs | null>(() => dayjs());
    const [filtroEtapa, setFiltroEtapa] = useState<string | null>(null);
    const [filtroTipoCosecha, setFiltroTipoCosecha] = useState<string | null>(null);
    const [filtroLote, setFiltroLote] = useState<string | null>(null);

    const [ordenCampo, setOrdenCampo] = useState<SortField>("fecha");
    const [ordenDireccion, setOrdenDireccion] = useState<SortOrder>("asc");

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
                cosechaId: values.cosechaId,
                etapa: values.etapa,
                kilosIngresados: values.kilosIngresados,
                kilosResultantes: values.kilosResultantes,
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

    function limpiarFiltros() {
        setFiltroMes(null);
        setFiltroEtapa(null);
        setFiltroTipoCosecha(null);
        setFiltroLote(null);
        setOrdenCampo("fecha");
        setOrdenDireccion("asc");
    }

    const procesosFiltrados = useMemo(() => {
        const filtrados = procesos.filter((proceso) => {
            const fecha = dayjs(proceso.fecha);

            const cumpleMes = filtroMes
                ? fecha.month() === filtroMes.month() &&
                fecha.year() === filtroMes.year()
                : true;

            const cumpleEtapa = filtroEtapa
                ? proceso.etapa === filtroEtapa
                : true;

            const cumpleTipoCosecha = filtroTipoCosecha
                ? proceso.cosecha?.tipoCosecha === filtroTipoCosecha
                : true;

            const cumpleLote = filtroLote
                ? proceso.cosecha?.lotes
                    ?.toLowerCase()
                    .includes(filtroLote.toLowerCase())
                : true;

            return cumpleMes && cumpleEtapa && cumpleTipoCosecha && cumpleLote;
        });

        return [...filtrados].sort((a, b) => {
            let valorA: number;
            let valorB: number;

            if (ordenCampo === "fecha") {
                valorA = dayjs(a.fecha).valueOf();
                valorB = dayjs(b.fecha).valueOf();
            } else {
                valorA = Number(a[ordenCampo] ?? 0);
                valorB = Number(b[ordenCampo] ?? 0);
            }

            return ordenDireccion === "asc" ? valorA - valorB : valorB - valorA;
        });
    }, [
        procesos,
        filtroMes,
        filtroEtapa,
        filtroTipoCosecha,
        filtroLote,
        ordenCampo,
        ordenDireccion,
    ]);

    const mermaPromedio =
        procesosFiltrados.length > 0
            ? procesosFiltrados.reduce(
                (total, proceso) => total + proceso.porcentajeMerma,
                0,
            ) / procesosFiltrados.length
            : 0;

    const totalIngresado = procesosFiltrados.reduce(
        (total, proceso) => total + proceso.kilosIngresados,
        0,
    );

    const totalResultante = procesosFiltrados.reduce(
        (total, proceso) => total + proceso.kilosResultantes,
        0,
    );

    const etapaOptions = useMemo(() => {
        const etapas = Array.from(new Set(procesos.map((p) => p.etapa))).sort();
        return etapas.map((etapa) => ({ value: etapa, label: etapa }));
    }, [procesos]);

    const loteOptions = useMemo(() => {
        const lotes = Array.from(
            new Set(procesos.map((p) => p.cosecha?.lotes ?? `Cosecha #${p.cosechaId}`)),
        ).sort();
        return lotes.map((lote) => ({ value: lote, label: lote }));
    }, [procesos]);

    function handleLimpiarFiltros() {
        setFiltroEtapa(null);
        setFiltroLote(null);
        setFiltroFecha(null);
    }

    const columns: ColumnsType<ProcesoTrazabilidad> = [
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
                <Space size="small">
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => handleView(record)}
                    />
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
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
                        Control de Trazabilidad
                    </Typography.Title>

                    <Button type="primary" icon={<PlusOutlined />} onClick={handleRegister}>
                        Registrar Proceso
                    </Button>
                </div>

                <Card>
                    <Space wrap align="center">
                        <DatePicker
                            picker="month"
                            value={filtroMes}
                            onChange={(value) => setFiltroMes(value)}
                            format="MMMM YYYY"
                            placeholder="Todos los meses"
                            allowClear
                        />

                        <Select
                            allowClear
                            placeholder="Etapa"
                            value={filtroEtapa}
                            onChange={(value) => setFiltroEtapa(value ?? null)}
                            style={{ minWidth: 180 }}
                            options={[
                                { value: "Despulpado", label: "Despulpado" },
                                { value: "Lavado", label: "Lavado" },
                                { value: "Secado", label: "Secado" },
                                { value: "Trilla", label: "Trilla" },
                                { value: "Clasificación", label: "Clasificación" },
                            ]}
                        />

                        <Select
                            allowClear
                            placeholder="Tipo de cosecha"
                            value={filtroTipoCosecha}
                            onChange={(value) => setFiltroTipoCosecha(value ?? null)}
                            style={{ minWidth: 180 }}
                            options={[
                                { value: "Rebusque", label: "Rebusque" },
                                { value: "Selectiva", label: "Selectiva" },
                                { value: "Manual", label: "Manual" },
                            ]}
                        />

                        <Select
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            placeholder="Lote origen"
                            value={filtroLote}
                            onChange={(value) => setFiltroLote(value ?? null)}
                            style={{ minWidth: 200 }}
                            options={Array.from(
                                new Set(
                                    cosechas
                                        .map((cosecha) => cosecha.lotes)
                                        .filter(Boolean),
                                ),
                            ).map((lote) => ({
                                value: lote,
                                label: lote,
                            }))}
                        />

                        <Select
                            value={ordenCampo}
                            onChange={setOrdenCampo}
                            style={{ minWidth: 210 }}
                            options={[
                                { value: "fecha", label: "Ordenar por fecha" },
                                { value: "kilosIngresados", label: "Ordenar por kg ingresados" },
                                { value: "kilosResultantes", label: "Ordenar por kg resultantes" },
                                { value: "porcentajeMerma", label: "Ordenar por merma" },
                            ]}
                        />

                        <Select
                            value={ordenDireccion}
                            onChange={setOrdenDireccion}
                            style={{ minWidth: 150 }}
                            options={[
                                { value: "asc", label: "Ascendente" },
                                { value: "desc", label: "Descendente" },
                            ]}
                        />

                        <Button onClick={limpiarFiltros}>
                            Limpiar filtros
                        </Button>
                    </Space>
                </Card>

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
                    locale={{
                        emptyText: "No hay procesos que coincidan con los filtros seleccionados",
                    }}
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
            <EditarProcesoModal
                open={isEditModalOpen}
                proceso={editingProceso}
                cosechas={cosechas}
                saving={saving}
                onClose={handleCloseEditModal}
                onSubmit={handleEditSubmit}
            />
            <Modal
                title="Detalle del Proceso"
                open={isDetailModalOpen}
                onCancel={handleCloseDetailModal}
                footer={[
                    <Button key="close" onClick={handleCloseDetailModal}>
                        Cerrar
                    </Button>,
                ]}
                centered
                width="min(760px, 95vw)"
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
                        <Descriptions.Item label="Fecha">
                            {dayjs(selectedProceso.fecha).format("DD/MM/YYYY")}
                        </Descriptions.Item>

                        <Descriptions.Item label="Etapa">
                            <Tag color="blue">{selectedProceso.etapa}</Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Lote Origen">
                            {selectedProceso.cosecha?.lotes ??
                                `Cosecha #${selectedProceso.cosechaId}`}
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

                        <Descriptions.Item label="Kg Resultantes">
                            {selectedProceso.kilosResultantes.toLocaleString("es-CL")} kg
                        </Descriptions.Item>

                        <Descriptions.Item label="Merma">
                            <Tag
                                color={
                                    selectedProceso.porcentajeMerma >= 30
                                        ? "red"
                                        : selectedProceso.porcentajeMerma >= 15
                                            ? "orange"
                                            : "green"
                                }
                            >
                                {selectedProceso.porcentajeMerma.toLocaleString("es-CL", {
                                    maximumFractionDigits: 2,
                                })}
                                %
                            </Tag>
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