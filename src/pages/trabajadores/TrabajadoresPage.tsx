// src/pages/trabajadores/TrabajadoresPage.tsx
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
  theme,
  Select
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  IdcardOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import type { Trabajador } from "./trabajadores.api";
import {
  getTrabajadoresApi,
  createTrabajadorApi,
  updateTrabajadorApi,
  deleteTrabajadorApi,
} from "./trabajadores.api";

export default function TrabajadoresPage() {
  const { token } = theme.useToken();
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Estado para modal CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrabajador, setEditingTrabajador] = useState<Trabajador | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchTrabajadores = async () => {
    setLoading(true);
    try {
      const data = await getTrabajadoresApi();
      setTrabajadores(data);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Error al cargar la lista de trabajadores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrabajadores();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingTrabajador(null);
    form.resetFields();
    form.setFieldsValue({
      activo: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: Trabajador) => {
    setEditingTrabajador(record);
    form.setFieldsValue({
      nombres: record.nombres,
      apellidos: record.apellidos || "",
      dni: record.dni,
      rol: record.rol || "",
      telefono: record.telefono || "",
      activo: record.activo,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTrabajadorApi(id);
      message.success("Trabajador eliminado correctamente");
      fetchTrabajadores();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Error al eliminar trabajador");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingTrabajador) {
        await updateTrabajadorApi(editingTrabajador.id, values);
        message.success("Trabajador actualizado con éxito");
      } else {
        await createTrabajadorApi(values);
        message.success("Trabajador registrado con éxito");
      }
      setIsModalOpen(false);
      form.resetFields();
      fetchTrabajadores();
    } catch (error: any) {
      if (error?.response?.data?.message) {
        message.error(error.response.data.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = trabajadores.filter((t) => {
    const search = searchText.toLowerCase();

    return (
      t.nombres.toLowerCase().includes(search) ||
      (t.apellidos?.toLowerCase().includes(search) ?? false) ||
      t.dni.includes(searchText) ||
      (t.telefono?.toLowerCase().includes(search) ?? false) ||
      (t.rol?.toLowerCase().includes(search) ?? false) ||
      (t.activo ? "activo" : "inactivo").includes(search)
    );
  });

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      sorter: (a: Trabajador, b: Trabajador) => a.id - b.id,
    },
    {
      title: "Nombres",
      dataIndex: "nombres",
      key: "nombres",
      render: (text: string) => (
        <Space>
          <UserOutlined style={{ color: token.colorPrimary }} />
          <Typography.Text strong>{text}</Typography.Text>
        </Space>
      ),
      sorter: (a: Trabajador, b: Trabajador) => a.nombres.localeCompare(b.nombres),
    },
    {
      title: "Apellidos",
      dataIndex: "apellidos",
      key: "apellidos",
      render: (text: string | null) => text || "-",
    },
    {
      title: "Teléfono",
      dataIndex: "telefono",
      key: "telefono",
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
      title: "DNI",
      dataIndex: "dni",
      key: "dni",
      render: (text: string) => (
        <Tag icon={<IdcardOutlined />} color="gold">
          {text}
        </Tag>
      ),
    },
    {
      title: "Rol / Cargo",
      dataIndex: "rol",
      key: "rol",
      render: (text: string | null) =>
        text ? (
          <Tag color="blue" icon={<SolutionOutlined />}>
            {text}
          </Tag>
        ) : (
          <Typography.Text type="secondary">Sin asignar</Typography.Text>
        ),
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 140,
      render: (_: any, record: Trabajador) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: token.colorPrimary }} />}
            onClick={() => handleOpenEditModal(record)}
          />
          <Popconfirm
            title="Eliminar trabajador"
            description="¿Está seguro de eliminar este trabajador?"
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
            Gestión de Trabajadores
          </Typography.Title>
          <Typography.Text type="secondary">
            Registro, edición y control del personal operativo y técnico.
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleOpenCreateModal}
          style={{ borderRadius: 8 }}
        >
          Nuevo Trabajador
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
            placeholder="Buscar por nombre, DNI o rol..."
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
          scroll={{ x: 900 }}
        />
      </Card>

      <Modal
        title={editingTrabajador ? "Editar Trabajador" : "Nuevo Trabajador"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        okText={editingTrabajador ? "Guardar Cambios" : "Registrar"}
        cancelText="Cancelar"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="nombres"
            label="Nombres"
            rules={[{ required: true, message: "Ingrese los nombres del trabajador" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Ej: Juan Carlos" />
          </Form.Item>

          <Form.Item name="apellidos" label="Apellidos">
            <Input placeholder="Ej: Pérez González" />
          </Form.Item>

          <Form.Item name="telefono" label="Teléfono">
            <Input placeholder="Ej: +56 9 1234 5678" />
          </Form.Item>

          <Form.Item name="activo" label="Estado">
            <Select
              options={[
                { value: true, label: "Activo" },
                { value: false, label: "Inactivo" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="dni"
            label="DNI"
            rules={[
              { required: true, message: "Ingrese el DNI" },
              { pattern: /^\d{8}$/, message: "El DNI debe contener 8 dígitos numéricos" },
            ]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="Ej: 12345678" maxLength={8} />
          </Form.Item>

          <Form.Item name="rol" label="Rol / Cargo (Opcional)">
            <Input prefix={<SolutionOutlined />} placeholder="Ej: Cosechador, Operario, Supervisor" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
