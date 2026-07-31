// src/pages/clientes/ClientesPage.tsx
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Radio,
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
  TeamOutlined,
  IdcardOutlined,
  BankOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { Cliente } from "../../api/clientes";
import {
  getClientesApi,
  createClienteApi,
  updateClienteApi,
  deleteClienteApi,
} from "../../api/clientes";

export default function ClientesPage() {
  const { token } = theme.useToken();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Estado para modal CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const data = await getClientesApi();
      setClientes(data);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Error al cargar la lista de clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingCliente(null);
    form.resetFields();
    form.setFieldsValue({ persona_juridica: false });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: Cliente) => {
    setEditingCliente(record);
    form.setFieldsValue({
      dni_rut: record.dni_rut,
      nombre: record.nombre,
      persona_juridica: record.persona_juridica,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteClienteApi(id);
      message.success("Cliente eliminado correctamente");
      fetchClientes();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Error al eliminar cliente");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingCliente) {
        await updateClienteApi(editingCliente.id, values);
        message.success("Cliente actualizado con éxito");
      } else {
        await createClienteApi(values);
        message.success("Cliente registrado con éxito");
      }
      setIsModalOpen(false);
      form.resetFields();
      fetchClientes();
    } catch (error: any) {
      if (error?.response?.data?.message) {
        message.error(error.response.data.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
      c.dni_rut.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      sorter: (a: Cliente, b: Cliente) => a.id - b.id,
    },
    {
      title: "Nombre / Razón Social",
      dataIndex: "nombre",
      key: "nombre",
      render: (text: string, record: Cliente) => (
        <Space>
          {record.persona_juridica ? (
            <BankOutlined style={{ color: token.colorPrimary }} />
          ) : (
            <UserOutlined style={{ color: token.colorPrimary }} />
          )}
          <Typography.Text strong>{text}</Typography.Text>
        </Space>
      ),
      sorter: (a: Cliente, b: Cliente) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: "DNI / RUT",
      dataIndex: "dni_rut",
      key: "dni_rut",
      render: (text: string) => (
        <Tag icon={<IdcardOutlined />} color="gold">
          {text}
        </Tag>
      ),
    },
    {
      title: "Tipo de Persona",
      dataIndex: "persona_juridica",
      key: "persona_juridica",
      render: (pj: boolean) =>
        pj ? (
          <Tag color="purple" icon={<BankOutlined />}>
            Persona Jurídica
          </Tag>
        ) : (
          <Tag color="blue" icon={<UserOutlined />}>
            Persona Natural
          </Tag>
        ),
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 140,
      render: (_: any, record: Cliente) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: token.colorPrimary }} />}
            onClick={() => handleOpenEditModal(record)}
          />
          <Popconfirm
            title="Eliminar cliente"
            description="¿Está seguro de eliminar este cliente?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí, eliminar"
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
            Gestión de Clientes
          </Typography.Title>
          <Typography.Text type="secondary">
            Registro, edición y control de clientes comerciales (Naturales o Jurídicos).
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleOpenCreateModal}
          style={{ borderRadius: 8 }}
        >
          Nuevo Cliente
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
            placeholder="Buscar por nombre o DNI/RUT..."
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
          scroll={{ x: "max-content" }}
        />
      </Card>

      <Modal
        title={editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        okText={editingCliente ? "Guardar Cambios" : "Registrar"}
        cancelText="Cancelar"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="nombre"
            label="Nombre o Razón Social"
            rules={[{ required: true, message: "Ingrese el nombre o razón social del cliente" }]}
          >
            <Input prefix={<TeamOutlined />} placeholder="Ej: San Crispín S.A.C. / Juan Pérez" />
          </Form.Item>

          <Form.Item
            name="dni_rut"
            label="DNI / RUT / RUC"
            rules={[{ required: true, message: "Ingrese el DNI, RUT o RUC" }]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="Ej: 20123456789 / 76.123.456-7" />
          </Form.Item>

          <Form.Item name="persona_juridica" label="Tipo de Persona">
            <Radio.Group buttonStyle="solid">
              <Radio.Button value={false}>Persona Natural</Radio.Button>
              <Radio.Button value={true}>Persona Jurídica</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
