import { mostrarError } from "../../utils/mostrarError";
// src/pages/lotes-fisicos/LotesFisicosPage.tsx


import { useCallback, useEffect, useMemo, useState } from "react";

import {
    Alert,
    Button,
    Card,
    Col,
    Descriptions,
    Empty,
    Form,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Statistic,
    Switch,
    Table,
    Tag,
    Typography,
    message,
    theme,
} from "antd";

import type { ColumnsType } from "antd/es/table";

import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    EnvironmentOutlined,
    EyeOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import {
    actualizarLoteFisicoApi,
    crearLoteFisicoApi,
    eliminarLoteFisicoApi,
    getLoteFisicoApi,
    getLotesFisicosApi,
} from "./lotes-fisicos.api";

import type {
    CrearLoteFisicoDTO,
    LoteFisico,
} from "./lotes-fisicos.api";

import {
    getFundosApi,
} from "../cosechas/fundos.api";

import type {
    Fundo,
} from "../cosechas/fundos.api";

dayjs.extend(utc);

type FormValues = CrearLoteFisicoDTO;

function obtenerMensajeError(
    error: unknown,
    fallback: string,
): string {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
    ) {
        const response = (
            error as {
                response?: {
                    data?: {
                        message?: string;
                    };
                };
            }
        ).response;

        if (response?.data?.message) {
            return response.data.message;
        }
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
}

function formatoHectareas(valor?: number | null) {
    return Number(valor ?? 0).toLocaleString("es-CL", {
        maximumFractionDigits: 2,
    });
}

