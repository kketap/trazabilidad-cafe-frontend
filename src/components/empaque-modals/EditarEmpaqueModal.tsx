import { Form, Modal } from "antd";
import dayjs from "dayjs";
import type { Lote } from "../../pages/lotes/lotes.api";
import type { Secado } from "../../pages/secado/secado.api";
import type { Empaque, UpdateEmpaqueDTO } from "../../pages/empaque/empaque.api";
import CamposEmpaque, { idsSecados } from "./CamposEmpaque";
import type { EmpaqueFormValues } from "./CrearEmpaqueModal";

type Props = {
  open: boolean; onClose: () => void; onSubmit: (id: number, values: UpdateEmpaqueDTO) => Promise<void>;
  empaque: Empaque | null; lotes: Lote[]; secados: Secado[]; empaques: Empaque[]; loading?: boolean;
};

export default function EditarEmpaqueModal({ open, onClose, onSubmit, empaque, lotes, secados, empaques, loading }: Props) {
  const [form] = Form.useForm<EmpaqueFormValues>();
  const secadoIds = empaque ? idsSecados(empaque) : [];
  const perfilSecado = secados.find(({ id }) => id === secadoIds[0])?.perfilProceso;
  const initialValues = empaque ? { ...empaque, fechaInicio: dayjs(empaque.fechaInicio), secadoIds, perfilSecado } : undefined;

  return (
    <Modal title="Editar registro de Almacén Pergamino" open={open} onCancel={onClose}
      onOk={() => form.submit()} okText="Guardar cambios" cancelText="Cancelar" confirmLoading={loading}
      width={720} destroyOnHidden>
      {empaque && <Form key={empaque.id} form={form} preserve={false} layout="vertical" initialValues={initialValues}
        onFinish={({ fechaInicio, ...values }) => onSubmit(empaque.id, { ...values, fechaInicio: fechaInicio.toISOString() })}>
        <CamposEmpaque lotes={lotes} secados={secados} empaques={empaques} actual={empaque} />
      </Form>}
    </Modal>
  );
}
