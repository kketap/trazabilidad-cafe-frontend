// src/components/cosechas-modals/CrearCosechaModal.tsx
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select } from "antd";
import type { Dayjs } from "dayjs";
import esES from "antd/es/date-picker/locale/es_ES";

export type CosechaFormValues = {
    fecha: Dayjs;
    kilosCosechados: number;
    cantidadCosechadores: number;
    lotes: string;
    totalHectareas: number;
    tipoCosecha: string;
};

type CrearCosechaModalProps = {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: CosechaFormValues) => void;
};

export default function CrearCosechaModal({ open, onClose, onSubmit }: CrearCosechaModalProps) {
    const [form] = Form.useForm<CosechaFormValues>();

    const handleFinish = (values: CosechaFormValues) => {
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
            title="Registrar Cosecha"
            open={open}
            onCancel={handleCancel}
            footer={null}
            centered
            width="min(720px, 95vw)"
            styles={{
                body: {
                    maxHeight: "70vh",
                    overflowY: "auto",
                    paddingRight: 8,
                },
            }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                autoComplete="off"
            >
                <Form.Item
                    label="Fecha"
                    name="fecha"
                    rules={[
                        { required: true, message: "La fecha es obligatoria" },
                    ]}
                >
                    <DatePicker
                        style={{ width: "100%" }}
                        locale={esES}
                        format="DD/MM/YYYY"
                        placeholder="Seleccione una fecha"
                    />
                </Form.Item>

                <Form.Item
                    label="Kilos Cosechados"
                    name="kilosCosechados"
                    rules={[
                        { required: true, message: "Los kilos cosechados son obligatorios" },
                    ]}
                >
                    <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        placeholder="Ej: 150"
                    />
                </Form.Item>

                <Form.Item
                    label="Cantidad Cosechadores"
                    name="cantidadCosechadores"
                    rules={[
                        { required: true, message: "La cantidad de cosechadores es obligatoria" },
                    ]}
                >
                    <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        placeholder="Ej: 4"
                    />
                </Form.Item>

                <Form.Item
                    label="Lotes"
                    name="lotes"
                    rules={[
                        { required: true, message: "Los lotes son obligatorios" },
                    ]}
                >
                    <Input placeholder="Ej: Lote 1" />
                </Form.Item>

                <Form.Item
                    label="Total Hectáreas"
                    name="totalHectareas"
                    rules={[
                        { required: true, message: "El total de hectáreas es obligatorio" },
                    ]}
                >
                    <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        placeholder="Ej: 2.5"
                    />
                </Form.Item>

                <Form.Item
                    label="Tipo Cosecha"
                    name="tipoCosecha"
                    rules={[
                        { required: true, message: "El tipo de cosecha es obligatorio" },
                    ]}
                >
                    <Select
                        placeholder="Seleccione un tipo de cosecha"
                        options={[
                            { value: "Rebusque", label: "Rebusque" },
                        ]}
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
