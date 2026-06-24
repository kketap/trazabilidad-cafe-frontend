// src/components/trazabilidad-modals/CrearProcesoModal.tsx
import { Button, DatePicker, Form, InputNumber, Modal, Select } from "antd";
import type { Dayjs } from "dayjs";

export type ProcesoFormValues = {
    fecha: Dayjs;
    loteOrigen: string;
    etapa: string;
    kilosIngresados: number;
    kilosResultantes: number;
    porcentajeMerma: number;
};

type CrearProcesoModalProps = {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: ProcesoFormValues) => void;
};

export default function CrearProcesoModal({ open, onClose, onSubmit }: CrearProcesoModalProps) {
    const [form] = Form.useForm<ProcesoFormValues>();

    const handleValuesChange = (changedValues: Partial<ProcesoFormValues>) => {
        if ("kilosIngresados" in changedValues || "kilosResultantes" in changedValues) {
            const kilosIngresados = form.getFieldValue("kilosIngresados") ?? 0;
            const kilosResultantes = form.getFieldValue("kilosResultantes") ?? 0;
            const porcentajeMerma = kilosIngresados > 0
                ? ((kilosIngresados - kilosResultantes) / kilosIngresados) * 100
                : 0;

            form.setFieldsValue({ porcentajeMerma });
        }
    };

    const handleFinish = (values: ProcesoFormValues) => {
        onSubmit(values);
        form.resetFields();
        onClose();
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            title="Registrar Proceso"
            open={open}
            onCancel={handleCancel}
            footer={null}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                onValuesChange={handleValuesChange}
                autoComplete="off"
            >
                <Form.Item
                    label="Fecha"
                    name="fecha"
                    rules={[
                        { required: true, message: "La fecha es obligatoria" },
                    ]}
                >
                    <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                    label="Lote Origen"
                    name="loteOrigen"
                    rules={[
                        { required: true, message: "El lote origen es obligatorio" },
                    ]}
                >
                    <Select
                        placeholder="Seleccione un lote"
                        options={[
                            { value: "COSECHA-2026-001", label: "COSECHA-2026-001" },
                            { value: "COSECHA-2026-002", label: "COSECHA-2026-002" },
                            { value: "COSECHA-2026-003", label: "COSECHA-2026-003" },
                        ]}
                    />
                </Form.Item>

                <Form.Item
                    label="Etapa"
                    name="etapa"
                    rules={[
                        { required: true, message: "La etapa es obligatoria" },
                    ]}
                >
                    <Select
                        placeholder="Seleccione una etapa"
                        options={[
                            { value: "Despulpado", label: "Despulpado" },
                            { value: "Lavado", label: "Lavado" },
                            { value: "Secado", label: "Secado" },
                            { value: "Trilla", label: "Trilla" },
                        ]}
                    />
                </Form.Item>

                <Form.Item
                    label="Kilos Ingresados"
                    name="kilosIngresados"
                    rules={[
                        { required: true, message: "Los kilos ingresados son obligatorios" },
                    ]}
                >
                    <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        placeholder="Ej: 180"
                    />
                </Form.Item>

                <Form.Item
                    label="Kilos Resultantes"
                    name="kilosResultantes"
                    rules={[
                        { required: true, message: "Los kilos resultantes son obligatorios" },
                    ]}
                >
                    <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        placeholder="Ej: 145"
                    />
                </Form.Item>

                <Form.Item
                    label="% Merma"
                    name="porcentajeMerma"
                >
                    <InputNumber
                        style={{ width: "100%" }}
                        readOnly
                        placeholder="Merma calculada"
                    />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Guardar
                    </Button>
                    <Button style={{ marginLeft: 8 }} onClick={handleCancel}>
                        Cancelar
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
}
