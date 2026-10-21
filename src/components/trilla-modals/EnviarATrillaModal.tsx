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
  Table,
  Tag,
  Typography,
} from "antd";
import { BarChartOutlined, NumberOutlined, SendOutlined, ShopOutlined, InboxOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Lote } from "../../pages/lotes/lotes.api";
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
  const [descuentos, setDescuentos] = useState<Record<number, { kilosDescontados: number; sacos?: number | null }>>({});

  // Observar todos los valores del formulario en tiempo real (evita hooks en loop)
  const allValues = Form.useWatch([], form);
  const kilosEnviados: number | undefined = allValues?.kilosEnviados;

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldValue("fechaDespacho", dayjs());
      setSelectedLoteIds([]);
      setDescuentos({});
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
    setDescuentos((prev) => {
      const next: Record<number, { kilosDescontados: number; sacos?: number | null }> = {};
      for (const id of ids) {
        if (prev[id]) {
          next[id] = prev[id];
        } else {
          const l = lotes.find((item) => item.id === id);
          const disp = Number(l?.kilosActuales ?? l?.kilosIniciales ?? 0);
          next[id] = { kilosDescontados: disp, sacos: null };
        }
      }
      const sumKilos = Object.values(next).reduce((acc, curr) => acc + (curr.kilosDescontados || 0), 0);
      const sumSacos = Object.values(next).reduce((acc, curr) => acc + (curr.sacos || 0), 0);
      form.setFieldsValue({
        kilosEnviados: Number(sumKilos.toFixed(2)),
        sacosEnviados: sumSacos > 0 ? sumSacos : undefined,
      });
      return next;
    });
    form.validateFields(["kilosEnviados"]).catch(() => undefined);
  };

  const handleKilosLoteChange = (loteId: number, val: number | null) => {
    const newKilos = Number(val || 0);
    setDescuentos((prev) => {
      const updated = {
        ...prev,
        [loteId]: {
          ...prev[loteId],
          kilosDescontados: newKilos,
        },
      };
      const sumKilos = Object.values(updated).reduce((acc, curr) => acc + (curr.kilosDescontados || 0), 0);
      form.setFieldValue("kilosEnviados", Number(sumKilos.toFixed(2)));
      return updated;
    });
  };

  const handleSacosLoteChange = (loteId: number, val: number | null) => {
    const newSacos = val != null ? Number(val) : null;
    setDescuentos((prev) => {
      const updated = {
        ...prev,
        [loteId]: {
          ...prev[loteId],
          sacos: newSacos,
        },
      };
      const sumSacos = Object.values(updated).reduce((acc, curr) => acc + (curr.sacos || 0), 0);
      form.setFieldValue("sacosEnviados", sumSacos > 0 ? sumSacos : undefined);
      return updated;
    });
  };

  const handleFinish = (values: any) => {
    const descuentosPorLote = selectedLoteIds.map((id) => ({
      loteId: id,
      kilosDescontados: Number(descuentos[id]?.kilosDescontados || 0),
      sacos: descuentos[id]?.sacos != null ? Number(descuentos[id]?.sacos) : null,
    }));

    const payload: CreateOrdenTrillaDTO = {
      loteIds: values.loteIds,
      descuentosPorLote,
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

  // Solo lotes activos y en estados aptos
  const lotesDisponibles = lotes.filter(
    (l) =>
      l.activo &&
      l.estado !== "VENDIDO" &&
      l.estado !== "INACTIVO" &&
      l.estado !== "TRILLADO"
  );

  const hayLotesSeleccionados = selectedLoteIds.length > 0;

  // Lógica de tabla de lotes y descuentos
  const remanenteData = selectedLoteIds.map((id) => {
    const lote = lotes.find((l) => l.id === id);
    if (!lote) return null;
    const disponible = Number(lote.kilosActuales ?? lote.kilosIniciales ?? 0);
    return {
      key: lote.id,
      id: lote.id,
      codigo: lote.codigo,
      nombre: lote.nombre,
      disponible,
    };
  }).filter(Boolean);

  const remanenteColumns = [
    {
      title: "Lote",
      dataIndex: "codigo",
      key: "codigo",
      render: (text: string, r: any) => (
        <Space direction="vertical" size={0}>
          <strong>{text}</strong>
          {r.nombre && <Text type="secondary" style={{ fontSize: 11 }}>{r.nombre}</Text>}
        </Space>
      ),
    },
    {
      title: "Disp. (kg)",
      dataIndex: "disponible",
      key: "disponible",
      align: "right" as const,
      render: (val: number) => <Tag color="blue">{val.toFixed(2)}</Tag>,
    },
    {
      title: "Kg a Descontar",
      key: "kilosDescontados",
      align: "center" as const,
      render: (_: any, r: any) => (
        <InputNumber
          min={0.1}
          max={r.disponible}
          step={1}
          precision={2}
          value={descuentos[r.id]?.kilosDescontados}
          onChange={(val) => handleKilosLoteChange(r.id, val)}
          addonAfter="kg"
          style={{ width: 140 }}
        />
      ),
    },
    {
      title: "Sacos a Descontar",
      key: "sacos",
      align: "center" as const,
      render: (_: any, r: any) => (
        <InputNumber
          min={0}
          step={1}
          precision={0}
          value={descuentos[r.id]?.sacos ?? undefined}
          onChange={(val) => handleSacosLoteChange(r.id, val)}
          placeholder="0"
          style={{ width: 95 }}
        />
      ),
    },
    {
      title: "Nuevo Saldo",
      key: "nuevoSaldo",
      align: "right" as const,
      render: (_: any, r: any) => {
        const descontado = descuentos[r.id]?.kilosDescontados || 0;
        const nuevo = Math.max(0, r.disponible - descontado);
        return (
          <Tag color={nuevo === 0 ? "default" : "green"}>
            {nuevo.toFixed(2)} kg
          </Tag>
        );
      },
    },
  ];

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
      width={780}
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
          <Col span={12}>
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

        {hayLotesSeleccionados && kilosDisponiblesTotal > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text strong style={{ fontSize: 13 }}>
                Descuento manual por lote (Kilos y Sacos):
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Total disponible: <Tag color="blue">{kilosDisponiblesTotal.toFixed(2)} kg</Tag>
              </Text>
            </div>
            <Table
              dataSource={remanenteData as any}
              columns={remanenteColumns}
              pagination={false}
              size="small"
              bordered
            />
          </div>
        )}

        <Divider style={{ margin: "12px 0" }} />

        {/* ── Kilos enviados + N° Guía + Sacos ── */}
        <Row gutter={16}>
          <Col span={8}>
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
                      hayLotesSeleccionados &&
                      kilosDisponiblesTotal > 0 &&
                      Number(value) > kilosDisponiblesTotal + 0.01
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
          <Col span={8}>
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
          <Col span={8}>
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
        <div style={{ margin: "16px 0", padding: "12px 16px", background: "#fcfaf6", borderRadius: 8, border: "1px solid #ebd9c3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Space>
              <BarChartOutlined style={{ color: "#8c6b3e" }} />
              <Text strong style={{ color: "#614725", fontSize: 13 }}>
                Rendimiento Estimado en Tiempo Real (% sobre base enviada)
              </Text>
            </Space>
            {baseKilos > 0 && (
              <Tag color="gold">Base: {baseKilos.toFixed(2)} kg</Tag>
            )}
          </div>
          <Row gutter={[12, 8]}>
            <Col xs={24} sm={8}>
              <div style={{ padding: "8px 12px", background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: 6, textAlign: "center" }}>
                <Text style={{ fontSize: 12, color: "#389e0d", display: "block", fontWeight: 600 }}>% Exportable</Text>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#389e0d" }}>
                  {pctExportable.toFixed(1)}%
                </span>
                <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                  {expVal.toFixed(1)} kg
                </Text>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ padding: "8px 12px", background: "#e6f7ff", border: "1px solid #91d5ff", borderRadius: 6, textAlign: "center" }}>
                <Text style={{ fontSize: 12, color: "#096dd9", display: "block", fontWeight: 600 }}>% Recuperado</Text>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#096dd9" }}>
                  {pctRecuperado.toFixed(1)}%
                </span>
                <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                  {recVal.toFixed(1)} kg
                </Text>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ padding: "8px 12px", background: "#fff7e6", border: "1px solid #ffd591", borderRadius: 6, textAlign: "center" }}>
                <Text style={{ fontSize: 12, color: "#d46b08", display: "block", fontWeight: 600 }}>% Resto</Text>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#d46b08" }}>
                  {pctResto.toFixed(1)}%
                </span>
                <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
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
