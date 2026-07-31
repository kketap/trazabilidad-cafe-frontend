// src/pages/lotes/LotesPage.tsx
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
  Radio,
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
  AppstoreOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import type { Lote } from "../../api/lotes";
import {
  getLotesApi,
  createLoteApi,
  updateLoteApi,
  deleteLoteApi,
} from "../../api/lotes";
import { formatEstadoEnum } from "../../utils/enumFormatters";

export default function LotesPage() {
  const { token } = theme.useToken();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros superiores
  const [searchText, setSearchText] = useState("");
  const [filtroFecha, setFiltroFecha] = useState<[Dayjs, Dayjs] | null>(null);
  const [filtroTipoCafe, setFiltroTipoCafe] = useState<string | undefined>(undefined);
  const [filtroEstado, setFiltroEstado] = useState<string | undefined>(undefined);

  // Estado Modal CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLote, setEditingLote] = useState<Lote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Escuchar el tipo de café seleccionado para autogenerar el código de previsualización
  const tipoCafeWatch = Form.useWatch("tipo_cafe", form);

  const fetchLotes = async () => {
    setLoading(true);
    try {
      const data = await getLotesApi();
      setLotes(data);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Error al cargar la lista de lotes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLotes();
  }, []);

  // Función para calcular el siguiente correlativo (ESC-00X o CONV-00X)
  const generarCodigoPreview = (tipo: string, listaLotes: Lote[]) => {
    const prefix = tipo === "especial" ? "ESC" : "CONV";
    const codigosExistentes = listaLotes
      .map((l) => l.codigo)
      .filter((c) => c && c.startsWith(`${prefix}-`));

    let maxNum = 0;
    codigosExistentes.forEach((codigo) => {
      const parts = codigo.split("-");
      if (parts.length >= 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    const nextNum = maxNum + 1;
    return `${prefix}-${String(nextNum).padStart(3, "0")}`;
  };

  // Autogenerar código cuando cambia el tipo de café en el formulario (solo en creación)
  useEffect(() => {
    if (isModalOpen && !editingLote && tipoCafeWatch) {
      const nuevoCodigo = generarCodigoPreview(tipoCafeWatch, lotes);
      form.setFieldValue("codigo", nuevoCodigo);
    }
  }, [tipoCafeWatch, isModalOpen, editingLote, lotes, form]);

  const handleOpenCreateModal = () => {
    setEditingLote(null);
    form.resetFields();
    const tipoInicial = "comercial";
    const codigoInicial = generarCodigoPreview(tipoInicial, lotes);
    form.setFieldsValue({
      tipo_cafe: tipoInicial,
      codigo: codigoInicial,
      activo: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: Lote) => {
    setEditingLote(record);
    form.setFieldsValue({
      codigo: record.codigo,
      nombre: record.nombre || "",
      hectareas: record.hectareas,
      ubicacion: record.ubicacion || "",
      observacion: record.observacion || "",
      activo: record.activo,
      tipo_cafe: record.tipo_cafe || "comercial",
      horas_oxidacion: record.horas_oxidacion,
      horas_fermentacion: record.horas_fermentacion,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteLoteApi(id);
      message.success("Lote eliminado correctamente");
      fetchLotes();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Error al eliminar lote");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingLote) {
        await updateLoteApi(editingLote.id, values);
        message.success("Lote actualizado con éxito");
      } else {
        await createLoteApi(values);
        message.success("Lote creado con éxito");
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchLotes();
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
    setFiltroTipoCafe(undefined);
    setFiltroEstado(undefined);
  };

  const filteredData = useMemo(() => {
    return lotes.filter((l) => {
      // Texto libre
      if (searchText) {
        const term = searchText.toLowerCase();
        const matchesCodigo = l.codigo.toLowerCase().includes(term);
        const matchesNombre = l.nombre && l.nombre.toLowerCase().includes(term);
        const matchesUbicacion = l.ubicacion && l.ubicacion.toLowerCase().includes(term);
        if (!matchesCodigo && !matchesNombre && !matchesUbicacion) {
          return false;
        }
      }

      // Fecha de creación/registro del lote
      if (filtroFecha && (l as any).createdAt) {
        const fechaLote = dayjs((l as any).createdAt);
        if (
          fechaLote.isBefore(filtroFecha[0], "day") ||
          fechaLote.isAfter(filtroFecha[1], "day")
        ) {
          return false;
        }
      }

      // Tipo de café
      if (filtroTipoCafe) {
        const tipo = l.tipo_cafe || "comercial";
        if (tipo !== filtroTipoCafe) return false;
      }

      // Estado / Etapa
      if (filtroEstado) {
        if (l.estado !== filtroEstado) return false;
      }

      return true;
    });
  }, [lotes, searchText, filtroFecha, filtroTipoCafe, filtroEstado]);

  const columns = [
    {
      title: "Código Lote",
      dataIndex: "codigo",
      key: "codigo",
      render: (text: string) => (
        <Tag icon={<AppstoreOutlined />} color="gold" style={{ fontSize: 13, padding: "2px 8px" }}>
          {text}
        </Tag>
      ),
      sorter: (a: Lote, b: Lote) => a.codigo.localeCompare(b.codigo),
    },
    {
      title: "Nombre del Lote",
      dataIndex: "nombre",
      key: "nombre",
      render: (text: string | null) => text || "Sin nombre",
    },
    {
      title: "Tipo de Café",
      dataIndex: "tipo_cafe",
      key: "tipo_cafe",
      render: (tipo: string) =>
        tipo === "especial" ? (
          <Tag color="purple" icon={<SafetyCertificateOutlined />}>
            Especialidad
          </Tag>
        ) : (
          <Tag color="blue">Comercial</Tag>
        ),
    },
    {
      title: "Hectáreas",
      dataIndex: "hectareas",
      key: "hectareas",
      render: (val: number | null) => (val ? `${val} ha` : "-"),
    },
    {
      title: "Proceso de Especialidad (Horas)",
      key: "proceso_especial",
      render: (_: any, record: Lote) =>
        record.tipo_cafe === "especial" ? (
          <Space direction="vertical" size={2}>
            <Tag color="orange" icon={<ClockCircleOutlined />}>
              Oxidación: {record.horas_oxidacion ?? 0} hrs
            </Tag>
            <Tag color="magenta" icon={<ExperimentOutlined />}>
              Fermentación: {record.horas_fermentacion ?? 0} hrs
            </Tag>
          </Space>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            N/A (Comercial)
          </Typography.Text>
        ),
    },
    {
      title: "Ubicación",
      dataIndex: "ubicacion",
      key: "ubicacion",
      render: (text: string | null) => text || "-",
    },
    {
      title: "Etapa / Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado: string) => {
        const colores: Record<string, string> = {
          EN_PROCESO: "blue",
          EN_SECADO: "orange",
          EN_ALMACEN: "purple",
          TRILLADO: "magenta",
          VENDIDO: "success",
          CERRADO: "default",
          INACTIVO: "error",
        };
        const estadoFormateado = formatEstadoEnum(estado || "EN_PROCESO");
        return <Tag color={colores[estado] || "default"}>{estadoFormateado}</Tag>;
      },
    },
    {
      title: "Estado Activo",
      dataIndex: "activo",
      key: "activo",
      render: (activo: boolean) =>
        activo ? <Tag color="success">Activo</Tag> : <Tag color="default">Inactivo</Tag>,
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 120,
      render: (_: any, record: Lote) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: token.colorPrimary }} />}
            onClick={() => handleOpenEditModal(record)}
            title="Editar lote"
          />
          <Popconfirm
            title="Eliminar lote"
            description="¿Deseas eliminar este lote?"
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
            Módulo de Lotes
          </Typography.Title>
          <Typography.Text type="secondary">
            Administración de terrenos, áreas de cultivo y perfiles de fermentación.
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleOpenCreateModal}
          style={{ borderRadius: 8 }}
        >
          Nuevo Lote
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
              placeholder="Buscar por código, nombre o ubicación..."
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
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Tipo de Café"
              value={filtroTipoCafe}
              onChange={setFiltroTipoCafe}
              allowClear
              style={{ width: "100%" }}
              options={[
                { value: "comercial", label: "Comercial" },
                { value: "especial", label: "Especialidad" },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="Etapa / Estado"
              value={filtroEstado}
              onChange={setFiltroEstado}
              allowClear
              style={{ width: "100%" }}
              options={[
                { value: "EN_PROCESO", label: "En Proceso" },
                { value: "EN_SECADO", label: "En Secado" },
                { value: "EN_ALMACEN", label: "En Almacén" },
                { value: "TRILLADO", label: "Trillado" },
                { value: "VENDIDO", label: "Vendido" },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Button icon={<ClearOutlined />} onClick={handleLimpiarFiltros} block>
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

      <Modal
        title={editingLote ? "Editar Lote" : "Nuevo Registro de Lote"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        okText={editingLote ? "Guardar Cambios" : "Crear Lote"}
        cancelText="Cancelar"
        width="min(700px, 95vw)"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="tipo_cafe"
                label="Tipo de Café / Destino"
                rules={[{ required: true, message: "Seleccione el tipo" }]}
              >
                <Radio.Group buttonStyle="solid" style={{ width: "100%" }}>
                  <Radio.Button value="comercial" style={{ width: "50%", textAlign: "center" }}>
                    Comercial
                  </Radio.Button>
                  <Radio.Button value="especial" style={{ width: "50%", textAlign: "center" }}>
                    Especialidad
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="codigo"
                label="Código del Lote"
                tooltip="Autogenerado en base al tipo seleccionado"
                rules={[{ required: true, message: "Ingrese el código del lote" }]}
              >
                <Input placeholder="Ej: ESC-001 o CONV-001" style={{ fontWeight: "bold" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="nombre"
                label="Nombre del Lote"
                rules={[{ required: true, message: "Ingrese un nombre identificador" }]}
              >
                <Input placeholder="Ej: Lote El Roble 1" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="hectareas" label="Área (Hectáreas)">
                <InputNumber style={{ width: "100%" }} min={0.1} addonAfter="ha" placeholder="Ej: 3.5" />
              </Form.Item>
            </Col>
          </Row>

          {tipoCafeWatch === "especial" && (
            <Card
              size="small"
              title="Perfil de Proceso Especial (Tiempos Requeridos)"
              style={{
                marginBottom: 16,
                background: token.colorBgLayout,
                borderColor: token.colorPrimaryBorder,
              }}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="horas_oxidacion"
                    label="Horas de Oxidación (Pre-fermentación)"
                    rules={[{ required: true, message: "Ingrese las horas de oxidación" }]}
                  >
                    <InputNumber style={{ width: "100%" }} min={0} addonAfter="hrs" placeholder="Ej: 12" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="horas_fermentacion"
                    label="Horas de Fermentación (Anaeróbica/Aeróbica)"
                    rules={[{ required: true, message: "Ingrese las horas de fermentación" }]}
                  >
                    <InputNumber style={{ width: "100%" }} min={0} addonAfter="hrs" placeholder="Ej: 48" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          <Form.Item name="ubicacion" label="Ubicación o Sector dentro de la Finca">
            <Input placeholder="Ej: Sector Norte - Parcela A" />
          </Form.Item>

          <Form.Item name="observacion" label="Observaciones o Notas Adicionales">
            <Input.TextArea rows={2} placeholder="Ej: Suelo rico en materia orgánica, variedad Caturra" />
          </Form.Item>

          <Form.Item name="activo" label="Estado del Lote" valuePropName="checked">
            <Radio.Group>
              <Radio value={true}>Activo / En producción</Radio>
              <Radio value={false}>Inactivo / En descanso</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}