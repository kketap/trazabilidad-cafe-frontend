// src/components/trilla-modals/EnviarATrillaModal.tsx
import { useEffect } from "react";
import {
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Select,
  Typography,
  Space,
  Tag,
  Divider,
  Alert,
} from "antd";
import { SendOutlined, ShopOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Lote } from "../../pages/lotes/lotes.api";
import type { CreateOrdenTrillaDTO } from "../../pages/trilla/trilla.api";

const { Text } = Typography;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateOrdenTrillaDTO) => void;
  lotes: Lote[];
  loading?: boolean;
};

export default function EnviarATrillaModal({ open, onClose, onSubmit, lotes, loading }: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldValue("fechaDespacho", dayjs());
    }
  }, [open, form]);

  const handleFinish = (values: any) => {
    const payload: CreateOrdenTrillaDTO = {
      loteIds: values.loteIds,
      kilosEnviados: Number(values.kilosEnviados),
      fechaDespacho: values.fechaDespacho
        ? values.fechaDespacho.toISOString()
        : new Date().toISOString(),
    };
    onSubmit(payload);
  };

  // Solo lotes activos (no VENDIDO, no INACTIVO)
  const lotesDisponibles = lotes.filter(
    (l) =>
      l.activo &&
      l.estado !== "VENDIDO" &&
      l.estado !== "INACTIVO" &&
      l.estado !== "TRILLADO"
  );

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
      width={600}
      destroyOnClose
    >
      <Alert
        type="info"
        showIcon
        message="Se generará un código temporal automáticamente. El código definitivo del proveedor podrá actualizarse luego de la recepción."
        style={{ marginBottom: 20 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
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
            filterOption={(input, option) =>
              (String(option?.label ?? "")).toLowerCase().includes(input.toLowerCase())
            }
            options={lotesDisponibles.map((l) => ({
              value: l.id,
              label: `${l.codigo}${l.nombre ? ` – ${l.nombre}` : ""}${l.kilosActuales ? ` (${l.kilosActuales} kg)` : ""}`,
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

        <Divider style={{ margin: "12px 0" }} />

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
            {
              type: "number",
              min: 0.1,
              message: "Debe ser mayor a 0",
            },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Ej: 500"
            min={0.1}
            step={0.5}
            addonAfter="kg"
            precision={2}
          />
        </Form.Item>

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
      </Form>
    </Modal>
  );
}
