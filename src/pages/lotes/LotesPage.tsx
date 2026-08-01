// src/pages/lotes/LotesPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
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
  AppstoreOutlined,
  BranchesOutlined,
  SafetyCertificateOutlined,
  BarcodeOutlined,
} from "@ant-design/icons";
import type { Lote, EstadoLote, TipoCodigoLote } from "./lotes.api";
import {
  getLotesApi,
  createLoteApi,
  updateLoteApi,
  deleteLoteApi,
  getSiguienteCorrelativoApi,
  getSiguienteCodigoLoteApi,
} from "./lotes.api";

type SortField = "codigo" | "nombre" | "kilosActuales" | "createdAt";
type SortOrder = "asc" | "desc";

const tipoCodigoOptions: { value: TipoCodigoLote; label: string }[] = [
  { value: "COMERCIAL", label: "Comercial (CONV)" },
  { value: "ESPECIAL", label: "Especial (ESC)" },
  { value: "PERSONALIZADO", label: "Personalizado" },
];

const estadoLoteOptions: { value: EstadoLote; label: string }[] = [
  { value: "EN_PROCESO", label: "En proceso" },
  { value: "EN_SECADO", label: "En secado" },
  { value: "EN_ALMACEN", label: "En almacén" },
  { value: "TRILLADO", label: "Trillado" },
  { value: "VENDIDO", label: "Vendido" },
  { value: "CERRADO", label: "Cerrado" },
  { value: "INACTIVO", label: "Inactivo" },
];

function getTipoCodigoColor(tipoCodigo?: TipoCodigoLote) {
  switch (tipoCodigo) {
    case "ESPECIAL":
      return "purple";
    case "PERSONALIZADO":
      return "cyan";
    case "COMERCIAL":
    default:
      return "blue";
  }
}

function getEstadoLoteColor(estado?: EstadoLote) {
  switch (estado) {
    case "EN_PROCESO":
      return "processing";
    case "EN_SECADO":
      return "orange";
    case "EN_ALMACEN":
      return "gold";
    case "TRILLADO":
      return "purple";
    case "VENDIDO":
      return "green";
    case "CERRADO":
      return "default";
    case "INACTIVO":
      return "red";
    default:
      return "default";
  }
}

function getEstadoLoteLabel(estado?: EstadoLote) {
  return estadoLoteOptions.find((option) => option.value === estado)?.label ?? estado ?? "-";
}

