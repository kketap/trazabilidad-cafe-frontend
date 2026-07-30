// src/pages/trilla/TrillaPage.tsx
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
  Tooltip,
  Badge,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import type { OrdenTrilla, CreateOrdenTrillaDTO, UpdateOrdenTrillaDTO } from "../../api/trilla.api";
import {
  getOrdenesTrilaApi,
  createOrdenTrillaApi,
  updateOrdenTrillaApi,
  deleteOrdenTrillaApi,
} from "../../api/trilla.api";

import type { Lote } from "../../api/lotes";
import { getLotesApi } from "../../api/lotes";

import EnviarATrillaModal from "../../components/trilla-modals/EnviarATrillaModal";
import RecepcionTrillaModal from "../../components/trilla-modals/RecepcionTrillaModal";

const { Title, Text } = Typography;

// Ícono representativo de la trilla (molinillo / procesamiento)
const TrillaIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="currentColor"
    style={{ display: "inline-block", verticalAlign: "middle", marginRight: 10 }}
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
  </svg>
);

export default function TrillaPage() {
  const { token } = theme.useToken();

  const [ordenes, setOrdenes] = useState<OrdenTrilla[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Estado de modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOrden, setEditingOrden] = useState<OrdenTrilla | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordenesData, lotesData] = await Promise.all([
        getOrdenesTrilaApi(),
        getLotesApi(),
      ]);
      setOrdenes(ordenesData);
      setLotes(lotesData);
    } catch (error: any) {
      console.error("Error al cargar datos de trilla:", error);
      message.error(error?.response?.data?.message || "Error al cargar registros de trilla");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Crear orden
  const handleCreate = async (values: CreateOrdenTrillaDTO) => {
    setSaving(true);
    try {
      await createOrdenTrillaApi(values);
      message.success("Lotes enviados a trilla correctamente");
      setIsCreateOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error creando orden de trilla:", error);
      message.error(
        error?.response?.data?.message || error.message || "Error al crear orden de trilla"
      );
    } finally {
      setSaving(false);
    }
  };

  // Actualizar (recepción)
  const handleUpdate = async (id: string, values: UpdateOrdenTrillaDTO) => {
    setSaving(true);
    try {
      await updateOrdenTrillaApi(id, values);
      message.success("Recepción de trilla registrada exitosamente");
      setIsEditOpen(false);
      setEditingOrden(null);
      fetchData();
    } catch (error: any) {
      console.error("Error actualizando orden de trilla:", error);
      message.error(
        error?.response?.data?.message || error.message || "Error al actualizar la trilla"
      );
    } finally {
      setSaving(false);
    }
  };

  // Eliminar
  const handleDelete = async (id: string) => {
    try {
      await deleteOrdenTrillaApi(id);
      message.success("Orden de trilla eliminada exitosamente");
      fetchData();
    } catch (error: any) {
      console.error("Error eliminando orden de trilla:", error);
      message.error(
        error?.response?.data?.message || error.message || "Error al eliminar orden de trilla"
      );
    }
  };

  // Estadísticas
  const stats = useMemo(() => {
    const total = ordenes.length;
    const temporales = ordenes.filter((o) => o.codigoTrilla?.startsWith("TEMP-")).length;
    const recibidas = ordenes.filter((o) => o.kilosNetos != null).length;
    const kilosEnviados = ordenes.reduce((acc, o) => acc + (o.kilosEnviados || 0), 0);
    const kilosNetos = ordenes.reduce((acc, o) => acc + (o.kilosNetos || 0), 0);
    const rendimiento = kilosEnviados > 0 ? (kilosNetos / kilosEnviados) * 100 : 0;
    return { total, temporales, recibidas, kilosEnviados, kilosNetos, rendimiento };
  }, [ordenes]);

  // Filtrado
  const filteredOrdenes = useMemo(() => {
    if (!searchText) return ordenes;
    const term = searchText.toLowerCase();
    return ordenes.filter(
      (o) =>
        o.codigoTrilla?.toLowerCase().includes(term) ||
        o.calidad?.toLowerCase().includes(term) ||
        o.tipoSaco?.toLowerCase().includes(term) ||
        (o.lotes && o.lotes.some((l: any) => l.codigo?.toLowerCase().includes(term)))
    );
  }, [ordenes, searchText]);

  // Columnas de la tabla
  const columns: ColumnsType<OrdenTrilla> = [
    {
      title: "Código de Trilla",
      dataIndex: "codigoTrilla",
      key: "codigoTrilla",
      sorter: (a, b) => a.codigoTrilla.localeCompare(b.codigoTrilla),
      render: (codigo: string) => {
        const esTemporal = codigo?.startsWith("TEMP-");
        return (
          <Space>
            {esTemporal ? (
              <Tooltip title="Código temporal - pendiente de número definitivo del proveedor">
                <Tag
                  icon={<ClockCircleOutlined />}
                  color="orange"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  {codigo}
                </Tag>
              </Tooltip>
            ) : (
              <Tag
                icon={<CheckCircleOutlined />}
                color="green"
                style={{ fontSize: 13, fontWeight: 600 }}
              >
                {codigo}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Lotes",
      key: "lotes",
      render: (_, record: OrdenTrilla) => (
        <Space wrap size={4}>
          {record.lotes && record.lotes.length > 0
            ? record.lotes.map((l: any) => (
                <Tag key={l.id} color="gold" style={{ fontSize: 12 }}>
                  {l.codigo}
                </Tag>
              ))
            : <Text type="secondary">-</Text>}
        </Space>
      ),
    },
    {
      title: "Fecha de Despacho",
      dataIndex: "fechaDespacho",
      key: "fechaDespacho",
      sorter: (a, b) =>
        dayjs(a.fechaDespacho).unix() - dayjs(b.fechaDespacho).unix(),
      render: (fecha: string) =>
        fecha ? dayjs(fecha).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Fecha Ingreso",
      dataIndex: "fechaIngreso",
      key: "fechaIngreso",
      render: (fecha?: string | null) =>
        fecha ? (
          <Text style={{ color: token.colorSuccess }}>{dayjs(fecha).format("DD/MM/YYYY")}</Text>
        ) : (
          <Text type="secondary">Pendiente</Text>
        ),
    },
    {
      title: "Kilos Enviados",
      dataIndex: "kilosEnviados",
      key: "kilosEnviados",
      align: "right",
      sorter: (a, b) => a.kilosEnviados - b.kilosEnviados,
      render: (val: number) => <strong>{val?.toLocaleString() ?? 0} kg</strong>,
    },
    {
      title: "Kilos Netos",
      dataIndex: "kilosNetos",
      key: "kilosNetos",
      align: "right",
      render: (val?: number | null) =>
        val != null ? (
          <strong style={{ color: token.colorPrimary }}>{val.toLocaleString()} kg</strong>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Calidad",
      dataIndex: "calidad",
      key: "calidad",
      render: (calidad?: string | null) =>
        calidad ? (
          <Tag color="purple">{calidad}</Tag>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Tipo Saco",
      dataIndex: "tipoSaco",
      key: "tipoSaco",
      render: (tipoSaco?: string | null) =>
        tipoSaco ? <Tag color="cyan">{tipoSaco}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: "Estado",
      key: "estado",
      align: "center",
      render: (_, record: OrdenTrilla) => {
        if (record.kilosNetos != null) {
          return <Badge status="success" text="Recibido" />;
        }
        if (record.fechaIngreso) {
          return <Badge status="processing" text="En trilla" />;
        }
        return <Badge status="warning" text="Despachado" />;
      },
    },
    {
      title: "Acciones",
      key: "acciones",
      align: "center",
      render: (_, record: OrdenTrilla) => (
        <Space size="middle">
          <Tooltip title="Registrar recepción / editar">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#1890ff" }} />}
              onClick={() => {
                setEditingOrden(record);
                setIsEditOpen(true);
              }}
              aria-label="Editar orden de trilla"
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar esta orden de trilla?"
            description="Esta acción no se puede deshacer."
            onConfirm={() => handleDelete(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label="Eliminar orden de trilla"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Encabezado */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <TrillaIcon />
            Trilla y Despacho
          </Title>
          <Text type="secondary">
            Gestión del envío de café pergamino a la trilladora y recepción del café verde resultante.
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            Refrescar
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateOpen(true)}
          >
            Enviar a Trilla
          </Button>
        </Space>
      </div>

      {/* Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Total Órdenes"
              value={stats.total}
              prefix={<SendOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Código Temporal (pendientes)"
              value={stats.temporales}
              valueStyle={{ color: stats.temporales > 0 ? "#faad14" : undefined }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Kilos Enviados (total)"
              value={stats.kilosEnviados}
              precision={1}
              suffix="kg"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Rendimiento Promedio"
              value={stats.rendimiento}
              precision={1}
              suffix="%"
              valueStyle={{
                color:
                  stats.rendimiento >= 75
                    ? token.colorSuccess
                    : stats.rendimiento > 0
                    ? "#faad14"
                    : undefined,
              }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla */}
      <Card style={{ borderRadius: 8 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Buscar por código, calidad, tipo de saco o lote..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredOrdenes}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{ emptyText: "No hay órdenes de trilla registradas" }}
          scroll={{ x: 1100 }}
          rowClassName={(record) =>
            record.codigoTrilla?.startsWith("TEMP-") ? "row-temporal" : ""
          }
        />
      </Card>

      {/* Modales */}
      <EnviarATrillaModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        lotes={lotes}
        loading={saving}
      />

      <RecepcionTrillaModal
        open={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingOrden(null);
        }}
        onSubmit={handleUpdate}
        orden={editingOrden}
        loading={saving}
      />
    </div>
  );
}
