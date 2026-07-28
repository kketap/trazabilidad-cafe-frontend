// src/pages/empaque/EmpaquePage.tsx
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
  InboxOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import type { Empaque, CreateEmpaqueDTO, UpdateEmpaqueDTO } from "../../api/empaque.api";
import {
  getEmpaquesApi,
  createEmpaqueApi,
  updateEmpaqueApi,
  deleteEmpaqueApi,
} from "../../api/empaque.api";

import type { Lote } from "../../api/lotes";
import { getLotesApi } from "../../api/lotes";

import CrearEmpaqueModal from "../../components/empaque-modals/CrearEmpaqueModal";
import EditarEmpaqueModal from "../../components/empaque-modals/EditarEmpaqueModal";

const { Title, Text } = Typography;

export default function EmpaquePage() {
  const { token } = theme.useToken();
  const [empaques, setEmpaques] = useState<Empaque[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEmpaque, setEditingEmpaque] = useState<Empaque | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empaquesData, lotesData] = await Promise.all([
        getEmpaquesApi(),
        getLotesApi(),
      ]);
      setEmpaques(empaquesData);
      setLotes(lotesData);
    } catch (error: any) {
      console.error("Error al cargar datos de empaque:", error);
      message.error(error?.response?.data?.message || "Error al cargar registros de empaque");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Crear Empaque
  const handleCreate = async (values: CreateEmpaqueDTO) => {
    setSaving(true);
    try {
      await createEmpaqueApi(values);
      message.success("Proceso de empaque registrado exitosamente");
      setIsCreateOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error creando empaque:", error);
      message.error(error?.response?.data?.message || error.message || "Error al registrar empaque");
    } finally {
      setSaving(false);
    }
  };

  // Editar Empaque
  const handleUpdate = async (id: number, values: UpdateEmpaqueDTO) => {
    setSaving(true);
    try {
      await updateEmpaqueApi(id, values);
      message.success("Proceso de empaque actualizado exitosamente");
      setIsEditOpen(false);
      setEditingEmpaque(null);
      fetchData();
    } catch (error: any) {
      console.error("Error actualizando empaque:", error);
      message.error(error?.response?.data?.message || error.message || "Error al actualizar empaque");
    } finally {
      setSaving(false);
    }
  };

  // Eliminar Empaque
  const handleDelete = async (id: number) => {
    try {
      await deleteEmpaqueApi(id);
      message.success("Proceso de empaque eliminado exitosamente");
      fetchData();
    } catch (error: any) {
      console.error("Error eliminando empaque:", error);
      message.error(error?.response?.data?.message || error.message || "Error al eliminar empaque");
    }
  };

  // Estadísticas
  const stats = useMemo(() => {
    const totalRegistros = empaques.length;
    const totalIngresados = empaques.reduce((acc, curr) => acc + (curr.kilosIngresados || 0), 0);
    const totalResultantes = empaques.reduce((acc, curr) => acc + (curr.kilosResultantes || 0), 0);
    const totalMerma = empaques.reduce((acc, curr) => acc + (curr.merma || 0), 0);
    const porcentajeMermaPromedio = totalIngresados > 0 ? (totalMerma / totalIngresados) * 100 : 0;

    return { totalRegistros, totalIngresados, totalResultantes, totalMerma, porcentajeMermaPromedio };
  }, [empaques]);

  // Filtrado por búsqueda
  const filteredEmpaques = useMemo(() => {
    if (!searchText) return empaques;
    const term = searchText.toLowerCase();
    return empaques.filter(
      (e) =>
        (e.lote?.codigo && e.lote.codigo.toLowerCase().includes(term)) ||
        (e.observaciones && e.observaciones.toLowerCase().includes(term))
    );
  }, [empaques, searchText]);

  // Columnas de la tabla
  const columns: ColumnsType<Empaque> = [
    {
      title: "Código del Lote",
      dataIndex: ["lote", "codigo"],
      key: "loteCodigo",
      render: (codigo: string, record: Empaque) => (
        <Space direction="vertical" size={2}>
          <Tag color="gold" style={{ fontSize: 13, fontWeight: "bold" }}>
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
      render: (val: number, record: Empaque) => {
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
      render: (_, record: Empaque) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#1890ff" }} />}
            onClick={() => {
              setEditingEmpaque(record);
              setIsEditOpen(true);
            }}
            title="Editar Empaque"
          />
          <Popconfirm
            title="¿Eliminar este registro de empaque?"
            description="Esta acción eliminará el registro de empaque permanentemente."
            onConfirm={() => handleDelete(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Eliminar Empaque"
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
            <InboxOutlined style={{ color: token.colorPrimary, marginRight: 10 }} />
            Procesamiento Físico: Empaque
          </Title>
          <Text type="secondary">
            Registro y control del empaque de lotes de café y transición al almacén con actualización automática de inventario.
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            Refrescar
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
            Nuevo Proceso de Empaque
          </Button>
        </Space>
      </div>

      {/* Tarjetas de Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic title="Total Procesos" value={stats.totalRegistros} prefix={<InboxOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic title="Total Kilos Ingresados" value={stats.totalIngresados} precision={1} suffix="kg" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic title="Total Kilos Empacados" value={stats.totalResultantes} precision={1} suffix="kg" valueStyle={{ color: token.colorPrimary }} />
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
          dataSource={filteredEmpaques}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{ emptyText: "No hay procesos de empaque registrados" }}
        />
      </Card>

      {/* Modales */}
      <CrearEmpaqueModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        lotes={lotes}
        loading={saving}
      />

      <EditarEmpaqueModal
        open={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingEmpaque(null);
        }}
        onSubmit={handleUpdate}
        empaque={editingEmpaque}
        lotes={lotes}
        loading={saving}
      />
    </div>
  );
}
