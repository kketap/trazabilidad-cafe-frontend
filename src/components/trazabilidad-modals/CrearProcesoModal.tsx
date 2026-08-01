// src/components/trazabilidad-modals/CrearProcesoModal.tsx
import { useMemo, useState } from "react";
import {
    Alert,
    Button,
    Col,
    DatePicker,
    Descriptions,
    Form,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
} from "antd";
import type { Dayjs } from "dayjs";
import type { Cosecha } from "../../pages/cosechas/cosechas.api";
import type { Lote } from "../../pages/lotes/lotes.api";

import esES from "antd/es/date-picker/locale/es_ES";

export type ProcesoFormValues = {
    fecha: Dayjs;
    loteId?: number | null;
    cosechaId?: number | null;
    etapa?: string;
    tipoProceso?: string;
    kilosIngresados: number;
    kilosResultantes?: number;
    porcentajeMerma?: number;
    fechaInicio?: Dayjs;
    fechaFin?: Dayjs;
};

type CrearProcesoModalProps = {
    open: boolean;
    cosechas: Cosecha[];
    lotes: Lote[];
    loading?: boolean;
    saving?: boolean;
    /**
     * Lista real de lotes productivos.
     * Se usa para asociar el proceso directamente a un lote.
     */
    lotes: Lote[];
    onClose: () => void;
    onSubmit: (values: ProcesoFormValues) => Promise<void> | void;
};

export default function CrearProcesoModal({
    open,
    cosechas,
    lotes,
    loading = false,
    saving = false,
    onClose,
    onSubmit,
    lotes
}: CrearProcesoModalProps) {
    const [form] = Form.useForm<ProcesoFormValues>();

    const handleFinish = async (
        values: ProcesoFormValues,
    ) => {
        await onSubmit(values);

        form.resetFields();
        setFechaSeleccionada(null);
        setLoteSeleccionadoId(null);
    };

    const handleCancel = () => {
        form.resetFields();
        setFechaSeleccionada(null);
        setLoteSeleccionadoId(null);
        onClose();
    };

    const loteOptions = (lotes || []).map((lote) => ({
        value: lote.id,
        label: lote.nombre ? `${lote.codigo} - ${lote.nombre}` : lote.codigo,
    }));

    const cosechaOptions = (cosechas || []).map((cosecha) => ({
        value: cosecha.id,
        label: `${cosecha.lotes} - ${cosecha.fecha ? cosecha.fecha.slice(0, 10) : ""} - ${(cosecha.kilosCosechados ?? 0).toLocaleString("es-CL")} kg`,
    }));

    return (
        <Modal
            title="Registrar Proceso Húmedo"
            open={open}
            onCancel={handleCancel}
            footer={null}
            destroyOnHidden
            centered
            width="min(1020px, 96vw)"
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
                <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Fecha de Registro"
                            name="fecha"
                            rules={[
                                {
                                    required: true,
                                    message: "La fecha es obligatoria",
                                },
                            ]}
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                locale={esES}
                                format="DD/MM/YYYY"
                                placeholder="Seleccione una fecha"
                                onChange={handleFechaChange}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Lote Origen"
                            name="loteId"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Seleccione el lote asociado al proceso",
                                },
                            ]}
                        >
                            <Select
                                placeholder="Seleccione un lote"
                                options={loteOptions}
                                showSearch
                                optionFilterProp="label"
                                loading={loading}
                                disabled={loading || (lotes || []).length === 0}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Cosecha (Opcional)"
                            name="cosechaId"
                        >
                            <Select
                                placeholder="Seleccione una cosecha (opcional)"
                                options={cosechaOptions}
                                showSearch
                                optionFilterProp="label"
                                allowClear
                                loading={loading}
                                disabled={loading || (cosechas || []).length === 0}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Tipo de Proceso"
                            name="tipoProceso"
                        >
                            <Select
                                placeholder="Seleccione un tipo de proceso"
                                options={[
                                    { value: "OXIDACION_CEREZA", label: "Oxidación en cereza" },
                                    { value: "OXIDACION_MUCILAGO", label: "Oxidación en mucílago" },
                                    { value: "ANAEROBICO_CEREZA", label: "Anaeróbico en cereza" },
                                    { value: "ANAEROBICO_MUCILAGO", label: "Anaeróbico en mucílago" },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                    
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Fecha/Hora de Inicio"
                            name="fechaInicio"
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                locale={esES}
                                showTime
                                format="DD/MM/YYYY HH:mm"
                                placeholder="Inicio del proceso"
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Fecha/Hora de Fin"
                            name="fechaFin"
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                locale={esES}
                                showTime
                                format="DD/MM/YYYY HH:mm"
                                placeholder="Fin del proceso"
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Kilos Ingresados"
                            name="kilosIngresados"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Los kilos ingresados son obligatorios",
                                },
                                {
                                    validator: async (_, value) => {
                                        const kilosDisponibles =
                                            loteSeleccionado?.kilosActuales ??
                                            loteSeleccionado?.kilosIniciales;

                                        if (
                                            kilosDisponibles != null &&
                                            Number(value) > kilosDisponibles
                                        ) {
                                            throw new Error(
                                                `El lote solamente tiene ${kilosDisponibles.toLocaleString(
                                                    "es-CL",
                                                )} kg disponibles`,
                                            );
                                        }
                                    },
                                },
                            ]}
                        >
                            <InputNumber
                                style={{ width: "100%" }}
                                min={0.01}
                                max={
                                    loteSeleccionado?.kilosActuales ??
                                    loteSeleccionado?.kilosIniciales ??
                                    undefined
                                }
                                precision={2}
                                addonAfter="kg"
                                placeholder="Ej: 180"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    style={{
                        marginBottom: 0,
                        paddingTop: 8,
                    }}
                >
                    <Space>
                        <Button type="primary" htmlType="submit" loading={saving}>
                            Guardar
                        </Button>

                        <Button onClick={handleCancel}>
                            Cancelar
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
}