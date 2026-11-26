import { Alert, Button, Card, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select, Space, Tag, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type { Empaque } from "../../pages/empaque/empaque.api";
import type { CreateOrdenTrillaDTO } from "../../pages/trilla/trilla.api";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateOrdenTrillaDTO) => void | Promise<void>;
  empaques: Empaque[];
  loading?: boolean;
  error?: string;
};

type ValoresEnvio = {
  empaqueIds: number[];
  cantidades: Record<string, number | null | undefined>;
  guiaSalida: string;
  fechaDespacho: Dayjs;
  codigoTrilla?: string;
};

const numeroKg = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 });


function saldoNeto(empaque: Empaque) {
  if (empaque.saldoTrilla !== undefined) return empaque.saldoTrilla;
  const despachados = (empaque.ordenesTrilla ?? []).reduce((suma, orden) => suma + orden.kilosEnviados, 0) +
    (empaque.enviosTrilla ?? []).reduce((suma, envio) => suma + envio.kilosNetos, 0);
  return Math.max(0, Number((empaque.kilosResultantes - despachados).toFixed(2)));
}

export default function EnviarATrillaModal({ open, onClose, onSubmit, empaques, loading, error }: Props) {
  const [form] = Form.useForm<ValoresEnvio>();
  const ids = Form.useWatch("empaqueIds", form) ?? [];
  const cantidades = Form.useWatch("cantidades", form) ?? {};
  const porId = new Map(empaques.map((empaque) => [empaque.id, empaque]));
  const kilosTotales = Number(ids.reduce((total, id) => total + (cantidades[String(id)] ?? 0), 0).toFixed(2));
  const origenes = new Set(ids.flatMap((id) => {
    const empaque = porId.get(id);
    if (!empaque) return [];
    const secados = empaque.empaqueSecados?.length
      ? empaque.empaqueSecados.map(({ secado }) => secado)
      : empaque.secado ? [empaque.secado] : [];
    return secados.length ? secados.flatMap((secado) => secado.secadoLotes?.length
      ? secado.secadoLotes.map(({ lote, loteId }) => lote?.codigo ?? `Lote #${loteId}`)
      : [secado.lote?.codigo ?? `Lote #${secado.loteId}`])
      : [empaque.lote?.codigo ?? `Lote #${empaque.loteId}`];
  }));

  return (
    <Modal title="Enviar a Trilla" open={open} onCancel={onClose} onOk={() => form.submit()}
      width="min(680px, 95vw)" okText="Enviar a Trilla" cancelText="Cancelar" confirmLoading={loading}
      styles={{ body: { maxHeight: "68dvh", overflowY: "auto", overflowWrap: "anywhere" } }}
      footer={(acciones) => (
        <>
          {error && <Alert type="error" showIcon title="No se pudo registrar el envío" description={error}
            style={{ textAlign: "start", marginBottom: 12 }} />}
          {acciones}
        </>
      )}
      destroyOnHidden>
      <Form form={form} layout="vertical" preserve={false} initialValues={{ fechaDespacho: dayjs() }}
        onFinish={({ empaqueIds, cantidades: kilos, fechaDespacho, ...values }) => onSubmit({
          ...values,
          fechaDespacho: fechaDespacho.toISOString(),
          enviosAlmacen: empaqueIds.map((empaqueId) => ({ empaqueId, kilosNetos: Number(kilos[String(empaqueId)]) })),
        })}>
        <Form.Item name="empaqueIds" label="Registros de Almacén Pergamino"
          tooltip={{ title: "Selecciona los registros y escribe cuánto enviar de cada uno.", trigger: ["hover", "focus", "click"] }}
          rules={[{ required: true, type: "array", min: 1, message: "Selecciona al menos un registro con saldo" }]}>
          <Select mode="multiple" showSearch optionFilterProp="label" placeholder="Selecciona uno o más registros"
            maxTagCount="responsive"
            options={empaques.filter((empaque) => saldoNeto(empaque) > 0 || ids.includes(empaque.id)).map((empaque) => ({
              value: empaque.id,
              label: `${empaque.codigo ?? `EMP-${empaque.id}`} · ${saldoNeto(empaque).toLocaleString("es-CL")} kg netos`,
            }))} />
        </Form.Item>
        {ids.map((id) => {
          const empaque = porId.get(id);
          const codigo = empaque?.codigo ?? `EMP-${id}`;
          const saldo = empaque ? saldoNeto(empaque) : 0;
          const campo: ["cantidades", string] = ["cantidades", String(id)];
          const cantidad = cantidades[String(id)] ?? 0;
          return (
            <Card key={id} size="small" style={{ marginBottom: 12 }} aria-label={codigo}>
              <Row gutter={[12, 8]} align="middle">
                <Col xs={24} sm={9}>
                  <Typography.Text strong>{codigo}</Typography.Text>
                  <div>Saldo disponible: {numeroKg.format(saldo)} kg</div>
                </Col>
                <Col xs={24} sm={15}>
                  <Form.Item name={campo} label={`Kilos netos a enviar de ${codigo}`}
                    style={{ marginBottom: 8 }}
                    rules={[
                      { required: true, type: "number", min: 0.01, message: "Ingresa al menos 0,01 kg." },
                      { validator: (_, valor) => {
                        if (saldo <= 0) return Promise.reject(new Error("Este registro ya no tiene saldo. Retíralo del envío."));
                        if (valor > saldo) return Promise.reject(new Error(`El saldo disponible es ${numeroKg.format(saldo)} kg.`));
                        return Promise.resolve();
                      } },
                    ]}>
                    <InputNumber min={0.01} precision={2} decimalSeparator="," style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
              <Space wrap>
                <Typography.Text type="secondary">Saldo después del envío: {numeroKg.format(Math.max(0, saldo - cantidad))} kg</Typography.Text>
                <Button type="link" size="small" disabled={saldo <= 0} onClick={() => {
                  form.setFieldValue(campo, saldo);
                  void form.validateFields([campo]).catch(() => undefined);
                }}>Usar saldo completo</Button>
              </Space>
            </Card>
          );
        })}
        {origenes.size > 0 && <Form.Item label="Lotes de origen"><Space wrap>
          {[...origenes].map((codigo) => <Tag key={codigo}>{codigo}</Tag>)}
        </Space></Form.Item>}
        <Form.Item label="Kilos netos totales"
          tooltip={{ title: "Suma de las cantidades indicadas para los registros seleccionados.", trigger: ["hover", "focus", "click"] }}>
          <InputNumber readOnly controls={false} value={kilosTotales} decimalSeparator="," addonAfter="kg" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="guiaSalida" label="Guía de salida"
          rules={[{ required: true, whitespace: true, message: "Ingresa la guía de salida" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="fechaDespacho" label="Fecha de salida" rules={[{ required: true, message: "Indica la fecha de salida" }]}>
          <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="codigoTrilla" label="Código de Trilla">
          <Input placeholder="Automático si se deja vacío" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
