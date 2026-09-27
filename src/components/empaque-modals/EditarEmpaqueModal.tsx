// src/components/empaque-modals/EditarEmpaqueModal.tsx
import { Form, Input, InputNumber, Modal, Select, DatePicker, Row, Col, Space, Typography, Tag, Divider, Switch } from "antd";
import { useEffect } from "react";
import dayjs from "dayjs";
import type { Lote } from "../../pages/lotes/lotes.api";
import type { Secado } from "../../pages/secado/secado.api";
import type { Empaque, UpdateEmpaqueDTO } from "../../pages/empaque/empaque.api";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: number, values: UpdateEmpaqueDTO) => Promise<void>;
  empaque: Empaque | null;
  lotes: Lote[];
  secados: Secado[];
  loading?: boolean;
};

export default function EditarEmpaqueModal({ open, onClose, onSubmit, empaque, lotes, secados, loading }: Props) {
  const [form] = Form.useForm();
  const kilosIngresados = Form.useWatch("kilosIngresados", form);
  const kilosResultantes = Form.useWatch("kilosResultantes", form);

  useEffect(() => {
    if (empaque) {
      form.setFieldsValue({
        loteId: empaque.loteId,
        fechaInicio: empaque.fechaInicio ? dayjs(empaque.fechaInicio) : null,
        fechaFin: empaque.fechaFin ? dayjs(empaque.fechaFin) : null,
        kilosIngresados: empaque.kilosIngresados,
        kilosResultantes: empaque.kilosResultantes,
        secadoId: empaque.secadoId ?? null,
        tipoEmpaque: empaque.tipoEmpaque ?? null,
        cantidadEmpaques: empaque.cantidadEmpaques ?? null,
        rendimiento: empaque.rendimiento ?? null,
        observaciones: empaque.observaciones || "",
        humedad: empaque.humedad ?? null,
        actividadAgua: empaque.actividadAgua ?? null,
        puntajeSca: empaque.puntajeSca ?? null,
        perfilSensorial: empaque.perfilSensorial || "",
        fueCatado: empaque.fueCatado ?? false,
      });
    }
  }, [empaque, form]);

  const mermaCalculada =
    kilosIngresados !== undefined && kilosResultantes !== undefined
      ? Number(kilosIngresados) - Number(kilosResultantes)
      : null;

  const handleFinish = async (values: any) => {
    if (!empaque) return;
    const payload: UpdateEmpaqueDTO = {
      loteId: values.loteId,
      fechaInicio: values.fechaInicio ? dayjs(values.fechaInicio).toISOString() : empaque.fechaInicio,
      fechaFin: values.fechaFin ? dayjs(values.fechaFin).toISOString() : null,
      kilosIngresados: Number(values.kilosIngresados),
      kilosResultantes: Number(values.kilosResultantes),
      secadoId: values.secadoId || null,
      tipoEmpaque: values.tipoEmpaque || null,
      cantidadEmpaques: values.cantidadEmpaques != null ? Number(values.cantidadEmpaques) : null,
      rendimiento: values.rendimiento != null ? Number(values.rendimiento) : null,
      observaciones: values.observaciones || "",
      humedad: values.humedad != null ? Number(values.humedad) : null,
      actividadAgua: values.actividadAgua != null ? Number(values.actividadAgua) : null,
      puntajeSca: values.puntajeSca != null ? Number(values.puntajeSca) : null,
      perfilSensorial: values.perfilSensorial?.trim() || null,
      fueCatado: values.fueCatado ?? null,
    };
    await onSubmit(empaque.id, payload);
  };

  return (
    <Modal
      title={`Editar Proceso de Empaque #${empaque?.id || ""}`}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Guardar Cambios"
      cancelText="Cancelar"
      width={680}
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

        <Form.Item name="secadoId" label="Proceso de Secado Vinculado" extra="Opcional. Si vincula, se tomarán los datos del secado.">
          <Select placeholder="Seleccione un proceso de secado" showSearch optionFilterProp="label" allowClear>
            {secados.map((secado) => (
              <Select.Option key={secado.id} value={secado.id} label={secado.codigo || `SEC-${secado.id}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span><strong>{secado.codigo || `SEC-${secado.id}`}</strong> - Lote: {secado.lote?.codigo}</span>
                  <Space>
                    <Tag color="cyan">{secado.kilosResultantes} kg resultantes</Tag>
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
              label="Kilos Resultantes (Empacados)"
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

        <Divider orientation="left" orientationMargin={0}>
          <Typography.Text strong style={{ fontSize: 13 }}>Detalles del Empaque</Typography.Text>
        </Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="tipoEmpaque" label="Tipo de Empaque">
              <Select placeholder="Ej: Saco 69 kg" allowClear options={[
                { value: "Saco 69 kg", label: "Saco 69 kg" },
                { value: "Saco 69 kg + Grainpro", label: "Saco 69 kg + Grainpro" },
                { value: "Saco 60 kg", label: "Saco 60 kg" },
                { value: "Big Bag", label: "Big Bag" },
                { value: "Granel", label: "Granel" },
              ]} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="cantidadEmpaques" label="Cantidad (bultos)">
              <InputNumber style={{ width: "100%" }} min={0} placeholder="Ej. 10" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="rendimiento" label="Rendimiento (%)">
              <InputNumber style={{ width: "100%" }} min={0} max={100} precision={2} addonAfter="%" placeholder="Ej. 75.5" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" orientationMargin={0}>
          <Typography.Text strong style={{ fontSize: 13 }}>Datos de Calidad (Opcional)</Typography.Text>
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="humedad" label="Humedad">
              <InputNumber style={{ width: "100%" }} min={0} max={100} precision={1} step={0.1} addonAfter="%" placeholder="Ej. 11.5" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="actividadAgua" label="Actividad de Agua (Aw)">
              <InputNumber style={{ width: "100%" }} min={0} max={1} precision={3} step={0.001} placeholder="Ej. 0.650" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="puntajeSca" label="Puntaje SCA" tooltip="Escala 0-100 según protocolo SCA">
              <InputNumber style={{ width: "100%" }} min={0} max={100} precision={2} step={0.25} addonAfter="pts" placeholder="Ej. 83.50" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="fueCatado" label="¿Fue catado?" valuePropName="checked">
              <Switch checkedChildren="Sí" unCheckedChildren="No" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="perfilSensorial" label="Perfil Sensorial">
          <Input.TextArea rows={2} placeholder="Ej. Notas a chocolate, caramelo, frutos rojos. Acidez media, cuerpo alto." />
        </Form.Item>

        <Divider orientation="left" orientationMargin={0}>
          <Typography.Text strong style={{ fontSize: 13 }}>Observaciones</Typography.Text>
        </Divider>

        <Form.Item name="observaciones">
          <Input.TextArea rows={3} placeholder="Tipo de saco, lugar de almacenamiento, notas internas..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
