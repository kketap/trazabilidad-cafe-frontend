import { mostrarError } from "../../utils/mostrarError";
import { formatearDuracionHoras, formatearDuracionMinutos } from "../../utils/formatearDuracion";
// src/pages/trazabilidad/TrazabilidadPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Grid,
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
import utc from "dayjs/plugin/utc";
import "dayjs/locale/es";

dayjs.extend(utc);
dayjs.locale("es");

import esES from "antd/es/date-picker/locale/es_ES";

type ProcesoRow = ProcesoTrazabilidad & {
    lote?: Lote | null;
    Lote?: Lote | null;
};

type SortField = "fecha" | "kilosIngresados";

type SortOrder = "asc" | "desc";

function formatKg(value?: number | null) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "-";
    }

    return `${Number(value).toLocaleString("es-CL", {
        maximumFractionDigits: 2,
    })} kg`;
}

function duracionEtapa(inicio?: string | null, fin?: string | null) {
    if (!inicio || !fin) return null;

    return formatearDuracionMinutos(dayjs(fin).diff(dayjs(inicio), "minute"));
}

function renderEtapa(inicio?: string | null, fin?: string | null, duracion?: string | null) {
    if (!inicio && !fin && !duracion) return "Sin registro";

    return (
        <Space orientation="vertical" size={2}>
            <span>Inicio: {inicio ? dayjs(inicio).format("DD/MM/YYYY HH:mm") : "—"}</span>
            <span>Fin: {fin ? dayjs(fin).format("DD/MM/YYYY HH:mm") : "—"}</span>
            <Typography.Text type="secondary">Duración: {duracion ?? "—"}</Typography.Text>
        </Space>
    );
}

function getLoteProceso(record: ProcesoRow) {
    return record.lote ?? record.Lote ?? null;
}


function renderLoteOrigen(
    record: ProcesoRow,
) {
    const relaciones =
        record.procesoLotes ?? [];

    if (relaciones.length > 0) {
        return (
            <Space wrap size={[4, 4]}>
                {relaciones.map((item) => (
                    <Tag
                        key={item.id}
                        color="gold"
                    >
                        {item.lote?.codigo ??
                            `Lote #${item.loteId}`}
                        {" · "}
                        {formatKg(item.kilosUsados)}
                    </Tag>
                ))}
            </Space>
        );
    }

    const lote = getLoteProceso(record);

    if (lote) {
        return (
            <Tag color="gold">
                {lote.codigo}
            </Tag>
        );
    }

    const lotesCosecha =
        record.cosecha?.cosechaLotes ?? [];

    if (lotesCosecha.length > 0) {
        return (
            <Space wrap>
                {lotesCosecha.map((item) => (
                    <Tag
                        key={item.id}
                        color="gold"
                    >
                        {item.lote.codigo}
                    </Tag>
                ))}
            </Space>
        );
    }

    return "Sin lotes asociados";
}


function getTipoCosechaProceso(proceso: ProcesoRow) {
    return proceso.cosecha?.tipoCosecha ?? null;
}

function normalizeProceso(proceso: ProcesoRow): ProcesoRow {
    return {
        ...proceso,
        lote: proceso.lote ?? proceso.Lote ?? null,
    };
}


function construirPayloadProceso(
    values: ProcesoFormValues,
): CreateProcesoTrazabilidadDto {
    const distribucion = values.lotes.map((item) => ({
        loteId: Number(item.loteId),
        kilosUsados: Number(item.kilosUsados),
    }));

    const totalIngresado = Number(
        distribucion.reduce(
            (total, item) =>
                total + item.kilosUsados,
            0,
        ).toFixed(2),
    );

    const inicio =
        values.inicioFermentacion?.toISOString() ?? null;

    const fin =
        values.finFermentacion?.toISOString() ?? null;

    return {
        fecha: values.fecha.format("YYYY-MM-DD"),

        fechaInicio: inicio,
        fechaFin: fin,

        inicioFermentacion: inicio,
        finFermentacion: fin,

        duracionHoras: values.duracionHoras,

        lotes: distribucion,

        cosechaId: values.cosechaId ?? null,

        inicioOxidacion: values.inicioOxidacion?.toISOString() ?? null,
        finOxidacion: values.finOxidacion?.toISOString() ?? null,
        tanqueOxidacion: values.tanqueOxidacion?.trim() || null,

        kilosIngresados: totalIngresado,

        fueDespulpado:
            values.fueDespulpado ?? false,

        tanqueFermentacion:
            values.tanqueFermentacion?.trim() || null,

        nivelPh: values.nivelPh ?? null,

        tempMaxima: values.tempMaxima ?? null,

        tempMinima: values.tempMinima ?? null,

        fueLavado: values.fueLavado ?? false,
    };
}


