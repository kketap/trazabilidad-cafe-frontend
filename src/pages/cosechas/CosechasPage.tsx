// src/pages/cosechas/CosechasPage.tsx
import { useEffect, useState } from "react";
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

  const filteredData = cosechas.filter(
    (c) =>
      c.lotes?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.trabajador?.nombres.toLowerCase().includes(searchText.toLowerCase()) ||
      (c.tipo_cosecha && c.tipo_cosecha.toLowerCase().includes(searchText.toLowerCase()))
  );

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