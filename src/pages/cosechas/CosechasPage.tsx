// src/pages/cosechas/CosechasPage.tsx
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Form,
    InputNumber,
    message,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Typography,
    Statistic
} from "antd";
import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import esES from "antd/es/date-picker/locale/es_ES";
import "dayjs/locale/es";

import {
    createCosecha,
    deleteCosecha,
    getCosechas,
    updateCosecha,
    type Cosecha,
    type CreateCosechaDto,
} from "./cosechas.api";

import { getLotes, type Lote } from "../lotes/lotes.api";

type CosechaFormValues = {
    fecha: Dayjs;
    kilosCosechados: number;
    cantidadCosechadores: number;
    loteIds: number[];
    lotes?: string;
    totalHectareas: number;
    tipoCosecha: string;
};

type SortField = "fecha" | "kilosCosechados" | "totalHectareas";
type SortOrder = "asc" | "desc";

export default function CosechasPage() {
    dayjs.locale("es");
    const [cosechas, setCosechas] = useState<Cosecha[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCosecha, setEditingCosecha] = useState<Cosecha | null>(null);

    const [lotesDisponibles, setLotesDisponibles] = useState<Lote[]>([]);
    const [filtroMes, setFiltroMes] = useState<Dayjs | null>(() => dayjs());
    const [filtroTipoCosecha, setFiltroTipoCosecha] = useState<string | null>(null);
    const [filtroLoteId, setFiltroLoteId] = useState<number | null>(null);
    const [ordenCampo, setOrdenCampo] = useState<SortField>("fecha");
    const [ordenDireccion, setOrdenDireccion] = useState<SortOrder>("asc");

    const [selectedCosecha, setSelectedCosecha] = useState<Cosecha | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [form] = Form.useForm<CosechaFormValues>();

    useEffect(() => {
        cargarDatos();
    }, []);

    async function cargarDatos() {
        try {
            setLoading(true);

            const [cosechasData, lotesData] = await Promise.all([
                getCosechas(),
                getLotes(),
            ]);

            setCosechas(cosechasData);
            setLotesDisponibles(lotesData);
        } catch (error) {
            console.error("Error cargando datos:", error);
            message.error("No se pudieron cargar los datos.");
        } finally {
            setLoading(false);
        }
    }

    function showModal() {
        setEditingCosecha(null);
        form.resetFields();
        setIsModalVisible(true);
    }

    function handleCancel() {
        setIsModalVisible(false);
        setEditingCosecha(null);
        form.resetFields();
    }

    async function onFinish(values: CosechaFormValues) {
        try {
            setSaving(true);

            const payload: CreateCosechaDto = {
                fecha: values.fecha.format("YYYY-MM-DD"),
                kilosCosechados: values.kilosCosechados,
                cantidadCosechadores: values.cantidadCosechadores,
                loteIds: values.loteIds ?? [],
                lotes:
                    values.loteIds && values.loteIds.length > 0
                        ? lotesDisponibles
                            .filter((lote) => values.loteIds.includes(lote.id))
                            .map((lote) => lote.codigo)
                            .join(", ")
                        : values.lotes ?? "",
                totalHectareas: values.totalHectareas,
                tipoCosecha: values.tipoCosecha,
            };

            if (editingCosecha) {
                const cosechaActualizada = await updateCosecha(
                    editingCosecha.id,
                    payload,
                );

                setCosechas((currentCosechas) =>
                    currentCosechas.map((cosecha) =>
                        cosecha.id === editingCosecha.id ? cosechaActualizada : cosecha,
                    ),
                );

                message.success("Cosecha actualizada correctamente.");
            } else {
                const nuevaCosecha = await createCosecha(payload);

                setCosechas((currentCosechas) => [nuevaCosecha, ...currentCosechas]);

                message.success("Cosecha registrada correctamente.");
            }

            setIsModalVisible(false);
            setEditingCosecha(null);
            form.resetFields();
        } catch (error) {
            console.error("Error guardando cosecha:", error);
            message.error("No se pudo guardar la cosecha.");
        } finally {
            setSaving(false);
        }
    }

    function handleView(cosecha: Cosecha) {
        setSelectedCosecha(cosecha);
        setIsDetailModalOpen(true);
    }

    function handleCloseDetailModal() {
        setSelectedCosecha(null);
        setIsDetailModalOpen(false);
    }

    function handleEdit(cosecha: Cosecha) {
        setEditingCosecha(cosecha);

        form.setFieldsValue({
            fecha: dayjs(cosecha.fecha),
            kilosCosechados: cosecha.kilosCosechados,
            cantidadCosechadores: cosecha.cantidadCosechadores,
            loteIds: cosecha.cosechaLotes?.map((item) => item.loteId) ?? [],
            lotes: cosecha.lotes,
            totalHectareas: cosecha.totalHectareas,
            tipoCosecha: cosecha.tipoCosecha,
        });

        setIsModalVisible(true);
    }

    function handleDelete(id: number) {
        Modal.confirm({
            title: "Eliminar cosecha",
            content:
                "¿Seguro que deseas eliminar esta cosecha? Si tiene procesos de trazabilidad asociados, también podrían eliminarse.",
            okText: "Eliminar",
            cancelText: "Cancelar",
            okButtonProps: {
                danger: true,
            },
            async onOk() {
                try {
                    await deleteCosecha(id);

                    setCosechas((currentCosechas) =>
                        currentCosechas.filter((cosecha) => cosecha.id !== id),
                    );

                    message.success("Cosecha eliminada correctamente.");
                } catch (error) {
                    console.error("Error eliminando cosecha:", error);
                    message.error("No se pudo eliminar la cosecha.");
                }
            },
        });
    }

    function limpiarFiltros() {
        setFiltroMes(dayjs());
        setFiltroTipoCosecha(null);
        setFiltroLoteId(null);
        setOrdenCampo("fecha");
        setOrdenDireccion("asc");
    }

    const cosechasFiltradas = useMemo(() => {
        const filtradas = cosechas.filter((cosecha) => {
            const fecha = dayjs(cosecha.fecha);

            const cumpleMes = filtroMes
                ? fecha.month() === filtroMes.month() &&
                fecha.year() === filtroMes.year()
                : true;

            const cumpleTipo = filtroTipoCosecha
                ? cosecha.tipoCosecha === filtroTipoCosecha
                : true;

            const cumpleLote = filtroLoteId
                ? cosecha.cosechaLotes?.some((item) => item.loteId === filtroLoteId)
                : true;

            return cumpleMes && cumpleTipo && cumpleLote;
        });

        return [...filtradas].sort((a, b) => {
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
        cosechas,
        filtroMes,
        filtroTipoCosecha,
        filtroLoteId,
        ordenCampo,
        ordenDireccion,
    ]);

    const kilosTotales = cosechasFiltradas.reduce(
        (total, cosecha) => total + cosecha.kilosCosechados,
        0,
    );

    const totalHectareas = cosechasFiltradas.reduce(
        (total, cosecha) => total + cosecha.totalHectareas,
        0,
    );

    const rendimiento = totalHectareas > 0 ? kilosTotales / totalHectareas : 0;

    const columns: ColumnsType<Cosecha> = [
        {
            title: "Fecha",
            dataIndex: "fecha",
            key: "fecha",
            render: (fecha: string) => dayjs(fecha).format("DD/MM/YYYY"),
        },
        {
            title: "Kilos Cosechados",
            dataIndex: "kilosCosechados",
            key: "kilosCosechados",
            render: (kilosCosechados: number) =>
                kilosCosechados.toLocaleString("es-CL"),
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
            render: (_value: string, record: Cosecha) => {
                const lotesRelacionados = record.cosechaLotes
                    ?.map((item) => item.lote.codigo)
                    .join(", ");

                return lotesRelacionados || record.lotes;
            },
        },
        {
            title: "Total Hectáreas",
            dataIndex: "totalHectareas",
            key: "totalHectareas",
            render: (totalHectareas: number) =>
                totalHectareas.toLocaleString("es-CL"),
        },
        {
            title: "Tipo Cosecha",
            dataIndex: "tipoCosecha",
            key: "tipoCosecha",
        },
        {
            title: "Acciones",
            key: "acciones",
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => handleView(record)}
                        title="Ver detalle"
                    />

                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        title="Editar cosecha"
                    />

                    <Popconfirm
                        title="Eliminar cosecha"
                        description="¿Estás seguro de eliminar esta cosecha?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Sí"
                        cancelText="No"
                    >
                        <Button danger icon={<DeleteOutlined />} title="Eliminar cosecha" />
                    </Popconfirm>
                </Space>
            ),
        }
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
                            Cosechas
                        </Typography.Title>

                        <Typography.Text type="secondary">
                            Registro y gestión de las cosechas realizadas.
                        </Typography.Text>
                    </div>

                    <Space wrap align="center">
                        <DatePicker
                            picker="month"
                            value={filtroMes}
                            onChange={(value) => setFiltroMes(value)}
                            format="MMMM YYYY"
                            placeholder="Filtrar por mes"
                            allowClear
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
                            placeholder="Lote"
                            value={filtroLoteId}
                            onChange={(value) => setFiltroLoteId(value ?? null)}
                            style={{ minWidth: 200 }}
                            options={lotesDisponibles.map((lote) => ({
                                value: lote.id,
                                label: `${lote.codigo}${lote.nombre ? ` - ${lote.nombre}` : ""}`,
                            }))}
                        />

                        <Select
                            value={ordenCampo}
                            onChange={setOrdenCampo}
                            style={{ minWidth: 190 }}
                            options={[
                                { value: "fecha", label: "Ordenar por fecha" },
                                { value: "kilosCosechados", label: "Ordenar por kilos" },
                                { value: "totalHectareas", label: "Ordenar por hectáreas" },
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

                        <Button onClick={limpiarFiltros}>
                            Limpiar filtros
                        </Button>

                        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                            Registrar Cosecha
                        </Button>
                    </Space>
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

                <Table
                    columns={columns}
                    dataSource={cosechasFiltradas}
                    rowKey="id"
                    bordered
                    loading={loading}
                    pagination={false}
                    locale={{
                        emptyText: "No hay cosechas que coincidan con los filtros seleccionados",
                    }}
                />
            </Space>

            <Modal
                title="Detalle de Cosecha"
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
                {selectedCosecha && (
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
                            {dayjs(selectedCosecha.fecha).format("DD/MM/YYYY")}
                        </Descriptions.Item>

                        <Descriptions.Item label="Tipo de Cosecha">
                            <Tag color="green">{selectedCosecha.tipoCosecha}</Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Lotes">
                            {selectedCosecha.cosechaLotes &&
                                selectedCosecha.cosechaLotes.length > 0 ? (
                                <Space wrap>
                                    {selectedCosecha.cosechaLotes.map((item) => (
                                        <Tag key={item.id} color="gold">
                                            {item.lote.codigo}
                                            {item.lote.nombre ? ` - ${item.lote.nombre}` : ""}
                                        </Tag>
                                    ))}
                                </Space>
                            ) : (
                                selectedCosecha.lotes || "-"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="Kilos Cosechados">
                            {selectedCosecha.kilosCosechados.toLocaleString("es-CL")} kg
                        </Descriptions.Item>

                        <Descriptions.Item label="Cantidad de Cosechadores">
                            {selectedCosecha.cantidadCosechadores}
                        </Descriptions.Item>

                        <Descriptions.Item label="Total Hectáreas">
                            {selectedCosecha.totalHectareas.toLocaleString("es-CL", {
                                maximumFractionDigits: 2,
                            })}{" "}
                            ha
                        </Descriptions.Item>

                        <Descriptions.Item label="Rendimiento">
                            {selectedCosecha.totalHectareas > 0
                                ? (
                                    selectedCosecha.kilosCosechados /
                                    selectedCosecha.totalHectareas
                                ).toLocaleString("es-CL", {
                                    maximumFractionDigits: 2,
                                })
                                : "0"}{" "}
                            kg/ha
                        </Descriptions.Item>

                        <Descriptions.Item label="Fecha de Registro">
                            {selectedCosecha.createdAt
                                ? dayjs(selectedCosecha.createdAt).format("DD/MM/YYYY HH:mm")
                                : "-"}
                        </Descriptions.Item>

                        <Descriptions.Item label="Última Actualización">
                            {selectedCosecha.updatedAt
                                ? dayjs(selectedCosecha.updatedAt).format("DD/MM/YYYY HH:mm")
                                : "-"}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>

            <Modal
                title={editingCosecha ? "Editar Cosecha" : "Registrar Cosecha"}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                destroyOnHidden
                centered
                width="min(780px, 95vw)"
                styles={{
                    body: {
                        maxHeight: "70vh",
                        overflowY: "auto",
                        paddingRight: 8,
                    },
                }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Fecha"
                                name="fecha"
                                rules={[{ required: true, message: "La fecha es obligatoria" }]}
                            >
                                <DatePicker
                                    style={{ width: "100%" }}
                                    locale={esES}
                                    format="DD/MM/YYYY"
                                    placeholder="Seleccione una fecha"
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Tipo Cosecha"
                                name="tipoCosecha"
                                rules={[
                                    {
                                        required: true,
                                        message: "El tipo de cosecha es obligatorio",
                                    },
                                ]}
                            >
                                <Select
                                    placeholder="Seleccione un tipo de cosecha"
                                    options={[
                                        { value: "Rebusque", label: "Rebusque" },
                                        { value: "Selectiva", label: "Selectiva" },
                                        { value: "Manual", label: "Manual" },
                                    ]}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Kilos Cosechados"
                                name="kilosCosechados"
                                rules={[
                                    {
                                        required: true,
                                        message: "Los kilos cosechados son obligatorios",
                                    },
                                ]}
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    min={0}
                                    placeholder="Ej: 150"
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Cantidad Cosechadores"
                                name="cantidadCosechadores"
                                rules={[
                                    {
                                        required: true,
                                        message: "La cantidad de cosechadores es obligatoria",
                                    },
                                ]}
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    min={0}
                                    placeholder="Ej: 4"
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Lotes"
                                name="loteIds"
                                rules={[
                                    {
                                        required: true,
                                        message: "Debe seleccionar al menos un lote",
                                    },
                                ]}
                            >
                                <Select
                                    mode="multiple"
                                    placeholder="Seleccione uno o más lotes"
                                    options={lotesDisponibles.map((lote) => ({
                                        value: lote.id,
                                        label: `${lote.codigo}${lote.nombre ? ` - ${lote.nombre}` : ""}`,
                                    }))}
                                    showSearch
                                    optionFilterProp="label"
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Total Hectáreas"
                                name="totalHectareas"
                                rules={[
                                    {
                                        required: true,
                                        message: "El total de hectáreas es obligatorio",
                                    },
                                ]}
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    min={0}
                                    placeholder="Ej: 2.5"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        style={{
                            marginBottom: 0,
                            paddingTop: 8,
                        }}
                    >
                        <Space>
                            <Button type="primary" htmlType="submit" loading={saving}>
                                {editingCosecha ? "Actualizar" : "Guardar"}
                            </Button>

                            <Button onClick={handleCancel}>
                                Cancelar
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}