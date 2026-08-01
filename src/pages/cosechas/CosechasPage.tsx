// src/pages/cosechas/CosechasPage.tsx
import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
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
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import type { Cosecha } from "../../api/cosechas";
import {
  getCosechasApi,
  createCosechaApi,
  updateCosechaApi,
  deleteCosechaApi,
} from "../../api/cosechas";
import type { Trabajador } from "../../api/trabajadores";
import { getTrabajadoresApi } from "../../api/trabajadores";
import type { Lote } from "../../api/lotes";
import { getLotesApi } from "../../api/lotes";
import { formatEstadoEnum } from "../../utils/enumFormatters";

export default function CosechasPage() {
  const { token } = theme.useToken();
  const [cosechas, setCosechas] = useState<Cosecha[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [lotesList, setLotesList] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros superiores
  const [searchText, setSearchText] = useState("");
  const [filtroFecha, setFiltroFecha] = useState<[Dayjs, Dayjs] | null>(null);
  const [filtroTrabajador, setFiltroTrabajador] = useState<number | undefined>(undefined);
  const [filtroTipo, setFiltroTipo] = useState<string | undefined>(undefined);

  // Estado Modal CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCosecha, setEditingCosecha] = useState<Cosecha | null>(null);
  const [selectedCosecha, setSelectedCosecha] = useState<Cosecha | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Estado Modal Visualización
  const [viewingCosecha, setViewingCosecha] = useState<Cosecha | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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

  const fetchTrabajadoresYLotes = async () => {
    try {
      const [trabData, lotesData] = await Promise.all([
        getTrabajadoresApi(),
        getLotesApi(),
      ]);
      setTrabajadores(trabData);
      setLotesList(lotesData);
    } catch (error) {
      console.error("Error al cargar trabajadores/lotes:", error);
    }
  };

  useEffect(() => {
    fetchCosechas();
    fetchTrabajadoresYLotes();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingCosecha(null);
    form.resetFields();
    form.setFieldsValue({
      fecha: dayjs(),
      tipo_cosecha: "plena",
      totalHectareas: 1.0,
      lotesArray: [],
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
    // Convertir string de lotes separados por coma en array
    const lotesArray = record.lotes
      ? record.lotes.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    form.setFieldsValue({
      fecha: dayjs(record.fecha),
      kilosCosechados: record.kilosCosechados,
      totalHectareas: record.totalHectareas,
      lotesArray: lotesArray,
      observacion: record.observacion || "",
      trabajadorId: record.trabajadorId || record.trabajador?.id,
      tipo_cosecha: record.tipo_cosecha || record.tipoCosecha || "plena",
      varietal: record.varietal,
    });
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (record: Cosecha) => {
    setViewingCosecha(record);
    setIsViewModalOpen(true);
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

      const lotesStr = Array.isArray(values.lotesArray)
        ? values.lotesArray.join(", ")
        : values.lotesArray || "";

      const payload = {
        ...values,
        lotes: lotesStr,
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

  const handleLimpiarFiltros = () => {
    setSearchText("");
    setFiltroFecha(null);
    setFiltroTrabajador(undefined);
    setFiltroTipo(undefined);
  };

  const filteredData = useMemo(() => {
    return cosechas.filter((c) => {
      // Filtro texto libre
      if (searchText) {
        const term = searchText.toLowerCase();
        const codigo = `COS-${String(c.id).padStart(3, "0")}`.toLowerCase();
        const matchesLotes = c.lotes?.toLowerCase().includes(term);
        const matchesTrabajador = c.trabajador?.nombres.toLowerCase().includes(term);
        const matchesTipo = c.tipo_cosecha?.toLowerCase().includes(term);
        if (!codigo.includes(term) && !matchesLotes && !matchesTrabajador && !matchesTipo) {
          return false;
        }
      }

      // Filtro fecha
      if (filtroFecha) {
        const fechaCosecha = dayjs(c.fecha);
        if (
          fechaCosecha.isBefore(filtroFecha[0], "day") ||
          fechaCosecha.isAfter(filtroFecha[1], "day")
        ) {
          return false;
        }
      }

      // Filtro trabajador
      if (filtroTrabajador !== undefined) {
        const trabId = c.trabajadorId || c.trabajador?.id;
        if (trabId !== filtroTrabajador) return false;
      }

      // Filtro tipo cosecha
      if (filtroTipo) {
        const tipo = c.tipo_cosecha || c.tipoCosecha || "plena";
        if (tipo.toLowerCase() !== filtroTipo.toLowerCase()) return false;
      }

      return true;
    });
  }, [cosechas, searchText, filtroFecha, filtroTrabajador, filtroTipo]);

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
      title: "Código Cosecha",
      dataIndex: "id",
      key: "codigo",
      width: 140,
      render: (id: number) => (
        <Tag color="blue" style={{ fontSize: 13, fontWeight: "bold", padding: "2px 8px" }}>
          COS-{String(id).padStart(3, "0")}
        </Tag>
      ),
      sorter: (a: Cosecha, b: Cosecha) => a.id - b.id,
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
          <Tag color={getTipoCosechaColor(valor)}>
            {formatEstadoEnum(valor)}
          </Tag>
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
      render: (val: number) => `${val?.toLocaleString() ?? 0} kg`,
      sorter: (a: Cosecha, b: Cosecha) => a.kilosCosechados - b.kilosCosechados,
    },
    {
      title: "Lote(s) Origen",
      dataIndex: "lotes",
      key: "lotes",
      render: (val: string | null) => val || "-",
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 140,
      render: (_: any, record: Cosecha) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined style={{ color: token.colorInfo }} />}
            onClick={() => handleOpenViewModal(record)}
            title="Visualizar detalle"
          />
          <Button
            type="text"
            icon={<EditOutlined style={{ color: token.colorPrimary }} />}
            onClick={() => handleOpenEditModal(record)}
            title="Editar cosecha"
          />
          <Popconfirm
            title="Eliminar cosecha"
            description="¿Deseas eliminar este registro de cosecha?"
            onConfirm={() => handleDelete(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} title="Eliminar" />
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
            Registro diario de recolección de café y asignación de trabajadores.
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
        {/* Barra superior de filtros */}
        <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Buscar por código, lote o trabajador..."
              prefix={<SearchOutlined style={{ color: token.colorTextSecondary }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DatePicker.RangePicker
              value={filtroFecha}
              onChange={(val) => setFiltroFecha(val as [Dayjs, Dayjs] | null)}
              format="DD/MM/YYYY"
              placeholder={["Fecha inicio", "Fecha fin"]}
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="Filtrar por trabajador"
              value={filtroTrabajador}
              onChange={setFiltroTrabajador}
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: "100%" }}
              options={trabajadores.map((t) => ({
                value: t.id,
                label: `${t.nombres} (${t.dni})`,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Tipo Cosecha"
              value={filtroTipo}
              onChange={setFiltroTipo}
              allowClear
              style={{ width: "100%" }}
              options={[
                { value: "plena", label: "Plena" },
                { value: "rebusca", label: "Rebusca" },
                { value: "selectiva", label: "Selectiva" },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Button
              icon={<ClearOutlined />}
              onClick={handleLimpiarFiltros}
              block
            >
              Limpiar
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: true }}
          scroll={{ x: "max-content" }}
        />
      </Card>

      {/* Modal Crear / Editar */}
      <Modal
        title={editingCosecha ? "Editar Registro de Cosecha" : "Nuevo Registro de Cosecha"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        okText={editingCosecha ? "Guardar Cambios" : "Registrar Cosecha"}
        cancelText="Cancelar"
        width="min(700px, 95vw)"
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
              <Form.Item name="varietal" label="Varietal">
                <Select mode="tags" placeholder="Ej: Geisha, Caturra...">
                  <Select.Option value="Geisha">Geisha</Select.Option>
                  <Select.Option value="Java">Java</Select.Option>
                  <Select.Option value="Caturra">Caturra</Select.Option>
                  <Select.Option value="Catimor">Catimor</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
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
            name="lotesArray"
            label="Lotes de Origen"
            rules={[{ required: true, message: "Seleccione al menos un lote de origen" }]}
          >
            <Select
              mode="multiple"
              placeholder="Seleccione los lotes de origen..."
              optionFilterProp="label"
              options={lotesList.map((lote) => ({
                value: lote.codigo,
                label: lote.nombre ? `${lote.codigo} - ${lote.nombre}` : lote.codigo,
              }))}
            />
          </Form.Item>

          <Form.Item name="observacion" label="Observación">
            <Input.TextArea placeholder="Observaciones adicionales sobre la cosecha..." rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Visualizar Detalle */}
      <Modal
        title={`Detalle de Cosecha - COS-${String(viewingCosecha?.id ?? 0).padStart(3, "0")}`}
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalOpen(false)}>
            Cerrar
          </Button>,
        ]}
        width="min(650px, 95vw)"
        centered
      >
        {viewingCosecha && (
          <Descriptions column={1} bordered size="small" style={{ marginTop: 16 }}>
            <Descriptions.Item label="Código Auto-generado">
              <Tag color="blue" style={{ fontSize: 13, fontWeight: "bold" }}>
                COS-{String(viewingCosecha.id).padStart(3, "0")}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Fecha">
              {dayjs(viewingCosecha.fecha).format("DD/MM/YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Trabajador Responsable">
              {viewingCosecha.trabajador?.nombres || "Sin asignar"}
            </Descriptions.Item>
            <Descriptions.Item label="Tipo Cosecha">
              <Tag color={getTipoCosechaColor(viewingCosecha.tipo_cosecha)}>
                {formatEstadoEnum(viewingCosecha.tipo_cosecha || viewingCosecha.tipoCosecha)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Kilos Cosechados">
              {viewingCosecha.kilosCosechados?.toLocaleString()} kg
            </Descriptions.Item>
            <Descriptions.Item label="Total Hectáreas">
              {viewingCosecha.totalHectareas} ha
            </Descriptions.Item>
            <Descriptions.Item label="Lotes de Origen">
              {viewingCosecha.lotes || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Observaciones">
              {viewingCosecha.observacion || viewingCosecha.observaciones || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Varietales">
              {Array.isArray(viewingCosecha.varietal)
                ? viewingCosecha.varietal.join(", ")
                : viewingCosecha.varietal || "-"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Space>
  );
}