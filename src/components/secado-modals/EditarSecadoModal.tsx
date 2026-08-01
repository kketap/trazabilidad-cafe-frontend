// src/components/secado-modals/EditarSecadoModal.tsx
import { Form, Input, InputNumber, Modal, Select, DatePicker, Row, Col, Space, Typography, Tag } from "antd";
import { useEffect } from "react";
import dayjs from "dayjs";
import type { Lote } from "../../pages/lotes/lotes.api";
import type { Secado, UpdateSecadoDTO } from "../../pages/secado/secado.api";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: number, values: UpdateSecadoDTO) => Promise<void>;
  secado: Secado | null;
  lotes: Lote[];
  loading?: boolean;
};

export default function EditarSecadoModal({ open, onClose, onSubmit, secado, lotes, loading }: Props) {
  const [form] = Form.useForm();
  const kilosIngresados = Form.useWatch("kilosIngresados", form);
  const kilosResultantes = Form.useWatch("kilosResultantes", form);

  useEffect(() => {
    if (secado) {
      form.setFieldsValue({
        loteId: secado.loteId,
        fechaInicio: secado.fechaInicio ? dayjs(secado.fechaInicio) : null,
        fechaFin: secado.fechaFin ? dayjs(secado.fechaFin) : null,
        kilosIngresados: secado.kilosIngresados,
        kilosResultantes: secado.kilosResultantes,
        observaciones: secado.observaciones || "",
        perfilProceso: secado.perfilProceso,
      });
    }
  }, [secado, form]);

  const mermaCalculada =
    kilosIngresados !== undefined && kilosResultantes !== undefined
      ? Number(kilosIngresados) - Number(kilosResultantes)
      : null;

  const handleFinish = async (values: any) => {
    if (!secado) return;
    const payload: UpdateSecadoDTO = {
      loteId: values.loteId,
      fechaInicio: values.fechaInicio ? dayjs(values.fechaInicio).toISOString() : secado.fechaInicio,
      fechaFin: values.fechaFin ? dayjs(values.fechaFin).toISOString() : null,
      kilosIngresados: Number(values.kilosIngresados),
      kilosResultantes: Number(values.kilosResultantes),
      observaciones: values.observaciones || "",
      perfilProceso: values.perfilProceso,
    };
    await onSubmit(secado.id, payload);
  };

  return (
    <Modal
      title={`Editar Proceso de Secado #${secado?.id || ""}`}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Guardar Cambios"
      cancelText="Cancelar"
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="loteId"
          label="Lote de Café"
          rules={[{ required: true, message: "Por favor seleccione un lote" }]}
        >
          <Select placeholder="Seleccione un lote" showSearch optionFilterProp="label">
            {lotes.map((lote) => (
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
                    <Tag>{lote.estado || "SIN ESTADO"}</Tag>
                  </Space>
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

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

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="kilosIngresados"
              label="Kilos Ingresados"
              rules={[{ required: true, message: "Kilos ingresados requeridos" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0.1} precision={2} addonAfter="kg" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="kilosResultantes"
              label="Kilos Resultantes (Secos)"
              rules={[{ required: true, message: "Kilos resultantes requeridos" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} precision={2} addonAfter="kg" />
            </Form.Item>
          </Col>
        </Row>

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
              <strong>Merma estimada: </strong> {mermaCalculada.toFixed(2)} kg (
              {kilosIngresados ? ((mermaCalculada / Number(kilosIngresados)) * 100).toFixed(1) : 0}%)
            </Typography.Text>
          </div>
        )}

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

        <Form.Item name="observaciones" label="Observaciones">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
