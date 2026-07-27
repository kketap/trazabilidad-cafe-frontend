// src/pages/trazabilidad/TrazabilidadPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    message,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    Typography,
} from "antd";
import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import CrearProcesoModal, {
    type ProcesoFormValues,
} from "../../components/trazabilidad-modals/CrearProcesoModal";
import EditarProcesoModal from "../../components/trazabilidad-modals/EditarProcesoModal";

import { getCosechasApi, type Cosecha } from "../cosechas/cosechas.api";

import type { Lote } from "../lotes/lotes.api";
import { getLotesApi } from "../lotes/lotes.api";

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

type SortField =
    | "fecha"
    | "kilosIngresados"
    | "kilosResultantes"
    | "porcentajeMerma";

type SortOrder = "asc" | "desc";

/**
 * Obtiene el color visual para cada etapa del proceso.
 */
function getEtapaColor(etapa?: string | null) {
    switch (etapa) {
        case "Despulpado":
            return "blue";
        case "Lavado":
            return "cyan";
        case "Secado":
            return "orange";
        case "Trilla":
            return "purple";
        case "Clasificación":
            return "gold";
        default:
            return "default";
    }
}

/**
 * Obtiene el color para el porcentaje de merma.
 */
function getMermaColor(porcentajeMerma: number) {
    if (porcentajeMerma >= 30) {
        return "red";
    }

    if (porcentajeMerma >= 15) {
        return "orange";
    }

    return "green";
}

/**
 * Muestra el lote asociado al proceso.
 *
 * Prioridad:
 * 1. Nuevo flujo: proceso.lote
 * 2. Compatibilidad: lotes asociados a la cosecha
 * 3. Compatibilidad antigua: texto cosecha.lotes
 * 4. Fallback: cosechaId
 */
function renderLoteOrigen(record: ProcesoTrazabilidad) {
    if (record.lote) {
        return (
            <Tag color="gold">
                {record.lote.codigo}
                {record.lote.nombre ? ` - ${record.lote.nombre}` : ""}
            </Tag>
        );
    }

    const lotesCosecha = record.cosecha?.cosechaLotes ?? [];

    if (lotesCosecha.length > 0) {
        return (
            <Space wrap>
                {lotesCosecha.map((item) => (
                    <Tag key={item.id} color="gold">
                        {item.lote.codigo}
                    </Tag>
                ))}
            </Space>
        );
    }

    if (record.cosecha?.lotes) {
        return record.cosecha.lotes;
    }

    return `Cosecha #${record.cosechaId ?? "-"}`;
}

