// src/pages/empaque/EmpaquePage.tsx
import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  InboxOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";

import type { Empaque, CreateEmpaqueDTO, UpdateEmpaqueDTO } from "./empaque.api";
import {
  getEmpaquesApi,
  createEmpaqueApi,
  updateEmpaqueApi,
  deleteEmpaqueApi,
} from "./empaque.api";

import type { Lote } from "../lotes/lotes.api";
import { getLotesApi } from "../lotes/lotes.api";

import type { Secado } from "../secado/secado.api";
import { getSecadosApi } from "../secado/secado.api";

import CrearEmpaqueModal from "../../components/empaque-modals/CrearEmpaqueModal";
import EditarEmpaqueModal from "../../components/empaque-modals/EditarEmpaqueModal";
import { formatEstadoEnum } from "../../utils/enumFormatters";

const { Title, Text } = Typography;

export default function EmpaquePage() {
  const { token } = theme.useToken();
  const [empaques, setEmpaques] = useState<Empaque[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [secados, setSecados] = useState<Secado[]>([]);
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
  const [viewingEmpaque, setViewingEmpaque] = useState<Empaque | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empaquesData, lotesData, secadosData] = await Promise.all([
        getEmpaquesApi(),
        getLotesApi(),
        getSecadosApi(),
      ]);
      setEmpaques(empaquesData);
      setLotes(lotesData);
      setSecados(secadosData);
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
        <Space size="small">
          <Tooltip title="Ver detalle">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: token.colorInfo }} />}
              onClick={() => { setViewingEmpaque(record); setIsViewOpen(true); }}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#1890ff" }} />}
              onClick={() => { setEditingEmpaque(record); setIsEditOpen(true); }}
            />
          </Tooltip>
          <Popconfirm
            title="Eliminar este registro de empaque?"
            description="Esta accion eliminara el registro de empaque permanentemente."
            onConfirm={() => handleDelete(record.id)}
            okText="Si, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Eliminar">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
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
        secados={secados}
        loading={saving}
      />

      <EditarEmpaqueModal
        open={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditingEmpaque(null); }}
        onSubmit={handleUpdate}
        empaque={editingEmpaque}
        lotes={lotes}
        secados={secados}
        loading={saving}
      />

      {/* Modal Detalle Empaque */}
      <Modal
        title={
          <Space>
            <Tag color="purple" style={{ fontWeight: "bold", fontSize: 14 }}>
              EMP-{String(viewingEmpaque?.id ?? 0).padStart(3, "0")}
            </Tag>
            <Typography.Text type="secondary">Detalle del registro de almacen</Typography.Text>
          </Space>
        }
        open={isViewOpen}
        onCancel={() => { setIsViewOpen(false); setViewingEmpaque(null); }}
        footer={[
          <Button key="close" onClick={() => { setIsViewOpen(false); setViewingEmpaque(null); }}>
            Cerrar
          </Button>,
        ]}
        width="min(720px, 95vw)"
        centered
        destroyOnHidden
      >
        {viewingEmpaque && (
          <>
            <Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }} size="middle" style={{ marginTop: 8 }}>
              <Descriptions.Item label="Lote de origen">
                <Space direction="vertical" size={0}>
                  <Tag color="gold" style={{ fontWeight: "bold" }}>
                    {viewingEmpaque.lote?.codigo || `Lote #${viewingEmpaque.loteId}`}
                  </Tag>
                  {viewingEmpaque.lote?.nombre && (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {viewingEmpaque.lote.nombre}
                    </Typography.Text>
                  )}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Estado">
                <Tag color={viewingEmpaque.kilosResultantes ? "purple" : "blue"}>
                  {viewingEmpaque.kilosResultantes ? "En Almacen" : "En Proceso"}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Proceso de Secado Vinculado">
                {viewingEmpaque.secadoId ? (
                  <Tag color="cyan">SEC-{viewingEmpaque.secadoId}</Tag>
                ) : (
                  <Typography.Text type="secondary">No vinculado</Typography.Text>
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Fecha inicio">
                {dayjs(viewingEmpaque.fechaInicio).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>

              <Descriptions.Item label="Fecha fin">
                {viewingEmpaque.fechaFin
                  ? dayjs(viewingEmpaque.fechaFin).format("DD/MM/YYYY HH:mm")
                  : <Typography.Text type="secondary">En proceso</Typography.Text>}
              </Descriptions.Item>

              <Descriptions.Item label="Kg ingresados">
                <strong>{viewingEmpaque.kilosIngresados?.toLocaleString("es-CL")} kg</strong>
              </Descriptions.Item>

              <Descriptions.Item label="Kg resultantes">
                <strong style={{ color: token.colorPrimary }}>
                  {viewingEmpaque.kilosResultantes?.toLocaleString("es-CL")} kg
                </strong>
              </Descriptions.Item>

              <Descriptions.Item label="Merma">
                {(() => {
                  const pct = viewingEmpaque.kilosIngresados
                    ? ((viewingEmpaque.merma / viewingEmpaque.kilosIngresados) * 100).toFixed(1) : "0";
                  return <Tag color={viewingEmpaque.merma > 0 ? "warning" : "green"}>{viewingEmpaque.merma?.toLocaleString("es-CL")} kg ({pct}%)</Tag>;
                })()}
              </Descriptions.Item>

              <Descriptions.Item label="Tipo de Empaque">
                {viewingEmpaque.tipoEmpaque || <Typography.Text type="secondary">No especificado</Typography.Text>}
              </Descriptions.Item>

              <Descriptions.Item label="Cantidad (Bultos)">
                {viewingEmpaque.cantidadEmpaques != null
                  ? <strong>{viewingEmpaque.cantidadEmpaques} bultos</strong>
                  : <Typography.Text type="secondary">No especificado</Typography.Text>}
              </Descriptions.Item>

              <Descriptions.Item label="Rendimiento (%)">
                {viewingEmpaque.rendimiento != null
                  ? <Tag color="geekblue">{viewingEmpaque.rendimiento}%</Tag>
                  : <Typography.Text type="secondary">No calculado</Typography.Text>}
              </Descriptions.Item>

              <Descriptions.Item label="Fue catado">
                <Tag color={viewingEmpaque.fueCatado ? "green" : "default"}>
                  {viewingEmpaque.fueCatado ? "Si" : viewingEmpaque.fueCatado === false ? "No" : "No registrado"}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Humedad">
                {viewingEmpaque.humedad != null
                  ? <Tag color="blue">{viewingEmpaque.humedad}%</Tag>
                  : <Typography.Text type="secondary">-</Typography.Text>}
              </Descriptions.Item>

              <Descriptions.Item label="Actividad de Agua (Aw)">
                {viewingEmpaque.actividadAgua != null
                  ? <Tag color="cyan">{viewingEmpaque.actividadAgua}</Tag>
                  : <Typography.Text type="secondary">-</Typography.Text>}
              </Descriptions.Item>

              <Descriptions.Item label="Puntaje SCA" span={2}>
                {viewingEmpaque.puntajeSca != null
                  ? <Tag color="gold" style={{ fontSize: 14, fontWeight: "bold" }}>{viewingEmpaque.puntajeSca} pts</Tag>
                  : <Typography.Text type="secondary">No registrado</Typography.Text>}
              </Descriptions.Item>
            </Descriptions>

            {viewingEmpaque.perfilSensorial && (
              <>
                <Divider orientation="left" orientationMargin={0} style={{ marginTop: 20 }}>
                  <Typography.Text strong style={{ fontSize: 13 }}>Perfil Sensorial</Typography.Text>
                </Divider>
                <Typography.Text type="secondary">{viewingEmpaque.perfilSensorial}</Typography.Text>
              </>
            )}

            {viewingEmpaque.observaciones && (
              <>
                <Divider orientation="left" orientationMargin={0} style={{ marginTop: 20 }}>
                  <Typography.Text strong style={{ fontSize: 13 }}>Observaciones</Typography.Text>
                </Divider>
                <Typography.Text type="secondary">{viewingEmpaque.observaciones}</Typography.Text>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
