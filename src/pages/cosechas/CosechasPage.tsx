// src/pages/cosechas/CosechasPage.tsx
import { useEffect, useState, useMemo } from "react";
import {
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
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  EyeOutlined,
  AppstoreOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

import type { Cosecha } from "./cosechas.api";
import {
  getCosechasApi,
  createCosechaApi,
  updateCosechaApi,
  deleteCosechaApi,
} from "./cosechas.api";
import type { Trabajador } from "../trabajadores/trabajadores.api";
import { getTrabajadoresApi } from "../trabajadores/trabajadores.api";

import type { Lote } from "../lotes/lotes.api";
import { getLotesApi } from "../lotes/lotes.api";

type SortField = "fecha" | "kilosCosechados" | "totalHectareas";
type SortOrder = "asc" | "desc";

export default function CosechasPage() {
  const { token } = theme.useToken();
  const [cosechas, setCosechas] = useState<Cosecha[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [filtroRangoFechas, setFiltroRangoFechas] =
    useState<[Dayjs, Dayjs] | null>(() => [
      dayjs().startOf("month"),
      dayjs().endOf("month"),
    ]);
  const [filtroTipoCosecha, setFiltroTipoCosecha] = useState<string | null>(null);
  const [filtroTrabajadorId, setFiltroTrabajadorId] = useState<number | null>(null);
  const [filtroEstadoAsignacion, setFiltroEstadoAsignacion] = useState<string | null>(null);

  const [ordenCampo, setOrdenCampo] = useState<SortField>("fecha");
  const [ordenDireccion, setOrdenDireccion] = useState<SortOrder>("desc");

  const rangosPredefinidos = [
    {
      label: "Hoy",
      value: [dayjs().startOf("day"), dayjs().endOf("day")] as [Dayjs, Dayjs],
    },
    {
      label: "Ayer",
      value: [
        dayjs().subtract(1, "day").startOf("day"),
        dayjs().subtract(1, "day").endOf("day"),
      ] as [Dayjs, Dayjs],
    },
    {
      label: "Últimos 3 días",
      value: [
        dayjs().subtract(2, "day").startOf("day"),
        dayjs().endOf("day"),
      ] as [Dayjs, Dayjs],
    },
    {
      label: "Últimos 7 días",
      value: [
        dayjs().subtract(6, "day").startOf("day"),
        dayjs().endOf("day"),
      ] as [Dayjs, Dayjs],
    },
    {
      label: "Este mes",
      value: [
        dayjs().startOf("month"),
        dayjs().endOf("month"),
      ] as [Dayjs, Dayjs],
    },
    {
      label: "Mes anterior",
      value: [
        dayjs().subtract(1, "month").startOf("month"),
        dayjs().subtract(1, "month").endOf("month"),
      ] as [Dayjs, Dayjs],
    },
  ];

  // Estado Modal CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCosecha, setEditingCosecha] = useState<Cosecha | null>(null);
  const [selectedCosecha, setSelectedCosecha] = useState<Cosecha | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchCosechas = async () => {
    setLoading(true);
    try {
      const data = await getCosechasApi();
      setCosechas(data);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Error al cargar la lista de cosechas");
    } finally {
      setLoading(false);
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

  const fetchLotes = async () => {
    try {
      const data = await getLotesApi();
      setLotes(data);
    } catch (error) {
      console.error("Error al cargar lotes:", error);
    }
  };

  useEffect(() => {
    fetchCosechas();
    fetchTrabajadores();
    fetchLotes();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingCosecha(null);
    form.resetFields();
    form.setFieldsValue({
      fecha: dayjs(),
      tipoCosecha: "plena",
      trabajadorIds: [],
      loteIds: [],
      cantidadCosechadores: 0,
      totalHectareas: 1.0,
    });
    setIsModalOpen(true);
  };

  const handleView = (record: Cosecha) => {
    setSelectedCosecha(record);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedCosecha(null);
    setIsDetailModalOpen(false);
  };

  const handleOpenEditModal = (record: Cosecha) => {
    setEditingCosecha(record);
    form.setFieldsValue({
      fecha: dayjs(record.fecha),
      kilosCosechados: record.kilosCosechados,
      cantidadCosechadores: record.cantidadCosechadores,
      totalHectareas: record.totalHectareas,
      lotes: record.lotes,
      tipoCosecha: record.tipoCosecha || "plena",
      trabajadorIds:
        record.cosechaTrabajadores?.map((item) => item.trabajadorId) ?? [],
      loteIds:
        record.cosechaLotes?.map((item) => item.loteId) ?? [],
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

      const trabajadorIds: number[] = values.trabajadorIds ?? [];

      const loteIds: number[] = values.loteIds ?? [];

      const lotesSeleccionadosTexto = lotes
        .filter((lote) => loteIds.includes(lote.id))
        .map((lote) => lote.codigo)
        .join(", ");

      const payload = {
        fecha: values.fecha.format("YYYY-MM-DD"),
        kilosCosechados: values.kilosCosechados,
        cantidadCosechadores: trabajadorIds.length,
        loteIds,
        lotes: values.lotes || lotesSeleccionadosTexto,
        totalHectareas: values.totalHectareas,
        tipoCosecha: values.tipoCosecha,
        trabajadores: trabajadorIds.map((trabajadorId) => ({
          trabajadorId,
        })),
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

  const limpiarFiltros = () => {
    setSearchText("");
    setFiltroRangoFechas(null);
    setFiltroTipoCosecha(null);
    setFiltroTrabajadorId(null);
    setFiltroEstadoAsignacion(null);
    setOrdenCampo("fecha");
    setOrdenDireccion("desc");
  };

  const filteredData = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    const filtradas = cosechas.filter((cosecha) => {
      const fecha = dayjs(cosecha.fecha);

      const trabajadoresCosecha = cosecha.cosechaTrabajadores ?? [];

      const trabajadoresTexto = trabajadoresCosecha
        .map((item) =>
          `${item.trabajador.nombres} ${item.trabajador.apellidos ?? ""} ${item.trabajador.dni}`,
        )
        .join(" ")
        .toLowerCase();

      const cumpleBusqueda =
        !search ||
        cosecha.lotes?.toLowerCase().includes(search) ||
        cosecha.tipoCosecha?.toLowerCase().includes(search) ||
        trabajadoresTexto.includes(search);

      const cumpleRangoFechas = filtroRangoFechas
        ? fecha.isSameOrAfter(filtroRangoFechas[0], "day") &&
        fecha.isSameOrBefore(filtroRangoFechas[1], "day")
        : true;

      const cumpleTipo = filtroTipoCosecha
        ? cosecha.tipoCosecha === filtroTipoCosecha
        : true;

      const cumpleTrabajador = filtroTrabajadorId
        ? trabajadoresCosecha.some(
          (item) => item.trabajadorId === filtroTrabajadorId,
        )
        : true;

      const cumpleEstadoAsignacion =
        filtroEstadoAsignacion === "CON_TRABAJADORES"
          ? trabajadoresCosecha.length > 0
          : filtroEstadoAsignacion === "SIN_TRABAJADORES"
            ? trabajadoresCosecha.length === 0
            : true;

      return (
        cumpleBusqueda &&
        cumpleRangoFechas &&
        cumpleTipo &&
        cumpleTrabajador &&
        cumpleEstadoAsignacion
      );
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
    searchText,
    filtroRangoFechas,
    filtroTipoCosecha,
    filtroTrabajadorId,
    filtroEstadoAsignacion,
    ordenCampo,
    ordenDireccion,
  ]);

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
      title: "Lotes",
      key: "lotes",
      render: (_: any, record: Cosecha) => {
        const lotesCosecha = record.cosechaLotes ?? [];

        if (lotesCosecha.length === 0) {
          return record.lotes || "-";
        }

        return (
          <Space wrap>
            {lotesCosecha.map((item) => (
              <Tag key={item.id} icon={<AppstoreOutlined />} color="gold">
                {item.lote.codigo}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "Trabajadores",
      key: "trabajadores",
      render: (_: any, record: Cosecha) => {
        const trabajadoresCosecha = record.cosechaTrabajadores ?? [];

        if (trabajadoresCosecha.length === 0) {
          return <Typography.Text type="secondary">Sin asignar</Typography.Text>;
        }

        return (
          <Space wrap>
            {trabajadoresCosecha.slice(0, 3).map((item) => (
              <Tag key={item.id} icon={<UserOutlined />} color="green">
                {item.trabajador.nombres}
                {item.trabajador.apellidos ? ` ${item.trabajador.apellidos}` : ""}
              </Tag>
            ))}

            {trabajadoresCosecha.length > 3 && (
              <Tag>+{trabajadoresCosecha.length - 3}</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Tipo Cosecha",
      dataIndex: "tipoCosecha",
      key: "tipoCosecha",
      render: (text: string) => (
        <Tag color={getTipoCosechaColor(text)}>
          {(text || "plena").toUpperCase()}
        </Tag>
      ),
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
      title: "Acciones",
      key: "acciones",
      width: 120,
      render: (_: any, record: Cosecha) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          />

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
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Buscar por lote, trabajador o tipo..."
              prefix={<SearchOutlined style={{ color: token.colorTextSecondary }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={8}>
            <DatePicker.RangePicker
              value={filtroRangoFechas}
              onChange={(value) => {
                setFiltroRangoFechas(value as [Dayjs, Dayjs] | null);
              }}
              presets={rangosPredefinidos}
              format="DD/MM/YYYY"
              placeholder={["Fecha inicio", "Fecha fin"]}
              allowClear
              style={{ width: "100%" }}
            />
          </Col>

          <Col xs={24} sm={12} md={5}>
            <Select
              allowClear
              placeholder="Tipo de cosecha"
              value={filtroTipoCosecha}
              onChange={(value) => setFiltroTipoCosecha(value ?? null)}
              style={{ width: "100%" }}
              options={[
                { value: "plena", label: "Plena" },
                { value: "rebusca", label: "Rebusca" },
                { value: "selectiva", label: "Selectiva" },
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Trabajador"
              value={filtroTrabajadorId}
              onChange={(value) => setFiltroTrabajadorId(value ?? null)}
              style={{ width: "100%" }}
              options={trabajadores.map((trabajador) => ({
                value: trabajador.id,
                label: `${trabajador.nombres}${trabajador.apellidos ? ` ${trabajador.apellidos}` : ""} (${trabajador.dni})`,
              }))}
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              allowClear
              placeholder="Asignación"
              value={filtroEstadoAsignacion}
              onChange={(value) => setFiltroEstadoAsignacion(value ?? null)}
              style={{ width: "100%" }}
              options={[
                { value: "CON_TRABAJADORES", label: "Con trabajadores" },
                { value: "SIN_TRABAJADORES", label: "Sin trabajadores" },
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              value={ordenCampo}
              onChange={setOrdenCampo}
              style={{ width: "100%" }}
              options={[
                { value: "fecha", label: "Ordenar por fecha" },
                { value: "kilosCosechados", label: "Ordenar por kg cosechados" },
                { value: "totalHectareas", label: "Ordenar por hectáreas" },
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={5}>
            <Select
              value={ordenDireccion}
              onChange={setOrdenDireccion}
              style={{ width: "100%" }}
              options={[
                { value: "desc", label: "Descendente" },
                { value: "asc", label: "Ascendente" },
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Button onClick={limpiarFiltros} block>
              Limpiar
            </Button>
          </Col>
        </Row>

        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          Mostrando {filteredData.length} de {cosechas.length} cosechas registradas.
        </Typography.Text>

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
                {/* formato DD/MM/YYYY*/}
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Seleccione la fecha"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="trabajadorIds"
                label="Trabajadores / Cosechadores"
              >
                <Select
                  mode="multiple"
                  placeholder="Seleccione trabajadores..."
                  showSearch
                  optionFilterProp="label"
                  onChange={(selectedIds: number[]) => {
                    form.setFieldValue("cantidadCosechadores", selectedIds.length);
                  }}
                  options={trabajadores
                    .filter((t) => t.activo)
                    .map((t) => ({
                      value: t.id,
                      label: `${t.nombres}${t.apellidos ? ` ${t.apellidos}` : ""} (${t.dni})`,
                    }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="tipoCosecha"
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
                rules={[{ required: true, message: "Seleccione al menos un trabajador" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Se calcula automáticamente"
                />
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

          <Form.Item
            name="loteIds"
            label="Lotes de origen"
            rules={[
              {
                required: true,
                message: "Seleccione al menos un lote",
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Seleccione uno o más lotes..."
              showSearch
              optionFilterProp="label"
              options={lotes
                .filter((lote) => lote.activo)
                .map((lote) => ({
                  value: lote.id,
                  label: `${lote.codigo}${lote.nombre ? ` - ${lote.nombre}` : ""}`,
                }))}
            />
          </Form.Item>

          <Form.Item name="lotes" label="Observaciones">
            <Input.TextArea
              placeholder="(Observación opcional)"
              rows={2}
            />
          </Form.Item>
        </Form>
      </Modal>
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
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Card size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Typography.Text type="secondary">Fecha</Typography.Text>
                  <br />
                  <Typography.Text strong>
                    {dayjs(selectedCosecha.fecha).format("DD/MM/YYYY")}
                  </Typography.Text>
                </Col>

                <Col xs={24} md={12}>
                  <Typography.Text type="secondary">Tipo de cosecha</Typography.Text>
                  <br />
                  <Tag color={getTipoCosechaColor(selectedCosecha.tipoCosecha)}>
                    {selectedCosecha.tipoCosecha.toUpperCase()}
                  </Tag>
                </Col>

                <Col xs={24} md={12}>
                  <Typography.Text type="secondary">Kilos cosechados</Typography.Text>
                  <br />
                  <Typography.Text strong>
                    {selectedCosecha.kilosCosechados.toLocaleString("es-CL")} kg
                  </Typography.Text>
                </Col>

                <Col xs={24} md={12}>
                  <Typography.Text type="secondary">Hectáreas</Typography.Text>
                  <br />
                  <Typography.Text strong>
                    {selectedCosecha.totalHectareas.toLocaleString("es-CL")} ha
                  </Typography.Text>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="Lotes asociados">
              {selectedCosecha.cosechaLotes &&
                selectedCosecha.cosechaLotes.length > 0 ? (
                <Space wrap>
                  {selectedCosecha.cosechaLotes.map((item) => (
                    <Tag key={item.id} icon={<AppstoreOutlined />} color="gold">
                      {item.lote.codigo}
                      {item.lote.nombre ? ` - ${item.lote.nombre}` : ""}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Typography.Text type="secondary">
                  {selectedCosecha.lotes || "No hay lotes asociados."}
                </Typography.Text>
              )}
            </Card>

            <Card size="small" title="Trabajadores asociados">
              {selectedCosecha.cosechaTrabajadores &&
                selectedCosecha.cosechaTrabajadores.length > 0 ? (
                <Space wrap>
                  {selectedCosecha.cosechaTrabajadores.map((item) => (
                    <Tag key={item.id} icon={<UserOutlined />} color="green">
                      {item.trabajador.nombres}
                      {item.trabajador.apellidos
                        ? ` ${item.trabajador.apellidos}`
                        : ""}
                      {item.kilosAsignados
                        ? ` - ${item.kilosAsignados.toLocaleString("es-CL")} kg`
                        : ""}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Typography.Text type="secondary">
                  No hay trabajadores asociados.
                </Typography.Text>
              )}
            </Card>
          </Space>
        )}
      </Modal>
    </Space>
  );
}