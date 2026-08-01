// src/pages/clientes/ClientesPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Radio,
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
  TeamOutlined,
  IdcardOutlined,
  BankOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import type { Cliente } from "./clientes.api";
import {
  getClientesApi,
  createClienteApi,
  updateClienteApi,
  deleteClienteApi,
} from "./clientes.api";

export default function ClientesPage() {
  const { token } = theme.useToken();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

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
      message.error(
        error?.response?.data?.message || "Error al cargar la lista de clientes",
      );
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
    form.setFieldsValue({
      personaJuridica: false,
      activo: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: Cliente) => {
    setEditingCliente(record);
    form.setFieldsValue({
      dniRut: record.dniRut,
      nombre: record.nombre,
      personaJuridica: record.personaJuridica,
      telefono: record.telefono || "",
      email: record.email || "",
      direccion: record.direccion || "",
      activo: record.activo,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteClienteApi(id);
      message.success("Cliente desactivado correctamente");
      fetchClientes();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Error al eliminar cliente",
      );
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

  const filteredData = useMemo(() => {
    const search = searchText.toLowerCase();

    return clientes.filter((cliente) => {
      return (
        cliente.nombre.toLowerCase().includes(search) ||
        cliente.dniRut.toLowerCase().includes(search) ||
        (cliente.telefono?.toLowerCase().includes(search) ?? false) ||
        (cliente.email?.toLowerCase().includes(search) ?? false) ||
        (cliente.direccion?.toLowerCase().includes(search) ?? false) ||
        (cliente.personaJuridica ? "persona jurídica" : "persona natural")
          .toLowerCase()
          .includes(search) ||
        (cliente.activo ? "activo" : "inactivo").includes(search)
      );
    });
  }, [clientes, searchText]);

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
          {record.personaJuridica ? (
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
      title: "DNI / RUT / RUC",
      dataIndex: "dniRut",
      key: "dniRut",
      render: (text: string) => (
        <Tag icon={<IdcardOutlined />} color="gold">
          {text}
        </Tag>
      ),
    },
    {
      title: "Tipo",
      dataIndex: "personaJuridica",
      key: "personaJuridica",
      render: (personaJuridica: boolean) =>
        personaJuridica ? (
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
      title: "Teléfono",
      dataIndex: "telefono",
      key: "telefono",
      render: (text: string | null) => text || "-",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text: string | null) => text || "-",
    },
    {
      title: "Estado",
      dataIndex: "activo",
      key: "activo",
      render: (activo: boolean) =>
        activo ? (
          <Tag color="success">Activo</Tag>
        ) : (
          <Tag color="default">Inactivo</Tag>
        ),
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 140,
      render: (_: unknown, record: Cliente) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: token.colorPrimary }} />}
            onClick={() => handleOpenEditModal(record)}
          />

          <Popconfirm
            title="Desactivar cliente"
            description="¿Está seguro de desactivar este cliente?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí, desactivar"
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
            Registro, edición y control de clientes comerciales naturales o
            jurídicos.
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
        <div style={{ marginBottom: 16, maxWidth: 420 }}>
          <Input
            placeholder="Buscar por nombre, DNI/RUT, teléfono o correo..."
            prefix={<SearchOutlined style={{ color: token.colorTextSecondary }} />}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
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
            rules={[
              {
                required: true,
                message: "Ingrese el nombre o razón social del cliente",
              },
            ]}
          >
            <Input
              prefix={<TeamOutlined />}
              placeholder="Ej: San Crispín S.A.C. / Juan Pérez"
            />
          </Form.Item>

          <Form.Item
            name="dniRut"
            label="DNI / RUT / RUC"
            rules={[
              {
                required: true,
                message: "Ingrese el DNI, RUT o RUC",
              },
            ]}
          >
            <Input
              prefix={<IdcardOutlined />}
              placeholder="Ej: 20123456789 / 76.123.456-7"
            />
          </Form.Item>

          <Form.Item name="personaJuridica" label="Tipo de Persona">
            <Radio.Group buttonStyle="solid">
              <Radio.Button value={false}>Persona Natural</Radio.Button>
              <Radio.Button value={true}>Persona Jurídica</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="telefono" label="Teléfono">
            <Input
              prefix={<PhoneOutlined />}
              placeholder="Ej: +56 9 1234 5678"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Correo"
            rules={[
              {
                type: "email",
                message: "Ingrese un correo válido",
              },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Ej: cliente@correo.com"
            />
          </Form.Item>

          <Form.Item name="direccion" label="Dirección">
            <Input
              prefix={<EnvironmentOutlined />}
              placeholder="Ej: Av. Principal 123"
            />
          </Form.Item>

          <Form.Item name="activo" label="Estado">
            <Select
              options={[
                { value: true, label: "Activo" },
                { value: false, label: "Inactivo" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}