export default function TrazabilidadPage() {
    const pantallas = Grid.useBreakpoint();
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
    const cosechaDelProceso = selectedProceso?.cosecha;
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [filtroMes, setFiltroMes] = useState<Dayjs | null>(null);
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
            mostrarError("No se pudieron cargar los datos de trazabilidad.");

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

    async function onFinish(
        values: ProcesoFormValues,
    ) {
        setSaving(true);

        try {
            const payload =
                construirPayloadProceso(values);

            await createProcesoTrazabilidad(payload);

            message.success(
                "Proceso registrado correctamente",
            );

            setIsModalOpen(false);

            await cargarDatos();
        } catch (error: any) {
            console.error(
                "Error registrando proceso:",
                error,
            );

            mostrarError(
                error?.response?.data?.message ||
                error?.message ||
                "No se pudo registrar el proceso",
            );

            throw error;
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

    async function handleEditSubmit(
        id: number,
        values: ProcesoFormValues,
    ) {
        setSaving(true);

        try {
            const payload =
                construirPayloadProceso(values);

            await updateProcesoTrazabilidad(
                id,
                payload,
            );

            message.success(
                "Proceso actualizado correctamente",
            );

            setIsEditModalOpen(false);
            setEditingProceso(null);

            await cargarDatos();
        } catch (error: any) {
            console.error(
                "Error actualizando proceso:",
                error,
            );

            mostrarError(
                error?.response?.data?.message ||
                error?.message ||
                "No se pudo actualizar el proceso",
            );

            throw error;
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
            mostrarError(
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

    const procesosFiltrados = useMemo(() => {
        const filtrados = procesos.filter((proceso) => {
            const fecha = dayjs.utc(proceso.fecha);

            const cumpleMes = filtroMes
                ? fecha.month() === filtroMes.month() &&
                fecha.year() === filtroMes.year()
                : true;

            const tipoCosechaProceso = getTipoCosechaProceso(proceso);

            const cumpleTipoCosecha = filtroTipoCosecha
                ? tipoCosechaProceso === filtroTipoCosecha
                : true;

            const cumpleLote = filtroLote
                ? (
                    proceso.procesoLotes?.some(
                        (item) =>
                            item.lote?.codigo === filtroLote,
                    ) ||
                    proceso.lote?.codigo === filtroLote ||
                    proceso.Lote?.codigo === filtroLote ||
                    proceso.cosecha?.cosechaLotes?.some(
                        (item) =>
                            item.lote.codigo === filtroLote,
                    ) ||
                    proceso.cosecha?.lotes
                        ?.toLowerCase()
                        .includes(filtroLote.toLowerCase())
                )
                : true;

            return cumpleMes && cumpleTipoCosecha && cumpleLote;
        });

        return [...filtrados].sort((a, b) => {
            let valorA = 0;
            let valorB = 0;

            switch (ordenCampo) {
                case "fecha":
                    valorA = dayjs.utc(a.fecha).valueOf();

                    valorB = dayjs.utc(b.fecha).valueOf();

                    break;

                case "kilosIngresados":
                    valorA = Number(a.kilosIngresados ?? 0);
                    valorB = Number(b.kilosIngresados ?? 0);
                    break;

            }

            return ordenDireccion === "asc"
                ? valorA - valorB
                : valorB - valorA;
        });
    }, [
        procesos,
        filtroMes,
        filtroTipoCosecha,
        filtroLote,
        ordenCampo,
        ordenDireccion,
    ]);

    const totalIngresado = procesosFiltrados.reduce(
        (total, proceso) => total + Number(proceso.kilosIngresados ?? 0),
        0,
    );

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
            title: "Oxidación",
            key: "oxidacion",
            width: 220,
            render: (_: unknown, record) => renderEtapa(
                record.inicioOxidacion,
                record.finOxidacion,
                duracionEtapa(record.inicioOxidacion, record.finOxidacion),
            ),
        },
        {
            title: "Fermentación",
            key: "fermentacion",
            width: 220,
            render: (_: unknown, record) => {
                const inicio = record.inicioFermentacion ?? (record.codigo?.startsWith("PRO-LEGACY-") ? null : record.fechaInicio);
                const fin = record.finFermentacion ?? (record.codigo?.startsWith("PRO-LEGACY-") ? null : record.fechaFin);
                const duracion = duracionEtapa(inicio, fin) ??
                    formatearDuracionHoras(record.duracionHoras);
                return renderEtapa(inicio, fin, duracion);
            },
        },
        {
            title: "Fecha del proceso",
            dataIndex: "fecha",
            key: "fecha",
            width: 120,

            render: (fecha: string) =>
                dayjs
                    .utc(fecha)
                    .format("DD/MM/YYYY"),

            sorter: (a, b) =>
                dayjs.utc(a.fecha).valueOf() -
                dayjs.utc(b.fecha).valueOf(),
        },
        {
            title: "Lote Origen",
            key: "loteOrigen",
            width: 240,
            render: (_: unknown, record) => renderLoteOrigen(record),
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
                    <Row gutter={[12, 12]} align="middle">
                        <Col xs={24} sm={12} lg={8} xl={4}>
                            <DatePicker locale={esES} picker="month" value={filtroMes}
                                onChange={setFiltroMes} format="MMMM YYYY" placeholder="Todos los meses"
                                allowClear style={{ width: "100%" }} aria-label="Filtrar por mes" />
                        </Col>
                        <Col xs={24} sm={12} lg={8} xl={4}>
                            <Select allowClear placeholder="Tipo de cosecha" value={filtroTipoCosecha}
                                onChange={(value) => setFiltroTipoCosecha(value ?? null)} style={{ width: "100%" }}
                                aria-label="Filtrar por tipo de cosecha"
                                options={[
                                    { value: "plena", label: "Plena" },
                                    { value: "rebusca", label: "Rebusca" },
                                    { value: "selectiva", label: "Selectiva" },
                                    { value: "raspa", label: "Raspa" },
                                ]} />
                        </Col>
                        <Col xs={24} sm={12} lg={8} xl={5}>
                            <Select allowClear showSearch optionFilterProp="label" placeholder="Lote de origen"
                                value={filtroLote} onChange={(value) => setFiltroLote(value ?? null)}
                                style={{ width: "100%" }} aria-label="Filtrar por lote de origen" options={loteOptions} />
                        </Col>
                        <Col xs={24} sm={12} lg={8} xl={4}>
                            <Select value={ordenCampo} onChange={setOrdenCampo} style={{ width: "100%" }}
                                aria-label="Campo de ordenamiento"
                                options={[
                                    { value: "fecha", label: "Ordenar por fecha" },
                                    { value: "kilosIngresados", label: "Ordenar por kg ingresados" },
                                ]} />
                        </Col>
                        <Col xs={24} sm={12} lg={8} xl={4}>
                            <Select value={ordenDireccion} onChange={setOrdenDireccion} style={{ width: "100%" }}
                                aria-label="Dirección del ordenamiento"
                                options={[
                                    { value: "desc", label: "Descendente" },
                                    { value: "asc", label: "Ascendente" },
                                ]} />
                        </Col>
                        <Col xs={24} sm={12} lg={8} xl={3}>
                            <Button block onClick={limpiarFiltros}>Limpiar</Button>
                        </Col>
                    </Row>
                </Card>

                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                        <Card hoverable>
                            <Statistic
                                title="Procesos"
                                value={procesosFiltrados.length}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} sm={12}>
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
                width="min(1120px, calc(100% - 32px))"
                styles={{
                    body: { maxHeight: "calc(100dvh - 144px)", overflowY: "auto" },
                }}
            >
                {selectedProceso && (
                    <Descriptions
                        bordered
                        column={{
                            xs: 1,
                            sm: 1,
                            md: 1,
                            lg: 2,
                        }}
                        layout={pantallas.sm ? "horizontal" : "vertical"}
                        size={pantallas.sm ? "middle" : "small"}
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

                        <Descriptions.Item label="Fecha">
                            {dayjs.utc(selectedProceso.fecha).format("DD/MM/YYYY")}
                        </Descriptions.Item>

                        <Descriptions.Item label="Lote Origen" span="filled">
                            {renderLoteOrigen(selectedProceso)}
                        </Descriptions.Item>

                        {cosechaDelProceso?.tipoCosecha && (
                            <Descriptions.Item label="Tipo de Cosecha">
                                {cosechaDelProceso.tipoCosecha}
                            </Descriptions.Item>
                        )}

                        {cosechaDelProceso?.kilosCosechados != null && (
                            <Descriptions.Item label="Kg Cosechados">
                                {formatKg(cosechaDelProceso.kilosCosechados)}
                            </Descriptions.Item>
                        )}

                        <Descriptions.Item label="Posa / Tanque">
                            {selectedProceso.tanqueFermentacion ? (
                                <Tag color="blue">{selectedProceso.tanqueFermentacion}</Tag>
                            ) : (
                                "No registrado"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="Duración de fermentación">
                            {duracionEtapa(selectedProceso.inicioFermentacion, selectedProceso.finFermentacion) ??
                                formatearDuracionHoras(selectedProceso.duracionHoras) ?? "—"}
                        </Descriptions.Item>

                        <Descriptions.Item label="Inicio de oxidación">
                            {selectedProceso.inicioOxidacion ? dayjs(selectedProceso.inicioOxidacion).format("DD/MM/YYYY HH:mm") : "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Fin de oxidación">
                            {selectedProceso.finOxidacion ? dayjs(selectedProceso.finOxidacion).format("DD/MM/YYYY HH:mm") : "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Duración de oxidación">
                            {duracionEtapa(selectedProceso.inicioOxidacion, selectedProceso.finOxidacion) ?? "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Posa / Tanque de oxidación">
                            {selectedProceso.tanqueOxidacion ?? "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Inicio Fermentación">
                            {selectedProceso.inicioFermentacion
                                ? dayjs(selectedProceso.inicioFermentacion).format(
                                    "DD/MM/YYYY HH:mm",
                                )
                                : selectedProceso.fechaInicio
                                    ? dayjs(selectedProceso.fechaInicio).format(
                                        "DD/MM/YYYY HH:mm",
                                    )
                                    : "No registrada"}
                        </Descriptions.Item>

                        <Descriptions.Item label="Fin Fermentación">
                            {selectedProceso.finFermentacion
                                ? dayjs(selectedProceso.finFermentacion).format(
                                    "DD/MM/YYYY HH:mm",
                                )
                                : "No registrada"}
                        </Descriptions.Item>

                        <Descriptions.Item label="Temperaturas">
                            {selectedProceso.tempMinima != null || selectedProceso.tempMaxima != null ? (
                                <Space>
                                    <span>Mín: <strong>{selectedProceso.tempMinima != null ? `${selectedProceso.tempMinima} °C` : "-"}</strong></span>
                                    <span>·</span>
                                    <span>Máx: <strong>{selectedProceso.tempMaxima != null ? `${selectedProceso.tempMaxima} °C` : "-"}</strong></span>
                                </Space>
                            ) : (
                                "No registradas"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="pH de salida">
                            {selectedProceso.nivelPh != null ? (
                                <Tag color="geekblue">{selectedProceso.nivelPh} pH</Tag>
                            ) : (
                                "No registrado"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="¿Se despulpó?">
                            <Tag color={selectedProceso.fueDespulpado ? "green" : "default"}>
                                {selectedProceso.fueDespulpado ? "Sí" : "No"}
                            </Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="¿Se lavó?">
                            <Tag color={selectedProceso.fueLavado ? "green" : "default"}>
                                {selectedProceso.fueLavado ? "Sí" : "No"}
                            </Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Kg Ingresados">
                            {formatKg(selectedProceso.kilosIngresados)}
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
                {selectedProceso && (
                    <section aria-label="Distribución de kilos" style={{ marginTop: 16 }}>
                        <Typography.Title level={5}>Distribución de kilos</Typography.Title>
                        {selectedProceso.procesoLotes?.length ? (
                            <Table
                                size="small"
                                rowKey="id"
                                pagination={false}
                                dataSource={selectedProceso.procesoLotes}
                                columns={[
                                    {
                                        title: "Lote",
                                        render: (_, item) =>
                                            item.lote?.codigo ?? `Lote #${item.loteId}`,
                                    },
                                    {
                                        title: "Kilos utilizados",
                                        dataIndex: "kilosUsados",
                                        align: "right",
                                        render: (value: number) => formatKg(value),
                                    },
                                ]}
                            />
                        ) : (
                            <Typography.Text type="secondary">
                                Sin distribución individual registrada
                            </Typography.Text>
                        )}
                    </section>
                )}
            </Modal>
        </div>
    );
}