import { useState } from "react";
import {
  Alert,
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
import dayjs, { type Dayjs } from "dayjs";
import { formatearDuracionSecado } from "../../utils/formatearDuracion";
import type { Lote } from "../../pages/lotes/lotes.api";
import type { CreateSecadoDTO } from "../../pages/secado/secado.api";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateSecadoDTO) => Promise<boolean>;
  lotes: Lote[];
  loading?: boolean;
  error?: string;
};

export default function CrearSecadoModal({ open, onClose, onSubmit, lotes, loading, error }: Props) {
  const [form] = Form.useForm();
  const [selectedLoteIds, setSelectedLoteIds] = useState<number[]>([]);
  const [kilosPorLote, setKilosPorLote] = useState<Record<number, number>>({});

  const fechaInicio = Form.useWatch<Dayjs | null>("fechaInicio", form);
  const fechaFin = Form.useWatch<Dayjs | null>("fechaFin", form);
  const tempMinima = Form.useWatch("tempMinima", form);
  const tempMaxima = Form.useWatch("tempMaxima", form);

  // Kilos reales disponibles del conjunto de lotes seleccionados
  const kilosDisponiblesTotal = selectedLoteIds.reduce((acc, id) => {
    const l = lotes.find((item) => item.id === id);
    return acc + Number(l?.kilosActuales ?? l?.kilosIniciales ?? 0);
  }, 0);


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
    if (!(await onSubmit(payload))) return;
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
      width="min(860px, 96vw)"
      centered
      destroyOnHidden
      className="secado-modal"
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ fechaInicio: dayjs() }}
      >
        {/* ── Perfil de proceso + Código ── */}
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="perfilProceso"
              label="Perfil de secado"
              rules={[{ required: true, message: "Seleccione un perfil de proceso" }]}
            >
              <Select
                placeholder="Seleccione perfil..."
              >
                <Select.Option value="HONEY">Honey</Select.Option>
                <Select.Option value="NATURAL">Natural</Select.Option>
                <Select.Option value="LAVADO">Lavado</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Código de Secado"
              tooltip="Se asigna al guardar con el siguiente correlativo del perfil seleccionado."
            >
              <Input placeholder="Se genera al guardar" readOnly />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Lotes de origen (Multi-lote) ── */}
        <Form.Item
          label="Lotes originales de café"
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
            {lotesOrdenados.filter((lote) => lote.activo && (lote.kilosActuales ?? lote.kilosIniciales ?? 0) > 0).map((lote) => {
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
        {/* Tabla de distribución de kilos por lote */}
        {selectedLoteIds.length > 0 && (
          <div className="secado-lotes-distribucion">
            <div className="secado-lotes-distribucion-header">
              <div>
                <Typography.Text strong>
                  Distribución de kilos por lote
                </Typography.Text>

                <Typography.Text
                  type="secondary"
                  style={{
                    display: "block",
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  Indique cuántos kilos de cada lote serán utilizados en este secado.
                </Typography.Text>
              </div>

              <Tag color="gold">
                {selectedLoteIds.length}{" "}
                {selectedLoteIds.length === 1
                  ? "lote seleccionado"
                  : "lotes seleccionados"}
              </Tag>
            </div>

            <Table
              className="secado-lotes-table"
              size="small"
              pagination={false}
              scroll={{
                x: 560,
              }}
              dataSource={selectedLoteIds.map((id) => {
                const lote = lotes.find(
                  (item) => item.id === id,
                );

                return {
                  id,
                  codigo:
                    lote?.codigo ||
                    `Lote #${id}`,

                  nombre:
                    lote?.nombre ??
                    null,

                  disponible:
                    Number(
                      lote?.kilosActuales ??
                      lote?.kilosIniciales ??
                      0,
                    ),
                };
              })}
              rowKey="id"
              columns={[
                {
                  title: "Lote",
                  key: "lote",
                  width: 190,
                  render: (
                    _: unknown,
                    row: any,
                  ) => (
                    <Space
                      direction="vertical"
                      size={0}
                    >
                      <Tag color="blue">
                        {row.codigo}
                      </Tag>

                      {row.nombre && (
                        <Typography.Text
                          type="secondary"
                          style={{
                            fontSize: 11,
                          }}
                        >
                          {row.nombre}
                        </Typography.Text>
                      )}
                    </Space>
                  ),
                },

                {
                  title: "Disponible",
                  dataIndex:
                    "disponible",
                  key: "disponible",
                  width: 150,
                  render: (
                    disponible: number,
                  ) => (
                    <Typography.Text
                      strong
                      type={
                        disponible <= 0
                          ? "danger"
                          : undefined
                      }
                    >
                      {disponible.toLocaleString(
                        "es-CL",
                        {
                          minimumFractionDigits:
                            2,
                          maximumFractionDigits:
                            2,
                        },
                      )}{" "}
                      kg
                    </Typography.Text>
                  ),
                },

                {
                  title:
                    "Kilos para Secado",
                  key: "kilos",
                  width: 220,
                  render: (
                    _: unknown,
                    row: any,
                  ) => (
                    <InputNumber
                      min={0}
                      max={
                        row.disponible
                      }
                      precision={2} decimalSeparator=","
                      addonAfter="kg"
                      style={{
                        width: "100%",
                      }}
                      value={
                        kilosPorLote[
                        row.id
                        ] ?? 0
                      }
                      disabled={
                        row.disponible <=
                        0
                      }
                      status={
                        (
                          kilosPorLote[
                          row.id
                          ] ?? 0
                        ) >
                          row.disponible
                          ? "error"
                          : undefined
                      }
                      placeholder={`Máx. ${row.disponible.toLocaleString(
                        "es-CL",
                      )}`}
                      onChange={(
                        value,
                      ) => {
                        const nuevoMapa = {
                          ...kilosPorLote,

                          [row.id]:
                            Number(
                              value ??
                              0,
                            ),
                        };

                        setKilosPorLote(
                          nuevoMapa,
                        );

                        const total =
                          selectedLoteIds.reduce(
                            (
                              acumulado,
                              loteId,
                            ) =>
                              acumulado +
                              (
                                nuevoMapa[
                                loteId
                                ] ?? 0
                              ),
                            0,
                          );

                        form.setFieldsValue(
                          {
                            kilosIngresados:
                              total,
                          },
                        );

                        form.validateFields(
                          [
                            "kilosIngresados",
                          ],
                        ).catch(
                          () =>
                            undefined,
                        );
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
          <Col xs={24} md={8}>
            <Form.Item
              name="fechaInicio"
              label="Fecha de Inicio"
              rules={[{ required: true, message: "Fecha de inicio requerida" }]}
            >
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD HH:mm" showTime />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="fechaFin"
              label="Fecha de Fin (Opcional)"
              help={!fechaFin ? "El secado se guardará sin fecha de término." : undefined}
            >
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD HH:mm" showTime />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Duración del proceso"
              htmlFor="duracion-secado-crear"
              tooltip="Se calcula a partir de las fechas y horas de inicio y fin."
            >
              <Input id="duracion-secado-crear" readOnly value={formatearDuracionSecado(fechaInicio, fechaFin) ?? "—"} />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Kilos ── */}
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="kilosIngresados"
              label="Kilos de cerezo ingresados"
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
              <InputNumber readOnly controls={false}
                style={{ width: "100%" }}
                min={0.01}
                precision={2} decimalSeparator=","
                placeholder="Ej. 500"
                addonAfter="kg"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Secadora / Infraestructura ── */}
        <Form.Item
          name="secadora"
          label="Lugar de secado (Opcional)"
          tooltip="Identificación del equipo o patio de secado"
        >
          <Input placeholder='Ej. "Secadora 01", "Patio Solar A"' maxLength={100} />
        </Form.Item>

        {/* ── Temperaturas ── */}
        <Row gutter={16}>
          <Col xs={24} md={12}>
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
                precision={1} decimalSeparator=","
                placeholder="Ej. 35.0"
                addonAfter="°C"
                step={0.5}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
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
                precision={1} decimalSeparator=","
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