export default function LotesFisicosPage() {
    const { token } = theme.useToken();
    const [form] = Form.useForm<FormValues>();

    const [lotes, setLotes] = useState<LoteFisico[]>([]);
    const [fundos, setFundos] = useState<Fundo[]>([]);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [searchText, setSearchText] = useState("");
    const [filtroFundo, setFiltroFundo] = useState<number>();
    const [filtroEstado, setFiltroEstado] =
        useState<"activos" | "inactivos" | "todos">("todos");

    const [modalAbierto, setModalAbierto] = useState(false);
    const [loteEditando, setLoteEditando] =
        useState<LoteFisico | null>(null);

    const [detalleAbierto, setDetalleAbierto] = useState(false);
    const [detalle, setDetalle] = useState<LoteFisico | null>(null);
    const [loadingDetalle, setLoadingDetalle] = useState(false);

    const fundoSeleccionado = Form.useWatch(
        "fundoId",
        form,
    );

    const numeroSeleccionado = Form.useWatch(
        "numero",
        form,
    );

    const codigoSugerido = useMemo(() => {
        const fundo = fundos.find(
            (item) => item.id === fundoSeleccionado,
        );

        if (
            !fundo ||
            !Number.isInteger(Number(numeroSeleccionado)) ||
            Number(numeroSeleccionado) <= 0
        ) {
            return "";
        }

        return `${fundo.codigo}-${numeroSeleccionado}`.toUpperCase();
    }, [fundos, fundoSeleccionado, numeroSeleccionado]);

    /* =========================================
       CARGA DE INFORMACIÓN
    ========================================= */

    const cargarDatos = useCallback(async () => {
        setLoading(true);

        try {
            const [listaLotes, listaFundos] = await Promise.all([
                getLotesFisicosApi(),
                getFundosApi(),
            ]);

            setLotes(listaLotes);
            setFundos(listaFundos);
        } catch (error) {
            mostrarError(
                obtenerMensajeError(
                    error,
                    "No se pudieron cargar los lotes físicos",
                ),
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void cargarDatos();
    }, [cargarDatos]);

    /* =========================================
       FILTROS E INDICADORES
    ========================================= */

    const resumen = useMemo(() => {
        const activos = lotes.filter((lote) => lote.activo);
        const inactivos = lotes.filter((lote) => !lote.activo);

        const hectareas = lotes.reduce(
            (total, lote) =>
                total + Number(lote.hectareas ?? 0),
            0,
        );

        return {
            total: lotes.length,
            activos: activos.length,
            inactivos: inactivos.length,
            hectareas,
        };
    }, [lotes]);

    const lotesFiltrados = useMemo(() => {
        const texto = searchText.trim().toLowerCase();

        return lotes.filter((lote) => {
            if (
                filtroFundo !== undefined &&
                lote.fundoId !== filtroFundo
            ) {
                return false;
            }

            if (
                filtroEstado === "activos" &&
                !lote.activo
            ) {
                return false;
            }

            if (
                filtroEstado === "inactivos" &&
                lote.activo
            ) {
                return false;
            }

            if (texto) {
                const valores = [
                    lote.codigo,
                    String(lote.numero),
                    lote.fundo?.codigo,
                    lote.fundo?.nombre ?? "",
                ];

                if (
                    !valores.some((valor) =>
                        valor?.toLowerCase().includes(texto),
                    )
                ) {
                    return false;
                }
            }

            return true;
        });
    }, [lotes, searchText, filtroFundo, filtroEstado]);

    /* =========================================
       MODALES CREAR / EDITAR
    ========================================= */

    function abrirCrear() {
        setLoteEditando(null);
        form.resetFields();

        form.setFieldsValue({
            activo: true,
        });

        setModalAbierto(true);
    }

    function abrirEditar(lote: LoteFisico) {
        setLoteEditando(lote);

        form.resetFields();
        form.setFieldsValue({
            fundoId: lote.fundoId,
            numero: lote.numero,
            hectareas: lote.hectareas,
            activo: lote.activo,
            codigo: lote.codigo,
        });

        setModalAbierto(true);
    }

    function cerrarModal() {
        if (submitting) return;

        setModalAbierto(false);
        setLoteEditando(null);
        form.resetFields();
    }

    async function guardarLote() {
        try {
            const values = await form.validateFields();

            setSubmitting(true);

            if (loteEditando) {
                const cambios = {
                    fondoId: values.fundoId,
                    numero: values.numero,
                    hectareas: values.hectareas ?? null,
                    activo: values.activo ?? true,
                };

                await actualizarLoteFisicoApi(
                    loteEditando.id,
                    cambios,
                );

                message.success(
                    "Lote físico actualizado correctamente",
                );
            } else {
                await crearLoteFisicoApi({
                    fundoId: values.fundoId,
                    numero: values.numero,
                    hectareas: values.hectareas ?? null,
                    activo: values.activo ?? true,
                });

                message.success(
                    "Lote físico creado correctamente",
                );
            }

            setModalAbierto(false);
            setLoteEditando(null);
            form.resetFields();

            await cargarDatos();
        } catch (error) {
            // Errores de validación de Ant Design:
            // los muestra directamente en los campos.
            if (
                typeof error === "object" &&
                error !== null &&
                "errorFields" in error
            ) {
                return;
            }

            mostrarError(
                obtenerMensajeError(
                    error,
                    "No se pudo guardar el lote físico",
                ),
            );
        } finally {
            setSubmitting(false);
        }
    }

    /* =========================================
       DETALLE
    ========================================= */

    async function abrirDetalle(id: number) {
        setDetalleAbierto(true);
        setLoadingDetalle(true);
        setDetalle(null);

        try {
            const resultado = await getLoteFisicoApi(id);
            setDetalle(resultado);
        } catch (error) {
            mostrarError(
                obtenerMensajeError(
                    error,
                    "No se pudo cargar el detalle",
                ),
            );
        } finally {
            setLoadingDetalle(false);
        }
    }

    /* =========================================
       ELIMINAR / DESACTIVAR
    ========================================= */

    async function eliminarLote(lote: LoteFisico) {
        try {
            const resultado = await eliminarLoteFisicoApi(
                lote.id,
            );

            message.success(
                resultado.message ||
                "Operación realizada correctamente",
            );

            await cargarDatos();
        } catch (error) {
            mostrarError(
                obtenerMensajeError(
                    error,
                    "No se pudo eliminar el lote físico",
                ),
            );
        }
    }

    async function cambiarEstado(
        lote: LoteFisico,
        activo: boolean,
    ) {
        try {
            await actualizarLoteFisicoApi(lote.id, {
                activo,
            });

            message.success(
                activo
                    ? "Lote físico activado correctamente"
                    : "Lote físico desactivado correctamente",
            );

            await cargarDatos();
        } catch (error) {
            mostrarError(
                obtenerMensajeError(
                    error,
                    "No se pudo cambiar el estado",
                ),
            );
        }
    }

    /* =========================================
       TABLA
    ========================================= */

    const columnas: ColumnsType<LoteFisico> = [
        {
            title: "Código",
            dataIndex: "codigo",
            key: "codigo",
            width: 150,
            render: (codigo: string) => (
                <Tag color="blue">{codigo}</Tag>
            ),
            sorter: (a, b) =>
                a.codigo.localeCompare(b.codigo),
        },
        {
            title: "Número",
            dataIndex: "numero",
            key: "numero",
            width: 110,
            render: (numero: number) => (
                <Typography.Text strong>
                    N° {numero}
                </Typography.Text>
            ),
            sorter: (a, b) => a.numero - b.numero,
        },
        {
            title: "Fundo",
            key: "fundo",
            width: 220,
            render: (_: unknown, lote) => (
                <Space direction="vertical" size={0}>
                    <Typography.Text strong>
                        {lote.fundo?.codigo ?? "-"}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                        {lote.fundo?.nombre ?? "Sin nombre"}
                    </Typography.Text>
                </Space>
            ),
        },
        {
            title: "Hectáreas",
            key: "hectareas",
            width: 130,
            render: (_: unknown, lote) =>
                lote.hectareas !== null
                    ? `${formatoHectareas(lote.hectareas)} ha`
                    : "-",
            sorter: (a, b) =>
                Number(a.hectareas ?? 0) -
                Number(b.hectareas ?? 0),
        },
        {
            title: "Cosechas",
            key: "cosechas",
            width: 120,
            align: "center",
            render: (_: unknown, lote) => (
                <Tag color={lote._count?.cosechas ? "cyan" : "default"}>
                    {lote._count?.cosechas ?? 0}
                </Tag>
            ),
            sorter: (a, b) =>
                (a._count?.cosechas ?? 0) -
                (b._count?.cosechas ?? 0),
        },
        {
            title: "Estado",
            key: "estado",
            width: 125,
            render: (_: unknown, lote) => (
                <Tag
                    icon={
                        lote.activo
                            ? <CheckCircleOutlined />
                            : <CloseCircleOutlined />
                    }
                    color={lote.activo ? "success" : "default"}
                >
                    {lote.activo ? "Activo" : "Inactivo"}
                </Tag>
            ),
        },
        {
            title: "Acciones",
            key: "acciones",
            width: 185,
            fixed: "right",
            render: (_: unknown, lote) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        title="Ver detalle"
                        onClick={() => abrirDetalle(lote.id)}
                    />

                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        title="Editar"
                        onClick={() => abrirEditar(lote)}
                    />

                    <Popconfirm
                        title={
                            lote.activo
                                ? "Desactivar lote"
                                : "Reactivar lote"
                        }
                        description={
                            lote.activo
                                ? "¿Deseas desactivar este lote físico?"
                                : "¿Deseas reactivar este lote físico?"
                        }
                        onConfirm={() =>
                            cambiarEstado(lote, !lote.activo)
                        }
                        okText="Confirmar"
                        cancelText="Cancelar"
                    >
                        <Button
                            type="text"
                            title={
                                lote.activo ? "Desactivar" : "Reactivar"
                            }
                            icon={
                                lote.activo
                                    ? <CloseCircleOutlined />
                                    : <CheckCircleOutlined />
                            }
                        />
                    </Popconfirm>

                    <Popconfirm
                        title="Eliminar lote físico"
                        description={
                            (lote._count?.cosechas ?? 0) > 0
                                ? "Tiene cosechas asociadas. Se desactivará para conservar su historial."
                                : "¿Eliminar permanentemente este lote físico?"
                        }
                        onConfirm={() => eliminarLote(lote)}
                        okText="Confirmar"
                        cancelText="Cancelar"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            title="Eliminar"
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    /* =========================================
       INTERFAZ
    ========================================= */

    return (
        <Space
            direction="vertical"
            size="large"
            style={{ width: "100%" }}
        >
            {/* Encabezado */}
            <Row
                gutter={[16, 16]}
                align="middle"
                justify="space-between"
            >
                <Col xs={24} md={15}>
                    <Typography.Title level={2} style={{ margin: 0 }}>
                        <EnvironmentOutlined
                            style={{
                                color: token.colorPrimary,
                                marginRight: 10,
                            }}
                        />
                        Gestión de Lotes Físicos
                    </Typography.Title>

                    <Typography.Text type="secondary">
                        Administración de cuarteles físicos,
                        fundos y sectores de origen de las cosechas.
                    </Typography.Text>
                </Col>

                <Col xs={24} md={9}>
                    <Space
                        wrap
                        style={{
                            width: "100%",
                            justifyContent: "flex-end",
                        }}
                    >
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => void cargarDatos()}
                            loading={loading}
                        >
                            Actualizar
                        </Button>

                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={abrirCrear}
                        >
                            Nuevo Lote Físico
                        </Button>
                    </Space>
                </Col>
            </Row>

            {/* Indicadores */}
            <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total de lotes"
                            value={resumen.total}
                        />
                    </Card>
                </Col>

                <Col xs={12} md={6}>
                    <Card>
                        <Statistic
                            title="Activos"
                            value={resumen.activos}
                            styles={{
                                content: {
                                    color: token.colorSuccess,
                                },
                            }}
                        />
                    </Card>
                </Col>

                <Col xs={12} md={6}>
                    <Card>
                        <Statistic
                            title="Inactivos"
                            value={resumen.inactivos}
                            styles={{
                                content: {
                                    color: token.colorTextSecondary,
                                },
                            }}
                        />
                    </Card>
                </Col>

                <Col xs={12} md={6}>
                    <Card>
                        <Statistic
                            title="Hectáreas registradas"
                            value={resumen.hectareas}
                            precision={2}
                            suffix="ha"
                        />
                    </Card>
                </Col>
            </Row>

            {/* Tabla y filtros */}
            <Card>
                <Row
                    gutter={[12, 12]}
                    align="middle"
                    style={{ marginBottom: 16 }}
                >
                    <Col xs={24} sm={12} lg={10}>
                        <Input
                            placeholder="Buscar por código, número o fundo..."
                            prefix={<SearchOutlined />}
                            allowClear
                            value={searchText}
                            onChange={(event) =>
                                setSearchText(event.target.value)
                            }
                        />
                    </Col>

                    <Col xs={24} sm={12} lg={7}>
                        <Select
                            style={{ width: "100%" }}
                            placeholder="Filtrar por fundo"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            value={filtroFundo}
                            onChange={setFiltroFundo}
                            options={fundos.map((fundo) => ({
                                value: fundo.id,
                                label: `${fundo.codigo} - ${fundo.nombre || fundo.codigo
                                    }`,
                            }))}
                        />
                    </Col>

                    <Col xs={24} sm={12} lg={5}>
                        <Select
                            style={{ width: "100%" }}
                            value={filtroEstado}
                            onChange={setFiltroEstado}
                            options={[
                                { value: "todos", label: "Todos" },
                                { value: "activos", label: "Activos" },
                                { value: "inactivos", label: "Inactivos" },
                            ]}
                        />
                    </Col>

                    <Col xs={24} sm={12} lg={2}>
                        <Button
                            block
                            onClick={() => {
                                setSearchText("");
                                setFiltroFundo(undefined);
                                setFiltroEstado("todos");
                            }}
                        >
                            Limpiar
                        </Button>
                    </Col>
                </Row>

                <Table<LoteFisico>
                    columns={columnas}
                    dataSource={lotesFiltrados}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                    }}
                    scroll={{ x: "max-content" }}
                    locale={{
                        emptyText: (
                            <Empty description="No se encontraron lotes físicos" />
                        ),
                    }}
                />
            </Card>

            {/* Modal Crear / Editar */}
            <Modal
                title={
                    loteEditando
                        ? `Editar ${loteEditando.codigo}`
                        : "Nuevo Lote Físico"
                }
                open={modalAbierto}
                onCancel={cerrarModal}
                onOk={() => void guardarLote()}
                confirmLoading={submitting}
                okText={
                    loteEditando ? "Guardar cambios" : "Crear lote"
                }
                cancelText="Cancelar"
                width="min(620px, 95vw)"
                destroyOnClose
            >
                <Form<FormValues>
                    form={form}
                    layout="vertical"
                    style={{ marginTop: 20 }}
                >
                    {loteEditando &&
                        (loteEditando._count?.cosechas ?? 0) > 0 && (
                            <Alert
                                type="info"
                                showIcon
                                style={{ marginBottom: 16 }}
                                message="Lote con historial"
                                description="El número y el fundo no pueden modificarse porque este lote físico tiene cosechas asociadas."
                            />
                        )}

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="fundoId"
                                label="Fundo"
                                tooltip="Un fundo es una unidad agrícola que agrupa los lotes físicos o cuarteles donde se realiza la cosecha. Ejemplo: el fundo FSC contiene los lotes FSC-1, FSC-2, etc."
                                rules={[
                                    {
                                        required: true,
                                        message: "Seleccione un fundo",
                                    },
                                ]}
                            >
                                <Select
                                    placeholder="Seleccione un fundo"
                                    showSearch
                                    optionFilterProp="label"
                                    disabled={
                                        !!loteEditando &&
                                        (loteEditando._count?.cosechas ?? 0) > 0
                                    }
                                    options={fundos
                                        .filter(
                                            (fundo) =>
                                                fundo.activo ||
                                                fundo.id === loteEditando?.fundoId,
                                        )
                                        .map((fundo) => ({
                                            value: fundo.id,
                                            label: `${fundo.codigo} - ${fundo.nombre || fundo.codigo
                                                }`,
                                        }))}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="numero"
                                label="Número del lote"
                                rules={[
                                    {
                                        required: true,
                                        message: "Ingrese el número",
                                    },
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    precision={0}
                                    style={{ width: "100%" }}
                                    placeholder="Ej: 15"
                                    disabled={
                                        !!loteEditando &&
                                        (loteEditando._count?.cosechas ?? 0) > 0
                                    }
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Código generado">
                        <Input
                            readOnly
                            value={
                                loteEditando
                                    ? loteEditando.codigo
                                    : codigoSugerido
                            }
                            placeholder="Seleccione fundo y número"
                        />
                    </Form.Item>

                    <Form.Item
                        name="hectareas"
                        label="Superficie del lote"
                        extra="Hectáreas correspondientes al cuartel físico."
                    >
                        <InputNumber
                            min={0}
                            precision={2} decimalSeparator=","
                            addonAfter="ha"
                            style={{ width: "100%" }}
                            placeholder="Ej: 0.75"
                        />
                    </Form.Item>

                    <Form.Item
                        name="activo"
                        label="Estado"
                        valuePropName="checked"
                    >
                        <Switch
                            checkedChildren="Activo"
                            unCheckedChildren="Inactivo"
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Detalle */}
            <Modal
                title={
                    detalle
                        ? `Detalle ${detalle.codigo}`
                        : "Detalle del Lote Físico"
                }
                open={detalleAbierto}
                onCancel={() => {
                    setDetalleAbierto(false);
                    setDetalle(null);
                }}
                footer={[
                    <Button
                        key="cerrar"
                        onClick={() => {
                            setDetalleAbierto(false);
                            setDetalle(null);
                        }}
                    >
                        Cerrar
                    </Button>,
                ]}
                width="min(680px, 95vw)"
            >
                <div style={{ marginTop: 20 }}>
                    {loadingDetalle ? (
                        <Typography.Text type="secondary">
                            Cargando detalle...
                        </Typography.Text>
                    ) : detalle ? (
                        <>
                            <Descriptions
                                bordered
                                size="small"
                                column={1}
                            >
                                <Descriptions.Item label="Código">
                                    <Tag color="blue">
                                        {detalle.codigo}
                                    </Tag>
                                </Descriptions.Item>

                                <Descriptions.Item label="Número">
                                    N° {detalle.numero}
                                </Descriptions.Item>

                                <Descriptions.Item label="Fundo">
                                    {detalle.fundo.codigo} -{" "}
                                    {detalle.fundo.nombre ??
                                        detalle.fundo.codigo}
                                </Descriptions.Item>

                                <Descriptions.Item label="Hectáreas">
                                    {detalle.hectareas !== null
                                        ? `${formatoHectareas(
                                            detalle.hectareas,
                                        )} ha`
                                        : "No registradas"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Estado">
                                    <Tag
                                        color={
                                            detalle.activo
                                                ? "success"
                                                : "default"
                                        }
                                    >
                                        {detalle.activo
                                            ? "Activo"
                                            : "Inactivo"}
                                    </Tag>
                                </Descriptions.Item>

                                <Descriptions.Item label="Cosechas asociadas">
                                    {detalle._count?.cosechas ?? 0}
                                </Descriptions.Item>
                            </Descriptions>

                            <Typography.Title
                                level={5}
                                style={{ marginTop: 24 }}
                            >
                                Historial de cosechas
                            </Typography.Title>

                            {detalle.cosechas?.length ? (
                                <Table
                                    size="small"
                                    rowKey="id"
                                    dataSource={detalle.cosechas}
                                    pagination={{ pageSize: 5 }}
                                    scroll={{ x: "max-content" }}
                                    columns={[
                                        {
                                            title: "Código",
                                            render: (
                                                _: unknown,
                                                item: NonNullable<
                                                    LoteFisico["cosechas"]
                                                >[number],
                                            ) =>
                                                `COS-${String(
                                                    item.cosecha.id,
                                                ).padStart(3, "0")}`,
                                        },
                                        {
                                            title: "Fecha",
                                            render: (
                                                _: unknown,
                                                item: NonNullable<
                                                    LoteFisico["cosechas"]
                                                >[number],
                                            ) =>
                                                dayjs.utc(
                                                    item.cosecha.fecha,
                                                ).format("DD/MM/YYYY"),
                                        },
                                        {
                                            title: "Kilos",
                                            render: (
                                                _: unknown,
                                                item: NonNullable<
                                                    LoteFisico["cosechas"]
                                                >[number],
                                            ) =>
                                                `${Number(
                                                    item.cosecha.kilosCosechados,
                                                ).toLocaleString("es-CL")} kg`,
                                        },
                                    ]}
                                />
                            ) : (
                                <Empty
                                    description="Sin cosechas asociadas"
                                />
                            )}
                        </>
                    ) : (
                        <Empty description="No se pudo obtener el detalle" />
                    )}
                </div>
            </Modal>
        </Space>
    );
}
