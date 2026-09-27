// src/components/trilla-modals/DetalleTrillaModal.tsx
import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Modal,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import {
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  InboxOutlined,
  SendOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { OrdenTrilla } from "../../pages/trilla/trilla.api";

const { Text } = Typography;

const SUBPRODUCTO_LABELS: { key: keyof OrdenTrilla; label: string }[] = [
  { key: "exportable", label: "Exportable" },
  { key: "recuperado", label: "Recuperado" },
  { key: "malla13", label: "Malla 13" },
  { key: "segundaBuena", label: "2° Buena" },
  { key: "segundaMala", label: "2° Mala" },
  { key: "sucioEscojo", label: "Sucio / Escojo" },
  { key: "cisco", label: "Cisco" },
  { key: "descarteMaquina", label: "Descarte Máquina" },
  { key: "cascarilla", label: "Cascarilla" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  orden: OrdenTrilla | null;
};

export default function DetalleTrillaModal({ open, onClose, orden }: Props) {
  if (!orden) return null;

  const esTemporal = orden.codigoTrilla?.startsWith("TEMP-");

  // Estado del proceso
  const estadoLabel =
    orden.kilosNetos != null
      ? { text: "Recibido", color: "success" as const }
      : orden.fechaIngreso
      ? { text: "En Trilla", color: "processing" as const }
      : { text: "Despachado", color: "warning" as const };

  // Subproductos registrados y suma
  const subproductosList = SUBPRODUCTO_LABELS.map((item) => ({
    label: item.label,
    value: orden[item.key] as number | null | undefined,
  }));

  const totalSubproductos = subproductosList.reduce(
    (acc, curr) => acc + (curr.value != null ? Number(curr.value) : 0),
    0
  );

  const tieneSubproductos = subproductosList.some((s) => s.value != null);

  // Rendimiento
  const rendimiento =
    orden.kilosEnviados && orden.kilosNetos
      ? ((orden.kilosNetos / orden.kilosEnviados) * 100).toFixed(1)
      : null;

  const merma =
    orden.kilosEnviados && orden.kilosNetos
      ? orden.kilosEnviados - orden.kilosNetos
      : null;

  return (
    <Modal
      title={
        <Space align="center">
          <EyeOutlined style={{ color: "#722ed1", fontSize: 18 }} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            Detalle de Orden de Trilla
          </span>
          <Tag color={esTemporal ? "orange" : "green"} style={{ marginLeft: 8 }}>
            {esTemporal ? (
              <Space size={4}>
                <ClockCircleOutlined />
                <span>Temporal</span>
              </Space>
            ) : (
              <Space size={4}>
                <CheckCircleOutlined />
                <span>Definitivo</span>
              </Space>
            )}
          </Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Cerrar
        </Button>,
      ]}
      width={720}
      destroyOnClose
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
        {/* Tarjetas de Resumen Numérico */}
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderRadius: 8, background: "#fafafa" }}>
              <Statistic
                title="Kilos Enviados"
                value={orden.kilosEnviados ?? 0}
                precision={2}
                suffix="kg"
                prefix={<SendOutlined style={{ color: "#fa8c16", fontSize: 14 }} />}
                valueStyle={{ fontSize: 18 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderRadius: 8, background: "#fafafa" }}>
              <Statistic
                title="Kilos Netos (Resultantes)"
                value={orden.kilosNetos ?? 0}
                precision={2}
                suffix="kg"
                prefix={<InboxOutlined style={{ color: "#52c41a", fontSize: 14 }} />}
                valueStyle={{ fontSize: 18, color: orden.kilosNetos ? "#389e0d" : undefined }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ borderRadius: 8, background: "#fafafa" }}>
              <Statistic
                title="Rendimiento Trilla"
                value={rendimiento ? `${rendimiento}%` : "—"}
                prefix={<BarChartOutlined style={{ color: "#1890ff", fontSize: 14 }} />}
                valueStyle={{ fontSize: 18, color: rendimiento ? "#096dd9" : undefined }}
              />
            </Card>
          </Col>
        </Row>

        {/* Información General */}
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Código de Trilla">
            <strong style={{ fontSize: 13 }}>{orden.codigoTrilla}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Estado">
            <Badge status={estadoLabel.color} text={estadoLabel.text} />
          </Descriptions.Item>

          <Descriptions.Item label="N° Guía de Despacho">
            {orden.numeroGuia ? (
              <Tag color="geekblue" style={{ fontSize: 12 }}>
                {orden.numeroGuia}
              </Tag>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Lotes de Origen">
            {orden.lotes && orden.lotes.length > 0 ? (
              <Space wrap size={4}>
                {orden.lotes.map((l: any) => (
                  <Tag key={l.id} color="gold" style={{ fontSize: 12 }}>
                    {l.codigo}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Fecha de Despacho">
            {orden.fechaDespacho
              ? dayjs(orden.fechaDespacho).format("DD/MM/YYYY HH:mm")
              : "—"}
          </Descriptions.Item>

          <Descriptions.Item label="Fecha de Ingreso">
            {orden.fechaIngreso
              ? dayjs(orden.fechaIngreso).format("DD/MM/YYYY")
              : <Text type="secondary">Pendiente de recepción</Text>}
          </Descriptions.Item>

          <Descriptions.Item label="Calidad">
            {orden.calidad ? (
              <Tag color="purple">{orden.calidad}</Tag>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Tipo de Saco">
            {orden.tipoSaco ? (
              <Tag color="cyan">{orden.tipoSaco}</Tag>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Sacos Enviados">
            {orden.sacosEnviados != null ? (
              <strong style={{ fontSize: 13 }}>{orden.sacosEnviados}</strong>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </Descriptions.Item>

          {merma != null && (
            <Descriptions.Item label="Merma Estimada" span={2}>
              <Text type={merma > 0 ? "secondary" : "danger"}>
                {merma.toLocaleString("es-AR", { minimumFractionDigits: 2 })} kg
              </Text>
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* Desglose de Subproductos */}
        <Divider orientation="left" style={{ margin: "8px 0 4px" }}>
          <Space>
            <BarChartOutlined style={{ color: "#722ed1" }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              Desglose de Subproductos
            </span>
            {totalSubproductos > 0 && (
              <Tag color="purple" style={{ marginLeft: 4 }}>
                Total: {totalSubproductos.toLocaleString("es-AR", { minimumFractionDigits: 2 })} kg
              </Tag>
            )}
          </Space>
        </Divider>

        {tieneSubproductos ? (
          <Row gutter={[10, 10]}>
            {subproductosList.map((item) => (
              <Col xs={12} sm={8} key={item.label}>
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    background: item.value != null ? "#f9f0ff" : "#fafafa",
                    border: `1px solid ${item.value != null ? "#d3adf7" : "#f0f0f0"}`,
                  }}
                >
                  <Text
                    type={item.value != null ? undefined : "secondary"}
                    style={{ fontSize: 12, display: "block" }}
                  >
                    {item.label}
                  </Text>
                  <strong
                    style={{
                      fontSize: 14,
                      color: item.value != null ? "#531dab" : "#bfbfbf",
                    }}
                  >
                    {item.value != null
                      ? `${Number(item.value).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })} kg`
                      : "—"}
                  </strong>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <div
            style={{
              padding: "16px",
              textAlign: "center",
              background: "#fafafa",
              borderRadius: 6,
              border: "1px dashed #d9d9d9",
            }}
          >
            <Text type="secondary">
              No se han registrado subproductos en esta orden de trilla.
            </Text>
          </div>
        )}
      </div>
    </Modal>
  );
}
