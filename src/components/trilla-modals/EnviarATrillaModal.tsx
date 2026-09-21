// src/components/trilla-modals/EnviarATrillaModal.tsx
import { useEffect, useState } from "react";
import {
  Alert,
  Col,
  DatePicker,
  Divider,
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
import { BarChartOutlined, NumberOutlined, SendOutlined, ShopOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Lote } from "../../pages/lotes/lotes.api";
import type { CreateOrdenTrillaDTO } from "../../pages/trilla/trilla.api";

const { Text } = Typography;

/** Definición centralizada de los 9 subproductos */
const SUBPRODUCTOS: { name: keyof Omit<CreateOrdenTrillaDTO, "loteIds" | "kilosEnviados" | "fechaDespacho" | "codigoTrilla" | "numeroGuia">; label: string }[] = [
  { name: "exportable", label: "Exportable" },
  { name: "recuperado", label: "Recuperado" },
  { name: "malla13", label: "Malla 13" },
  { name: "segundaBuena", label: "Segunda Buena" },
  { name: "segundaMala", label: "Segunda Mala" },
  { name: "sucioEscojo", label: "Sucio / Escojo" },
  { name: "cisco", label: "Cisco" },
  { name: "descarteMaquina", label: "Descarte Máquina" },
  { name: "cascarilla", label: "Cascarilla" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateOrdenTrillaDTO) => void;
  lotes: Lote[];
  loading?: boolean;
};

/** Extrae el valor numérico de un campo, retorna null si vacío/undefined */
function toNumberOrNull(val: any): number | null {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

export default function EnviarATrillaModal({ open, onClose, onSubmit, lotes, loading }: Props) {
  const [form] = Form.useForm();
  const [selectedLoteIds, setSelectedLoteIds] = useState<number[]>([]);

  // Observar todos los valores del formulario en tiempo real (evita hooks en loop)
  const allValues = Form.useWatch([], form);
  const kilosEnviados: number | undefined = allValues?.kilosEnviados;

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldValue("fechaDespacho", dayjs());
      setSelectedLoteIds([]);
    }
  }, [open, form]);

  // Kilos disponibles totales de los lotes seleccionados
  const kilosDisponiblesTotal = selectedLoteIds.reduce((acc, id) => {
    const lote = lotes.find((l) => l.id === id);
    return acc + (lote?.kilosActuales ?? lote?.kilosIniciales ?? 0);
  }, 0);

  // Suma de subproductos ingresados
  const totalSubproductos = SUBPRODUCTOS.reduce((acc, s) => {
    const val = allValues?.[s.name];
    return acc + (val != null && !isNaN(Number(val)) ? Number(val) : 0);
  }, 0);

  const handleLotesChange = (ids: number[]) => {
    setSelectedLoteIds(ids);
    form.validateFields(["kilosEnviados"]).catch(() => undefined);
  };

  const handleFinish = (values: any) => {
    const payload: CreateOrdenTrillaDTO = {
      loteIds: values.loteIds,
      kilosEnviados: Number(values.kilosEnviados),
      fechaDespacho: values.fechaDespacho
        ? values.fechaDespacho.toISOString()
        : new Date().toISOString(),
      numeroGuia: values.numeroGuia?.trim() || null,
      ...Object.fromEntries(
        SUBPRODUCTOS.map((s) => [s.name, toNumberOrNull(values[s.name])])
      ),
    };
    onSubmit(payload);
  };

  // Solo lotes activos y en estados aptos
  const lotesDisponibles = lotes.filter(
    (l) =>
      l.activo &&
      l.estado !== "VENDIDO" &&
      l.estado !== "INACTIVO" &&
      l.estado !== "TRILLADO"
  );

  const hayLotesSeleccionados = selectedLoteIds.length > 0;

  return (
    <Modal
      title={
        <Space>
          <SendOutlined style={{ color: "#c4b795" }} />
          <span>Enviar a Trilla</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Enviar a Trilla"
      cancelText="Cancelar"
      confirmLoading={loading}
      width={700}
      destroyOnClose
    >
      <Alert
        type="info"
        showIcon
        message="Se generará un código temporal automáticamente. El código definitivo del proveedor podrá actualizarse luego de la recepción."
        style={{ marginBottom: 20 }}
      />

      <Form form={form} layout="vertical" onFinish={handleFinish}>

        {/* ── Lotes de origen ── */}
        <Form.Item
          label="Lotes a enviar"
          name="loteIds"
          rules={[{ required: true, message: "Seleccione al menos un lote" }]}
        >
          <Select
            mode="multiple"
            placeholder="Seleccionar lotes de café pergamino..."
            allowClear
            showSearch
            onChange={handleLotesChange}
            filterOption={(input, option) =>
              (String(option?.label ?? "")).toLowerCase().includes(input.toLowerCase())
            }
            options={lotesDisponibles.map((l) => ({
              value: l.id,
              label: `${l.codigo}${l.nombre ? ` – ${l.nombre}` : ""}${(l.kilosActuales ?? l.kilosIniciales) ? ` (${(l.kilosActuales ?? l.kilosIniciales)?.toLocaleString()} kg)` : ""}`,
            }))}
            tagRender={({ label, onClose: closeTag }) => (
              <Tag
                closable
                onClose={closeTag}
                style={{ marginRight: 4, borderRadius: 4 }}
                color="gold"
              >
                {label}
              </Tag>
            )}
            notFoundContent={
              <Text type="secondary">No hay lotes disponibles para trilla</Text>
            }
          />
        </Form.Item>

        {/* Saldo total acumulado de lotes seleccionados */}
        {hayLotesSeleccionados && kilosDisponiblesTotal > 0 && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16, borderRadius: 6 }}
            message={
              <span>
                Saldo total disponible de los lotes seleccionados:{" "}
                <Tag color="blue" style={{ fontSize: 13 }}>
                  {kilosDisponiblesTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })} kg
                </Tag>
              </span>
            }
          />
        )}

        <Divider style={{ margin: "12px 0" }} />

        {/* ── Kilos enviados + Fecha ── */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <Space>
                  <ShopOutlined />
                  <span>Kilos Enviados (café pergamino)</span>
                </Space>
              }
              name="kilosEnviados"
              rules={[
                { required: true, message: "Ingrese los kilos enviados" },
                { type: "number", min: 0.01, message: "Debe ser mayor a 0" },
                {
                  validator: (_, value) => {
                    if (
                      value &&
                      hayLotesSeleccionados &&
                      kilosDisponiblesTotal > 0 &&
                      Number(value) > kilosDisponiblesTotal
                    ) {
                      return Promise.reject(
                        new Error(
                          `No puede superar los ${kilosDisponiblesTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })} kg disponibles`
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
                placeholder="Ej: 500"
                min={0.01}
                step={0.5}
                addonAfter="kg"
                precision={2}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Fecha de Despacho"
              name="fechaDespacho"
              rules={[{ required: true, message: "Seleccione la fecha de despacho" }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                showTime
                format="DD/MM/YYYY HH:mm"
                placeholder="Seleccionar fecha y hora..."
              />
            </Form.Item>
          </Col>
        </Row>

        {/* ── N° Guía de Despacho ── */}
        <Form.Item
          label={
            <Space>
              <NumberOutlined />
              <span>N° Guía de Despacho (Opcional)</span>
            </Space>
          }
          name="numeroGuia"
          tooltip="Número de guía de remisión o despacho emitido por el transportista o proveedor"
        >
          <Input placeholder='Ej. "GR-2026-00145"' maxLength={80} allowClear />
        </Form.Item>

        {/* ── Desglose de Subproductos ── */}
        <Divider orientation={"left" as const} style={{ margin: "16px 0 12px" }}>
          <Space>
            <BarChartOutlined />
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              Desglose de Subproductos (Opcional)
            </span>
          </Space>
        </Divider>

        <Row gutter={[12, 0]}>
          {SUBPRODUCTOS.map((sub) => (
            <Col xs={24} sm={12} md={8} key={sub.name}>
              <Form.Item name={sub.name} label={sub.label}>
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  precision={2}
                  placeholder="0.00"
                  addonAfter="kg"
                  step={0.5}
                />
              </Form.Item>
            </Col>
          ))}
        </Row>

        {/* Balance en vivo de subproductos */}
        {totalSubproductos > 0 && (
          <div
            style={{
              padding: "10px 14px",
              marginTop: 4,
              background:
                kilosEnviados && totalSubproductos > Number(kilosEnviados)
                  ? "rgba(255, 77, 79, 0.08)"
                  : "rgba(82, 196, 26, 0.08)",
              border: `1px solid ${
                kilosEnviados && totalSubproductos > Number(kilosEnviados) ? "#ff4d4f" : "#52c41a"
              }`,
              borderRadius: 6,
            }}
          >
            <Text
              type={
                kilosEnviados && totalSubproductos > Number(kilosEnviados) ? "danger" : "success"
              }
            >
              <strong>Total subproductos: </strong>
              {totalSubproductos.toLocaleString("es-AR", { minimumFractionDigits: 2 })} kg
              {kilosEnviados ? (
                <span style={{ marginLeft: 8, opacity: 0.75 }}>
                  / {Number(kilosEnviados).toLocaleString("es-AR", { minimumFractionDigits: 2 })} kg enviados
                </span>
              ) : null}
            </Text>
          </div>
        )}
      </Form>
    </Modal>
  );
}
