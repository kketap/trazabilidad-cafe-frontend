// src/pages/lotes/LotesPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  AppstoreOutlined,
  BarcodeOutlined,
  ClearOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";

import type { Lote, TipoCodigoLote, EstadoLote } from "./lotes.api";
import {
  createLoteApi,
  deleteLoteApi,
  getLotesApi,
  updateLoteApi,
} from "./lotes.api";

import { formatEstadoEnum } from "../../utils/enumFormatters";

type TipoCafeUi = "comercial" | "especial";

function getTipoCodigoColor(tipoCodigo?: TipoCodigoLote | null) {
  switch (tipoCodigo) {
    case "ESPECIAL":
      return "gold";
    case "PERSONALIZADO":
      return "purple";
    case "COMERCIAL":
    default:
      return "green";
  }
}

function formatKg(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return `${Number(value).toLocaleString("es-CL", {
    maximumFractionDigits: 2,
  })} kg`;
}

function calcularSaldo(
  kilosIniciales?: number | null,
  kilosActuales?: number | null,
) {
  if (kilosIniciales === null || kilosIniciales === undefined) return null;
  if (kilosActuales === null || kilosActuales === undefined) return null;

  return Math.max(Number(kilosIniciales) - Number(kilosActuales), 0);
}

function mapTipoCafeToTipoCodigo(tipoCafe?: TipoCafeUi): TipoCodigoLote {
  if (tipoCafe === "especial") return "ESPECIAL";
  return "COMERCIAL";
}

function mapTipoCodigoToTipoCafe(tipoCodigo?: TipoCodigoLote | null): TipoCafeUi {
  if (tipoCodigo === "ESPECIAL") return "especial";
  return "comercial";
}

