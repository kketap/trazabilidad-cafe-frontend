// src/components/empaque-modals/CrearEmpaqueModal.tsx
import { Form, Input, InputNumber, Modal, Select, DatePicker, Row, Col, Space, Typography, Tag } from "antd";

import dayjs from "dayjs";
import type { Lote } from "../../api/lotes";
import type { CreateEmpaqueDTO } from "../../api/empaque.api";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateEmpaqueDTO) => Promise<void>;
  lotes: Lote[];
  loading?: boolean;
};

export default function CrearEmpaqueModal({ open, onClose, onSubmit, lotes, loading }: Props) {
  const [form] = Form.useForm();
  const kilosIngresados = Form.useWatch("kilosIngresados", form);
  const kilosResultantes = Form.useWatch("kilosResultantes", form);

  // Filtrar y ordenar lotes: Lotes en estado EN_SECADO primero
  const lotesOrdenados = [...lotes].sort((a, b) => {
    if (a.estado === "EN_SECADO" && b.estado !== "EN_SECADO") return -1;
    if (a.estado !== "EN_SECADO" && b.estado === "EN_SECADO") return 1;
    return (a.codigo || "").localeCompare(b.codigo || "");
  });

  const handleLoteChange = (loteId: number) => {
    const loteSeleccionado = lotes.find((l) => l.id === loteId);
    if (loteSeleccionado && loteSeleccionado.kilosActuales) {
      form.setFieldsValue({ kilosIngresados: loteSeleccionado.kilosActuales });
    }
  };

  const mermaCalculada =
    kilosIngresados !== undefined && kilosResultantes !== undefined
      ? Number(kilosIngresados) - Number(kilosResultantes)
      : null;

  const handleFinish = async (values: any) => {
    const payload: CreateEmpaqueDTO = {
      loteId: values.loteId,
      fechaInicio: values.fechaInicio ? dayjs(values.fechaInicio).toISOString() : new Date().toISOString(),
      fechaFin: values.fechaFin ? dayjs(values.fechaFin).toISOString() : null,
      kilosIngresados: Number(values.kilosIngresados),
      kilosResultantes: Number(values.kilosResultantes),
      observaciones: values.observaciones || "",
    };
    await onSubmit(payload);
    form.resetFields();
  };

  return (
    <Modal
      title="Registrar Proceso de Empaque"
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Registrar Empaque"
      cancelText="Cancelar"
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ fechaInicio: dayjs() }}>
        <Form.Item
          name="loteId"
          label="Lote de Café"
          rules={[{ required: true, message: "Por favor seleccione un lote" }]}
          extra="Lotes priorizados en estado EN_SECADO"
        >
          <Select
            placeholder="Seleccione un lote"
            onChange={handleLoteChange}
            showSearch
            optionFilterProp="label"
          >
            {lotesOrdenados.map((lote) => {
              const esRecomendado = lote.estado === "EN_SECADO";
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
                      {lote.kilosActuales ? <Tag color="blue">{lote.kilosActuales} kg</Tag> : null}
                      <Tag color={esRecomendado ? "gold" : "default"}>
                        {lote.estado || "SIN ESTADO"}
                      </Tag>
                    </Space>
                  </div>
                </Select.Option>
              );
            })}
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
              <InputNumber style={{ width: "100%" }} min={0.1} precision={2} placeholder="Ej. 420" addonAfter="kg" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="kilosResultantes"
              label="Kilos Resultantes (Empacados)"
              rules={[{ required: true, message: "Kilos resultantes requeridos" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} precision={2} placeholder="Ej. 400" addonAfter="kg" />
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

        <Form.Item name="observaciones" label="Observaciones">
          <Input.TextArea rows={3} placeholder="Tipo de saco, lote de empaque, lugar de almacenamiento..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