export default function TrazabilidadPage() {
    const [procesos, setProcesos] = useState<ProcesoTrazabilidad[]>([]);
    const [cosechas, setCosechas] = useState<Cosecha[]>([]);

    /**
     * Lista real de lotes productivos.
     * Esta es la fuente principal para seleccionar lotes en trazabilidad.
     */
    const [lotes, setLotes] = useState<Lote[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProceso, setEditingProceso] =
        useState<ProcesoTrazabilidad | null>(null);

    const [selectedProceso, setSelectedProceso] =
        useState<ProcesoTrazabilidad | null>(null);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    /**
     * Filtros de tabla.
     * filtroMes parte en null para mostrar todos los meses por defecto.
     */
    const [filtroMes, setFiltroMes] = useState<Dayjs | null>(null);
    const [filtroEtapa, setFiltroEtapa] = useState<string | null>(null);
    const [filtroTipoCosecha, setFiltroTipoCosecha] = useState<string | null>(
        null,
    );
    const [filtroLote, setFiltroLote] = useState<string | null>(null);

    const [ordenCampo, setOrdenCampo] = useState<SortField>("fecha");
    const [ordenDireccion, setOrdenDireccion] = useState<SortOrder>("desc");

    useEffect(() => {
        cargarDatos();
    }, []);

    /**
     * Carga:
     * - procesos de trazabilidad
     * - cosechas antiguas para compatibilidad
     * - lotes reales para el nuevo flujo recomendado
     */
    async function cargarDatos() {
        try {
            setLoading(true);

            const [procesosData, cosechasData, lotesData] = await Promise.all([
                getProcesosTrazabilidad(),
                getCosechasApi(),
                getLotesApi(),
            ]);

            const procesosNormalizados = Array.isArray(procesosData)
                ? procesosData
                : Array.isArray((procesosData as any)?.data)
                    ? (procesosData as any).data
                    : [];

            const cosechasNormalizadas = Array.isArray(cosechasData)
                ? cosechasData
                : Array.isArray((cosechasData as any)?.data)
                    ? (cosechasData as any).data
                    : [];

            const lotesNormalizados = Array.isArray(lotesData)
                ? lotesData
                : Array.isArray((lotesData as any)?.data)
                    ? (lotesData as any).data
                    : [];

            setProcesos(procesosNormalizados);
            setCosechas(cosechasNormalizadas);
            setLotes(lotesNormalizados);
        } catch (error) {
            console.error("Error cargando trazabilidad:", error);
            message.error("No se pudieron cargar los datos de trazabilidad.");

            setProcesos([]);
            setCosechas([]);
            setLotes([]);
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

    /**
     * Crea un proceso usando loteId como relación principal.
     * cosechaId queda opcional por compatibilidad si el modal todavía lo envía.
     */
    async function onFinish(values: ProcesoFormValues) {
        try {
            setSaving(true);

            const payload: CreateProcesoTrazabilidadDto = {
                fecha: values.fecha.format("YYYY-MM-DD"),

                fechaInicio: values.fechaInicio.toISOString(),
                duracionHoras: values.duracionHoras,

                etapa: values.etapa,
                kilosIngresados: values.kilosIngresados,
                kilosResultantes: values.kilosResultantes,

                loteId: values.loteId,
            };

            const nuevoProceso = await createProcesoTrazabilidad(payload);

            setProcesos((currentProcesos) => [nuevoProceso, ...currentProcesos]);
            message.success("Proceso registrado correctamente.");

            setIsModalOpen(false);
        } catch (error: any) {
            console.error("Error registrando proceso:", error);
            message.error(
                error?.response?.data?.message || "No se pudo registrar el proceso.",
            );
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

    /**
     * Actualiza un proceso usando loteId como relación principal.
     */
    async function handleEditSubmit(id: number, values: ProcesoFormValues) {
        try {
            setSaving(true);

            const payload: Partial<CreateProcesoTrazabilidadDto> = {
                fecha: values.fecha.format("YYYY-MM-DD"),

                fechaInicio: values.fechaInicio.toISOString(),
                duracionHoras: values.duracionHoras,

                etapa: values.etapa,
                kilosIngresados: values.kilosIngresados,
                kilosResultantes: values.kilosResultantes,

                loteId: values.loteId,
            };

            const procesoActualizado = await updateProcesoTrazabilidad(id, payload);

            setProcesos((current) =>
                current.map((p) => (p.id === id ? procesoActualizado : p)),
            );

            message.success("Proceso actualizado correctamente.");
            setIsEditModalOpen(false);
            setEditingProceso(null);
        } catch (error: any) {
            console.error("Error actualizando proceso:", error);
            message.error(
                error?.response?.data?.message || "No se pudo actualizar el proceso.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number) {
        try {
            await deleteProcesoTrazabilidad(id);
            setProcesos((current) => current.filter((p) => p.id !== id));
            message.success("Proceso eliminado correctamente.");
        } catch (error: any) {
            console.error("Error eliminando proceso:", error);
            message.error(
                error?.response?.data?.message || "No se pudo eliminar el proceso.",
            );
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
        setOrdenDireccion("desc");
    }

    /**
     * Opciones de lotes reales para el filtro.
     */
    const loteOptions = useMemo(() => {
        return lotes
            .filter((lote) => lote.activo)
            .map((lote) => ({
                value: lote.codigo,
                label: `${lote.codigo}${lote.nombre ? ` - ${lote.nombre}` : ""}`,
            }));
    }, [lotes]);

    /**
     * Opciones de etapas según datos reales existentes.
     * Si no hay procesos, igual se muestran etapas base.
     */
    const etapaOptions = useMemo(() => {
        const etapasBase = [
            "Despulpado",
            "Lavado",
            "Secado",
            "Trilla",
            "Clasificación",
        ];

        const etapasProcesos = procesos.map((p) => p.etapa);
        const etapas = Array.from(new Set([...etapasBase, ...etapasProcesos])).sort();

        return etapas.map((etapa) => ({
            value: etapa,
            label: etapa,
        }));
    }, [procesos]);

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

            const tipoCosechaProceso =
                proceso.cosecha?.tipoCosecha ??
                proceso.lote?.cosechaLotes?.[0]?.cosecha
                    ?.tipoCosecha;

            const cumpleTipoCosecha = filtroTipoCosecha
                ? tipoCosechaProceso === filtroTipoCosecha
                : true;

            /**
             * Nuevo filtro por lote:
             * - Primero busca en proceso.lote.codigo.
             * - Luego usa cosecha.cosechaLotes para datos antiguos.
             * - Finalmente usa cosecha.lotes como texto antiguo.
             */
            const cumpleLote = filtroLote
                ? proceso.lote?.codigo === filtroLote ||
                proceso.cosecha?.cosechaLotes?.some(
                    (item) => item.lote.codigo === filtroLote,
                ) ||
                proceso.cosecha?.lotes
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

    const columns: ColumnsType<ProcesoTrazabilidad> = [
        {
            title: "Código",
            dataIndex: "codigo",
            key: "codigo",
            width: 175,
            render: (codigo?: string | null) => (
                <Typography.Text code>
                    {codigo ?? "-"}
                </Typography.Text>
            ),
        },
        {
            title: "Inicio",
            dataIndex: "fechaInicio",
            key: "fechaInicio",
            width: 170,
            render: (
                fechaInicio: string | null | undefined,
                record,
            ) => {
                if (!fechaInicio) {
                    return "No registrada";
                }

                if (record.codigo?.startsWith("PRO-LEGACY-")) {
                    return `${dayjs(fechaInicio).format(
                        "DD/MM/YYYY",
                    )} · sin hora`;
                }

                return dayjs(fechaInicio).format(
                    "DD/MM/YYYY HH:mm",
                );
            },
        },
        {
            title: "Duración",
            dataIndex: "duracionHoras",
            key: "duracionHoras",
            align: "right",
            width: 120,
            render: (duracionHoras?: number | null) =>
                duracionHoras != null && duracionHoras > 0
                    ? `${duracionHoras.toLocaleString("es-CL", {
                        maximumFractionDigits: 2,
                    })} h`
                    : "No registrada",
        },
        {
            title: "Fecha",
            dataIndex: "fecha",
            key: "fecha",
            render: (fecha: string) => dayjs(fecha).format("DD/MM/YYYY"),
            sorter: (a, b) => dayjs(a.fecha).valueOf() - dayjs(b.fecha).valueOf(),
        },
        {
            title: "Lote Origen",
            key: "loteOrigen",
            render: (_, record) => renderLoteOrigen(record),
        },
        {
            title: "Etapa",
            dataIndex: "etapa",
            key: "etapa",
            render: (etapa: string) => (
                <Tag color={getEtapaColor(etapa)}>{etapa}</Tag>
            ),
        },
        {
            title: "Kilos Ingresados",
            dataIndex: "kilosIngresados",
            key: "kilosIngresados",
            align: "right",
            render: (kilosIngresados: number) =>
                `${kilosIngresados.toLocaleString("es-CL")} kg`,
            sorter: (a, b) => a.kilosIngresados - b.kilosIngresados,
        },
        {
            title: "Kilos Resultantes",
            dataIndex: "kilosResultantes",
            key: "kilosResultantes",
            align: "right",
            render: (kilosResultantes: number) =>
                `${kilosResultantes.toLocaleString("es-CL")} kg`,
            sorter: (a, b) => a.kilosResultantes - b.kilosResultantes,
        },
        {
            title: "% Merma",
            dataIndex: "porcentajeMerma",
            key: "porcentajeMerma",
            align: "right",
            render: (porcentajeMerma: number) => (
                <Tag color={getMermaColor(porcentajeMerma)}>
                    {porcentajeMerma.toLocaleString("es-CL", {
                        maximumFractionDigits: 2,
                    })}
                    %
                </Tag>
            ),
            sorter: (a, b) => a.porcentajeMerma - b.porcentajeMerma,
        },
        {
            title: "Acciones",
            key: "acciones",
            width: 130,
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
                        <Button type="link" danger icon={<DeleteOutlined />} />
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
                    <div>
                        <Typography.Title level={2} style={{ margin: 0 }}>
                            Control de Trazabilidad
                        </Typography.Title>

                        <Typography.Text type="secondary">
                            Registro de procesos asociados directamente a lotes
                            productivos de café.
                        </Typography.Text>
                    </div>

                    <Button type="primary" icon={<PlusOutlined />} onClick={handleRegister}>
                        Registrar Proceso
                    </Button>
                </div>

                <Card>
                    <Space wrap align="center">
                        <DatePicker
                            locale={esES}
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
                            options={etapaOptions}
                        />

                        <Select
                            allowClear
                            placeholder="Tipo de cosecha"
                            value={filtroTipoCosecha}
                            onChange={(value) => setFiltroTipoCosecha(value ?? null)}
                            style={{ minWidth: 180 }}
                            options={[
                                { value: "plena", label: "Plena" },
                                { value: "rebusca", label: "Rebusca" },
                                { value: "selectiva", label: "Selectiva" },
                            ]}
                        />

                        <Select
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            placeholder="Lote origen"
                            value={filtroLote}
                            onChange={(value) => setFiltroLote(value ?? null)}
                            style={{ minWidth: 240 }}
                            options={loteOptions}
                        />

                        <Select
                            value={ordenCampo}
                            onChange={setOrdenCampo}
                            style={{ minWidth: 210 }}
                            options={[
                                { value: "fecha", label: "Ordenar por fecha" },
                                {
                                    value: "kilosIngresados",
                                    label: "Ordenar por kg ingresados",
                                },
                                {
                                    value: "kilosResultantes",
                                    label: "Ordenar por kg resultantes",
                                },
                                {
                                    value: "porcentajeMerma",
                                    label: "Ordenar por merma",
                                },
                            ]}
                        />

                        <Select
                            value={ordenDireccion}
                            onChange={setOrdenDireccion}
                            style={{ minWidth: 150 }}
                            options={[
                                { value: "desc", label: "Descendente" },
                                { value: "asc", label: "Ascendente" },
                            ]}
                        />

                        <Button onClick={limpiarFiltros}>Limpiar filtros</Button>
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
                                title="Total Ingresado"
                                value={totalIngresado}
                                suffix="kg"
                                formatter={(value) =>
                                    Number(value).toLocaleString("es-CL")
                                }
                            />
                        </Card>
                    </Col>

                    <Col xs={24} md={8}>
                        <Card hoverable>
                            <Statistic
                                title="Total Resultante"
                                value={totalResultante}
                                suffix="kg"
                                formatter={(value) =>
                                    Number(value).toLocaleString("es-CL")
                                }
                            />
                        </Card>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={procesosFiltrados}
                    rowKey="id"
                    bordered
                    loading={loading}
                    pagination={{
                        pageSize: 8,
                        showSizeChanger: true,
                    }}
                    scroll={{ x: 1350 }}
                    locale={{
                        emptyText:
                            "No hay procesos que coincidan con los filtros seleccionados",
                    }}
                />
            </Space>

            <CrearProcesoModal
                open={isModalOpen}
                cosechas={cosechas}
                lotes={lotes}
                loading={loading}
                saving={saving}
                onClose={handleCancel}
                onSubmit={onFinish}
            />

            <EditarProcesoModal
                open={isEditModalOpen}
                proceso={editingProceso}
                cosechas={cosechas}
                lotes={lotes}
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
                        <Descriptions.Item label="Código del proceso">
                            <Typography.Text code>
                                {selectedProceso.codigo ?? "-"}
                            </Typography.Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Inicio del proceso">
                            {selectedProceso.fechaInicio
                                ? selectedProceso.codigo?.startsWith("PRO-LEGACY-")
                                    ? `${dayjs(selectedProceso.fechaInicio).format(
                                        "DD/MM/YYYY",
                                    )} · hora no registrada`
                                    : dayjs(selectedProceso.fechaInicio).format(
                                        "DD/MM/YYYY HH:mm",
                                    )
                                : "No registrada"}
                        </Descriptions.Item>

                        <Descriptions.Item label="Duración">
                            {selectedProceso.duracionHoras != null &&
                                selectedProceso.duracionHoras > 0
                                ? `${selectedProceso.duracionHoras.toLocaleString("es-CL", {
                                    maximumFractionDigits: 2,
                                })} horas`
                                : "No registrada"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tipo de Cosecha">
                            {selectedProceso.cosecha?.tipoCosecha ??
                                selectedProceso.lote?.cosechaLotes?.[0]
                                    ?.cosecha?.tipoCosecha ??
                                "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Kg Cosechados">
                            {(
                                selectedProceso.cosecha?.kilosCosechados ??
                                selectedProceso.lote?.cosechaLotes?.[0]
                                    ?.cosecha?.kilosCosechados
                            )?.toLocaleString("es-CL") ?? "-"}{" "}
                            kg
                        </Descriptions.Item>
                        <Descriptions.Item label="Fecha">
                            {dayjs(selectedProceso.fecha).format("DD/MM/YYYY")}
                        </Descriptions.Item>

                        <Descriptions.Item label="Etapa">
                            <Tag color={getEtapaColor(selectedProceso.etapa)}>
                                {selectedProceso.etapa}
                            </Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Lote Origen">
                            {renderLoteOrigen(selectedProceso)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Kg Ingresados">
                            {selectedProceso.kilosIngresados.toLocaleString("es-CL")} kg
                        </Descriptions.Item>

                        <Descriptions.Item label="Kg Resultantes">
                            {selectedProceso.kilosResultantes.toLocaleString("es-CL")} kg
                        </Descriptions.Item>

                        <Descriptions.Item label="Merma">
                            <Tag color={getMermaColor(selectedProceso.porcentajeMerma)}>
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