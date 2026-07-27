// src/pages/cosechas/CosechasPage.tsx
import { useEffect, useState } from "react";
import {
<<<<<<< HEAD
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

=======
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  theme,
} from "antd";
>>>>>>> 2e51d57ebd7ef037ec51f79bb932a6df326a6f8f
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Cosecha } from "../../api/cosechas";
import {
  getCosechasApi,
  createCosechaApi,
  updateCosechaApi,
  deleteCosechaApi,
} from "../../api/cosechas";
import type { Trabajador } from "../../api/trabajadores";
import { getTrabajadoresApi } from "../../api/trabajadores";

type SortField = "fecha" | "kilosCosechados" | "totalHectareas";
type SortOrder = "asc" | "desc";

export default function CosechasPage() {
  const { token } = theme.useToken();
  const [cosechas, setCosechas] = useState<Cosecha[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Estado Modal CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCosecha, setEditingCosecha] = useState<Cosecha | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

<<<<<<< HEAD
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
=======
  const fetchCosechas = async () => {
    setLoading(true);
    try {
      const data = await getCosechasApi();
      setCosechas(data);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Error al cargar la lista de cosechas");
    } finally {
      setLoading(false);
>>>>>>> 2e51d57ebd7ef037ec51f79bb932a6df326a6f8f
    }
  };

  const fetchTrabajadores = async () => {
    try {
      const data = await getTrabajadoresApi();
      setTrabajadores(data);
    } catch (error) {
      console.error("Error al cargar trabajadores:", error);
    }
  };

  useEffect(() => {
    fetchCosechas();
    fetchTrabajadores();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingCosecha(null);
    form.resetFields();
    form.setFieldsValue({
      fecha: dayjs(),
      tipo_cosecha: "plena",
      cantidadCosechadores: 1,
      totalHectareas: 1.0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: Cosecha) => {
    setEditingCosecha(record);
    form.setFieldsValue({
      fecha: dayjs(record.fecha),
      kilosCosechados: record.kilosCosechados,
      cantidadCosechadores: record.cantidadCosechadores,
      totalHectareas: record.totalHectareas,
      lotes: record.lotes,
      trabajadorId: record.trabajadorId || record.trabajador?.id,
      tipo_cosecha: record.tipo_cosecha || record.tipoCosecha || "plena",
      kilos_diarios: record.kilos_diarios,
      kilos_quincena: record.kilos_quincena,
      kilos_mensuales: record.kilos_mensuales,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCosechaApi(id);
      message.success("Cosecha eliminada correctamente");
      fetchCosechas();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Error al eliminar cosecha");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        ...values,
        fecha: values.fecha.format("YYYY-MM-DD"),
      };

      if (editingCosecha) {
        await updateCosechaApi(editingCosecha.id, payload);
        message.success("Cosecha actualizada con éxito");
      } else {
        await createCosechaApi(payload);
        message.success("Cosecha registrada con éxito");
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchCosechas();
    } catch (error: any) {
      if (error?.response?.data?.message) {
        message.error(error.response.data.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

<<<<<<< HEAD
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
=======
  const filteredData = cosechas.filter(
    (c) =>
      c.lotes?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.trabajador?.nombres.toLowerCase().includes(searchText.toLowerCase()) ||
      (c.tipo_cosecha && c.tipo_cosecha.toLowerCase().includes(searchText.toLowerCase()))
  );
>>>>>>> 2e51d57ebd7ef037ec51f79bb932a6df326a6f8f

  const getTipoCosechaColor = (tipo?: string | null) => {
    switch (tipo?.toLowerCase()) {
      case "selectiva":
        return "gold";
      case "rebusca":
        return "purple";
      case "plena":
      default:
        return "green";
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
    },
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      render: (text: string) => dayjs(text).format("DD/MM/YYYY"),
      sorter: (a: Cosecha, b: Cosecha) => dayjs(a.fecha).unix() - dayjs(b.fecha).unix(),
    },
    {
      title: "Trabajador Responsable",
      dataIndex: "trabajador",
      key: "trabajador",
      render: (_: any, record: Cosecha) => (
        <Space>
          <UserOutlined style={{ color: token.colorPrimary }} />
          <Typography.Text strong>
            {record.trabajador?.nombres || "Sin asignar"}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Tipo Cosecha",
      dataIndex: "tipo_cosecha",
      key: "tipo_cosecha",
      render: (text: string | null, record: Cosecha) => {
        const valor = text || record.tipoCosecha || "plena";
        return (
          <Tag color={getTipoCosechaColor(valor)}>
            {valor.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Kilos Cosechados",
      dataIndex: "kilosCosechados",
      key: "kilosCosechados",
      render: (val: number) => `${val.toLocaleString()} kg`,
      sorter: (a: Cosecha, b: Cosecha) => a.kilosCosechados - b.kilosCosechados,
    },
    {
      title: "Cosechadores",
      dataIndex: "cantidadCosechadores",
      key: "cantidadCosechadores",
    },
    {
      title: "Hectáreas",
      dataIndex: "totalHectareas",
      key: "totalHectareas",
      render: (val: number) => `${val} ha`,
    },
    {
      title: "Rendimiento (Diario/Quincena/Mensual)",
      key: "rendimiento",
      render: (_: any, record: Cosecha) => (
        <Space direction="vertical" size={2}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Día: {record.kilos_diarios !== null && record.kilos_diarios !== undefined ? `${record.kilos_diarios} kg` : "-"}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Quincena: {record.kilos_quincena !== null && record.kilos_quincena !== undefined ? `${record.kilos_quincena} kg` : "-"}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 120,
      render: (_: any, record: Cosecha) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: token.colorPrimary }} />}
            onClick={() => handleOpenEditModal(record)}
          />
          <Popconfirm
            title="Eliminar cosecha"
            description="¿Deseas eliminar este registro de cosecha?"
            onConfirm={() => handleDelete(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

<<<<<<< HEAD
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
=======
  return (
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
            Gestión de Cosechas
          </Typography.Title>
          <Typography.Text type="secondary">
            Registro diario de recolección de café, rendimiento y asignación de trabajadores.
          </Typography.Text>
>>>>>>> 2e51d57ebd7ef037ec51f79bb932a6df326a6f8f
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleOpenCreateModal}
          style={{ borderRadius: 8 }}
        >
          Nueva Cosecha
        </Button>
      </div>

      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ marginBottom: 16, maxWidth: 360 }}>
          <Input
            placeholder="Buscar por lote, trabajador o tipo..."
            prefix={<SearchOutlined style={{ color: token.colorTextSecondary }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: true }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={editingCosecha ? "Editar Registro de Cosecha" : "Nuevo Registro de Cosecha"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        okText={editingCosecha ? "Guardar Cambios" : "Registrar Cosecha"}
        cancelText="Cancelar"
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="fecha"
                label="Fecha de Cosecha"
                rules={[{ required: true, message: "Seleccione la fecha" }]}
              >
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="trabajadorId"
                label="Trabajador / Cosechador Responsable"
                rules={[{ required: true, message: "Seleccione un trabajador" }]}
              >
                <Select
                  placeholder="Seleccionar trabajador..."
                  showSearch
                  optionFilterProp="children"
                >
                  {trabajadores.map((t) => (
                    <Select.Option key={t.id} value={t.id}>
                      {t.nombres} ({t.dni})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="tipo_cosecha"
                label="Tipo de Cosecha"
                rules={[{ required: true, message: "Seleccione el tipo de cosecha" }]}
              >
                <Select placeholder="Seleccionar tipo...">
                  <Select.Option value="plena">Plena (Cosecha Principal)</Select.Option>
                  <Select.Option value="rebusca">Rebusca (Cosecha Tardía)</Select.Option>
                  <Select.Option value="selectiva">Selectiva (Alta Calidad)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="kilosCosechados"
                label="Kilos Cosechados (Totales)"
                rules={[{ required: true, message: "Ingrese los kilos cosechados" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0.1}
                  addonAfter="kg"
                  placeholder="Ej: 450"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="cantidadCosechadores"
                label="N° Cosechadores en Campo"
                rules={[{ required: true, message: "Ingrese cantidad de cosechadores" }]}
              >
                <InputNumber style={{ width: "100%" }} min={1} placeholder="Ej: 5" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="totalHectareas"
                label="Total Hectáreas Recorridas"
                rules={[{ required: true, message: "Ingrese total de hectáreas" }]}
              >
                <InputNumber style={{ width: "100%" }} min={0.1} addonAfter="ha" placeholder="Ej: 2.5" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="lotes" label="Lotes de Origen / Observaciones">
            <Input.TextArea placeholder="Ej: Lote San Antonio 1 y 2" rows={2} />
          </Form.Item>

          <Typography.Title level={5} style={{ marginTop: 8 }}>
            Métricas de Rendimiento (Opcionales)
          </Typography.Title>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="kilos_diarios" label="Kg Diarios Propietario">
                <InputNumber style={{ width: "100%" }} min={0} addonAfter="kg" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="kilos_quincena" label="Kg Quincenales">
                <InputNumber style={{ width: "100%" }} min={0} addonAfter="kg" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="kilos_mensuales" label="Kg Mensuales">
                <InputNumber style={{ width: "100%" }} min={0} addonAfter="kg" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Space>
  );
}