// src/pages/secado/SecadoPage.tsx
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
  FireOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";

import type { Secado, CreateSecadoDTO, UpdateSecadoDTO } from "./secado.api";
import {
  getSecadosApi,
  createSecadoApi,
  updateSecadoApi,
  deleteSecadoApi,
} from "./secado.api";

import type { Lote } from "../lotes/lotes.api";
import { getLotesApi } from "../lotes/lotes.api";

import CrearSecadoModal from "../../components/secado-modals/CrearSecadoModal";
import EditarSecadoModal from "../../components/secado-modals/EditarSecadoModal";
import { formatEstadoEnum } from "../../utils/enumFormatters";

const { Title, Text } = Typography;

export default function SecadoPage() {
  const { token } = theme.useToken();
  const [secados, setSecados] = useState<Secado[]>([]);
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
  const [editingSecado, setEditingSecado] = useState<Secado | null>(null);
  const [viewingSecado, setViewingSecado] = useState<Secado | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

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

  const handleLimpiarFiltros = () => {
    setSearchText("");
    setFiltroFecha(null);
    setFiltroEstado(undefined);
  };

  const stats = useMemo(() => {
    const totalRegistros = secados.length;
    const totalIngresados = secados.reduce((acc, curr) => acc + (curr.kilosIngresados || 0), 0);
    const totalResultantes = secados.reduce((acc, curr) => acc + (curr.kilosResultantes || 0), 0);
    const totalMerma = secados.reduce((acc, curr) => acc + (curr.merma || 0), 0);
    const porcentajeMermaPromedio = totalIngresados > 0 ? (totalMerma / totalIngresados) * 100 : 0;

    return { totalRegistros, totalIngresados, totalResultantes, totalMerma, porcentajeMermaPromedio };
  }, [secados]);

  // Filtrado
  const filteredSecados = useMemo(() => {
    return secados.filter((s) => {
      if (searchText) {
        const term = searchText.toLowerCase();
        const codigoMatches = s.lote?.codigo && s.lote.codigo.toLowerCase().includes(term);
        const obsMatches = s.observaciones && s.observaciones.toLowerCase().includes(term);
        if (!codigoMatches && !obsMatches) return false;
      }

      if (filtroFecha && s.fechaInicio) {
        const f = dayjs(s.fechaInicio);
        if (f.isBefore(filtroFecha[0], "day") || f.isAfter(filtroFecha[1], "day")) {
          return false;
        }
      }

      if (filtroEstado) {
        const estado = (s as any).estado || (s.kilosResultantes ? "COMPLETADO" : "EN_PROCESO");
        if (estado !== filtroEstado) return false;
      }

      return true;
    });
  }, [secados, searchText, filtroFecha, filtroEstado]);

  const columns: ColumnsType<Secado> = [
    {
      title: "Código",
      key: "codigo",
      width: 120,
      render: (_: unknown, record: Secado) => (
        <Tag color="cyan" style={{ fontWeight: "bold", fontSize: 13 }}>
          {record.codigo || `SEC-${String(record.id).padStart(3, "0")}`}
        </Tag>
      ),
    },
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
      title: "Perfil",
      dataIndex: "perfilProceso",
      key: "perfilProceso",
      render: (perfil: string) => perfil ? <Tag color="purple">{formatEstadoEnum(perfil)}</Tag> : "-",
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
      title: "Estado",
      key: "estado",
      render: (_, record: Secado) => {
        const estado = (record as any).estado || (record.kilosResultantes ? "COMPLETADO" : "EN_SECADO");
        return (
          <Tag color={estado === "COMPLETADO" ? "success" : "orange"}>
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
      render: (_, record: Secado) => (
        <Space size="small">
          <Tooltip title="Ver detalle">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: token.colorInfo }} />}
              onClick={() => { setViewingSecado(record); setIsViewOpen(true); }}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#1890ff" }} />}
              onClick={() => {
                setEditingSecado(record);
                setIsEditOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar registro de secado?"
            description="Esta acción no se puede deshacer."
            onConfirm={() => handleDelete(record.id)}
            okText="Sí, eliminar"
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
            <FireOutlined style={{ fontSize: 28, color: "#fa8c16" }} />
            <div>
              <Title level={3} style={{ margin: 0 }}>
                Módulo de Secado
              </Title>
              <Text type="secondary">
                Control de ingreso a patios/marquesinas, perfiles de secado y merma.
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
              style={{ background: "#fa8c16", borderColor: "#fa8c16" }}
            >
              Nuevo Secado
            </Button>
          </Space>
        </Col>
      </Row>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic title="Total Registros" value={stats.totalRegistros} prefix={<FireOutlined />} />
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
              title="Resultante (Kg)"
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
              title="Merma Acumulada"
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
                { value: "EN_SECADO", label: "En Secado" },
                { value: "COMPLETADO", label: "Completado" },
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
          dataSource={filteredSecados}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{ emptyText: "No hay procesos de secado registrados" }}
          scroll={{ x: "max-content" }}
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

      {/* ── Modal Detalle Secado ── */}
      <Modal
        title={
          <Space>
            <Tag color="cyan" style={{ fontWeight: "bold", fontSize: 14 }}>
              {viewingSecado?.codigo || `SEC-${String(viewingSecado?.id ?? 0).padStart(3, "0")}`}
            </Tag>
            <Typography.Text type="secondary">Detalle del proceso de secado</Typography.Text>
          </Space>
        }
        open={isViewOpen}
        onCancel={() => { setIsViewOpen(false); setViewingSecado(null); }}
        footer={[
          <Button key="close" onClick={() => { setIsViewOpen(false); setViewingSecado(null); }}>
            Cerrar
          </Button>,
        ]}
        width="min(720px, 95vw)"
        centered
        destroyOnHidden
      >
        {viewingSecado && (
          <>
            <Descriptions
              bordered
              column={{ xs: 1, sm: 2, md: 2 }}
              size="middle"
              style={{ marginTop: 8 }}
            >
              <Descriptions.Item label="Código Secado">
                <Tag color="cyan" style={{ fontWeight: "bold" }}>
                  {viewingSecado.codigo || `SEC-${String(viewingSecado.id).padStart(3, "0")}`}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Lote de origen">
                <Space direction="vertical" size={0}>
                  <Tag color="blue" style={{ fontWeight: "bold" }}>
                    {viewingSecado.lote?.codigo || `Lote #${viewingSecado.loteId}`}
                  </Tag>
                  {viewingSecado.lote?.nombre && (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {viewingSecado.lote.nombre}
                    </Typography.Text>
                  )}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Perfil de proceso">
                {viewingSecado.perfilProceso ? (
                  <Tag color="purple">{formatEstadoEnum(viewingSecado.perfilProceso)}</Tag>
                ) : <Typography.Text type="secondary">-</Typography.Text>}
              </Descriptions.Item>

              <Descriptions.Item label="Secadora / Infraestructura">
                {viewingSecado.secadora || <Typography.Text type="secondary">-</Typography.Text>}
              </Descriptions.Item>

              <Descriptions.Item label="Fecha inicio">
                {dayjs(viewingSecado.fechaInicio).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>

              <Descriptions.Item label="Fecha fin">
                {viewingSecado.fechaFin
                  ? dayjs(viewingSecado.fechaFin).format("DD/MM/YYYY HH:mm")
                  : <Typography.Text type="secondary">En proceso</Typography.Text>}
              </Descriptions.Item>

              <Descriptions.Item label="Kg ingresados">
                <strong>{viewingSecado.kilosIngresados?.toLocaleString("es-CL")} kg</strong>
              </Descriptions.Item>

              <Descriptions.Item label="Kg resultantes (secos)">
                <strong style={{ color: token.colorPrimary }}>
                  {viewingSecado.kilosResultantes?.toLocaleString("es-CL")} kg
                </strong>
              </Descriptions.Item>

              <Descriptions.Item label="Merma">
                {(() => {
                  const pct = viewingSecado.kilosIngresados
                    ? ((viewingSecado.merma / viewingSecado.kilosIngresados) * 100).toFixed(1)
                    : "0";
                  return (
                    <Tag color={viewingSecado.merma > 0 ? "warning" : "green"}>
                      {viewingSecado.merma?.toLocaleString("es-CL")} kg ({pct}%)
                    </Tag>
                  );
                })()}
              </Descriptions.Item>

              <Descriptions.Item label="Temp. mínima">
                {viewingSecado.tempMinima != null
                  ? <Tag color="blue">{viewingSecado.tempMinima} °C</Tag>
                  : <Typography.Text type="secondary">-</Typography.Text>}
              </Descriptions.Item>

              <Descriptions.Item label="Temp. máxima">
                {viewingSecado.tempMaxima != null
                  ? <Tag color="red">{viewingSecado.tempMaxima} °C</Tag>
                  : <Typography.Text type="secondary">-</Typography.Text>}
              </Descriptions.Item>
            </Descriptions>

            {viewingSecado.observaciones && (
              <>
                <Divider orientation="left" orientationMargin={0} style={{ marginTop: 20 }}>
                  <Typography.Text strong style={{ fontSize: 13 }}>Observaciones</Typography.Text>
                </Divider>
                <Typography.Text type="secondary">{viewingSecado.observaciones}</Typography.Text>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
