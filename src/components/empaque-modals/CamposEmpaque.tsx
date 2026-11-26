import { QuestionCircleOutlined } from "@ant-design/icons";
import { Col, DatePicker, Divider, Form, Input, InputNumber, Row, Select, Switch } from "antd";
import type { Empaque } from "../../pages/empaque/empaque.api";
import type { Lote } from "../../pages/lotes/lotes.api";
import type { Secado } from "../../pages/secado/secado.api";
import { formatEstadoEnum } from "../../utils/enumFormatters";

type Props = { lotes: Lote[]; secados: Secado[]; empaques: Empaque[]; actual?: Empaque | null };

export function idsSecados(empaque: Empaque) {
  return empaque.empaqueSecados?.length
    ? empaque.empaqueSecados.map(({ secadoId }) => secadoId)
    : empaque.secadoId ? [empaque.secadoId] : [];
}

export default function CamposEmpaque({ lotes, secados, empaques, actual }: Props) {
  const form = Form.useFormInstance();
  const loteId = Form.useWatch<number>("loteId", form);
  const perfil = Form.useWatch<string>("perfilSecado", form);
  const brutos = Form.useWatch<number>("kilosIngresados", form);
  const netos = Form.useWatch<number>("kilosResultantes", form);
  const comprometido = Boolean(actual?.ordenesTrilla?.length || actual?.enviosTrilla?.length);
  const propios = actual ? idsSecados(actual) : [];
  const vinculados = new Set(empaques.filter(({ id }) => id !== actual?.id).flatMap(idsSecados));
  const elegibles = secados.filter((secado) =>
    propios.includes(secado.id) || Boolean(secado.fechaFin && secado.perfilProceso && !vinculados.has(secado.id)),
  );
  const perteneceAlLote = (secado: Secado, id: number) =>
    secado.loteId === id || secado.secadoLotes?.some(({ loteId }) => loteId === id);
  const perfilesDe = (id: number) => [...new Set(elegibles.filter((secado) =>
    perteneceAlLote(secado, id),
  ).map(({ perfilProceso }) => perfilProceso).filter((valor): valor is string => Boolean(valor)))];
  const perfiles = loteId ? perfilesDe(loteId) : [];
  const tara = brutos != null && netos != null && brutos >= netos ? Number((brutos - netos).toFixed(2)) : undefined;

  return (
    <>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="fechaInicio" label="Fecha de ingreso" rules={[{ required: true, message: "Indica la fecha de ingreso" }]}>
            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        {!actual && <Col xs={24} md={12}><Form.Item name="codigo" label="Código de empaque"><Input placeholder="Automático si se deja vacío" /></Form.Item></Col>}
        <Col xs={24} md={12}>
          <Form.Item
            name="loteId"
            label="Lote de café"
            tooltip={{
              title: "Aparecen los lotes activos con al menos un secado con fecha de fin y perfil asignado, disponible para ingresar a almacén.",
              trigger: ["hover", "focus", "click"],
              icon: <QuestionCircleOutlined tabIndex={0} aria-label="Ayuda sobre los lotes disponibles" />,
            }}
            rules={[{ required: true, message: "Selecciona un lote" }]}
          >
            <Select
              disabled={comprometido}
              showSearch
              optionFilterProp="label"
              placeholder="Seleccione un lote con secado terminado"
              options={lotes.filter((lote) => lote.id === actual?.loteId || (lote.activo && perfilesDe(lote.id).length > 0))
                .map((lote) => ({ value: lote.id, label: lote.nombre ? `${lote.codigo} · ${lote.nombre}` : lote.codigo }))}
              onChange={(id: number) => {
                const opciones = perfilesDe(id);
                form.setFieldsValue({ secadoIds: [], perfilSecado: opciones.length === 1 ? opciones[0] : undefined });
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="perfilSecado" label="Perfil de secado">
            <Select disabled={comprometido || !loteId} options={perfiles.map((value) => ({ value, label: formatEstadoEnum(value) }))}
              onChange={() => form.setFieldValue("secadoIds", [])} placeholder="Seleccione el perfil del lote" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="secadoIds" label="Procesos de secado vinculados"
        tooltip={{
          title: "Puedes elegir secados con fecha de fin guardada, del perfil seleccionado y disponibles para este ingreso. Los secados en curso o vinculados a otro ingreso quedan fuera. Incluye al menos uno del lote seleccionado.",
          trigger: ["hover", "focus", "click"],
          icon: <QuestionCircleOutlined tabIndex={0} aria-label="Ayuda sobre los secados disponibles" />,
        }}
        rules={[{ required: !actual || propios.length > 0, message: "Selecciona al menos un secado terminado" }]}>
        <Select mode="multiple" disabled={comprometido || !perfil} optionFilterProp="label" placeholder="Seleccione secados del perfil"
          options={elegibles.filter((secado) => secado.perfilProceso === perfil || propios.includes(secado.id) && !perfil)
            .map((secado) => ({
              value: secado.id,
              label: `${secado.codigo ?? `SEC-${secado.id}`} · ${secado.lote?.codigo ?? ""} · ${secado.kilosIngresados.toLocaleString("es-CL")} kg`,
            }))}
        />
      </Form.Item>
      <Divider titlePlacement="left">Detalles del empaque</Divider>
      <Row gutter={16}>
        <Col xs={24} md={8}><Form.Item name="cantidadEmpaques" label="N.º de sacos">
          <InputNumber min={0} precision={0} style={{ width: "100%" }} />
        </Form.Item></Col>
        <Col xs={24} md={16}><Form.Item name="tipoEmpaque" label="Tipo de empaque">
          <Select allowClear options={["Saco 69 kg", "Saco 69 kg + Grainpro", "Saco 60 kg", "Big Bag", "Granel"].map((value) => ({ value, label: value }))} />
        </Form.Item></Col>
        <Col xs={24} md={8}><Form.Item name="kilosIngresados" label="Kilos brutos"
            rules={[{ required: true, type: "number", min: 0.01, message: "Ingrese los kilos brutos" }]}>
          <InputNumber min={0.01} precision={2} decimalSeparator="," addonAfter="kg" style={{ width: "100%" }} />
        </Form.Item></Col>
        <Col xs={24} md={8}><Form.Item name="kilosResultantes" label="Kilos netos" dependencies={["kilosIngresados"]}
            rules={[{ required: true, type: "number", min: 0.01, message: "Ingrese los kilos netos" },
              { validator: (_, value) => value != null && value > form.getFieldValue("kilosIngresados")
                ? Promise.reject(new Error("Los netos no pueden superar a los brutos")) : Promise.resolve() }]}>
          <InputNumber min={0.01} precision={2} readOnly={comprometido} decimalSeparator="," addonAfter="kg" style={{ width: "100%" }} />
        </Form.Item></Col>
        <Col xs={24} md={8}><Form.Item label="Tara">
          <InputNumber value={tara} readOnly controls={false} decimalSeparator="," addonAfter="kg" style={{ width: "100%" }} />
        </Form.Item></Col>
      </Row>
      <Divider titlePlacement="left">Datos de calidad</Divider>
      <Row gutter={16}>
        <Col xs={24} md={8}><Form.Item name="rendimiento" label="Rendimiento (%)"><InputNumber min={0} max={100} precision={2} decimalSeparator="," /></Form.Item></Col>
        <Col xs={24} md={8}><Form.Item name="humedad" label="Humedad (%)"><InputNumber min={0} max={100} precision={2} decimalSeparator="," /></Form.Item></Col>
        <Col xs={24} md={8}><Form.Item name="actividadAgua" label="Actividad de agua (Aw)"><InputNumber min={0} max={1} precision={3} decimalSeparator="," /></Form.Item></Col>
        <Col xs={24} md={8}><Form.Item name="puntajeSca" label="Puntaje SCA"><InputNumber min={0} max={100} precision={2} decimalSeparator="," /></Form.Item></Col>
        <Col xs={24} md={8}><Form.Item name="fueCatado" label="¿Fue catado?" valuePropName="checked"><Switch checkedChildren="Sí" unCheckedChildren="No" /></Form.Item></Col>
        <Col xs={24} md={8}><Form.Item name="muestra" label="¿Muestra?" valuePropName="checked"><Switch checkedChildren="Sí" unCheckedChildren="No" /></Form.Item></Col>
      </Row>
      <Form.Item name="perfilSensorial" label="Perfil sensorial"><Input.TextArea rows={2} /></Form.Item>
      <Form.Item name="observaciones" label="Observaciones"><Input.TextArea rows={3} /></Form.Item>
    </>
  );
}
