import { useState } from "react";
import {
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import type { Lote } from "../../pages/lotes/lotes.api";
import type { CreateSecadoDTO } from "../../pages/secado/secado.api";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateSecadoDTO) => Promise<void>;
  lotes: Lote[];
  loading?: boolean;
};

export default function CrearSecadoModal({ open, onClose, onSubmit, lotes, loading }: Props) {
  const [form] = Form.useForm();
  const [selectedLoteIds, setSelectedLoteIds] = useState<number[]>([]);
  const [kilosPorLote, setKilosPorLote] = useState<Record<number, number>>({});

  const kilosIngresados = Form.useWatch("kilosIngresados", form);
  const kilosResultantes = Form.useWatch("kilosResultantes", form);
  const tempMinima = Form.useWatch("tempMinima", form);
  const tempMaxima = Form.useWatch("tempMaxima", form);

  // Kilos reales disponibles del conjunto de lotes seleccionados
  const kilosDisponiblesTotal = selectedLoteIds.reduce((acc, id) => {
    const l = lotes.find((item) => item.id === id);
    return acc + Number(l?.kilosActuales ?? l?.kilosIniciales ?? 0);
  }, 0);

  // Merma calculada en tiempo real
  const mermaCalculada =
    kilosIngresados !== undefined && kilosIngresados !== null &&
    kilosResultantes !== undefined && kilosResultantes !== null
      ? Number(kilosIngresados) - Number(kilosResultantes)
      : null;

  // Filtrar y ordenar lotes: EN_PROCESO primero
  const lotesOrdenados = [...lotes].sort((a, b) => {
    if (a.estado === "EN_PROCESO" && b.estado !== "EN_PROCESO") return -1;
    if (a.estado !== "EN_PROCESO" && b.estado === "EN_PROCESO") return 1;
    return (a.codigo || "").localeCompare(b.codigo || "");
  });

  const handleLotesChange = (ids: number[]) => {
    setSelectedLoteIds(ids);
    const newKilos = { ...kilosPorLote };
    ids.forEach((id) => {
      if (newKilos[id] === undefined) {
        const l = lotes.find((item) => item.id === id);
        newKilos[id] = Number(l?.kilosActuales ?? l?.kilosIniciales ?? 0);
      }
    });
    setKilosPorLote(newKilos);
    const sum = ids.reduce((acc, id) => acc + (newKilos[id] || 0), 0);
    form.setFieldsValue({ kilosIngresados: sum });
    form.validateFields(["kilosIngresados"]).catch(() => undefined);
  };

  const handleFinish = async (values: any) => {
    const lotesPayload = selectedLoteIds
      .map((id) => ({
        loteId: id,
        kilosUsados: Number(kilosPorLote[id] || 0),
      }))
      .filter((l) => l.kilosUsados > 0);

    const payload: CreateSecadoDTO = {
      codigo: values.codigo?.trim() || null,
      loteId: selectedLoteIds[0] || values.loteId || 0,
      lotes: lotesPayload.length > 0 ? lotesPayload : undefined,
      fechaInicio: values.fechaInicio
        ? dayjs(values.fechaInicio).toISOString()
        : new Date().toISOString(),
      fechaFin: values.fechaFin ? dayjs(values.fechaFin).toISOString() : null,
      kilosIngresados: Number(values.kilosIngresados),
      kilosResultantes: Number(values.kilosResultantes),
      observaciones: values.observaciones || null,
      perfilProceso: values.perfilProceso,
      secadora: values.secadora?.trim() || null,
      tempMinima:
        values.tempMinima !== undefined && values.tempMinima !== null
          ? Number(values.tempMinima)
          : null,
      tempMaxima:
        values.tempMaxima !== undefined && values.tempMaxima !== null
          ? Number(values.tempMaxima)
          : null,
    };
    await onSubmit(payload);
    form.resetFields();
    setSelectedLoteIds([]);
    setKilosPorLote({});
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedLoteIds([]);
    setKilosPorLote({});
    onClose();
  };

  return (
    <Modal
      title="Registrar Proceso de Secado"
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Registrar Secado"
      cancelText="Cancelar"
      width={720}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ fechaInicio: dayjs() }}
      >
        {/* ── Perfil de proceso + Código ── */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="perfilProceso"
              label="Perfil de Proceso"
              rules={[{ required: true, message: "Seleccione un perfil de proceso" }]}
            >
              <Select
                placeholder="Seleccione perfil..."
                onChange={(perfil) => {
                  const prefixMap: Record<string, string> = {
                    NATURAL: "SEC-NAT",
                    HONEY: "SEC-HON",
                    LAVADO: "SEC-LAV",
                  };
                  const prefix = prefixMap[perfil] || "SEC";
                  if (!form.getFieldValue("codigo")) {
                    form.setFieldValue("codigo", `${prefix}-001`);
                  }
                }}
              >
                <Select.Option value="HONEY">Honey</Select.Option>
                <Select.Option value="NATURAL">Natural</Select.Option>
                <Select.Option value="LAVADO">Lavado</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="codigo"
              label="Código de Secado"
              tooltip="Código autogenerado vinculado al perfil de secado (SEC-NAT-001, etc.), pero editable"
            >
              <Input placeholder="Ej. SEC-NAT-001" style={{ fontWeight: "bold" }} />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Lotes de origen (Multi-lote) ── */}
        <Form.Item
          label="Lotes de Proceso Húmedo (Multi-lote)"
          rules={[
            {
              validator: async () => {
                if (selectedLoteIds.length === 0) {
                  throw new Error("Por favor seleccione al menos un lote de café");
                }
              },
            },
          ]}
          extra="Seleccione uno o más lotes de café con saldo disponible para este secado"
        >
          <Select
            mode="multiple"
            placeholder="Seleccione uno o varios lotes"
            value={selectedLoteIds}
            onChange={handleLotesChange}
            showSearch
            optionFilterProp="label"
          >
            {lotesOrdenados.map((lote) => {
              const esRecomendado = lote.estado === "EN_PROCESO";
              const disp = lote.kilosActuales ?? lote.kilosIniciales;
              return (
                <Select.Option
                  key={lote.id}
                  value={lote.id}
                  label={`${lote.codigo} ${lote.nombre ? `- ${lote.nombre}` : ""}`}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>
                      <strong>{lote.codigo}</strong> {lote.nombre ? `(${lote.nombre})` : ""}
                    </span>
                    <Space>
                      {disp != null && (
                        <Tag color="blue">
                          {disp.toLocaleString()} kg disp.
                        </Tag>
                      )}
                      <Tag color={esRecomendado ? "green" : "default"}>
                        {lote.estado || "SIN ESTADO"}
                      </Tag>
                    </Space>
                  </div>
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>

        {/* Tabla de kilos por lote cuando hay selección múltiple */}
        {selectedLoteIds.length > 0 && (
          <div style={{ marginBottom: 16, background: "#f8f9fa", padding: 12, borderRadius: 6 }}>
            <Typography.Text strong style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
              Kilos a descontar por lote:
            </Typography.Text>
            <Table
              size="small"
              pagination={false}
              dataSource={selectedLoteIds.map((id) => {
                const l = lotes.find((item) => item.id === id);
                return {
                  id,
                  codigo: l?.codigo || `Lote #${id}`,
                  disponible: Number(l?.kilosActuales ?? l?.kilosIniciales ?? 0),
                };
              })}
              rowKey="id"
              columns={[
                {
                  title: "Lote",
                  dataIndex: "codigo",
                  key: "codigo",
                  render: (c: string) => <Tag color="blue">{c}</Tag>,
                },
                {
                  title: "Disponible",
                  dataIndex: "disponible",
                  key: "disponible",
                  render: (d: number) => `${d.toLocaleString()} kg`,
                },
                {
                  title: "Kilos para Secado",
                  key: "kilos",
                  render: (_: unknown, row: any) => (
                    <InputNumber
                      min={0.1}
                      max={row.disponible}
                      precision={2}
                      addonAfter="kg"
                      style={{ width: "100%" }}
                      value={kilosPorLote[row.id]}
                      placeholder={`Máx ${row.disponible}`}
                      onChange={(val) => {
                        const newMap = { ...kilosPorLote, [row.id]: Number(val ?? 0) };
                        setKilosPorLote(newMap);
                        const sum = selectedLoteIds.reduce((acc, id) => acc + (newMap[id] || 0), 0);
                        form.setFieldsValue({ kilosIngresados: sum });
                      }}
                    />
                  ),
                },
              ]}
            />
          </div>
        )}

        {/* ── Fechas ── */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="fechaInicio"
              label="Fecha de Inicio"
              rules={[{ required: true, message: "Fecha de inicio requerida" }]}
            >
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD HH:mm" showTime />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="fechaFin" label="Fecha de Fin (Opcional)">
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD HH:mm" showTime />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Kilos ── */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="kilosIngresados"
              label="Kilos Ingresados"
              rules={[
                { required: true, message: "Kilos ingresados requeridos" },
                {
                  type: "number",
                  min: 0.01,
                  message: "Debe ser mayor a 0",
                },
                {
                  validator: (_, value) => {
                    if (value && kilosDisponiblesTotal > 0 && Number(value) > kilosDisponiblesTotal + 0.01) {
                      return Promise.reject(
                        new Error(
                          `No puede superar los ${kilosDisponiblesTotal.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })} kg disponibles`
                        )
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0.01}
                precision={2}
                placeholder="Ej. 500"
                addonAfter="kg"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="kilosResultantes"
              label="Kilos Resultantes (Secos)"
              rules={[{ required: true, message: "Kilos resultantes requeridos" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                precision={2}
                placeholder="Ej. 420"
                addonAfter="kg"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Merma calculada */}
        {mermaCalculada !== null && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: 16,
              background: mermaCalculada >= 0 ? "rgba(250, 173, 20, 0.1)" : "rgba(255, 77, 79, 0.1)",
              border: `1px solid ${mermaCalculada >= 0 ? "#faad14" : "#ff4d4f"}`,
              borderRadius: 6,
            }}
          >
            <Typography.Text type={mermaCalculada >= 0 ? "warning" : "danger"}>
              <strong>Merma estimada: </strong>
              {mermaCalculada.toFixed(2)} kg (
              {kilosIngresados
                ? ((mermaCalculada / Number(kilosIngresados)) * 100).toFixed(1)
                : 0}
              %)
            </Typography.Text>
          </div>
        )}

        {/* ── Secadora / Infraestructura ── */}
        <Form.Item
          name="secadora"
          label="Secadora / Infraestructura (Opcional)"
          tooltip="Identificación del equipo o patio de secado"
        >
          <Input placeholder='Ej. "Secadora 01", "Patio Solar A"' maxLength={100} />
        </Form.Item>

        {/* ── Temperaturas ── */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="tempMinima"
              label="Temperatura Mínima (Opcional)"
              dependencies={["tempMaxima"]}
              rules={[
                {
                  validator: (_, value) => {
                    if (
                      value !== undefined &&
                      value !== null &&
                      tempMaxima !== undefined &&
                      tempMaxima !== null &&
                      Number(value) > Number(tempMaxima)
                    ) {
                      return Promise.reject(
                        new Error("La temp. mínima no puede superar la máxima")
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                precision={1}
                placeholder="Ej. 35.0"
                addonAfter="°C"
                step={0.5}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="tempMaxima"
              label="Temperatura Máxima (Opcional)"
              dependencies={["tempMinima"]}
              rules={[
                {
                  validator: (_, value) => {
                    if (
                      value !== undefined &&
                      value !== null &&
                      tempMinima !== undefined &&
                      tempMinima !== null &&
                      Number(value) < Number(tempMinima)
                    ) {
                      return Promise.reject(
                        new Error("La temp. máxima no puede ser inferior a la mínima")
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                precision={1}
                placeholder="Ej. 55.0"
                addonAfter="°C"
                step={0.5}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Observaciones ── */}
        <Form.Item name="observaciones" label="Observaciones">
          <Input.TextArea
            rows={3}
            placeholder="Método de secado, porcentaje de humedad final, notas..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
