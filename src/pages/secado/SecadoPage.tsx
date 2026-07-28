// src/pages/secado/SecadoPage.tsx
import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Card,
  Col,
  Input,
  message,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  theme,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  FireOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import type { Secado, CreateSecadoDTO, UpdateSecadoDTO } from "../../api/secado.api";
import {
  getSecadosApi,
  createSecadoApi,
  updateSecadoApi,
  deleteSecadoApi,
} from "../../api/secado.api";

import type { Lote } from "../../api/lotes";
import { getLotesApi } from "../../api/lotes";

import CrearSecadoModal from "../../components/secado-modals/CrearSecadoModal";
import EditarSecadoModal from "../../components/secado-modals/EditarSecadoModal";

const { Title, Text } = Typography;

export default function SecadoPage() {
  const { token } = theme.useToken();
  const [secados, setSecados] = useState<Secado[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSecado, setEditingSecado] = useState<Secado | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [secadosData, lotesData] = await Promise.all([
        getSecadosApi(),
        getLotesApi(),
      ]);
      setSecados(secadosData);
      setLotes(lotesData);
    } catch (error: any) {
      console.error("Error al cargar datos de secado:", error);
      message.error(error?.response?.data?.message || "Error al cargar registros de secado");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Crear Secado
  const handleCreate = async (values: CreateSecadoDTO) => {
    setSaving(true);
    try {
      await createSecadoApi(values);
      message.success("Proceso de secado registrado exitosamente");
      setIsCreateOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error creando secado:", error);
      message.error(error?.response?.data?.message || error.message || "Error al registrar secado");
    } finally {
      setSaving(false);
    }
  };

  // Editar Secado
  const handleUpdate = async (id: number, values: UpdateSecadoDTO) => {
    setSaving(true);
    try {
      await updateSecadoApi(id, values);
      message.success("Proceso de secado actualizado exitosamente");
      setIsEditOpen(false);
      setEditingSecado(null);
      fetchData();
    } catch (error: any) {
      console.error("Error actualizando secado:", error);
      message.error(error?.response?.data?.message || error.message || "Error al actualizar secado");
    } finally {
      setSaving(false);
    }
  };

  // Eliminar Secado
  const handleDelete = async (id: number) => {
    try {
      await deleteSecadoApi(id);
      message.success("Proceso de secado eliminado exitosamente");
      fetchData();
    } catch (error: any) {
      console.error("Error eliminando secado:", error);
      message.error(error?.response?.data?.message || error.message || "Error al eliminar secado");
    }
  };

  // Estadísticas
  const stats = useMemo(() => {
    const totalRegistros = secados.length;
    const totalIngresados = secados.reduce((acc, curr) => acc + (curr.kilosIngresados || 0), 0);
    const totalResultantes = secados.reduce((acc, curr) => acc + (curr.kilosResultantes || 0), 0);
    const totalMerma = secados.reduce((acc, curr) => acc + (curr.merma || 0), 0);
    const porcentajeMermaPromedio = totalIngresados > 0 ? (totalMerma / totalIngresados) * 100 : 0;

    return { totalRegistros, totalIngresados, totalResultantes, totalMerma, porcentajeMermaPromedio };
  }, [secados]);

  // Filtrado por búsqueda
  const filteredSecados = useMemo(() => {
    if (!searchText) return secados;
    const term = searchText.toLowerCase();
    return secados.filter(
      (s) =>
        (s.lote?.codigo && s.lote.codigo.toLowerCase().includes(term)) ||
        (s.observaciones && s.observaciones.toLowerCase().includes(term))
    );
  }, [secados, searchText]);

  // Columnas de la tabla
  const columns: ColumnsType<Secado> = [
    {
      title: "Código del Lote",
      dataIndex: ["lote", "codigo"],
      key: "loteCodigo",
      render: (codigo: string, record: Secado) => (
        <Space direction="vertical" size={2}>
          <Tag color="blue" style={{ fontSize: 13, fontWeight: "bold" }}>
            {codigo || `Lote #${record.loteId}`}
          </Tag>
          {record.lote?.nombre ? <Text type="secondary" style={{ fontSize: 12 }}>{record.lote.nombre}</Text> : null}
        </Space>
      ),
    },
    {
      title: "Fecha de Inicio",
      dataIndex: "fechaInicio",
      key: "fechaInicio",
      render: (fecha: string) => (fecha ? dayjs(fecha).format("DD/MM/YYYY HH:mm") : "-"),
    },
    {
      title: "Kilos Ingresados",
      dataIndex: "kilosIngresados",
      key: "kilosIngresados",
      align: "right",
      render: (val: number) => <strong>{val?.toLocaleString() ?? 0} kg</strong>,
    },
    {
      title: "Kilos Resultantes",
      dataIndex: "kilosResultantes",
      key: "kilosResultantes",
      align: "right",
      render: (val: number) => <strong style={{ color: token.colorPrimary }}>{val?.toLocaleString() ?? 0} kg</strong>,
    },
    {
      title: "Merma",
      dataIndex: "merma",
      key: "merma",
      align: "right",
      render: (val: number, record: Secado) => {
        const pct = record.kilosIngresados ? ((val / record.kilosIngresados) * 100).toFixed(1) : "0";
        return (
          <Tag color={val > 0 ? "warning" : "green"}>
            {val?.toLocaleString() ?? 0} kg ({pct}%)
          </Tag>
        );
      },
    },
    {
      title: "Observaciones",
      dataIndex: "observaciones",
      key: "observaciones",
      ellipsis: true,
      render: (obs: string) => obs || <Text type="secondary">-</Text>,
    },
    {
      title: "Acciones",
      key: "acciones",
      align: "center",
      render: (_, record: Secado) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#1890ff" }} />}
            onClick={() => {
              setEditingSecado(record);
              setIsEditOpen(true);
            }}
            title="Editar Secado"
          />
          <Popconfirm
            title="¿Eliminar este registro de secado?"
            description="Esta acción eliminará el registro de secado permanentemente."
            onConfirm={() => handleDelete(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Eliminar Secado"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <FireOutlined style={{ color: token.colorPrimary, marginRight: 10 }} />
            Procesamiento Físico: Secado
          </Title>
          <Text type="secondary">
            Registro y control del proceso de secado de lotes de café con actualización automática de saldo y merma.
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            Refrescar
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
            Nuevo Proceso de Secado
          </Button>
        </Space>
      </div>

      {/* Tarjetas de Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic title="Total Procesos" value={stats.totalRegistros} prefix={<FireOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic title="Total Kilos Ingresados" value={stats.totalIngresados} precision={1} suffix="kg" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic title="Total Kilos Resultantes" value={stats.totalResultantes} precision={1} suffix="kg" valueStyle={{ color: token.colorPrimary }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Merma Total Acumulada"
              value={stats.totalMerma}
              precision={1}
              suffix={`kg (${stats.porcentajeMermaPromedio.toFixed(1)}%)`}
              valueStyle={{ color: stats.totalMerma > 0 ? "#faad14" : undefined }}
            />
          </Card>
        </Col>
      </Row>

      {/* Barra de Filtros y Tabla */}
      <Card style={{ borderRadius: 8 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Buscar por código de lote u observaciones..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredSecados}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{ emptyText: "No hay procesos de secado registrados" }}
        />
      </Card>

      {/* Modales */}
      <CrearSecadoModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        lotes={lotes}
        loading={saving}
      />

      <EditarSecadoModal
        open={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingSecado(null);
        }}
        onSubmit={handleUpdate}
        secado={editingSecado}
        lotes={lotes}
        loading={saving}
      />
    </div>
  );
}
