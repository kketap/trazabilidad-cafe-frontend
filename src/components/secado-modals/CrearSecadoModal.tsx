// src/components/secado-modals/CrearSecadoModal.tsx
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
  Tag,
  Typography,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
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
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);

  const kilosIngresados = Form.useWatch("kilosIngresados", form);
  const kilosResultantes = Form.useWatch("kilosResultantes", form);
  const tempMinima = Form.useWatch("tempMinima", form);
  const tempMaxima = Form.useWatch("tempMaxima", form);

  // Kilos reales disponibles del lote seleccionado
  const kilosDisponibles =
    loteSeleccionado != null
      ? (loteSeleccionado.kilosActuales ?? loteSeleccionado.kilosIniciales ?? null)
      : null;

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

  const handleLoteChange = (loteId: number) => {
    const lote = lotes.find((l) => l.id === loteId) ?? null;
    setLoteSeleccionado(lote);
    if (lote) {
      const disponibles = lote.kilosActuales ?? lote.kilosIniciales;
      if (disponibles) {
        form.setFieldsValue({ kilosIngresados: disponibles });
      }
    }
    // Revalidar kilosIngresados si ya tiene valor
    form.validateFields(["kilosIngresados"]).catch(() => undefined);
  };

  const handleFinish = async (values: any) => {
    const payload: CreateSecadoDTO = {
      loteId: values.loteId,
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
    setLoteSeleccionado(null);
  };

  const handleCancel = () => {
    form.resetFields();
    setLoteSeleccionado(null);
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
      width={660}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ fechaInicio: dayjs() }}
      >
        {/* ── Lote de origen ── */}
        <Form.Item
          name="loteId"
          label="Lote de Café"
          rules={[{ required: true, message: "Por favor seleccione un lote" }]}
          extra="Lotes priorizados en estado EN_PROCESO"
        >
          <Select
            placeholder="Seleccione un lote"
            onChange={handleLoteChange}
            showSearch
            optionFilterProp="label"
          >
            {lotesOrdenados.map((lote) => {
              const esRecomendado = lote.estado === "EN_PROCESO";
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
                      {(lote.kilosActuales ?? lote.kilosIniciales) != null && (
                        <Tag color="blue">
                          {(lote.kilosActuales ?? lote.kilosIniciales)?.toLocaleString()} kg
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

        {/* Saldo disponible del lote seleccionado */}
        {loteSeleccionado && kilosDisponibles != null && (
          <Alert
            type="info"
            icon={<InfoCircleOutlined />}
            showIcon
            style={{ marginBottom: 16, borderRadius: 6 }}
            message={
              <span>
                Saldo disponible en lote{" "}
                <strong>{loteSeleccionado.codigo}</strong>:{" "}
                <Tag color="blue" style={{ fontSize: 13 }}>
                  {kilosDisponibles.toLocaleString("es-AR", { minimumFractionDigits: 2 })} kg
                </Tag>
              </span>
            }
          />
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
                    if (value && kilosDisponibles != null && Number(value) > kilosDisponibles) {
                      return Promise.reject(
                        new Error(
                          `No puede superar los ${kilosDisponibles.toLocaleString("es-AR", {
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

        {/* ── Perfil de proceso + Secadora ── */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="perfilProceso"
              label="Perfil de Proceso"
              rules={[{ required: true, message: "Seleccione un perfil de proceso" }]}
            >
              <Select placeholder="Seleccione perfil...">
                <Select.Option value="HONEY">Honey</Select.Option>
                <Select.Option value="NATURAL">Natural</Select.Option>
                <Select.Option value="LAVADO">Lavado</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="secadora"
              label="Secadora / Infraestructura (Opcional)"
              tooltip="Identificación del equipo o patio de secado"
            >
              <Input placeholder='Ej. "Secadora 01", "Patio Solar A"' maxLength={100} />
            </Form.Item>
          </Col>
        </Row>

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
