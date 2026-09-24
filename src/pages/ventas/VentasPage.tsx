// src/pages/ventas/VentasPage.tsx
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
  Typography,
  theme,
  Tooltip,
  Badge,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DollarOutlined,
  FileTextOutlined,
  WarningOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";


import type { Venta, CreateVentaDTO, UpdateVentaDTO } from "./ventas.api";
import {
  getVentasApi,
  createVentaApi,
  updateVentaApi,
  deleteVentaApi,
} from "./ventas.api";

import type { Cliente } from "../../pages/clientes/clientes.api";
import { getClientesApi } from "../../pages/clientes/clientes.api";

import type { OrdenTrilla } from "../trilla/trilla.api";
import { getOrdenesTrilaApi } from "../trilla/trilla.api";

import RegistrarVentaModal from "../../components/ventas-modals/RegistrarVentaModal";

const { Title, Text } = Typography;

export default function VentasPage() {
  const { token } = theme.useToken();

  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenTrilla[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenta, setEditingVenta] = useState<Venta | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingVenta, setViewingVenta] = useState<Venta | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ventasData, clientesData, ordenesData] = await Promise.all([
        getVentasApi(),
        getClientesApi(),
        getOrdenesTrilaApi(),
      ]);
      setVentas(ventasData);
      setClientes(clientesData);
      setOrdenes(ordenesData);
    } catch (error: any) {
      console.error("Error al cargar datos de ventas:", error);
      message.error(
        error?.response?.data?.message || "Error al cargar registros de ventas"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (data: CreateVentaDTO | UpdateVentaDTO, id?: string) => {
    setSaving(true);
    try {
      if (id) {
        await updateVentaApi(id, data as UpdateVentaDTO);
        message.success("Venta actualizada correctamente");
      } else {
        await createVentaApi(data as CreateVentaDTO);
        message.success("Venta registrada correctamente");
      }
      setIsModalOpen(false);
      setEditingVenta(null);
      fetchData();
    } catch (error: any) {
      console.error("Error en operación de venta:", error);
      message.error(
        error?.response?.data?.message || error.message || "Error al procesar la venta"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVentaApi(id);
      message.success("Venta eliminada correctamente");
      fetchData();
    } catch (error: any) {
      console.error("Error eliminando venta:", error);
      message.error(
        error?.response?.data?.message || error.message || "Error al eliminar la venta"
      );
    }
  };

  // Estadísticas (KPIs)
  const stats = useMemo(() => {
    const totalVentas = ventas.length;
    const kilosTotales = ventas.reduce((acc, v) => acc + (v.kilosVendidos || 0), 0);
    const ingresoTotal = ventas.reduce(
      (acc, v) => acc + (v.kilosVendidos || 0) * (v.precioVentaKilo || 0),
      0
    );
    const sinFactura = ventas.filter((v) => !v.numeroFactura).length;
    return { totalVentas, kilosTotales, ingresoTotal, sinFactura };
  }, [ventas]);

  const [filtroFecha, setFiltroFecha] = useState<[Dayjs, Dayjs] | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string | undefined>(undefined);

  const handleLimpiarFiltros = () => {
    setSearchText("");
    setFiltroFecha(null);
    setFiltroEstado(undefined);
  };

  // Búsqueda y filtrado
  const filteredVentas = useMemo(() => {
    return ventas.filter((v) => {
      if (searchText) {
        const term = searchText.toLowerCase();
        const matchesProducto = v.producto?.toLowerCase().includes(term);
        const matchesFactura = v.numeroFactura?.toLowerCase().includes(term);
        const matchesGuia = v.numeroGuiaRemision?.toLowerCase().includes(term);
        const matchesFinca = v.fincaOrigen?.toLowerCase().includes(term);
        const matchesCliente = v.cliente?.nombre?.toLowerCase().includes(term);
        const matchesOrden = v.ordenTrilla?.codigoTrilla?.toLowerCase().includes(term);
        if (!matchesProducto && !matchesFactura && !matchesGuia && !matchesFinca && !matchesCliente && !matchesOrden) {
          return false;
        }
      }

      if (filtroFecha && v.fechaVenta) {
        const f = dayjs(v.fechaVenta);
        if (f.isBefore(filtroFecha[0], "day") || f.isAfter(filtroFecha[1], "day")) {
          return false;
        }
      }

      if (filtroEstado) {
        const tieneFactura = Boolean(v.numeroFactura);
        if (filtroEstado === "FACTURADO" && !tieneFactura) return false;
        if (filtroEstado === "PENDIENTE" && tieneFactura) return false;
      }

      return true;
    });
  }, [ventas, searchText, filtroFecha, filtroEstado]);

  const columns: ColumnsType<Venta> = [
    {
      title: "Fecha de Venta",
      dataIndex: "fechaVenta",
      key: "fechaVenta",
      sorter: (a, b) => dayjs(a.fechaVenta).unix() - dayjs(b.fechaVenta).unix(),
      render: (fecha: string) => dayjs(fecha).format("DD/MM/YYYY"),
      width: 130,
    },
    {
      title: "Cliente",
      key: "cliente",
      render: (_, record: Venta) => (
        <Text strong>{record.cliente?.nombre ?? `ID: ${record.clienteId}`}</Text>
      ),
    },
    {
      title: "Producto",
      dataIndex: "producto",
      key: "producto",
      render: (producto: string) => <Tag color="green">{producto}</Tag>,
    },
    {
      title: "Orden de Trilla",
      key: "ordenTrilla",
      render: (_, record: Venta) => (
        <Tag color="blue">
          {record.ordenTrilla?.codigoTrilla ?? record.ordenTrillaId}
        </Tag>
      ),
    },
    {
      title: "Kilos Vendidos",
      dataIndex: "kilosVendidos",
      key: "kilosVendidos",
      align: "right",
      sorter: (a, b) => a.kilosVendidos - b.kilosVendidos,
      render: (val: number) => <strong>{val?.toLocaleString()} kg</strong>,
    },
    {
      title: "Presentación",
      dataIndex: "presentacionSacos",
      key: "presentacionSacos",
      render: (val: string) => <Tag>{`Saco ${val} kg`}</Tag>,
    },
    {
      title: "Precio / kg",
      dataIndex: "precioVentaKilo",
      key: "precioVentaKilo",
      align: "right",
      render: (val: number) => (
        <Text style={{ color: token.colorSuccess }}>
          ${val?.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: "Total Venta",
      key: "totalVenta",
      align: "right",
      render: (_, record: Venta) => {
        const total = (record.kilosVendidos || 0) * (record.precioVentaKilo || 0);
        return (
          <Text strong style={{ color: token.colorPrimary }}>
            ${total.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
          </Text>
        );
      },
    },
    {
      title: "Factura",
      dataIndex: "numeroFactura",
      key: "numeroFactura",
      render: (val?: string | null) =>
        val ? (
          <Space>
            <FileTextOutlined style={{ color: token.colorSuccess }} />
            <Text>{val}</Text>
          </Space>
        ) : (
          <Tooltip title="Sin número de factura aún">
            <Badge status="warning" text={<Text type="secondary">Pendiente</Text>} />
          </Tooltip>
        ),
    },
    {
      title: "Guía Remisión",
      dataIndex: "numeroGuiaRemision",
      key: "numeroGuiaRemision",
      render: (val?: string | null) =>
        val ? <Text>{val}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: "Finca",
      dataIndex: "fincaOrigen",
      key: "fincaOrigen",
      render: (val?: string | null) =>
        val ? <Text>{val}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: "Acciones",
      key: "acciones",
      align: "center",
      fixed: "right",
      render: (_, record: Venta) => (
        <Space>
          <Tooltip title="Ver detalle">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: token.colorInfo }} />}
              onClick={() => {
                setViewingVenta(record);
                setIsViewOpen(true);
              }}
              aria-label="Ver detalle de venta"
            />
          </Tooltip>
          <Tooltip title="Editar venta">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#1890ff" }} />}
              onClick={() => {
                setEditingVenta(record);
                setIsModalOpen(true);
              }}
              aria-label="Editar venta"
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar esta venta?"
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
              aria-label="Eliminar venta"
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
            <DollarOutlined style={{ marginRight: 10, color: token.colorSuccess }} />
            Ventas
          </Title>
          <Text type="secondary">
            Registro de ventas de café verde, documentos comerciales y trazabilidad de origen.
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            Refrescar
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingVenta(null);
              setIsModalOpen(true);
            }}
          >
            Registrar Venta
          </Button>
        </Space>
      </div>

      {/* Tarjetas KPI */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Total Ventas"
              value={stats.totalVentas}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Kilos Totales Vendidos"
              value={stats.kilosTotales}
              precision={1}
              suffix="kg"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Ingresos Totales"
              value={stats.ingresoTotal}
              precision={2}
              prefix="$"
              valueStyle={{ color: token.colorSuccess }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 8 }}>
            <Statistic
              title="Sin Factura (pendientes)"
              value={stats.sinFactura}
              valueStyle={{ color: stats.sinFactura > 0 ? "#faad14" : undefined }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla y Filtros */}
      <Card style={{ borderRadius: 8 }}>
        <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Buscar por cliente, producto, factura, guía o trilla..."
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
              placeholder="Estado Facturación"
              value={filtroEstado}
              onChange={setFiltroEstado}
              allowClear
              style={{ width: "100%" }}
              options={[
                { value: "FACTURADO", label: "Facturado" },
                { value: "PENDIENTE", label: "Pendiente" },
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
          dataSource={filteredVentas}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{ emptyText: "No hay ventas registradas" }}
          scroll={{ x: "max-content" }}
        />
      </Card>

      {/* Modal unificado de creación y edición */}
      <RegistrarVentaModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVenta(null);
        }}
        onSubmit={handleSubmit}
        clientes={clientes}
        ordenes={ordenes}
        ventas={ventas}
        editingVenta={editingVenta}
        loading={saving}
      />

      {/* Modal Detalle de Venta */}
      <Modal
        title={
          <Space>
            <Tag color="green" style={{ fontWeight: "bold", fontSize: 14 }}>
              VENTA #{viewingVenta?.id}
            </Tag>
            <Typography.Text type="secondary">Detalle de la Operación Comercial</Typography.Text>
          </Space>
        }
        open={isViewOpen}
        onCancel={() => {
          setIsViewOpen(false);
          setViewingVenta(null);
        }}
        footer={[
          <Button key="close" onClick={() => { setIsViewOpen(false); setViewingVenta(null); }}>
            Cerrar
          </Button>,
        ]}
        width="min(720px, 95vw)"
        centered
        destroyOnHidden
      >
        {viewingVenta && (
          <>
            <Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }} size="middle" style={{ marginTop: 8 }}>
              <Descriptions.Item label="Cliente">
                <Space direction="vertical" size={0}>
                  <strong>{viewingVenta.cliente?.nombre || `Cliente #${viewingVenta.clienteId}`}</strong>
                  {viewingVenta.cliente?.dniRut && (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      RUT/DNI: {viewingVenta.cliente.dniRut}
                    </Typography.Text>
                  )}
                  {viewingVenta.cliente?.telefono && (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Tel: {viewingVenta.cliente.telefono}
                    </Typography.Text>
                  )}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Fecha de Venta">
                {dayjs(viewingVenta.fechaVenta).format("DD/MM/YYYY")}
              </Descriptions.Item>

              <Descriptions.Item label="Orden de Trilla">
                <Tag color="blue" style={{ fontWeight: "bold" }}>
                  {viewingVenta.ordenTrilla?.codigoTrilla || `OT-${viewingVenta.ordenTrillaId}`}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Producto">
                <Tag color="green" style={{ fontWeight: "bold" }}>{viewingVenta.producto}</Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Presentación">
                <Tag>Saco {viewingVenta.presentacionSacos} kg</Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Finca de Origen">
                {viewingVenta.fincaOrigen || <Typography.Text type="secondary">—</Typography.Text>}
              </Descriptions.Item>

              <Descriptions.Item label="Kilos Vendidos">
                <strong>{viewingVenta.kilosVendidos?.toLocaleString("es-CL")} kg</strong>
              </Descriptions.Item>

              <Descriptions.Item label="Precio por Kilo">
                <Typography.Text style={{ color: token.colorSuccess, fontWeight: "bold" }}>
                  ${viewingVenta.precioVentaKilo?.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </Typography.Text>
              </Descriptions.Item>

              <Descriptions.Item label="Total Venta" span={2}>
                <Typography.Title level={4} style={{ color: token.colorPrimary, margin: 0 }}>
                  ${((viewingVenta.kilosVendidos || 0) * (viewingVenta.precioVentaKilo || 0)).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </Typography.Title>
              </Descriptions.Item>

              <Descriptions.Item label="N° Factura">
                {viewingVenta.numeroFactura ? (
                  <Space>
                    <FileTextOutlined style={{ color: token.colorSuccess }} />
                    <strong>{viewingVenta.numeroFactura}</strong>
                  </Space>
                ) : (
                  <Badge status="warning" text="Pendiente" />
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Guía de Remisión">
                {viewingVenta.numeroGuiaRemision || <Typography.Text type="secondary">—</Typography.Text>}
              </Descriptions.Item>
            </Descriptions>

            {viewingVenta.observaciones && (
              <>
                <Divider orientation="left" orientationMargin={0} style={{ marginTop: 20 }}>
                  <Typography.Text strong style={{ fontSize: 13 }}>Observaciones</Typography.Text>
                </Divider>
                <Typography.Text type="secondary">{viewingVenta.observaciones}</Typography.Text>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
