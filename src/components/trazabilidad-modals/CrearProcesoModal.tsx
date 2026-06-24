// src/components/trazabilidad-modals/CrearProcesoModal.tsx
import { Button, DatePicker, Form, InputNumber, Modal, Select } from "antd";
import type { Dayjs } from "dayjs";
import type { Cosecha } from "../../pages/cosechas/cosechas.api";

export type ProcesoFormValues = {
    fecha: Dayjs;
    cosechaId: number;
    etapa: string;
    kilosIngresados: number;
    kilosResultantes: number;
    porcentajeMerma?: number;
};

type CrearProcesoModalProps = {
    open: boolean;
    cosechas: Cosecha[];
    loading?: boolean;
    saving?: boolean;
    onClose: () => void;
    onSubmit: (values: ProcesoFormValues) => Promise<void> | void;
};

export default function CrearProcesoModal({
    open,
    cosechas,
    loading = false,
    saving = false,
    onClose,
    onSubmit,
}: CrearProcesoModalProps) {
    const [form] = Form.useForm<ProcesoFormValues>();

    const handleValuesChange = (changedValues: Partial<ProcesoFormValues>) => {
        if (
            "kilosIngresados" in changedValues ||
            "kilosResultantes" in changedValues
        ) {
            const kilosIngresados = form.getFieldValue("kilosIngresados") ?? 0;
            const kilosResultantes = form.getFieldValue("kilosResultantes") ?? 0;

            const porcentajeMerma =
                kilosIngresados > 0
                    ? ((kilosIngresados - kilosResultantes) / kilosIngresados) * 100
                    : 0;

            form.setFieldsValue({
                porcentajeMerma: Number(porcentajeMerma.toFixed(2)),
            });
        }
    };

    const handleFinish = async (values: ProcesoFormValues) => {
        await onSubmit(values);
        form.resetFields();
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    const cosechaOptions = cosechas.map((cosecha) => ({
        value: cosecha.id,
        label: `${cosecha.lotes} - ${cosecha.fecha.slice(
            0,
            10,
        )} - ${cosecha.kilosCosechados.toLocaleString("es-CL")} kg`,
    }));

    return (
        <Modal
            title="Registrar Proceso"
            open={open}
            onCancel={handleCancel}
            footer={null}
            destroyOnHidden
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
                    rules={[{ required: true, message: "La fecha es obligatoria" }]}
                >
                    <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                    label="Lote Origen"
                    name="cosechaId"
                    rules={[{ required: true, message: "El lote origen es obligatorio" }]}
                >
                    <Select
                        placeholder="Seleccione una cosecha"
                        options={cosechaOptions}
                        showSearch
                        optionFilterProp="label"
                        loading={loading}
                        disabled={loading || cosechas.length === 0}
                    />
                </Form.Item>

                <Form.Item
                    label="Etapa"
                    name="etapa"
                    rules={[{ required: true, message: "La etapa es obligatoria" }]}
                >
                    <Select
                        placeholder="Seleccione una etapa"
                        options={[
                            { value: "Despulpado", label: "Despulpado" },
                            { value: "Lavado", label: "Lavado" },
                            { value: "Secado", label: "Secado" },
                            { value: "Trilla", label: "Trilla" },
                            { value: "Clasificación", label: "Clasificación" },
                        ]}
                    />
                </Form.Item>

                <Form.Item
                    label="Kilos Ingresados"
                    name="kilosIngresados"
                    rules={[
                        {
                            required: true,
                            message: "Los kilos ingresados son obligatorios",
                        },
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
                        {
                            required: true,
                            message: "Los kilos resultantes son obligatorios",
                        },
                    ]}
                >
                    <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        placeholder="Ej: 145"
                    />
                </Form.Item>

                <Form.Item label="% Merma" name="porcentajeMerma">
                    <InputNumber
                        style={{ width: "100%" }}
                        readOnly
                        placeholder="Merma calculada"
                    />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={saving}>
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