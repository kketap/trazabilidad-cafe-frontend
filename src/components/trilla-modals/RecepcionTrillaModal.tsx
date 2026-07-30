// src/components/trilla-modals/RecepcionTrillaModal.tsx
import { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Space,
  Divider,
  Descriptions,
  Tag,
  Alert,
} from "antd";
import { CheckCircleOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { OrdenTrilla, UpdateOrdenTrillaDTO } from "../../api/trilla.api";

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

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, values: UpdateOrdenTrillaDTO) => void;
  orden: OrdenTrilla | null;
  loading?: boolean;
};

export default function RecepcionTrillaModal({ open, onClose, onSubmit, orden, loading }: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && orden) {
      form.setFieldsValue({
        codigoTrilla: orden.codigoTrilla,
        fechaIngreso: orden.fechaIngreso ? dayjs(orden.fechaIngreso) : null,
        calidad: orden.calidad || undefined,
        tipoSaco: orden.tipoSaco || undefined,
        kilosNetos: orden.kilosNetos ?? undefined,
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
      width={640}
      destroyOnClose
    >
      {orden && (
        <>
          <Descriptions
            size="small"
            bordered
            column={2}
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Código Actual" span={1}>
              <Tag color={esTemporalCodigo ? "orange" : "green"}>
                {orden.codigoTrilla}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Kilos Enviados" span={1}>
              <strong>{orden.kilosEnviados?.toLocaleString()} kg</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Lotes incluidos" span={2}>
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

        <Form.Item label="Fecha de Ingreso a Trilladora" name="fechaIngreso">
          <DatePicker
            style={{ width: "100%" }}
            showTime
            format="DD/MM/YYYY HH:mm"
            placeholder="Seleccionar fecha de ingreso..."
          />
        </Form.Item>

        <Divider style={{ margin: "12px 0" }} />

        <Form.Item label="Calidad del café resultante" name="calidad">
          <Select
            placeholder="Seleccionar calidad..."
            allowClear
            options={CALIDAD_OPTIONS}
          />
        </Form.Item>

        <Form.Item label="Tipo de Saco" name="tipoSaco">
          <Select
            placeholder="Seleccionar tipo de saco..."
            allowClear
            options={TIPO_SACO_OPTIONS}
          />
        </Form.Item>

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
      </Form>
    </Modal>
  );
}