function generarCodigoPreview(tipo: TipoCafeUi, listaLotes: Lote[]) {
  const prefix = tipo === "especial" ? "ESC" : "CONV";

  const codigosExistentes = listaLotes
    .map((lote) => lote.codigo)
    .filter((codigo) => codigo && codigo.startsWith(`${prefix}-`));

  let maxNum = 0;

  codigosExistentes.forEach((codigo) => {
    const parts = codigo.split("-");
    if (parts.length >= 2) {
      const num = parseInt(parts[1], 10);
      if (!Number.isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  const nextNum = maxNum + 1;
  return `${prefix}-${String(nextNum).padStart(3, "0")}`;
}

export default function LotesPage() {
  const { token } = theme.useToken();

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filtroFecha, setFiltroFecha] = useState<[Dayjs, Dayjs] | null>(null);
  const [filtroTipoCafe, setFiltroTipoCafe] = useState<TipoCafeUi | undefined>(
    undefined,
  );
  const [filtroEstado, setFiltroEstado] = useState<EstadoLote | undefined>(
    undefined,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLote, setEditingLote] = useState<Lote | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [viewingLote, setViewingLote] = useState<Lote | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [form] = Form.useForm();

  const tipoCafeWatch = Form.useWatch("tipoCafe", form);

  async function fetchLotes() {
    setLoading(true);

    try {
      const data = await getLotesApi();
      setLotes(data);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Error al cargar la lista de lotes",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLotes();
  }, []);

  useEffect(() => {
    if (isModalOpen && !editingLote && tipoCafeWatch) {
      const nuevoCodigo = generarCodigoPreview(tipoCafeWatch, lotes);
      form.setFieldValue("codigo", nuevoCodigo);
    }
  }, [tipoCafeWatch, isModalOpen, editingLote, lotes, form]);

  function handleOpenCreateModal() {
    const tipoInicial: TipoCafeUi = "comercial";
    const codigoInicial = generarCodigoPreview(tipoInicial, lotes);

    setEditingLote(null);
    form.resetFields();

    form.setFieldsValue({
      tipoCafe: tipoInicial,
      codigo: codigoInicial,
      estado: "EN_PROCESO",
      activo: true,
    });

    setIsModalOpen(true);
  }

  function handleOpenEditModal(record: Lote) {
    setEditingLote(record);

    form.setFieldsValue({
      tipoCafe: mapTipoCodigoToTipoCafe(record.tipoCodigo),
      codigo: record.codigo,
      nombre: record.nombre || "",
      estado: record.estado || "EN_PROCESO",
      kilosIniciales: record.kilosIniciales ?? null,
      kilosActuales: record.kilosActuales ?? null,
      gradosBrix: record.gradosBrix ?? null,
      observacion: record.observacion || "",
      activo: record.activo,
    });

    setIsModalOpen(true);
  }

  function handleOpenViewModal(record: Lote) {
    setViewingLote(record);
    setIsViewModalOpen(true);
  }

  async function handleDelete(id: number) {
    try {
      await deleteLoteApi(id);
      message.success("Lote eliminado o desactivado correctamente");
      fetchLotes();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Error al eliminar lote");
    }
  }

  async function handleSubmit() {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const tipoCodigo = mapTipoCafeToTipoCodigo(values.tipoCafe);

      const kilosActuales =
        values.kilosActuales !== undefined && values.kilosActuales !== null
          ? values.kilosActuales
          : values.kilosIniciales;

      const payload = {
        codigo: values.codigo,
        nombre: values.nombre?.trim() || null,
        tipoCodigo,
        estado: values.estado ?? "EN_PROCESO",
        kilosIniciales:
          values.kilosIniciales !== undefined && values.kilosIniciales !== null
            ? Number(values.kilosIniciales)
            : null,
        kilosActuales:
          kilosActuales !== undefined && kilosActuales !== null
            ? Number(kilosActuales)
            : null,
        gradosBrix:
          values.gradosBrix !== undefined && values.gradosBrix !== null
            ? Number(values.gradosBrix)
            : null,
        observacion: values.observacion?.trim() || null,
        activo: values.activo ?? true,
      };

      if (editingLote) {
        await updateLoteApi(editingLote.id, payload);
        message.success("Lote actualizado con éxito");
      } else {
        await createLoteApi(payload);
        message.success("Lote creado con éxito");
      }

      setIsModalOpen(false);
      setEditingLote(null);
      form.resetFields();
      fetchLotes();
    } catch (error: any) {
      if (error?.response?.data?.message) {
        message.error(error.response.data.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingLote(null);
    form.resetFields();
  }

  function handleLimpiarFiltros() {
    setSearchText("");
    setFiltroFecha(null);
    setFiltroTipoCafe(undefined);
    setFiltroEstado(undefined);
  }

  const filteredData = useMemo(() => {
    return lotes.filter((lote) => {
      if (searchText) {
        const term = searchText.toLowerCase();

        const matchesCodigo = lote.codigo.toLowerCase().includes(term);
        const matchesNombre =
          lote.nombre?.toLowerCase().includes(term) ?? false;
        const matchesObservacion =
          lote.observacion?.toLowerCase().includes(term) ?? false;

        if (!matchesCodigo && !matchesNombre && !matchesObservacion) {
          return false;
        }
      }

      if (filtroFecha && lote.createdAt) {
        const fechaLote = dayjs(lote.createdAt);

        if (
          fechaLote.isBefore(filtroFecha[0], "day") ||
          fechaLote.isAfter(filtroFecha[1], "day")
        ) {
          return false;
        }
      }

      if (filtroTipoCafe) {
        const tipoLote = mapTipoCodigoToTipoCafe(lote.tipoCodigo);
        if (tipoLote !== filtroTipoCafe) return false;
      }

      if (filtroEstado && lote.estado !== filtroEstado) {
        return false;
      }

      return true;
    });
  }, [lotes, searchText, filtroFecha, filtroTipoCafe, filtroEstado]);

  const columns: ColumnsType<Lote> = [
    {
      title: "Código",
      dataIndex: "codigo",
      key: "codigo",
      width: 150,
      render: (text: string) => (
        <Tag
          icon={<BarcodeOutlined />}
          color="gold"
          style={{ fontSize: 13, padding: "2px 8px" }}
        >
          {text}
        </Tag>
      ),
      sorter: (a, b) => a.codigo.localeCompare(b.codigo),
    },
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      width: 220,
      render: (text: string | null) => text || "Sin nombre",
    },
    {
      title: "Tipo",
      dataIndex: "tipoCodigo",
      key: "tipoCodigo",
      width: 150,
      render: (tipoCodigo: TipoCodigoLote) => (
        <Tag
          color={getTipoCodigoColor(tipoCodigo)}
          icon={
            tipoCodigo === "ESPECIAL" ? (
              <SafetyCertificateOutlined />
            ) : undefined
          }
        >
          {tipoCodigo === "COMERCIAL"
            ? "Comercial"
            : tipoCodigo === "ESPECIAL"
              ? "Especial"
              : "Personalizado"}
        </Tag>
      ),
    },
    {
      title: "Kg iniciales",
      dataIndex: "kilosIniciales",
      key: "kilosIniciales",
      align: "right",
      width: 140,
      render: (value: number | null) => formatKg(value),
      sorter: (a, b) =>
        Number(a.kilosIniciales ?? 0) - Number(b.kilosIniciales ?? 0),
    },
    {
      title: "Kg actuales",
      dataIndex: "kilosActuales",
      key: "kilosActuales",
      align: "right",
      width: 140,
      render: (value: number | null) => formatKg(value),
      sorter: (a, b) =>
        Number(a.kilosActuales ?? 0) - Number(b.kilosActuales ?? 0),
    },
    {
      title: "Saldo calculado",
      key: "saldoCalculado",
      align: "right",
      width: 150,
      render: (_: unknown, record: Lote) => {
        const saldo = calcularSaldo(record.kilosIniciales, record.kilosActuales);

        return saldo !== null ? (
          <Tag color={saldo > 0 ? "orange" : "green"}>{formatKg(saldo)}</Tag>
        ) : (
          "-"
        );
      },
    },
    {
      title: "Etapa / Estado",
      dataIndex: "estado",
      key: "estado",
      width: 170,
      render: (estado: EstadoLote) => {
        const colores: Record<EstadoLote, string> = {
          EN_PROCESO: "blue",
          EN_SECADO: "orange",
          EN_ALMACEN: "purple",
          TRILLADO: "magenta",
          VENDIDO: "success",
          CERRADO: "default",
          INACTIVO: "error",
        };

        return (
          <Tag color={colores[estado] || "default"}>
            {formatEstadoEnum(estado || "EN_PROCESO")}
          </Tag>
        );
      },
    },
    {
      title: "Activo",
      dataIndex: "activo",
      key: "activo",
      width: 110,
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
      fixed: "right",
      render: (_: unknown, record: Lote) => (
        <Space size="small">
          <Tooltip title="Ver detalle">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: token.colorInfo }} />}
              onClick={() => handleOpenViewModal(record)}
            />
          </Tooltip>

          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              onClick={() => handleOpenEditModal(record)}
            />
          </Tooltip>

          <Popconfirm
            title="Eliminar lote"
            description="¿Deseas eliminar o desactivar este lote?"
            onConfirm={() => handleDelete(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Eliminar">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
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
            Módulo de Lotes
          </Typography.Title>

          <Typography.Text type="secondary">
            Administración de lotes productivos de café.
          </Typography.Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleOpenCreateModal}
          style={{ borderRadius: 8 }}
        >
          Nuevo Lote
        </Button>
      </div>

      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={7}>
            <Input
              placeholder="Buscar por código, nombre u observación..."
              prefix={
                <SearchOutlined style={{ color: token.colorTextSecondary }} />
              }
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              allowClear
              style={{ width: "100%" }}
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <DatePicker.RangePicker
              value={filtroFecha}
              onChange={(value) =>
                setFiltroFecha(value as [Dayjs, Dayjs] | null)
              }
              format="DD/MM/YYYY"
              placeholder={["Fecha inicio", "Fecha fin"]}
              style={{ width: "100%" }}
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Tipo"
              value={filtroTipoCafe}
              onChange={setFiltroTipoCafe}
              allowClear
              style={{ width: "100%" }}
              options={[
                { value: "comercial", label: "Comercial" },
                { value: "especial", label: "Especial" },
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="Etapa / Estado"
              value={filtroEstado}
              onChange={setFiltroEstado}
              allowClear
              style={{ width: "100%" }}
              options={[
                { value: "EN_PROCESO", label: "En proceso" },
                { value: "EN_SECADO", label: "En secado" },
                { value: "EN_ALMACEN", label: "En almacén" },
                { value: "TRILLADO", label: "Trillado" },
                { value: "VENDIDO", label: "Vendido" },
                { value: "CERRADO", label: "Cerrado" },
                { value: "INACTIVO", label: "Inactivo" },
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={2}>
            <Button
              icon={<ClearOutlined />}
              onClick={handleLimpiarFiltros}
              block
            >
              Limpiar
            </Button>
          </Col>
        </Row>

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
        title={editingLote ? "Editar Lote" : "Nuevo Registro de Lote"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={submitting}
        okText={editingLote ? "Guardar Cambios" : "Crear Lote"}
        cancelText="Cancelar"
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="tipoCafe"
                label="Tipo de café / destino"
                rules={[{ required: true, message: "Seleccione el tipo" }]}
              >
                <Radio.Group
                  buttonStyle="solid"
                  style={{ width: "100%" }}
                  onChange={(event) => {
                    const tipo = event.target.value as TipoCafeUi;
                    const codigo = generarCodigoPreview(tipo, lotes);
                    form.setFieldValue("codigo", codigo);
                  }}
                >
                  <Radio.Button
                    value="comercial"
                    style={{ width: "50%", textAlign: "center" }}
                  >
                    Comercial
                  </Radio.Button>

                  <Radio.Button
                    value="especial"
                    style={{ width: "50%", textAlign: "center" }}
                  >
                    Especial
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="codigo"
                label="Código del lote"
                tooltip="Autogenerado en base al tipo seleccionado, pero editable"
                rules={[
                  { required: true, message: "Ingrese el código del lote" },
                ]}
              >
                <Input
                  placeholder="Ej: ESC-001 o CONV-001"
                  style={{ fontWeight: "bold" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="nombre"
            label="Nombre del lote"
            rules={[
              { required: true, message: "Ingrese un nombre identificador" },
            ]}
          >
            <Input placeholder="Ej: Café comercial julio / Geisha Finca Alta" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="kilosIniciales"
                label="Kg iniciales"
                rules={[
                  { required: true, message: "Ingrese los kilos iniciales" },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  precision={2}
                  addonAfter="kg"
                  placeholder="Ej: 250"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="kilosActuales" label="Kg actuales">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  precision={2}
                  addonAfter="kg"
                  placeholder="Si lo deja vacío, se usará el inicial"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="gradosBrix"
                label="Grados Brix"
                tooltip="Concentración de azúcares al momento de la recepción del lote"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  max={30}
                  step={0.1}
                  precision={1}
                  addonAfter="°Bx"
                  placeholder="Ej: 18.5"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="estado" label="Etapa / Estado">
            <Select
              options={[
                { value: "EN_PROCESO", label: "En proceso" },
                { value: "EN_SECADO", label: "En secado" },
                { value: "EN_ALMACEN", label: "En almacén" },
                { value: "TRILLADO", label: "Trillado" },
                { value: "VENDIDO", label: "Vendido" },
                { value: "CERRADO", label: "Cerrado" },
                { value: "INACTIVO", label: "Inactivo" },
              ]}
            />
          </Form.Item>

          <Form.Item name="observacion" label="Observaciones">
            <Input.TextArea
              rows={3}
              placeholder="Ej: Lote para proceso húmedo, variedad, notas internas, etc."
            />
          </Form.Item>

          <Form.Item name="activo" label="Estado del lote">
            <Radio.Group>
              <Radio value={true}>Activo / En producción</Radio>
              <Radio value={false}>Inactivo</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Modal Detalle Lote ── */}
      <Modal
        title={
          <Space>
            <Tag color="gold" style={{ fontSize: 13, fontWeight: "bold" }}>
              {viewingLote?.codigo}
            </Tag>
            {viewingLote?.nombre && (
              <Typography.Text type="secondary">{viewingLote.nombre}</Typography.Text>
            )}
          </Space>
        }
        open={isViewModalOpen}
        onCancel={() => { setIsViewModalOpen(false); setViewingLote(null); }}
        footer={[
          <Button key="close" onClick={() => { setIsViewModalOpen(false); setViewingLote(null); }}>
            Cerrar
          </Button>,
        ]}
        width="min(720px, 95vw)"
        centered
        destroyOnHidden
      >
        {viewingLote && (
          <>
            <Descriptions
              bordered
              column={{ xs: 1, sm: 2, md: 2 }}
              size="middle"
              style={{ marginTop: 8 }}
            >
              <Descriptions.Item label="Código">
                <Tag icon={<BarcodeOutlined />} color="gold" style={{ fontWeight: "bold", fontSize: 13 }}>
                  {viewingLote.codigo}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Tipo">
                <Tag
                  color={getTipoCodigoColor(viewingLote.tipoCodigo)}
                  icon={viewingLote.tipoCodigo === "ESPECIAL" ? <SafetyCertificateOutlined /> : undefined}
                >
                  {viewingLote.tipoCodigo === "COMERCIAL"
                    ? "Comercial"
                    : viewingLote.tipoCodigo === "ESPECIAL"
                      ? "Especial"
                      : "Personalizado"}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Estado">
                {(() => {
                  const colores: Record<EstadoLote, string> = {
                    EN_PROCESO: "blue",
                    EN_SECADO: "orange",
                    EN_ALMACEN: "purple",
                    TRILLADO: "magenta",
                    VENDIDO: "success",
                    CERRADO: "default",
                    INACTIVO: "error",
                  };
                  return (
                    <Tag color={colores[viewingLote.estado] || "default"}>
                      {formatEstadoEnum(viewingLote.estado || "EN_PROCESO")}
                    </Tag>
                  );
                })()}
              </Descriptions.Item>

              <Descriptions.Item label="Activo">
                <Tag color={viewingLote.activo ? "success" : "default"}>
                  {viewingLote.activo ? "Activo" : "Inactivo"}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Kg iniciales">
                <strong>{formatKg(viewingLote.kilosIniciales)}</strong>
              </Descriptions.Item>

              <Descriptions.Item label="Kg actuales">
                <strong>{formatKg(viewingLote.kilosActuales)}</strong>
              </Descriptions.Item>

              <Descriptions.Item label="Saldo calculado">
                {(() => {
                  const saldo = calcularSaldo(viewingLote.kilosIniciales, viewingLote.kilosActuales);
                  return saldo !== null ? (
                    <Tag color={saldo > 0 ? "orange" : "green"}>{formatKg(saldo)}</Tag>
                  ) : "-";
                })()}
              </Descriptions.Item>

              <Descriptions.Item label="Grados Brix">
                {viewingLote.gradosBrix != null ? (
                  <Tag color="cyan">{viewingLote.gradosBrix} °Bx</Tag>
                ) : "No registrado"}
              </Descriptions.Item>
            </Descriptions>

            {viewingLote.cosechaLotes && viewingLote.cosechaLotes.length > 0 && (
              <>
                <Divider orientation="left" orientationMargin={0} style={{ marginTop: 20 }}>
                  <Typography.Text strong style={{ fontSize: 13 }}>Cosechas asociadas</Typography.Text>
                </Divider>
                <Space wrap>
                  {viewingLote.cosechaLotes.map((item) => (
                    <Tag key={item.id} icon={<AppstoreOutlined />} color="blue">
                      COS-{String(item.cosechaId).padStart(3, "0")} · {item.cosecha.fecha ? dayjs(item.cosecha.fecha).format("DD/MM/YYYY") : ""}
                    </Tag>
                  ))}
                </Space>
              </>
            )}

            {viewingLote.observacion && (
              <>
                <Divider orientation="left" orientationMargin={0} style={{ marginTop: 20 }}>
                  <Typography.Text strong style={{ fontSize: 13 }}>Observaciones</Typography.Text>
                </Divider>
                <Typography.Text type="secondary">{viewingLote.observacion}</Typography.Text>
              </>
            )}
          </>
        )}
      </Modal>
    </Space>
  );
}