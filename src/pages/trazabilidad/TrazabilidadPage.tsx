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
    ClockCircleOutlined,
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
import { getLotesApi, type Lote } from "../lotes/lotes.api";

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

type ProcesoRow = ProcesoTrazabilidad & {
    lote?: Lote | null;
    Lote?: Lote | null;
    kilosResultantes?: number | null;
    porcentajeMerma?: number | null;
    fechaInicio?: string | null;
    fechaFin?: string | null;
    duracionHoras?: number | null;
    etapa?: string | null;
};

type SortField =
    | "fecha"
    | "kilosIngresados"
    | "kilosResultantes"
    | "porcentajeMerma";

type SortOrder = "asc" | "desc";

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

function getMermaColor(porcentajeMerma?: number | null) {
    const value = Number(porcentajeMerma ?? 0);

    if (value >= 30) return "red";
    if (value >= 15) return "orange";

    return "green";
}

function formatKg(value?: number | null) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "-";
    }

    return `${Number(value).toLocaleString("es-CL", {
        maximumFractionDigits: 2,
    })} kg`;
}

function formatHoras(value?: number | null) {
    if (
        value === null ||
        value === undefined ||
        Number.isNaN(Number(value)) ||
        Number(value) <= 0
    ) {
        return "No registrada";
    }

    return `${Number(value).toLocaleString("es-CL", {
        maximumFractionDigits: 2,
    })} h`;
}

function formatPorcentaje(value?: number | null) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "-";
    }

    return `${Number(value).toLocaleString("es-CL", {
        maximumFractionDigits: 2,
    })}%`;
}

function calcularMermaLocal(
    kilosIngresados?: number | null,
    kilosResultantes?: number | null,
) {
    if (
        kilosIngresados === null ||
        kilosIngresados === undefined ||
        kilosResultantes === null ||
        kilosResultantes === undefined ||
        Number(kilosIngresados) <= 0
    ) {
        return null;
    }

    return (
        ((Number(kilosIngresados) - Number(kilosResultantes)) /
            Number(kilosIngresados)) *
        100
    );
}

function getLoteProceso(record: ProcesoRow) {
    return record.lote ?? record.Lote ?? null;
}

