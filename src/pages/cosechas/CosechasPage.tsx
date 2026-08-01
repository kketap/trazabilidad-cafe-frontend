// src/pages/cosechas/CosechasPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
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
import type { ColumnsType } from "antd/es/table";
import {
  AppstoreOutlined,
  ClearOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";

import type { Cosecha } from "./cosechas.api";
import {
  createCosechaApi,
  deleteCosechaApi,
  getCosechasApi,
  updateCosechaApi,
} from "./cosechas.api";

import type { Trabajador } from "../../pages/trabajadores/trabajadores.api";
import { getTrabajadoresApi } from "../../pages/trabajadores/trabajadores.api";

import type { Lote } from "../lotes/lotes.api";
import { getLotesApi } from "../lotes/lotes.api";

import { formatEstadoEnum } from "../../utils/enumFormatters";

type CosechaTrabajadorRelacion = {
  id: number;
  cosechaId: number;
  trabajadorId: number;
  kilosAsignados?: number | null;
  trabajador: {
    id: number;
    nombres: string;
    apellidos?: string | null;
    dni: string;
  };
};

type CosechaLoteRelacion = {
  id: number;
  cosechaId: number;
  loteId: number;
  lote: {
    id: number;
    codigo: string;
    nombre?: string | null;
  };
};

type CosechaRow = Cosecha & {
  observacion?: string | null;
  observaciones?: string | null;
  varietal?: string[] | string | null;

  tipoCosecha?: string | null;
  tipo_cosecha?: string | null;

  trabajadorId?: number | null;
  trabajador?: {
    id: number;
    nombres: string;
    apellidos?: string | null;
    dni?: string | null;
  } | null;

  cosechaTrabajadores?: CosechaTrabajadorRelacion[];
  cosechaLotes?: CosechaLoteRelacion[];
};

function getTipoCosechaColor(tipo?: string | null) {
  switch (tipo?.toLowerCase()) {
    case "selectiva":
      return "gold";
    case "rebusca":
      return "purple";
    case "plena":
    default:
      return "green";
  }
}

function getTipoCosecha(cosecha: CosechaRow) {
  return cosecha.tipoCosecha || cosecha.tipo_cosecha || "plena";
}

function formatKg(value?: number | null) {
  return `${Number(value ?? 0).toLocaleString("es-CL")} kg`;
}

export default function CosechasPage() {
  const { token } = theme.useToken();

  const [cosechas, setCosechas] = useState<CosechaRow[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [lotesList, setLotesList] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filtroFecha, setFiltroFecha] = useState<[Dayjs, Dayjs] | null>(null);
  const [filtroTrabajador, setFiltroTrabajador] = useState<number | undefined>(
    undefined,
  );
  const [filtroTipo, setFiltroTipo] = useState<string | undefined>(undefined);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCosecha, setEditingCosecha] = useState<CosechaRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [viewingCosecha, setViewingCosecha] = useState<CosechaRow | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [form] = Form.useForm();

  async function fetchCosechas() {
    setLoading(true);

    try {
      const data = await getCosechasApi();
      setCosechas(data as CosechaRow[]);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
        "Error al cargar la lista de cosechas",
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchTrabajadoresYLotes() {
    try {
      const [trabData, lotesData] = await Promise.all([
        getTrabajadoresApi(),
        getLotesApi(),
      ]);

      setTrabajadores(trabData);
      setLotesList(lotesData);
    } catch (error) {
      console.error("Error al cargar trabajadores/lotes:", error);
      message.error("No se pudieron cargar trabajadores o lotes.");
    }
  }

  useEffect(() => {
    fetchCosechas();
    fetchTrabajadoresYLotes();
  }, []);

  function handleOpenCreateModal() {
    setEditingCosecha(null);
    form.resetFields();

    form.setFieldsValue({
      fecha: dayjs(),
      tipoCosecha: "plena",
      totalHectareas: 1,
      trabajadorIds: [],
      loteIds: [],
    });

    setIsModalOpen(true);
  }

  function handleOpenEditModal(record: CosechaRow) {
    setEditingCosecha(record);

    const loteIdsRelacion = record.cosechaLotes?.map((item) => item.loteId) ?? [];

    const loteIdsFallback =
      loteIdsRelacion.length > 0
        ? loteIdsRelacion
        : lotesList
          .filter((lote) =>
            record.lotes
              ?.split(",")
              .map((item) => item.trim())
              .includes(lote.codigo),
          )
          .map((lote) => lote.id);

    const trabajadorIdsRelacion =
      record.cosechaTrabajadores?.map((item) => item.trabajadorId) ?? [];

    const trabajadorIdsFallback =
      trabajadorIdsRelacion.length > 0
        ? trabajadorIdsRelacion
        : record.trabajadorId
          ? [record.trabajadorId]
          : record.trabajador?.id
            ? [record.trabajador.id]
            : [];

    form.setFieldsValue({
      fecha: dayjs(record.fecha),
      kilosCosechados: record.kilosCosechados,
      totalHectareas: record.totalHectareas,
      loteIds: loteIdsFallback,
      trabajadorIds: trabajadorIdsFallback,
      observacion: record.observacion || record.observaciones || "",
      tipoCosecha: getTipoCosecha(record),
      varietal: record.varietal,
    });

    setIsModalOpen(true);
  }

  function handleOpenViewModal(record: CosechaRow) {
    setViewingCosecha(record);
    setIsViewModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingCosecha(null);
    form.resetFields();
  }

  async function handleDelete(id: number) {
    try {
      await deleteCosechaApi(id);
      message.success("Cosecha eliminada correctamente");
      fetchCosechas();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Error al eliminar cosecha");
    }
  }

  async function handleSubmit() {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const trabajadorIds: number[] = Array.isArray(values.trabajadorIds)
        ? values.trabajadorIds
        : [];

      const loteIds: number[] = Array.isArray(values.loteIds)
        ? values.loteIds
        : [];

      const lotesSeleccionadosTexto = lotesList
        .filter((lote) => loteIds.includes(lote.id))
        .map((lote) => lote.codigo)
        .join(", ");

      const payload = {
        fecha: values.fecha.format("YYYY-MM-DD"),
        kilosCosechados: Number(values.kilosCosechados),
        cantidadCosechadores: trabajadorIds.length,
        totalHectareas: Number(values.totalHectareas),
        tipoCosecha: values.tipoCosecha,
        lotes: lotesSeleccionadosTexto,

        loteIds,

        trabajadores: trabajadorIds.map((trabajadorId) => ({
          trabajadorId,
        })),

        observacion: values.observacion?.trim() || null,
        varietal: values.varietal ?? null,
      };

      if (editingCosecha) {
        await updateCosechaApi(editingCosecha.id, payload as any);
        message.success("Cosecha actualizada con éxito");
      } else {
        await createCosechaApi(payload as any);
        message.success("Cosecha registrada con éxito");
      }

      handleCloseModal();
      fetchCosechas();
    } catch (error: any) {
      if (error?.response?.data?.message) {
        message.error(error.response.data.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleLimpiarFiltros() {
    setSearchText("");
    setFiltroFecha(null);
    setFiltroTrabajador(undefined);
    setFiltroTipo(undefined);
  }

  const filteredData = useMemo(() => {
    return cosechas.filter((cosecha) => {
      if (searchText) {
        const term = searchText.toLowerCase();
        const codigo = `COS-${String(cosecha.id).padStart(3, "0")}`.toLowerCase();

        const matchesCodigo = codigo.includes(term);

        const matchesLotes =
          cosecha.lotes?.toLowerCase().includes(term) ||
          cosecha.cosechaLotes?.some((item) =>
            item.lote.codigo.toLowerCase().includes(term),
          );

        const matchesTrabajador =
          cosecha.trabajador?.nombres?.toLowerCase().includes(term) ||
          cosecha.cosechaTrabajadores?.some((item) =>
            `${item.trabajador.nombres} ${item.trabajador.apellidos ?? ""}`
              .toLowerCase()
              .includes(term),
          );

        const matchesTipo = getTipoCosecha(cosecha).toLowerCase().includes(term);

        if (!matchesCodigo && !matchesLotes && !matchesTrabajador && !matchesTipo) {
          return false;
        }
      }

      if (filtroFecha) {
        const fechaCosecha = dayjs(cosecha.fecha);

        if (
          fechaCosecha.isBefore(filtroFecha[0], "day") ||
          fechaCosecha.isAfter(filtroFecha[1], "day")
        ) {
          return false;
        }
      }

      if (filtroTrabajador !== undefined) {
        const tieneTrabajadorRelacion = cosecha.cosechaTrabajadores?.some(
          (item) => item.trabajadorId === filtroTrabajador,
        );

        const tieneTrabajadorLegacy =
          cosecha.trabajadorId === filtroTrabajador ||
          cosecha.trabajador?.id === filtroTrabajador;

        if (!tieneTrabajadorRelacion && !tieneTrabajadorLegacy) {
          return false;
        }
      }

      if (filtroTipo) {
        const tipo = getTipoCosecha(cosecha);
        if (tipo.toLowerCase() !== filtroTipo.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [cosechas, searchText, filtroFecha, filtroTrabajador, filtroTipo]);

  const columns: ColumnsType<CosechaRow> = [
    {
      title: "Código Cosecha",
      dataIndex: "id",
      key: "codigo",
      width: 150,
      render: (id: number) => (
        <Tag
          color="blue"
          style={{ fontSize: 13, fontWeight: "bold", padding: "2px 8px" }}
        >
          COS-{String(id).padStart(3, "0")}
        </Tag>
      ),
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      width: 130,
      render: (text: string) => dayjs(text).format("DD/MM/YYYY"),
      sorter: (a, b) => dayjs(a.fecha).unix() - dayjs(b.fecha).unix(),
    },
    {
      title: "Lotes",
      key: "lotes",
      width: 220,
      render: (_: unknown, record) => {
        const lotesCosecha = record.cosechaLotes ?? [];

        if (lotesCosecha.length === 0) {
          return record.lotes || "-";
        }

        return (
          <Space wrap>
            {lotesCosecha.map((item) => (
              <Tag key={item.id} icon={<AppstoreOutlined />} color="gold">
                {item.lote.codigo}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "Trabajadores",
      key: "trabajadores",
      width: 260,
      render: (_: unknown, record) => {
        const trabajadoresCosecha = record.cosechaTrabajadores ?? [];

        if (trabajadoresCosecha.length > 0) {
          return (
            <Space wrap>
              {trabajadoresCosecha.map((item) => (
                <Tag key={item.id} icon={<UserOutlined />} color="blue">
                  {item.trabajador.nombres}
                  {item.trabajador.apellidos
                    ? ` ${item.trabajador.apellidos}`
                    : ""}
                </Tag>
              ))}
            </Space>
          );
        }

        if (record.trabajador?.nombres) {
          return (
            <Tag icon={<UserOutlined />} color="blue">
              {record.trabajador.nombres}
              {record.trabajador.apellidos ? ` ${record.trabajador.apellidos}` : ""}
            </Tag>
          );
        }

        return <Typography.Text type="secondary">Sin asignar</Typography.Text>;
      },
    },
    {
      title: "Tipo Cosecha",
      key: "tipoCosecha",
      width: 150,
      render: (_: unknown, record) => {
        const tipo = getTipoCosecha(record);

        return (
          <Tag color={getTipoCosechaColor(tipo)}>
            {formatEstadoEnum(tipo)}
          </Tag>
        );
      },
    },
    {
      title: "Kilos Cosechados",
      dataIndex: "kilosCosechados",
      key: "kilosCosechados",
      width: 160,
      align: "right",
      render: (value: number) => formatKg(value),
      sorter: (a, b) => a.kilosCosechados - b.kilosCosechados,
    },
    {
      title: "Hectáreas",
      dataIndex: "totalHectareas",
      key: "totalHectareas",
      width: 120,
      align: "right",
      render: (value: number) => `${Number(value ?? 0).toLocaleString("es-CL")} ha`,
      sorter: (a, b) => a.totalHectareas - b.totalHectareas,
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 140,
      fixed: "right",
      render: (_: unknown, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined style={{ color: token.colorInfo }} />}
            onClick={() => handleOpenViewModal(record)}
            title="Visualizar detalle"
          />

          <Button
            type="text"
            icon={<EditOutlined style={{ color: token.colorPrimary }} />}
            onClick={() => handleOpenEditModal(record)}
            title="Editar cosecha"
          />

          <Popconfirm
            title="Eliminar cosecha"
            description="¿Deseas eliminar este registro de cosecha?"
            onConfirm={() => handleDelete(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Eliminar"
            />
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
            Gestión de Cosechas
          </Typography.Title>

          <Typography.Text type="secondary">
            Registro diario de recolección de café y asignación de trabajadores.
          </Typography.Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleOpenCreateModal}
          style={{ borderRadius: 8 }}
        >
          Nueva Cosecha
        </Button>
      </div>

      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Buscar por código, lote o trabajador..."
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

          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="Filtrar por trabajador"
              value={filtroTrabajador}
              onChange={setFiltroTrabajador}
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: "100%" }}
              options={trabajadores.map((trabajador) => ({
                value: trabajador.id,
                label: `${trabajador.nombres}${trabajador.apellidos ? ` ${trabajador.apellidos}` : ""
                  } (${trabajador.dni})`,
              }))}
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Tipo Cosecha"
              value={filtroTipo}
              onChange={setFiltroTipo}
              allowClear
              style={{ width: "100%" }}
              options={[
                { value: "plena", label: "Plena" },
                { value: "rebusca", label: "Rebusca" },
                { value: "selectiva", label: "Selectiva" },
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={3}>
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
        title={
          editingCosecha
            ? "Editar Registro de Cosecha"
            : "Nuevo Registro de Cosecha"
        }
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={submitting}
        okText={editingCosecha ? "Guardar Cambios" : "Registrar Cosecha"}
        cancelText="Cancelar"
        width="min(760px, 95vw)"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="fecha"
                label="Fecha de Cosecha"
                rules={[{ required: true, message: "Seleccione la fecha" }]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Seleccione la fecha"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="trabajadorIds"
                label="Trabajadores / Cosechadores"
              >
                <Select
                  mode="multiple"
                  placeholder="Seleccione trabajadores..."
                  showSearch
                  optionFilterProp="label"
                  options={trabajadores
                    .filter((trabajador) => trabajador.activo)
                    .map((trabajador) => ({
                      value: trabajador.id,
                      label: `${trabajador.nombres}${trabajador.apellidos ? ` ${trabajador.apellidos}` : ""
                        } (${trabajador.dni})`,
                    }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="tipoCosecha"
                label="Tipo de Cosecha"
                rules={[
                  { required: true, message: "Seleccione el tipo de cosecha" },
                ]}
              >
                <Select
                  placeholder="Seleccionar tipo..."
                  options={[
                    { value: "plena", label: "Plena" },
                    { value: "rebusca", label: "Rebusca" },
                    { value: "selectiva", label: "Selectiva" },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="varietal" label="Varietal">
                <Select
                  mode="tags"
                  placeholder="Ej: Geisha, Caturra..."
                  options={[
                    { value: "Geisha", label: "Geisha" },
                    { value: "Java", label: "Java" },
                    { value: "Caturra", label: "Caturra" },
                    { value: "Catimor", label: "Catimor" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="kilosCosechados"
                label="Kilos Cosechados"
                rules={[
                  { required: true, message: "Ingrese los kilos cosechados" },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0.1}
                  addonAfter="kg"
                  placeholder="Ej: 450"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="totalHectareas"
                label="Total Hectáreas Recorridas"
                rules={[
                  { required: true, message: "Ingrese total de hectáreas" },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0.1}
                  addonAfter="ha"
                  placeholder="Ej: 2.5"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="loteIds"
            label="Lotes de Origen"
            rules={[
              {
                required: true,
                message: "Seleccione al menos un lote de origen",
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Seleccione los lotes de origen..."
              showSearch
              optionFilterProp="label"
              options={lotesList
                .filter((lote) => lote.activo)
                .map((lote) => ({
                  value: lote.id,
                  label: `${lote.codigo}${lote.nombre ? ` - ${lote.nombre}` : ""
                    }`,
                }))}
            />
          </Form.Item>

          <Form.Item name="observacion" label="Observación">
            <Input.TextArea
              placeholder="Observaciones adicionales sobre la cosecha..."
              rows={2}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Detalle de Cosecha - COS-${String(
          viewingCosecha?.id ?? 0,
        ).padStart(3, "0")}`}
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalOpen(false)}>
            Cerrar
          </Button>,
        ]}
        width="min(680px, 95vw)"
        centered
      >
        {viewingCosecha && (
          <Descriptions column={1} bordered size="small" style={{ marginTop: 16 }}>
            <Descriptions.Item label="Código">
              <Tag color="blue" style={{ fontSize: 13, fontWeight: "bold" }}>
                COS-{String(viewingCosecha.id).padStart(3, "0")}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Fecha">
              {dayjs(viewingCosecha.fecha).format("DD/MM/YYYY")}
            </Descriptions.Item>

            <Descriptions.Item label="Tipo Cosecha">
              <Tag color={getTipoCosechaColor(getTipoCosecha(viewingCosecha))}>
                {formatEstadoEnum(getTipoCosecha(viewingCosecha))}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Trabajadores">
              {viewingCosecha.cosechaTrabajadores &&
                viewingCosecha.cosechaTrabajadores.length > 0 ? (
                <Space wrap>
                  {viewingCosecha.cosechaTrabajadores.map((item) => (
                    <Tag key={item.id} icon={<UserOutlined />} color="blue">
                      {item.trabajador.nombres}
                      {item.trabajador.apellidos
                        ? ` ${item.trabajador.apellidos}`
                        : ""}
                    </Tag>
                  ))}
                </Space>
              ) : viewingCosecha.trabajador?.nombres ? (
                <Tag icon={<UserOutlined />} color="blue">
                  {viewingCosecha.trabajador.nombres}
                </Tag>
              ) : (
                "Sin asignar"
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Kilos Cosechados">
              {formatKg(viewingCosecha.kilosCosechados)}
            </Descriptions.Item>

            <Descriptions.Item label="Total Hectáreas">
              {Number(viewingCosecha.totalHectareas ?? 0).toLocaleString(
                "es-CL",
              )}{" "}
              ha
            </Descriptions.Item>

            <Descriptions.Item label="Lotes de Origen">
              {viewingCosecha.cosechaLotes &&
                viewingCosecha.cosechaLotes.length > 0 ? (
                <Space wrap>
                  {viewingCosecha.cosechaLotes.map((item) => (
                    <Tag key={item.id} icon={<AppstoreOutlined />} color="gold">
                      {item.lote.codigo}
                    </Tag>
                  ))}
                </Space>
              ) : (
                viewingCosecha.lotes || "-"
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Observaciones">
              {viewingCosecha.observacion ||
                viewingCosecha.observaciones ||
                "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Varietales">
              {Array.isArray(viewingCosecha.varietal)
                ? viewingCosecha.varietal.join(", ")
                : viewingCosecha.varietal || "-"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Space>
  );
}