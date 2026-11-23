// src/components/trilla-modals/EnviarATrillaModal.tsx
import { useEffect } from "react";
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
import { BarChartOutlined, NumberOutlined, SendOutlined, ShopOutlined, InboxOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Empaque } from "../../pages/empaque/empaque.api";
import type { CreateOrdenTrillaDTO } from "../../pages/trilla/trilla.api";

const { Text } = Typography;

/** Definición centralizada de los 9 subproductos */
const SUBPRODUCTOS: { name: keyof Omit<CreateOrdenTrillaDTO, "loteIds" | "descuentosPorLote" | "kilosEnviados" | "fechaDespacho" | "codigoTrilla" | "numeroGuia">; label: string }[] = [
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
  empaques: Empaque[];
  loading?: boolean;
};

/** Extrae el valor numérico de un campo, retorna null si vacío/undefined */
function toNumberOrNull(val: any): number | null {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

export default function EnviarATrillaModal({ open, onClose, onSubmit, empaques, loading }: Props) {
  const [form] = Form.useForm();
  // Observar todos los valores del formulario en tiempo real (evita hooks en loop)
  const allValues = Form.useWatch([], form);
  const kilosEnviados: number | undefined = allValues?.kilosEnviados;

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldValue("fechaDespacho", dayjs());
    }
  }, [open, form]);

  const empaque = empaques.find((item) => item.id === allValues?.empaqueId);
  const saldo = (item: Empaque) => Math.max(0, Number((
    item.kilosResultantes - (item.ordenesTrilla ?? []).reduce((total, orden) => total + orden.kilosEnviados, 0)
  ).toFixed(2)));
  const kilosDisponiblesTotal = empaque ? saldo(empaque) : 0;
  const secados = empaque?.empaqueSecados?.length
    ? empaque.empaqueSecados.map(({ secado }) => secado)
    : empaque?.secado ? [empaque.secado] : [];
  const lotesOrigen = [...new Map(secados.flatMap((secado) => secado.secadoLotes?.length
    ? secado.secadoLotes.map(({ loteId, lote }) => [loteId, lote?.codigo ?? `Lote #${loteId}`] as const)
    : [[secado.loteId, secado.lote?.codigo ?? `Lote #${secado.loteId}`] as const],
  )).values()];

  // Suma de subproductos ingresados
  const totalSubproductos = SUBPRODUCTOS.reduce((acc, s) => {
    const val = allValues?.[s.name];
    return acc + (val != null && !isNaN(Number(val)) ? Number(val) : 0);
  }, 0);

  const handleFinish = (values: any) => {
    const payload: CreateOrdenTrillaDTO = {
      empaqueId: values.empaqueId,
      codigoTrilla: values.codigoTrilla?.trim() || undefined,
      kilosEnviados: Number(values.kilosEnviados),
      fechaDespacho: values.fechaDespacho
        ? values.fechaDespacho.toISOString()
        : new Date().toISOString(),
      numeroGuia: values.numeroGuia?.trim() || null,
      sacosEnviados: toNumberOrNull(values.sacosEnviados),
      ...Object.fromEntries(
        SUBPRODUCTOS.map((s) => [s.name, toNumberOrNull(values[s.name])])
      ),
    };
    onSubmit(payload);
  };

  // Métricas de rendimiento en tiempo real
  const baseKilos = Number(kilosEnviados || 0);
  const expVal = Number(allValues?.exportable || 0);
  const recVal = Number(allValues?.recuperado || 0);
  const otrosSubproductos =
    Number(allValues?.malla13 || 0) +
    Number(allValues?.segundaBuena || 0) +
    Number(allValues?.segundaMala || 0) +
    Number(allValues?.sucioEscojo || 0) +
    Number(allValues?.cisco || 0) +
    Number(allValues?.descarteMaquina || 0) +
    Number(allValues?.cascarilla || 0);

  const pctExportable = baseKilos > 0 ? (expVal / baseKilos) * 100 : 0;
  const pctRecuperado = baseKilos > 0 ? (recVal / baseKilos) * 100 : 0;
  const restoKilos = otrosSubproductos > 0
    ? otrosSubproductos
    : Math.max(0, baseKilos - (expVal + recVal));
  const pctResto = baseKilos > 0 ? (restoKilos / baseKilos) * 100 : 0;

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
      width="min(860px, 96vw)"
      centered
      destroyOnClose
    >
      <Alert
        type="info"
        showIcon
        message="Puedes ingresar un código de trilla o dejarlo vacío para que se genere un código temporal (TEMP-xxx)."
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {/* ── Código de Trilla editable ── */}
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                <Space>
                  <NumberOutlined />
                  <span>Código de Trilla (Opcional)</span>
                </Space>
              }
              name="codigoTrilla"
              tooltip="Código propio o de trilladora. Si se omite, se generará TEMP-xxx automáticamente."
            >
              <Input placeholder='Ej: "TRI-2026-001" (vacío = temporal)' allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
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

        <Form.Item
          label="Registro de Almacén Pergamino"
          name="empaqueId"
          tooltip="El saldo disponible se calcula con los kilos almacenados y los envíos de trilla ya registrados."
          rules={[{ required: true, message: "Seleccione un registro con stock disponible" }]}
        >
          <Select<number>
            showSearch
            optionFilterProp="label"
            options={empaques.filter((item) => saldo(item) > 0).map((item) => ({
              value: item.id,
              label: `${item.codigo ?? `EMP-${item.id}`} · ${saldo(item).toLocaleString("es-CL")} kg disponibles`,
            }))}
            onChange={() => form.setFieldValue("kilosEnviados", undefined)}
          />
        </Form.Item>
        {empaque && (
          <Space wrap style={{ marginBottom: 16 }}>
            <Text type="secondary">Lotes de origen</Text>
            {(lotesOrigen.length ? lotesOrigen : [empaque.lote?.codigo ?? `Lote #${empaque.loteId}`])
              .map((codigo) => <Tag key={codigo}>{codigo}</Tag>)}
          </Space>
        )}

        <Divider style={{ margin: "12px 0" }} />

        {/* ── Kilos enviados + N° Guía + Sacos ── */}
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              label={
                <Space>
                  <ShopOutlined />
                  <span>Kilos Totales</span>
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
                      empaque &&
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
                precision={2} decimalSeparator=","
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              label={
                <Space>
                  <InboxOutlined />
                  <span>Sacos Enviados</span>
                </Space>
              }
              name="sacosEnviados"
              tooltip="Cantidad total de sacos enviados a la trilladora"
            >
              <InputNumber style={{ width: "100%" }} placeholder="Ej: 50" min={1} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              label={
                <Space>
                  <NumberOutlined />
                  <span>N° Guía Despacho</span>
                </Space>
              }
              name="numeroGuia"
              tooltip="Número de guía de remisión o despacho"
            >
              <Input placeholder='Ej. "GR-2026-00145"' maxLength={80} allowClear />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Panel KPI en tiempo real: % Exportable, % Recuperado y % Resto ── */}
        <div className="trilla-kpi-panel">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            <Space>
              <BarChartOutlined />
              <Text strong style={{ fontSize: 13 }}>
                Rendimiento Estimado en Tiempo Real (% sobre base enviada)
              </Text>
            </Space>

            {baseKilos > 0 && (
              <Tag color="gold">Base: {baseKilos.toFixed(2)} kg</Tag>
            )}
          </div>

          <Row gutter={[12, 8]}>
            <Col xs={24} sm={8}>
              <div className="trilla-kpi-card trilla-kpi-card-exportable">
                <Text className="trilla-kpi-label trilla-kpi-label-exportable">
                  % Exportable
                </Text>
                <span className="trilla-kpi-value trilla-kpi-value-exportable">
                  {pctExportable.toFixed(1)}%
                </span>
                <Text className="trilla-kpi-secondary">
                  {expVal.toFixed(1)} kg
                </Text>
              </div>
            </Col>

            <Col xs={24} sm={8}>
              <div className="trilla-kpi-card trilla-kpi-card-recuperado">
                <Text className="trilla-kpi-label trilla-kpi-label-recuperado">
                  % Recuperado
                </Text>
                <span className="trilla-kpi-value trilla-kpi-value-recuperado">
                  {pctRecuperado.toFixed(1)}%
                </span>
                <Text className="trilla-kpi-secondary">
                  {recVal.toFixed(1)} kg
                </Text>
              </div>
            </Col>

            <Col xs={24} sm={8}>
              <div className="trilla-kpi-card trilla-kpi-card-resto">
                <Text className="trilla-kpi-label trilla-kpi-label-resto">
                  % Resto
                </Text>
                <span className="trilla-kpi-value trilla-kpi-value-resto">
                  {pctResto.toFixed(1)}%
                </span>
                <Text className="trilla-kpi-secondary">
                  {restoKilos.toFixed(1)} kg
                </Text>
              </div>
            </Col>
          </Row>
        </div>

        {/* ── Desglose de Subproductos ── */}
        <Divider titlePlacement="left" style={{ margin: "16px 0 12px" }}>
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
                  precision={2} decimalSeparator=","
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
              border: `1px solid ${kilosEnviados && totalSubproductos > Number(kilosEnviados) ? "#ff4d4f" : "#52c41a"
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
