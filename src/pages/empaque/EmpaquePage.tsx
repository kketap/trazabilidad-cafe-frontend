// src/pages/empaque/EmpaquePage.tsx
import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  message,
  Popconfirm,
  Row,
  Select,
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
  ClearOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";

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
import { formatEstadoEnum } from "../../utils/enumFormatters";

const { Title, Text } = Typography;

export default function EmpaquePage() {
  const { token } = theme.useToken();
  const [empaques, setEmpaques] = useState<Empaque[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filtros
  const [searchText, setSearchText] = useState("");
  const [filtroFecha, setFiltroFecha] = useState<[Dayjs, Dayjs] | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string | undefined>(undefined);

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

  const handleLimpiarFiltros = () => {
    setSearchText("");
    setFiltroFecha(null);
    setFiltroEstado(undefined);
  };

  const stats = useMemo(() => {
    const totalRegistros = empaques.length;
    const totalIngresados = empaques.reduce((acc, curr) => acc + (curr.kilosIngresados || 0), 0);
    const totalResultantes = empaques.reduce((acc, curr) => acc + (curr.kilosResultantes || 0), 0);
    const totalMerma = empaques.reduce((acc, curr) => acc + (curr.merma || 0), 0);
    const porcentajeMermaPromedio = totalIngresados > 0 ? (totalMerma / totalIngresados) * 100 : 0;

    return { totalRegistros, totalIngresados, totalResultantes, totalMerma, porcentajeMermaPromedio };
  }, [empaques]);

  const filteredEmpaques = useMemo(() => {
    return empaques.filter((e) => {
      if (searchText) {
        const term = searchText.toLowerCase();
        const codigoMatches = e.lote?.codigo && e.lote.codigo.toLowerCase().includes(term);
        const obsMatches = e.observaciones && e.observaciones.toLowerCase().includes(term);
        if (!codigoMatches && !obsMatches) return false;
      }

      if (filtroFecha && e.fechaInicio) {
        const f = dayjs(e.fechaInicio);
        if (f.isBefore(filtroFecha[0], "day") || f.isAfter(filtroFecha[1], "day")) {
          return false;
        }
      }

      if (filtroEstado) {
        const estado = (e as any).estado || (e.kilosResultantes ? "EN_ALMACEN" : "EN_PROCESO");
        if (estado !== filtroEstado) return false;
      }

      return true;
    });
  }, [empaques, searchText, filtroFecha, filtroEstado]);

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
      title: "Estado",
      key: "estado",
      render: (_, record: Empaque) => {
        const estado = (record as any).estado || (record.kilosResultantes ? "EN_ALMACEN" : "EN_PROCESO");
        return (
          <Tag color={estado === "EN_ALMACEN" ? "purple" : "blue"}>
            {formatEstadoEnum(estado)}
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
            <Button type="text" danger icon={<DeleteOutlined />} title="Eliminar" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* Encabezado */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space align="center" size="middle">
            <InboxOutlined style={{ fontSize: 28, color: "#722ed1" }} />
            <div>
              <Title level={3} style={{ margin: 0 }}>
                Módulo de Empaque
              </Title>
              <Text type="secondary">
                Empacado final de pergamino/verde, pesaje y almacenamiento.
              </Text>
            </div>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
              Refrescar
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateOpen(true)}
              style={{ background: "#722ed1", borderColor: "#722ed1" }}
            >
              Nuevo Empaque
            </Button>
          </Space>
        </Col>
      </Row>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic title="Total Registros" value={stats.totalRegistros} prefix={<InboxOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic title="Ingresado (Kg)" value={stats.totalIngresados} precision={1} suffix="kg" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Empacado Final (Kg)"
              value={stats.totalResultantes}
              precision={1}
              suffix="kg"
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Merma de Empaque"
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
        <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Buscar por código de lote u observaciones..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24} sm={12} md={7}>
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
              placeholder="Estado"
              value={filtroEstado}
              onChange={setFiltroEstado}
              allowClear
              style={{ width: "100%" }}
              options={[
                { value: "EN_PROCESO", label: "En Proceso" },
                { value: "EN_ALMACEN", label: "En Almacén" },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button icon={<ClearOutlined />} onClick={handleLimpiarFiltros} block>
              Limpiar
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredEmpaques}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{ emptyText: "No hay procesos de empaque registrados" }}
          scroll={{ x: "max-content" }}
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
