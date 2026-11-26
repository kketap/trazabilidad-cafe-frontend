import { Form, Modal } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type { Lote } from "../../pages/lotes/lotes.api";
import type { Secado } from "../../pages/secado/secado.api";
import type { CreateEmpaqueDTO, Empaque } from "../../pages/empaque/empaque.api";
import CamposEmpaque from "./CamposEmpaque";

export type EmpaqueFormValues = Omit<CreateEmpaqueDTO, "fechaInicio"> & { fechaInicio: Dayjs };

type Props = {
  open: boolean; onClose: () => void; onSubmit: (values: CreateEmpaqueDTO) => Promise<void>;
  lotes: Lote[]; secados: Secado[]; empaques: Empaque[]; loading?: boolean;
};

export default function CrearEmpaqueModal({ open, onClose, onSubmit, lotes, secados, empaques, loading }: Props) {
  const [form] = Form.useForm<EmpaqueFormValues>();

  return (
    <Modal title="Registrar ingreso a Almacén Pergamino" open={open} onCancel={onClose}
      onOk={() => form.submit()} okText="Registrar ingreso" cancelText="Cancelar" confirmLoading={loading}
      width={720} destroyOnHidden>
      <Form form={form} preserve={false} layout="vertical"
        initialValues={{ fechaInicio: dayjs(), fueCatado: false, muestra: false }}
        onFinish={({ fechaInicio, ...values }) => onSubmit({ ...values, fechaInicio: fechaInicio.toISOString() })}>
        <CamposEmpaque lotes={lotes} secados={secados} empaques={empaques} />
      </Form>
    </Modal>
  );
}
