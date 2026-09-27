// src/components/trilla-modals/RecepcionTrillaModal.tsx
import { useEffect } from "react";
import {
  Alert,
  Col,
  DatePicker,
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
  NumberOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
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

const TIPO_SACO_OPTIONS = [
  { value: "GrainPro", label: "GrainPro" },
  { value: "Yute", label: "Yute" },
  { value: "Polipropileno", label: "Polipropileno" },
  { value: "Ecotact", label: "Ecotact" },
  { value: "Hermético 30kg", label: "Hermético 30kg" },
  { value: "Hermético 60kg", label: "Hermético 60kg" },
];

/** Definición centralizada de los 9 subproductos */
const SUBPRODUCTOS: { name: keyof Pick<OrdenTrilla,
  "exportable" | "recuperado" | "malla13" | "segundaBuena" | "segundaMala" |
  "sucioEscojo" | "cisco" | "descarteMaquina" | "cascarilla"
>; label: string }[] = [
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
  const kilosNetos: number | undefined = allValues?.kilosNetos;

  const totalSubproductos = SUBPRODUCTOS.reduce((acc, s) => {
    const val = allValues?.[s.name];
    return acc + (val != null && !isNaN(Number(val)) ? Number(val) : 0);
  }, 0);

  useEffect(() => {
    if (open && orden) {
      form.setFieldsValue({
        codigoTrilla: orden.codigoTrilla,
        fechaIngreso: orden.fechaIngreso ? dayjs(orden.fechaIngreso) : null,
        calidad: orden.calidad || undefined,
        tipoSaco: orden.tipoSaco || undefined,
        kilosNetos: orden.kilosNetos ?? undefined,
        numeroGuia: orden.numeroGuia ?? "",
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
      codigoTrilla: values.codigoTrilla?.trim(),
      fechaIngreso: values.fechaIngreso ? values.fechaIngreso.toISOString() : null,
      calidad: values.calidad || null,
      tipoSaco: values.tipoSaco || null,
      kilosNetos: values.kilosNetos ? Number(values.kilosNetos) : null,
      numeroGuia: values.numeroGuia?.trim() || null,
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
      cancelText="Cancelar"
      confirmLoading={loading}
      width={720}
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
            {orden.numeroGuia && (
              <Descriptions.Item label="N° Guía" span={1}>
                <Tag color="geekblue">{orden.numeroGuia}</Tag>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Lotes incluidos" span={orden.numeroGuia ? 1 : 2}>
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
              description="Ingresa el número definitivo de trilla entregado por el proveedor (Hayland u otro)."
              style={{ marginBottom: 20 }}
            />
          )}
        </>
      )}

      <Form form={form} layout="vertical" onFinish={handleFinish}>

        {/* ── Código de trilla ── */}
        <Form.Item
          label="Número de Trilla (Código definitivo)"
          name="codigoTrilla"
          rules={[
            { required: true, message: "El código de trilla es obligatorio" },
            { min: 2, message: "Mínimo 2 caracteres" },
          ]}
        >
          <Input
            placeholder="Ej: HAY-2026-001"
            prefix={<EditOutlined />}
            allowClear
          />
        </Form.Item>

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

        <Form.Item label="Fecha de Ingreso a Trilladora" name="fechaIngreso">
          <DatePicker
            style={{ width: "100%" }}
            showTime
            format="DD/MM/YYYY HH:mm"
            placeholder="Seleccionar fecha de ingreso..."
          />
        </Form.Item>

        <Divider style={{ margin: "12px 0" }} />

        {/* ── Calidad + Tipo saco + Kilos netos ── */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Calidad del café resultante" name="calidad">
              <Select
                placeholder="Seleccionar calidad..."
                allowClear
                options={CALIDAD_OPTIONS}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Tipo de Saco" name="tipoSaco">
              <Select
                placeholder="Seleccionar tipo de saco..."
                allowClear
                options={TIPO_SACO_OPTIONS}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Kilos Netos resultantes (café verde)"
          name="kilosNetos"
          rules={[
            {
              validator: (_, value) => {
                if (value !== undefined && value !== null && value <= 0) {
                  return Promise.reject("Los kilos netos deben ser mayor a 0");
                }
                return Promise.resolve();
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
            precision={2}
          />
        </Form.Item>

        {/* ── Desglose de Subproductos ── */}
        <Divider orientation={"left" as const} style={{ margin: "16px 0 12px" }}>
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
                kilosNetos && totalSubproductos > Number(kilosNetos)
                  ? "rgba(255, 77, 79, 0.08)"
                  : "rgba(82, 196, 26, 0.08)",
              border: `1px solid ${
                kilosNetos && totalSubproductos > Number(kilosNetos) ? "#ff4d4f" : "#52c41a"
              }`,
              borderRadius: 6,
            }}
          >
            <Text
              type={
                kilosNetos && totalSubproductos > Number(kilosNetos) ? "danger" : "success"
              }
            >
              <strong>Total subproductos: </strong>
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
