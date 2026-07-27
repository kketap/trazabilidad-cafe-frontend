// src/pages/lotes/LotesPage.tsx
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
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
  BranchesOutlined,
} from "@ant-design/icons";
import type { Lote } from "../../api/lotes";
import {
  getLotesApi,
  createLoteApi,
  updateLoteApi,
  deleteLoteApi,
  getSiguienteCorrelativoApi,
} from "../../api/lotes";

export default function LotesPage() {
  const { token } = theme.useToken();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Estado Modal CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLote, setEditingLote] = useState<Lote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Escuchar el tipo de café seleccionado para renderizado condicional de horas
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

  const handleOpenCreateModal = () => {
    setEditingLote(null);
    form.resetFields();
    form.setFieldsValue({
      tipo_cafe: "comercial",
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

  const handleGenerarCorrelativo = async () => {
    const codigoActual = form.getFieldValue("codigo");
    if (!codigoActual) {
      message.warning("Ingrese un código base de lote (ej: ESC-001)");
      return;
    }

    try {
      const nuevoCorrelativo = await getSiguienteCorrelativoApi(codigoActual.trim());
      form.setFieldValue("codigo", nuevoCorrelativo);
      message.success(`Correlativo generado: ${nuevoCorrelativo}`);
    } catch (error) {
      message.error("Error al generar correlativo de lote");
    }
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

  const filteredData = lotes.filter(
    (l) =>
      l.codigo.toLowerCase().includes(searchText.toLowerCase()) ||
      (l.nombre && l.nombre.toLowerCase().includes(searchText.toLowerCase())) ||
      (l.ubicacion && l.ubicacion.toLowerCase().includes(searchText.toLowerCase()))
  );

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
      title: "Estado",
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
          />
          <Popconfirm
            title="Eliminar lote"
            description="¿Deseas eliminar este lote?"
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
            Gestión de Lotes
          </Typography.Title>
          <Typography.Text type="secondary">
            Administración de terrenos agrícolas, control de saldos y cafés de especialidad.
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
        <div style={{ marginBottom: 16, maxWidth: 360 }}>
          <Input
            placeholder="Buscar por código, nombre o ubicación..."
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
        title={editingLote ? "Editar Lote" : "Nuevo Lote"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        okText={editingLote ? "Guardar Cambios" : "Crear Lote"}
        cancelText="Cancelar"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16} align="middle">
            <Col xs={16}>
              <Form.Item
                name="codigo"
                label="Código del Lote"
                rules={[{ required: true, message: "Ingrese el código único del lote" }]}
              >
                <Input prefix={<AppstoreOutlined />} placeholder="Ej: ESC-001 o ESC-001-1" />
              </Form.Item>
            </Col>
            <Col xs={8}>
              <Button
                type="dashed"
                icon={<BranchesOutlined />}
                onClick={handleGenerarCorrelativo}
                style={{ marginTop: 6, width: "100%" }}
                title="Generar correlativo de saldo"
              >
                Sublote
              </Button>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="nombre" label="Nombre del Lote (Opcional)">
                <Input placeholder="Ej: Lote Geisha Finca Alta" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="hectareas" label="Hectáreas totales">
                <InputNumber style={{ width: "100%" }} min={0} addonAfter="ha" placeholder="Ej: 3.5" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="tipo_cafe" label="Tipo de Café">
            <Radio.Group buttonStyle="solid" style={{ width: "100%" }}>
              <Radio.Button value="comercial" style={{ width: "50%", textAlign: "center" }}>
                Café Comercial
              </Radio.Button>
              <Radio.Button value="especial" style={{ width: "50%", textAlign: "center" }}>
                Café Especial / Especialidad
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          {/* Lógica Condicional: Si tipo_cafe es "especial", mostrar horas de proceso */}
          {tipoCafeWatch === "especial" && (
            <Card
              size="small"
              style={{
                background: token.colorBgLayout,
                marginBottom: 16,
                borderColor: token.colorBorderSecondary,
                borderRadius: 8,
              }}
            >
              <Typography.Text strong style={{ display: "block", marginBottom: 12, color: token.colorPrimary }}>
                <SafetyCertificateOutlined /> Parámetros del Proceso de Especialidad
              </Typography.Text>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="horas_oxidacion" label="Horas de Oxidación">
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      addonAfter="hrs"
                      placeholder="Ej: 12"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="horas_fermentacion" label="Horas de Fermentación">
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      addonAfter="hrs"
                      placeholder="Ej: 36"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          <Form.Item name="ubicacion" label="Ubicación / Sector">
            <Input placeholder="Ej: Sector Norte - Altura 1,600 msnm" />
          </Form.Item>

          <Form.Item name="observacion" label="Observaciones">
            <Input.TextArea placeholder="Notas sobre el suelo, variedad u origen" rows={2} />
          </Form.Item>

          <Form.Item name="activo" label="Estado del Lote" valuePropName="checked">
            <Select>
              <Select.Option value={true}>Activo</Select.Option>
              <Select.Option value={false}>Inactivo</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}