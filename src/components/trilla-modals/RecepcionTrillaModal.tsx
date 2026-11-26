import { estadosTrilla, getEstadoTrilla } from "../../pages/trilla/trilla.api";
// src/components/trilla-modals/RecepcionTrillaModal.tsx
import { useEffect } from "react";
import {
  Alert,
  Col,
  Descriptions,
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
import {
  BarChartOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { OrdenTrilla, UpdateOrdenTrillaDTO } from "../../pages/trilla/trilla.api";

const { Text } = Typography;

const CALIDAD_OPTIONS = [
  { value: "Especial", label: "Especial" },
  { value: "Premium", label: "Premium" },
  { value: "Exportación", label: "Exportación" },
  { value: "Primera", label: "Primera" },
  { value: "Segunda", label: "Segunda" },
  { value: "Estándar", label: "Estándar" },
];

/** Campos del desglose de subproductos de la recepción. */
const SUBPRODUCTOS: {
  name: keyof Pick<OrdenTrilla,
    "exportable" | "exportable2" | "exportable3" | "recuperado" | "malla13" | "segundaBuena" | "segundaMala" |
    "sucioEscojo" | "cisco" | "descarteMaquina" | "cascarilla"
  >; label: string
}[] = [
    { name: "exportable", label: "Exportable 1" },
    { name: "exportable2", label: "Exportable 2" },
    { name: "exportable3", label: "Exportable 3" },
    { name: "recuperado", label: "Recuperado" },
    { name: "malla13", label: "Malla 13" },
    { name: "segundaBuena", label: "Segunda Buena" },
    { name: "segundaMala", label: "Segunda Mala" },
    { name: "sucioEscojo", label: "Sucio / Escojo" },
    { name: "cisco", label: "Cisco" },
    { name: "descarteMaquina", label: "Descarte Máquina" },
    { name: "cascarilla", label: "Cascarilla" },
  ];

/** Extrae el valor numérico de un campo, retorna null si vacío/undefined */
function toNumberOrNull(val: any): number | null {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, values: UpdateOrdenTrillaDTO) => void;
  orden: OrdenTrilla | null;
  loading?: boolean;
};

export default function RecepcionTrillaModal({ open, onClose, onSubmit, orden, loading }: Props) {
  const [form] = Form.useForm();

  // Observar todos los valores del formulario en tiempo real (evita hooks en loop)
  const allValues = Form.useWatch([], form);
  const datos = allValues ?? orden;
  const kilosNetos: number | undefined = datos?.kilosNetos ?? undefined;
  const kilosEnviados = orden?.kilosEnviados;
  const excedeKilosEnviados = kilosNetos != null && kilosEnviados != null && kilosNetos > kilosEnviados;
  const mensajeLimite = `Los kilos netos resultantes no pueden superar los ${kilosEnviados?.toLocaleString("es-CL")} kg enviados.`;

  const totalSubproductos = Number(SUBPRODUCTOS.reduce(
    (total, { name }) => total + (toNumberOrNull(datos?.[name]) ?? 0),
    Number(orden?.exportable4 ?? 0),
  ).toFixed(2));

  useEffect(() => {
    if (open && orden) {
      form.setFieldsValue({
        codigoTrilla: "",
        calidad: orden.calidad || undefined,
        kilosNetos: orden.kilosNetos ?? undefined,
        numeroGuiaHayland: orden.numeroGuiaHayland ?? "",
        guiaIngreso: orden.guiaIngreso ?? "",
        estadoManual: getEstadoTrilla(orden),
        exportable2: orden.exportable2 ?? null,
        exportable3: orden.exportable3 ?? null,
        // Subproductos
        exportable: orden.exportable ?? null,
        recuperado: orden.recuperado ?? null,
        malla13: orden.malla13 ?? null,
        segundaBuena: orden.segundaBuena ?? null,
        segundaMala: orden.segundaMala ?? null,
        sucioEscojo: orden.sucioEscojo ?? null,
        cisco: orden.cisco ?? null,
        descarteMaquina: orden.descarteMaquina ?? null,
        cascarilla: orden.cascarilla ?? null,
      });
    }
    if (!open) {
      form.resetFields();
    }
  }, [open, orden, form]);

  const handleFinish = (values: any) => {
    if (!orden) return;
    const payload: UpdateOrdenTrillaDTO = {
      codigoTrilla: values.codigoTrilla?.trim() || undefined,
      calidad: values.calidad || null,
      kilosNetos: values.kilosNetos ? Number(values.kilosNetos) : null,
      numeroGuiaHayland: values.numeroGuiaHayland?.trim() || null,
      guiaIngreso: values.guiaIngreso.trim(),
      estadoManual: values.estadoManual,
      ...Object.fromEntries(
        SUBPRODUCTOS.map((s) => [s.name, toNumberOrNull(values[s.name])])
      ),
    };
    onSubmit(orden.id, payload);
  };

  const esTemporalCodigo = orden?.codigoTrilla?.startsWith("TEMP-");

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined style={{ color: "#52c41a" }} />
          <span>Recepción de Trilla</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Guardar Recepción"
      okButtonProps={{ disabled: excedeKilosEnviados }}
      cancelText="Cancelar"
      confirmLoading={loading}
      width="min(760px, 96vw)"
      centered
      destroyOnClose
    >
      {/* Resumen de la orden */}
      {orden && (
        <>
          <Descriptions size="small" bordered column={2} style={{ marginBottom: 20 }}>
            <Descriptions.Item label="Código Actual" span={1}>
              <Tag color={esTemporalCodigo ? "orange" : "green"}>{orden.codigoTrilla}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Kilos Enviados" span={1}>
              <strong>{orden.kilosEnviados?.toLocaleString()} kg</strong>
            </Descriptions.Item>
            {(orden.guiaSalida ?? orden.numeroGuia) && (
              <Descriptions.Item label="Guía de salida" span={1}>
                <Tag color="geekblue">{orden.guiaSalida ?? orden.numeroGuia}</Tag>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Lotes incluidos" span={(orden.guiaSalida ?? orden.numeroGuia) ? 1 : 2}>
              <Space wrap>
                {orden.lotes && orden.lotes.length > 0
                  ? orden.lotes.map((l: any) => (
                    <Tag key={l.id} color="gold">
                      {l.codigo}
                    </Tag>
                  ))
                  : "-"}
              </Space>
            </Descriptions.Item>
          </Descriptions>

          {esTemporalCodigo && (
            <Alert
              type="warning"
              showIcon
              icon={<EditOutlined />}
              message="Código temporal pendiente"
              description="Ingresa el código definitivo que te entregó la trilladora. Si aún está pendiente, puedes guardar la recepción con el código temporal."
              style={{ marginBottom: 20 }}
            />
          )}
        </>
      )}

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {esTemporalCodigo && (
          <Form.Item
            name="codigoTrilla"
            label="Código definitivo de trilla"
            rules={[{
              validator: async (_, value?: string) => {
                if (value?.trim().toUpperCase().startsWith("TEMP-")) {
                  throw new Error("Ingresa el código definitivo que te entregó la trilladora.");
                }
              },
            }]}
          >
            <Input placeholder="Código informado por la trilladora" allowClear />
          </Form.Item>
        )}
        <Form.Item name="estadoManual" label="Estado" rules={[{ required: true }]}>
          <Select options={[...estadosTrilla]} />
        </Form.Item>
        <Form.Item name="numeroGuiaHayland" label="N.º de guía de recepción Hayland">
          <Input maxLength={80} allowClear />
        </Form.Item>

        <Form.Item name="guiaIngreso" label="Guía de ingreso"
          rules={[{ required: true, whitespace: true, message: "Ingresa la guía de ingreso" }]}>
          <Input />
        </Form.Item>

        <Divider style={{ margin: "12px 0" }} />

        {/* ── Calidad + Tipo saco + Kilos netos ── */}
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Calidad del café resultante" name="calidad">
              <Select
                placeholder="Seleccionar calidad..."
                allowClear
                options={CALIDAD_OPTIONS}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Kilos Netos resultantes (café verde)"
          name="kilosNetos"
          validateStatus={excedeKilosEnviados ? "error" : undefined}
          help={excedeKilosEnviados ? mensajeLimite : undefined}
          rules={[
            {
              validator: async (_, value) => {
                if (value == null) return;
                if (value <= 0) throw new Error("Los kilos netos deben ser mayores a 0.");
                if (kilosEnviados != null && value > kilosEnviados) throw new Error(mensajeLimite);
              },
            },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Ej: 350"
            min={0.1}
            step={0.5}
            addonAfter="kg"
            precision={2} decimalSeparator=","
          />
        </Form.Item>

        {kilosNetos != null && kilosNetos > 0 && (() => {
          const expVal = [datos?.exportable, datos?.exportable2, datos?.exportable3, orden?.exportable4]
            .reduce((total, kilos) => total + Number(kilos ?? 0), 0);
          const recVal = Number(datos?.recuperado ?? 0);
          const otrosSubproductos = Number((totalSubproductos - expVal - recVal).toFixed(2));
          const sinDistribuir = Number((kilosNetos - totalSubproductos).toFixed(2));

          const pctExportable = (expVal / kilosNetos) * 100;
          const pctRecuperado = (recVal / kilosNetos) * 100;
          const pctOtros = (otrosSubproductos / kilosNetos) * 100;

          return (
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
                    Desglose en tiempo real (% sobre kilos netos)
                  </Text>
                </Space>

                <Tag color="gold">{kilosNetos.toLocaleString("es-CL")} kg netos</Tag>
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
                      % Otros subproductos
                    </Text>
                    <span className="trilla-kpi-value trilla-kpi-value-resto">
                      {pctOtros.toFixed(1)}%
                    </span>
                    <Text className="trilla-kpi-secondary">
                      {otrosSubproductos.toFixed(1)} kg
                    </Text>
                  </div>
                </Col>
              </Row>
              {sinDistribuir !== 0 && (
                <div style={{ marginTop: 12 }}>
                  <Text type={sinDistribuir > 0 ? "warning" : "danger"}>
                    {Math.abs(sinDistribuir).toLocaleString("es-CL")} kg{" "}
                    {sinDistribuir > 0 ? "sin distribuir en el desglose" : "por encima del peso neto"}
                  </Text>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Desglose de Subproductos ── */}
        <Divider titlePlacement="left" style={{ margin: "16px 0 12px" }}>
          <Space>
            <BarChartOutlined />
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              Desglose de Subproductos
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
                kilosNetos && totalSubproductos > Number(kilosNetos)
                  ? "rgba(255, 77, 79, 0.08)"
                  : "rgba(82, 196, 26, 0.08)",
              border: `1px solid ${kilosNetos && totalSubproductos > Number(kilosNetos) ? "#ff4d4f" : "#52c41a"
                }`,
              borderRadius: 6,
            }}
          >
            <Text
              type={
                kilosNetos && totalSubproductos > Number(kilosNetos) ? "danger" : "success"
              }
            >
              <strong>Total del desglose </strong>
              {totalSubproductos.toLocaleString("es-AR", { minimumFractionDigits: 2 })} kg
              {kilosNetos ? (
                <span style={{ marginLeft: 8, opacity: 0.75 }}>
                  / {Number(kilosNetos).toLocaleString("es-AR", { minimumFractionDigits: 2 })} kg netos
                </span>
              ) : null}
            </Text>
          </div>
        )}
      </Form>
    </Modal>
  );
}
