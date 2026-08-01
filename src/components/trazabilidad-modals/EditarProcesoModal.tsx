// src/components/trazabilidad-modals/EditarProcesoModal.tsx
import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Col,
    DatePicker,
    Form,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
} from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

import type { Cosecha } from "../../pages/cosechas/cosechas.api";
import type { Lote } from "../../pages/lotes/lotes.api";
import type { ProcesoTrazabilidad } from "../../pages/trazabilidad/trazabilidad.api";
import type { ProcesoFormValues } from "./CrearProcesoModal";

import esES from "antd/es/date-picker/locale/es_ES";

type EditarProcesoModalProps = {
    open: boolean;
    proceso: ProcesoTrazabilidad | null;
    cosechas: Cosecha[];
    lotes: Lote[];
    saving?: boolean;
    onClose: () => void;
    onSubmit: (id: number, values: ProcesoFormValues) => Promise<void> | void;
};

const ETAPA_OPTIONS = [
    { value: "Despulpado", label: "Despulpado" },
    { value: "Lavado", label: "Lavado" },
    { value: "Secado", label: "Secado" },
    { value: "Trilla", label: "Trilla" },
    { value: "Clasificación", label: "Clasificación" },
];

export default function EditarProcesoModal({
    open,
    proceso,
    cosechas,
    lotes,
    saving = false,
    onClose,
    onSubmit,
}: EditarProcesoModalProps) {
    const [form] = Form.useForm<ProcesoFormValues>();

    const [loteSeleccionadoId, setLoteSeleccionadoId] =
        useState<number | null>(null);

    const lotesDisponibles = useMemo(() => {
        return (lotes ?? []).filter((lote) => {
            const esLoteActual = lote.id === proceso?.loteId;
            return lote.activo || esLoteActual;
        });
    }, [lotes, proceso?.loteId]);

    const loteSeleccionado = useMemo(() => {
        return (
            lotesDisponibles.find((lote) => lote.id === loteSeleccionadoId) ??
            null
        );
    }, [lotesDisponibles, loteSeleccionadoId]);

    const loteOptions = useMemo(() => {
        return lotesDisponibles.map((lote) => ({
            value: lote.id,
            label: `${lote.codigo}${lote.nombre ? ` - ${lote.nombre}` : ""}`,
        }));
    }, [lotesDisponibles]);

    const cosechaOptions = useMemo(() => {
        return (cosechas ?? []).map((cosecha) => ({
            value: cosecha.id,
            label: `COS-${String(cosecha.id).padStart(3, "0")} | Lote: ${cosecha.lotes || "N/A"
                } | ${cosecha.fecha ? String(cosecha.fecha).slice(0, 10) : ""
                } | ${(cosecha.kilosCosechados ?? 0).toLocaleString("es-CL")} kg`,
        }));
    }, [cosechas]);

    useEffect(() => {
        if (open && proceso) {
            form.setFieldsValue({
                fecha: dayjs(proceso.fecha),
                fechaInicio: proceso.fechaInicio
                    ? dayjs(proceso.fechaInicio)
                    : undefined,
                duracionHoras: proceso.duracionHoras ?? undefined,
                loteId: proceso.loteId ?? null,
                cosechaId: proceso.cosechaId ?? null,
                etapa: proceso.etapa ?? undefined,
                kilosIngresados: proceso.kilosIngresados,
                kilosResultantes: proceso.kilosResultantes ?? undefined,
            });

            setLoteSeleccionadoId(proceso.loteId ?? null);
        }

        if (!open) {
            form.resetFields();
            setLoteSeleccionadoId(null);
        }
    }, [open, proceso, form]);

    function handleFechaChange(_value: Dayjs | null) {
        form.resetFields([
            "loteId",
            "cosechaId",
            "kilosIngresados",
            "kilosResultantes",
        ]);

        setLoteSeleccionadoId(null);
    }

    function handleLoteChange(value: number | null) {
        setLoteSeleccionadoId(value);
        form.resetFields(["kilosIngresados", "kilosResultantes"]);
    }

    const handleFinish = async (values: ProcesoFormValues) => {
        if (!proceso) return;

        await onSubmit(proceso.id, values);
    };

    const handleCancel = () => {
        form.resetFields();
        setLoteSeleccionadoId(null);
        onClose();
    };

    const kilosDisponibles =
        loteSeleccionado?.kilosActuales ?? loteSeleccionado?.kilosIniciales;

    return (
        <Modal
            title="Editar Proceso Húmedo"
            open={open}
            onCancel={handleCancel}
            footer={null}
            destroyOnHidden
            centered
            width="min(860px, 96vw)"
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
                            label="Fecha del proceso"
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
                            label="Inicio del proceso"
                            name="fechaInicio"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Seleccione la fecha y hora de inicio",
                                },
                            ]}
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                locale={esES}
                                showTime={{ format: "HH:mm" }}
                                format="DD/MM/YYYY HH:mm"
                                placeholder="Inicio del proceso"
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Duración del proceso"
                            name="duracionHoras"
                            rules={[
                                {
                                    required: true,
                                    message: "Ingrese la duración del proceso",
                                },
                                {
                                    type: "number",
                                    min: 0.01,
                                    message:
                                        "La duración debe ser mayor que cero",
                                },
                            ]}
                        >
                            <InputNumber
                                style={{ width: "100%" }}
                                min={0.01}
                                precision={2}
                                addonAfter="horas"
                                placeholder="Ej: 12"
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Lote origen"
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
                                onChange={handleLoteChange}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Cosecha relacionada"
                            name="cosechaId"
                        >
                            <Select
                                placeholder="Seleccione una cosecha opcional"
                                options={cosechaOptions}
                                showSearch
                                optionFilterProp="label"
                                allowClear
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Etapa"
                            name="etapa"
                            rules={[
                                {
                                    required: true,
                                    message: "Seleccione la etapa",
                                },
                            ]}
                        >
                            <Select
                                placeholder="Seleccione una etapa"
                                options={ETAPA_OPTIONS}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Kilos ingresados"
                            name="kilosIngresados"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Los kilos ingresados son obligatorios",
                                },
                                {
                                    validator: async (_, value) => {
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
                                max={kilosDisponibles ?? undefined}
                                precision={2}
                                addonAfter="kg"
                                placeholder="Ej: 180"
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Kilos resultantes"
                            name="kilosResultantes"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Los kilos resultantes son obligatorios",
                                },
                                {
                                    validator: async (_, value) => {
                                        const kilosIngresados =
                                            form.getFieldValue(
                                                "kilosIngresados",
                                            );

                                        if (
                                            kilosIngresados != null &&
                                            Number(value) > Number(kilosIngresados)
                                        ) {
                                            throw new Error(
                                                "Los kilos resultantes no pueden superar los kilos ingresados",
                                            );
                                        }
                                    },
                                },
                            ]}
                        >
                            <InputNumber
                                style={{ width: "100%" }}
                                min={0}
                                precision={2}
                                addonAfter="kg"
                                placeholder="Ej: 150"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item style={{ marginBottom: 0, paddingTop: 8 }}>
                    <Space>
                        <Button type="primary" htmlType="submit" loading={saving}>
                            Actualizar
                        </Button>

                        <Button onClick={handleCancel}>Cancelar</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
}