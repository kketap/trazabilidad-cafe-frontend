// src/components/secado-modals/EditarSecadoModal.tsx
import { useEffect } from "react";
import {
  Alert,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { formatearDuracionSecado } from "../../utils/formatearDuracion";
import type { Lote } from "../../pages/lotes/lotes.api";
import type { Secado, UpdateSecadoDTO } from "../../pages/secado/secado.api";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (id: number, values: UpdateSecadoDTO) => Promise<void>;
  secado: Secado | null;
  lotes: Lote[];
  loading?: boolean;
  error?: string;
};

export default function EditarSecadoModal({ open, onClose, onSubmit, secado, lotes, loading, error }: Props) {
  const [form] = Form.useForm();
  const aportes = Form.useWatch<{ loteId: number; kilosUsados: number | null }[]>("lotes", form) ?? [];
  const fechaInicio = Form.useWatch<Dayjs | null>("fechaInicio", form);
  const fechaFin = Form.useWatch<Dayjs | null>("fechaFin", form);
  const tempMinima = Form.useWatch("tempMinima", form);
  const tempMaxima = Form.useWatch("tempMaxima", form);

  const originales = secado?.secadoLotes?.length ? secado.secadoLotes : secado
    ? [{ loteId: secado.loteId, kilosUsados: secado.kilosIngresados }] : [];

  const disponiblePara = (loteId: number) => {
    const lote = lotes.find((item) => item.id === loteId);
    const anterior = originales.find((item) => item.loteId === loteId)?.kilosUsados ?? 0;
    return (lote?.kilosActuales ?? lote?.kilosIniciales ?? 0) + anterior;
  };

  useEffect(() => {
    if (secado && open) {
      const lotesIniciales = secado.secadoLotes?.length
        ? secado.secadoLotes.map(({ loteId, kilosUsados }) => ({ loteId, kilosUsados }))
        : [{ loteId: secado.loteId, kilosUsados: secado.kilosIngresados }];

      form.setFieldsValue({
        lotes: lotesIniciales,
        fechaInicio: secado.fechaInicio ? dayjs(secado.fechaInicio) : null,
        fechaFin: secado.fechaFin ? dayjs(secado.fechaFin) : null,
        kilosIngresados: secado.kilosIngresados,
        observaciones: secado.observaciones || "",
        perfilProceso: secado.perfilProceso,
        secadora: secado.secadora ?? "",
        tempMinima: secado.tempMinima ?? null,
        tempMaxima: secado.tempMaxima ?? null,
      });
    }
  }, [secado, open, form]);


  const handleFinish = async (values: any) => {
    if (!secado) return;
    const payload: UpdateSecadoDTO = {
      lotes: values.lotes,
      fechaInicio: values.fechaInicio
        ? dayjs(values.fechaInicio).toISOString()
        : secado.fechaInicio,
      fechaFin: values.fechaFin ? dayjs(values.fechaFin).toISOString() : null,
      kilosIngresados: Number(values.kilosIngresados),
      observaciones: values.observaciones || null,
      perfilProceso: values.perfilProceso,
      secadora: values.secadora?.trim() || null,
      tempMinima:
        values.tempMinima !== undefined && values.tempMinima !== null
          ? Number(values.tempMinima)
          : null,
      tempMaxima:
        values.tempMaxima !== undefined && values.tempMaxima !== null
          ? Number(values.tempMaxima)
          : null,
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
      width={660}
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Form form={form} layout="vertical" onFinish={handleFinish} onValuesChange={(changed, values) => {
        if (changed.lotes) {
          const total = (values.lotes ?? []).reduce(
            (sum: number, item: { kilosUsados?: number }) => sum + (item.kilosUsados ?? 0), 0,
          );
          form.setFieldValue("kilosIngresados", Number(total.toFixed(2)));
        }
      }}>

        <Form.Item
          label="Lotes de café"
          required
          tooltip="El saldo disponible para editar incluye los kilos que este secado ya descontó de cada lote."
        >
          <Select<number[]>
            mode="multiple"
            value={aportes.map(({ loteId }) => loteId)}
            placeholder="Seleccione uno o más lotes"
            optionFilterProp="label"
            options={lotes.filter((lote) =>
              originales.some(({ loteId }) => loteId === lote.id) ||
              (lote.activo && (lote.kilosActuales ?? lote.kilosIniciales ?? 0) > 0)
            ).map((lote) => ({ value: lote.id, label: lote.codigo }))}
            onChange={(ids) => {
              const seleccion = ids.map((loteId) =>
                aportes.find((aporte) => aporte.loteId === loteId) ?? { loteId, kilosUsados: null }
              );
              form.setFieldsValue({
                lotes: seleccion,
                kilosIngresados: Number(seleccion.reduce((total, aporte) => total + (aporte.kilosUsados ?? 0), 0).toFixed(2)),
              });
            }}
          />
        </Form.Item>
        <Form.List name="lotes" rules={[{
          validator: (_, value) => value?.length ? Promise.resolve() : Promise.reject(new Error("Seleccione un lote")),
        }]}>
          {(fields, _operations, { errors }) => (
            <>
              {fields.map(({ key, name }) => {
                const loteId = aportes[name]?.loteId;
                const lote = lotes.find((item) => item.id === loteId);
                const disponible = loteId === undefined ? 0 : disponiblePara(loteId);
                return (
                  <div key={key}>
                    <Form.Item name={[name, "loteId"]} hidden><InputNumber /></Form.Item>
                    <Form.Item
                      name={[name, "kilosUsados"]}
                      label={`${lote?.codigo ?? loteId} · ${disponible.toLocaleString("es-CL")} kg disponibles`}
                      rules={[{ required: true, type: "number", min: 0.01, max: disponible }]}
                    >
                      <InputNumber min={0.01} precision={2} decimalSeparator="," addonAfter="kg" />
                    </Form.Item>
                  </div>
                );
              })}
              <Form.ErrorList errors={errors} />
            </>
          )}
        </Form.List>

        {/* ── Fechas ── */}
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name="fechaInicio"
              label="Fecha de Inicio"
              rules={[{ required: true, message: "Fecha de inicio requerida" }]}
            >
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD HH:mm" showTime />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="fechaFin" label="Fecha de Fin (Opcional)">
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD HH:mm" showTime />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Duración del proceso"
              htmlFor="duracion-secado-editar"
              tooltip="Se calcula a partir de las fechas y horas de inicio y fin."
            >
              <Input id="duracion-secado-editar" readOnly value={formatearDuracionSecado(fechaInicio, fechaFin) ?? "—"} />
            </Form.Item>
          </Col>
        </Row>

        {!fechaFin && <Alert type="warning" showIcon message="El secado se guardará sin fecha de término." />}

        {/* ── Kilos ── */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="kilosIngresados" label="Kilos de cerezo ingresados">
              <InputNumber readOnly controls={false} precision={2} decimalSeparator="," addonAfter="kg" />
            </Form.Item>
          </Col>
        </Row>

        {/* Merma calculada */}

        {/* ── Perfil de proceso + Secadora ── */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="perfilProceso"
              label="Perfil de secado"
              rules={[{ required: true, message: "Seleccione un perfil de proceso" }]}
            >
              <Select placeholder="Seleccione perfil...">
                <Select.Option value="HONEY">Honey</Select.Option>
                <Select.Option value="NATURAL">Natural</Select.Option>
                <Select.Option value="LAVADO">Lavado</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="secadora"
              label="Lugar de secado (Opcional)"
              tooltip="Identificación del equipo o patio de secado"
            >
              <Input placeholder='Ej. "Secadora 01", "Patio Solar A"' maxLength={100} />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Temperaturas ── */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="tempMinima"
              label="Temperatura Mínima (Opcional)"
              dependencies={["tempMaxima"]}
              rules={[
                {
                  validator: (_, value) => {
                    if (
                      value !== undefined &&
                      value !== null &&
                      tempMaxima !== undefined &&
                      tempMaxima !== null &&
                      Number(value) > Number(tempMaxima)
                    ) {
                      return Promise.reject(
                        new Error("La temp. mínima no puede superar la máxima")
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                precision={1} decimalSeparator=","
                placeholder="Ej. 35.0"
                addonAfter="°C"
                step={0.5}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="tempMaxima"
              label="Temperatura Máxima (Opcional)"
              dependencies={["tempMinima"]}
              rules={[
                {
                  validator: (_, value) => {
                    if (
                      value !== undefined &&
                      value !== null &&
                      tempMinima !== undefined &&
                      tempMinima !== null &&
                      Number(value) < Number(tempMinima)
                    ) {
                      return Promise.reject(
                        new Error("La temp. máxima no puede ser inferior a la mínima")
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                precision={1} decimalSeparator=","
                placeholder="Ej. 55.0"
                addonAfter="°C"
                step={0.5}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Observaciones ── */}
        <Form.Item name="observaciones" label="Observaciones">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