function formatKg(value?: number | null) {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${value.toLocaleString("es-CL")} kg`;
}

/**
 * Calcula el saldo del lote según sus kilos iniciales y actuales.
 * Si no existen datos suficientes, retorna null para mostrar "-".
 */
function calcularSaldo(
  kilosIniciales?: number | null,
  kilosActuales?: number | null,
) {
  if (kilosIniciales === null || kilosIniciales === undefined) {
    return null;
  }

  if (kilosActuales === null || kilosActuales === undefined) {
    return null;
  }

  return Math.max(Number(kilosIniciales) - Number(kilosActuales), 0);
}

export default function LotesPage() {
  const { token } = theme.useToken();

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [filtroTipoCodigo, setFiltroTipoCodigo] = useState<TipoCodigoLote | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoLote | null>(null);
  const [filtroKilosMin, setFiltroKilosMin] = useState<number | null>(null);
  const [filtroKilosMax, setFiltroKilosMax] = useState<number | null>(null);

  const [ordenCampo, setOrdenCampo] = useState<SortField>("codigo");
  const [ordenDireccion, setOrdenDireccion] = useState<SortOrder>("asc");

  // Estado del modal de creación/edición.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLote, setEditingLote] = useState<Lote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Permite reaccionar al tipo de código seleccionado.
  const tipoCodigoWatch = Form.useWatch("tipoCodigo", form) as TipoCodigoLote | undefined;

  const fetchLotes = async () => {
    setLoading(true);

    try {
      const data = await getLotesApi();
      setLotes(data);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Error al cargar la lista de lotes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLotes();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingLote(null);
    form.resetFields();

    // Valores por defecto para crear un lote productivo.
    form.setFieldsValue({
      tipoCodigo: "COMERCIAL",
      estado: "EN_PROCESO",
      activo: true,
    });

    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: Lote) => {
    setEditingLote(record);

    // Carga valores existentes al formulario.
    form.setFieldsValue({
      codigo: record.codigo,
      nombre: record.nombre || "",
      tipoCodigo: record.tipoCodigo || "COMERCIAL",
      estado: record.estado || "EN_PROCESO",
      kilosIniciales: record.kilosIniciales ?? null,
      kilosActuales: record.kilosActuales ?? null,
      saldoTemporal: record.saldoTemporal ?? null,
      observacion: record.observacion || "",
      activo: record.activo,
    });

    setIsModalOpen(true);
  };

  const handleGenerarCodigoPrincipal = async () => {
    const tipoCodigo = form.getFieldValue("tipoCodigo") as TipoCodigoLote | undefined;

    if (!tipoCodigo || tipoCodigo === "PERSONALIZADO") {
      message.warning("Seleccione Comercial o Especial para generar un código automático");
      return;
    }

    try {
      const nuevoCodigo = await getSiguienteCodigoLoteApi(tipoCodigo);
      form.setFieldValue("codigo", nuevoCodigo);
      message.success(`Código generado: ${nuevoCodigo}`);
    } catch (error) {
      message.error("Error al generar código de lote");
    }
  };

  const handleGenerarCorrelativo = async () => {
    const codigoActual = form.getFieldValue("codigo");

    if (!codigoActual) {
      message.warning("Ingrese o genere un código base de lote. Ej: ESC-001");
      return;
    }

    try {
      const nuevoCorrelativo = await getSiguienteCorrelativoApi(codigoActual.trim());
      form.setFieldValue("codigo", nuevoCorrelativo);
      message.success(`Sublote generado: ${nuevoCorrelativo}`);
    } catch (error) {
      message.error("Error al generar sublote");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteLoteApi(id);
      message.success("Lote eliminado o desactivado correctamente");
      fetchLotes();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Error al eliminar lote");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      /**
       * Si el usuario no ingresa kilos actuales,
       * se asume que el lote sigue completo.
       */
      const kilosActuales =
        values.kilosActuales !== undefined && values.kilosActuales !== null
          ? values.kilosActuales
          : values.kilosIniciales;

      /**
       * No enviamos saldoTemporal porque el saldo se calcula automáticamente:
       * saldo = kilosIniciales - kilosActuales.
       */
      const payload = {
        ...values,
        kilosActuales,
        saldoTemporal: undefined,
      };

      if (editingLote) {
        await updateLoteApi(editingLote.id, payload);
        message.success("Lote actualizado con éxito");
      } else {
        await createLoteApi(payload);
        message.success("Lote creado con éxito");
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchLotes();
    } catch (error: any) {
      if (error?.response?.data?.message) {
        message.error(error.response.data.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const limpiarFiltros = () => {
    setSearchText("");
    setFiltroTipoCodigo(null);
    setFiltroEstado(null);
    setFiltroKilosMin(null);
    setFiltroKilosMax(null);
    setOrdenCampo("codigo");
    setOrdenDireccion("asc");
  };

  const filteredData = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    const filtrados = lotes.filter((lote) => {
      const kilosActuales = Number(lote.kilosActuales ?? 0);

      const cumpleBusqueda =
        !search ||
        lote.codigo.toLowerCase().includes(search) ||
        (lote.nombre?.toLowerCase().includes(search) ?? false) ||
        (lote.observacion?.toLowerCase().includes(search) ?? false) ||
        lote.tipoCodigo.toLowerCase().includes(search) ||
        lote.estado.toLowerCase().includes(search);

      const cumpleTipoCodigo =
        filtroTipoCodigo === null ? true : lote.tipoCodigo === filtroTipoCodigo;

      const cumpleEstado =
        filtroEstado === null ? true : lote.estado === filtroEstado;

      const cumpleKilosMin =
        filtroKilosMin === null ? true : kilosActuales >= filtroKilosMin;

      const cumpleKilosMax =
        filtroKilosMax === null ? true : kilosActuales <= filtroKilosMax;

      return (
        cumpleBusqueda &&
        cumpleTipoCodigo &&
        cumpleEstado &&
        cumpleKilosMin &&
        cumpleKilosMax
      );
    });

    return [...filtrados].sort((a, b) => {
      let valorA: string | number;
      let valorB: string | number;

      if (ordenCampo === "codigo") {
        valorA = a.codigo.toLowerCase();
        valorB = b.codigo.toLowerCase();
      } else if (ordenCampo === "nombre") {
        valorA = (a.nombre ?? "").toLowerCase();
        valorB = (b.nombre ?? "").toLowerCase();
      } else if (ordenCampo === "kilosActuales") {
        valorA = Number(a.kilosActuales ?? 0);
        valorB = Number(b.kilosActuales ?? 0);
      } else {
        valorA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        valorB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      }

      if (typeof valorA === "string" && typeof valorB === "string") {
        return ordenDireccion === "asc"
          ? valorA.localeCompare(valorB)
          : valorB.localeCompare(valorA);
      }

      return ordenDireccion === "asc"
        ? Number(valorA) - Number(valorB)
        : Number(valorB) - Number(valorA);
    });
  }, [
    lotes,
    searchText,
    filtroTipoCodigo,
    filtroEstado,
    filtroKilosMin,
    filtroKilosMax,
    ordenCampo,
    ordenDireccion,
  ]);

  const columns = [
    {
      title: "Código",
      dataIndex: "codigo",
      key: "codigo",
      render: (text: string) => (
        <Tag
          icon={<BarcodeOutlined />}
          color="gold"
          style={{ fontSize: 13, padding: "2px 8px" }}
        >
          {text}
        </Tag>
      ),
      sorter: (a: Lote, b: Lote) => a.codigo.localeCompare(b.codigo),
    },
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      render: (text: string | null) => text || "Sin nombre",
    },
    {
      title: "Tipo",
      dataIndex: "tipoCodigo",
      key: "tipoCodigo",
      render: (tipoCodigo: TipoCodigoLote) => (
        <Tag
          color={getTipoCodigoColor(tipoCodigo)}
          icon={tipoCodigo === "ESPECIAL" ? <SafetyCertificateOutlined /> : undefined}
        >
          {tipoCodigo}
        </Tag>
      ),
    },
    {
      title: "Kg iniciales",
      dataIndex: "kilosIniciales",
      key: "kilosIniciales",
      align: "right" as const,
      render: (value: number | null) => formatKg(value),
    },
    {
      title: "Kg actuales",
      dataIndex: "kilosActuales",
      key: "kilosActuales",
      align: "right" as const,
      render: (value: number | null) => formatKg(value),
      sorter: (a: Lote, b: Lote) =>
        Number(a.kilosActuales ?? 0) - Number(b.kilosActuales ?? 0),
    },
    {
      title: "Saldo calculado",
      key: "saldoCalculado",
      align: "right" as const,
      render: (_: unknown, record: Lote) => {
        const saldo = calcularSaldo(record.kilosIniciales, record.kilosActuales);

        return saldo !== null ? (
          <Tag color={saldo > 0 ? "orange" : "green"}>
            {formatKg(saldo)}
          </Tag>
        ) : (
          "-"
        );
      },
    },
    {
      title: "Etapa",
      dataIndex: "estado",
      key: "estado",
      render: (estado: string) => {
        const colores: Record<string, string> = {
          EN_PROCESO: "blue",
          EN_SECADO: "orange",
          EN_ALMACEN: "purple",
          TRILLADO: "magenta",
          VENDIDO: "success",
          CERRADO: "default",
          INACTIVO: "error",
        };
        return <Tag color={colores[estado] || "default"}>{estado ? estado.replace('_', ' ') : 'EN PROCESO'}</Tag>;
      },
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado: EstadoLote) => (
        <Tag color={getEstadoLoteColor(estado)}>
          {getEstadoLoteLabel(estado)}
        </Tag>
      ),
    },
    {
      title: "Activo",
      dataIndex: "activo",
      key: "activo",
      render: (activo: boolean) =>
        activo ? <Tag color="success">Activo</Tag> : <Tag color="default">Inactivo</Tag>,
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 120,
      render: (_: unknown, record: Lote) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: token.colorPrimary }} />}
            onClick={() => handleOpenEditModal(record)}
          />

          <Popconfirm
            title="Eliminar lote"
            description="¿Deseas eliminar o desactivar este lote?"
            onConfirm={() => handleDelete(record.id)}
            okText="Eliminar"
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
            Gestión de Lotes
          </Typography.Title>

          <Typography.Text type="secondary">
            Administración de lotes productivos de café con códigos CONV, ESC o personalizados.
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
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Buscar por código, nombre, tipo, estado u observación..."
              prefix={<SearchOutlined style={{ color: token.colorTextSecondary }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={5}>
            <Select
              allowClear
              placeholder="Tipo de código"
              value={filtroTipoCodigo}
              onChange={(value) => setFiltroTipoCodigo(value ?? null)}
              style={{ width: "100%" }}
              options={tipoCodigoOptions}
            />
          </Col>

          <Col xs={24} sm={12} md={5}>
            <Select
              allowClear
              placeholder="Estado productivo"
              value={filtroEstado}
              onChange={(value) => setFiltroEstado(value ?? null)}
              style={{ width: "100%" }}
              options={estadoLoteOptions}
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <InputNumber
              min={0}
              value={filtroKilosMin}
              onChange={(value) => setFiltroKilosMin(value ?? null)}
              placeholder="Kg mín."
              addonAfter="kg"
              style={{ width: "100%" }}
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <InputNumber
              min={0}
              value={filtroKilosMax}
              onChange={(value) => setFiltroKilosMax(value ?? null)}
              placeholder="Kg máx."
              addonAfter="kg"
              style={{ width: "100%" }}
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              value={ordenCampo}
              onChange={setOrdenCampo}
              style={{ width: "100%" }}
              options={[
                { value: "codigo", label: "Ordenar por código" },
                { value: "nombre", label: "Ordenar por nombre" },
                { value: "kilosActuales", label: "Ordenar por kg actuales" },
                { value: "createdAt", label: "Ordenar por creación" },
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={5}>
            <Select
              value={ordenDireccion}
              onChange={setOrdenDireccion}
              style={{ width: "100%" }}
              options={[
                { value: "asc", label: "Ascendente" },
                { value: "desc", label: "Descendente" },
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Button onClick={limpiarFiltros} block>
              Limpiar
            </Button>
          </Col>
        </Row>

        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          Mostrando {filteredData.length} de {lotes.length} lotes registrados.
        </Typography.Text>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: true }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Modal
        title={editingLote ? "Editar Lote" : "Nuevo Lote"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        okText={editingLote ? "Guardar Cambios" : "Crear Lote"}
        cancelText="Cancelar"
        destroyOnClose
        width={720}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="tipoCodigo"
                label="Tipo de código"
                rules={[{ required: true, message: "Seleccione el tipo de código" }]}
              >
                <Select
                  options={tipoCodigoOptions}
                  placeholder="Seleccione tipo de código"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="estado"
                label="Estado productivo"
                rules={[{ required: true, message: "Seleccione el estado del lote" }]}
              >
                <Select
                  options={estadoLoteOptions}
                  placeholder="Seleccione estado"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16} align="middle">
            <Col xs={24} sm={14}>
              <Form.Item
                name="codigo"
                label="Código del lote"
                rules={[
                  {
                    required: tipoCodigoWatch === "PERSONALIZADO",
                    message: "Ingrese el código personalizado del lote",
                  },
                ]}
              >
                <Input
                  prefix={<AppstoreOutlined />}
                  placeholder={
                    tipoCodigoWatch === "PERSONALIZADO"
                      ? "Ej: GEISHA-ALTURA-001"
                      : "Puede generarse automáticamente"
                  }
                />
              </Form.Item>
            </Col>

            <Col xs={12} sm={5}>
              <Button
                type="dashed"
                onClick={handleGenerarCodigoPrincipal}
                style={{ marginTop: 6, width: "100%" }}
                disabled={tipoCodigoWatch === "PERSONALIZADO"}
              >
                Generar
              </Button>
            </Col>

            <Col xs={12} sm={5}>
              <Button
                type="dashed"
                icon={<BranchesOutlined />}
                onClick={handleGenerarCorrelativo}
                style={{ marginTop: 6, width: "100%" }}
                title="Generar sublote o saldo"
              >
                Sublote
              </Button>
            </Col>
          </Row>

          <Form.Item name="nombre" label="Nombre del lote">
            <Input placeholder="Ej: Geisha Finca Alta / Café comercial julio" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="kilosIniciales" label="Kg iniciales">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  addonAfter="kg"
                  placeholder="Ej: 300"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8}>
              <Form.Item name="kilosActuales" label="Kg actuales">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  addonAfter="kg"
                  placeholder="Si queda vacío, usa kg iniciales"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item shouldUpdate>
            {() => {
              const kilosIniciales = form.getFieldValue("kilosIniciales");
              const kilosActuales = form.getFieldValue("kilosActuales");

              const saldo = calcularSaldo(kilosIniciales, kilosActuales);

              return (
                <Card
                  size="small"
                  style={{
                    borderRadius: 12,
                    marginBottom: 16,
                  }}
                >
                  <Space direction="vertical" size={2}>
                    <Typography.Text type="secondary">
                      Saldo calculado
                    </Typography.Text>

                    <Typography.Title level={4} style={{ margin: 0 }}>
                      {saldo !== null ? `${saldo.toLocaleString("es-CL")} kg` : "-"}
                    </Typography.Title>

                  </Space>
                </Card>
              );
            }}
          </Form.Item>

          <Form.Item name="observacion" label="Observaciones">
            <Input.TextArea
              placeholder="Notas del lote, origen, saldo, proceso o clasificación"
              rows={3}
            />
          </Form.Item>

          <Form.Item name="activo" label="Estado administrativo">
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