function renderLoteOrigen(record: ProcesoRow) {
    const lote = getLoteProceso(record);

    if (lote) {
        return (
            <Tag color="gold">
                {lote.codigo}
                {lote.nombre ? ` - ${lote.nombre}` : ""}
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

function getTipoCosechaProceso(proceso: ProcesoRow) {
    return proceso.cosecha?.tipoCosecha ?? null;
}

function getKilosCosechadosProceso(proceso: ProcesoRow) {
    return proceso.cosecha?.kilosCosechados ?? null;
}

function normalizeProceso(proceso: ProcesoRow): ProcesoRow {
    return {
        ...proceso,
        lote: proceso.lote ?? proceso.Lote ?? null,
    };
}

export default function TrazabilidadPage() {
    const [procesos, setProcesos] = useState<ProcesoRow[]>([]);
    const [cosechas, setCosechas] = useState<Cosecha[]>([]);
    const [lotes, setLotes] = useState<Lote[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProceso, setEditingProceso] = useState<ProcesoRow | null>(
        null,
    );

    const [selectedProceso, setSelectedProceso] = useState<ProcesoRow | null>(
        null,
    );
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [filtroMes, setFiltroMes] = useState<Dayjs | null>(null);
    const [filtroEtapa, setFiltroEtapa] = useState<string | null>(null);
    const [filtroTipoCosecha, setFiltroTipoCosecha] =
        useState<string | null>(null);
    const [filtroLote, setFiltroLote] = useState<string | null>(null);

    const [ordenCampo, setOrdenCampo] = useState<SortField>("fecha");
    const [ordenDireccion, setOrdenDireccion] = useState<SortOrder>("desc");

    useEffect(() => {
        cargarDatos();
    }, []);

    async function cargarDatos() {
        try {
            setLoading(true);

            const [procesosRes, cosechasRes, lotesRes] = await Promise.all([
                getProcesosTrazabilidad(),
                getCosechasApi(),
                getLotesApi(),
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

            setProcesos(procesosArr.map((item: ProcesoRow) => normalizeProceso(item)));
            setCosechas(cosechasArr);
            setLotes(lotesArr);
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

    async function onFinish(values: ProcesoFormValues) {
        try {
            setSaving(true);

            const porcentajeMerma = calcularMermaLocal(
                values.kilosIngresados,
                values.kilosResultantes,
            );

            const payload: CreateProcesoTrazabilidadDto = {
                fecha: values.fecha.format("YYYY-MM-DD"),
                fechaInicio: values.fechaInicio.toISOString(),
                duracionHoras: values.duracionHoras,
                loteId: values.loteId ?? null,
                cosechaId: values.cosechaId ?? null,
                etapa: values.etapa,
                kilosIngresados: values.kilosIngresados,
                kilosResultantes: values.kilosResultantes,
            };

            const nuevoProceso = await createProcesoTrazabilidad(payload);

            setProcesos((currentProcesos) => [
                normalizeProceso({
                    ...(nuevoProceso as ProcesoRow),
                    kilosResultantes: values.kilosResultantes,
                    porcentajeMerma,
                }),
                ...currentProcesos,
            ]);

            message.success("Proceso registrado correctamente.");
            setIsModalOpen(false);
        } catch (error: any) {
            console.error("Error registrando proceso:", error);
            message.error(
                error?.response?.data?.message ||
                "No se pudo registrar el proceso.",
            );
        } finally {
            setSaving(false);
        }
    }

    function handleView(proceso: ProcesoRow) {
        setSelectedProceso(proceso);
        setIsDetailModalOpen(true);
    }

    function handleEdit(proceso: ProcesoRow) {
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

            const porcentajeMerma = calcularMermaLocal(
                values.kilosIngresados,
                values.kilosResultantes,
            );

            const payload: Partial<CreateProcesoTrazabilidadDto> = {
                fecha: values.fecha.format("YYYY-MM-DD"),
                fechaInicio: values.fechaInicio.toISOString(),
                duracionHoras: values.duracionHoras,
                loteId: values.loteId ?? null,
                cosechaId: values.cosechaId ?? null,
                etapa: values.etapa,
                kilosIngresados: values.kilosIngresados,
                kilosResultantes: values.kilosResultantes,
            };

            const procesoActualizado = await updateProcesoTrazabilidad(id, payload);

            setProcesos((current) =>
                current.map((p) =>
                    p.id === id
                        ? normalizeProceso({
                            ...(procesoActualizado as ProcesoRow),
                            kilosResultantes: values.kilosResultantes,
                            porcentajeMerma,
                        })
                        : p,
                ),
            );

            message.success("Proceso actualizado correctamente.");
            setIsEditModalOpen(false);
            setEditingProceso(null);
        } catch (error: any) {
            console.error("Error actualizando proceso:", error);
            message.error(
                error?.response?.data?.message ||
                "No se pudo actualizar el proceso.",
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
                error?.response?.data?.message ||
                "No se pudo eliminar el proceso.",
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

    const loteOptions = useMemo(() => {
        return lotes
            .filter((lote) => lote.activo)
            .map((lote) => ({
                value: lote.codigo,
                label: `${lote.codigo}${lote.nombre ? ` - ${lote.nombre}` : ""}`,
            }));
    }, [lotes]);

    const etapaOptions = useMemo(() => {
        const etapasBase = [
            "Despulpado",
            "Lavado",
            "Secado",
            "Trilla",
            "Clasificación",
        ];

        const etapasProcesos = procesos
            .map((proceso) => proceso.etapa)
            .filter((etapa): etapa is string => Boolean(etapa));

        const etapas = Array.from(
            new Set([...etapasBase, ...etapasProcesos]),
        ).sort();

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

            const tipoCosechaProceso = getTipoCosechaProceso(proceso);

            const cumpleTipoCosecha = filtroTipoCosecha
                ? tipoCosechaProceso === filtroTipoCosecha
                : true;

            const lote = getLoteProceso(proceso);

            const cumpleLote = filtroLote
                ? lote?.codigo === filtroLote ||
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

    const totalIngresado = procesosFiltrados.reduce(
        (total, proceso) => total + Number(proceso.kilosIngresados ?? 0),
        0,
    );

    const totalResultante = procesosFiltrados.reduce(
        (total, proceso) => total + Number(proceso.kilosResultantes ?? 0),
        0,
    );

    const mermasValidas = procesosFiltrados
        .map(
            (proceso) =>
                proceso.porcentajeMerma ??
                calcularMermaLocal(
                    proceso.kilosIngresados,
                    proceso.kilosResultantes,
                ),
        )
        .filter((value): value is number => value !== null && value !== undefined);

    const mermaPromedio =
        mermasValidas.length > 0
            ? mermasValidas.reduce((total, value) => total + value, 0) /
            mermasValidas.length
            : 0;

    const columns: ColumnsType<ProcesoRow> = [
        {
            title: "Código",
            dataIndex: "codigo",
            key: "codigo",
            width: 175,
            render: (codigo: string | null | undefined, record) => (
                <Tag color="purple" style={{ fontWeight: "bold", fontSize: 13 }}>
                    {codigo ?? `PRO-${String(record.id).padStart(3, "0")}`}
                </Tag>
            ),
        },
        {
            title: "Inicio",
            dataIndex: "fechaInicio",
            key: "fechaInicio",
            width: 170,
            render: (fechaInicio: string | null | undefined, record) => {
                if (!fechaInicio) return "No registrada";

                if (record.codigo?.startsWith("PRO-LEGACY-")) {
                    return `${dayjs(fechaInicio).format("DD/MM/YYYY")} · sin hora`;
                }

                return dayjs(fechaInicio).format("DD/MM/YYYY HH:mm");
            },
        },
        {
            title: "Duración",
            dataIndex: "duracionHoras",
            key: "duracionHoras",
            align: "right",
            width: 130,
            render: (duracionHoras: number | null | undefined) =>
                duracionHoras != null && duracionHoras > 0 ? (
                    <Tag icon={<ClockCircleOutlined />} color="cyan">
                        {formatHoras(duracionHoras)}
                    </Tag>
                ) : (
                    "No registrada"
                ),
        },
        {
            title: "Fecha",
            dataIndex: "fecha",
            key: "fecha",
            width: 120,
            render: (fecha: string) => dayjs(fecha).format("DD/MM/YYYY"),
            sorter: (a, b) => dayjs(a.fecha).valueOf() - dayjs(b.fecha).valueOf(),
        },
        {
            title: "Lote Origen",
            key: "loteOrigen",
            width: 240,
            render: (_: unknown, record) => renderLoteOrigen(record),
        },
        {
            title: "Tipo Cosecha",
            key: "tipoCosecha",
            width: 140,
            render: (_: unknown, record) => getTipoCosechaProceso(record) ?? "-",
        },
        {
            title: "Etapa",
            dataIndex: "etapa",
            key: "etapa",
            width: 150,
            render: (etapa: string | null | undefined) => (
                <Tag color={getEtapaColor(etapa)}>{etapa ?? "-"}</Tag>
            ),
        },
        {
            title: "Kg Ingresados",
            dataIndex: "kilosIngresados",
            key: "kilosIngresados",
            align: "right",
            width: 150,
            render: (kilosIngresados: number | null | undefined) =>
                formatKg(kilosIngresados),
            sorter: (a, b) =>
                Number(a.kilosIngresados ?? 0) - Number(b.kilosIngresados ?? 0),
        },
        {
            title: "Kg Resultantes",
            dataIndex: "kilosResultantes",
            key: "kilosResultantes",
            align: "right",
            width: 150,
            render: (kilosResultantes: number | null | undefined) =>
                formatKg(kilosResultantes),
            sorter: (a, b) =>
                Number(a.kilosResultantes ?? 0) -
                Number(b.kilosResultantes ?? 0),
        },
        {
            title: "% Merma",
            dataIndex: "porcentajeMerma",
            key: "porcentajeMerma",
            align: "right",
            width: 120,
            render: (_porcentajeMerma: number | null | undefined, record) => {
                const merma =
                    record.porcentajeMerma ??
                    calcularMermaLocal(
                        record.kilosIngresados,
                        record.kilosResultantes,
                    );

                if (merma === null || merma === undefined) {
                    return "-";
                }

                return (
                    <Tag color={getMermaColor(merma)}>
                        {formatPorcentaje(merma)}
                    </Tag>
                );
            },
            sorter: (a, b) => {
                const mermaA =
                    a.porcentajeMerma ??
                    calcularMermaLocal(a.kilosIngresados, a.kilosResultantes) ??
                    0;

                const mermaB =
                    b.porcentajeMerma ??
                    calcularMermaLocal(b.kilosIngresados, b.kilosResultantes) ??
                    0;

                return mermaA - mermaB;
            },
        },
        {
            title: "Acciones",
            key: "acciones",
            width: 130,
            fixed: "right",
            render: (_: unknown, record) => (
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
                            Proceso Húmedo
                        </Typography.Title>

                        <Typography.Text type="secondary">
                            Registro de procesos asociados a lotes productivos.
                        </Typography.Text>
                    </div>

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleRegister}
                    >
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
                            onChange={(value) =>
                                setFiltroTipoCosecha(value ?? null)
                            }
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
                    <Col xs={24} md={6}>
                        <Card hoverable>
                            <Statistic
                                title="Procesos"
                                value={procesosFiltrados.length}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} md={6}>
                        <Card hoverable>
                            <Statistic
                                title="Total Ingresado"
                                value={totalIngresado}
                                suffix="kg"
                                formatter={(value) =>
                                    Number(value ?? 0).toLocaleString("es-CL")
                                }
                            />
                        </Card>
                    </Col>

                    <Col xs={24} md={6}>
                        <Card hoverable>
                            <Statistic
                                title="Total Resultante"
                                value={totalResultante}
                                suffix="kg"
                                formatter={(value) =>
                                    Number(value ?? 0).toLocaleString("es-CL")
                                }
                            />
                        </Card>
                    </Col>

                    <Col xs={24} md={6}>
                        <Card hoverable>
                            <Statistic
                                title="Merma Promedio"
                                value={mermaPromedio}
                                suffix="%"
                                precision={2}
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
                title={`Detalle del Proceso - ${selectedProceso?.codigo ??
                    `PRO-${String(selectedProceso?.id ?? 0).padStart(3, "0")}`
                    }`}
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
                            <Tag
                                color="purple"
                                style={{ fontWeight: "bold", fontSize: 13 }}
                            >
                                {selectedProceso.codigo ??
                                    `PRO-${String(selectedProceso.id).padStart(
                                        3,
                                        "0",
                                    )}`}
                            </Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Inicio del proceso">
                            {selectedProceso.fechaInicio
                                ? dayjs(selectedProceso.fechaInicio).format(
                                    "DD/MM/YYYY HH:mm",
                                )
                                : "No registrada"}
                        </Descriptions.Item>

                        <Descriptions.Item label="Duración">
                            {selectedProceso.duracionHoras != null &&
                                selectedProceso.duracionHoras > 0 ? (
                                <Tag icon={<ClockCircleOutlined />} color="cyan">
                                    {formatHoras(selectedProceso.duracionHoras)}
                                </Tag>
                            ) : (
                                "No registrada"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="Fecha">
                            {dayjs(selectedProceso.fecha).format("DD/MM/YYYY")}
                        </Descriptions.Item>

                        <Descriptions.Item label="Lote Origen">
                            {renderLoteOrigen(selectedProceso)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Tipo de Cosecha">
                            {getTipoCosechaProceso(selectedProceso) ?? "-"}
                        </Descriptions.Item>

                        <Descriptions.Item label="Kg Cosechados">
                            {formatKg(
                                getKilosCosechadosProceso(selectedProceso),
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="Etapa">
                            <Tag color={getEtapaColor(selectedProceso.etapa)}>
                                {selectedProceso.etapa ?? "-"}
                            </Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Kg Ingresados">
                            {formatKg(selectedProceso.kilosIngresados)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Kg Resultantes">
                            {formatKg(selectedProceso.kilosResultantes)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Merma">
                            {(() => {
                                const merma =
                                    selectedProceso.porcentajeMerma ??
                                    calcularMermaLocal(
                                        selectedProceso.kilosIngresados,
                                        selectedProceso.kilosResultantes,
                                    );

                                if (merma === null || merma === undefined) {
                                    return "-";
                                }

                                return (
                                    <Tag color={getMermaColor(merma)}>
                                        {formatPorcentaje(merma)}
                                    </Tag>
                                );
                            })()}
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