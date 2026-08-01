// src/components/trazabilidad-modals/EditarProcesoModal.tsx
import { useEffect, useState, useMemo } from "react";
import { Button, DatePicker, Form, InputNumber, Modal, Row, Col, Space, Select, Descriptions, Alert } from "antd";
import dayjs from "dayjs";
import type { Cosecha } from "../../pages/cosechas/cosechas.api";
import type { Lote } from "../../pages/lotes/lotes.api";
import type { ProcesoTrazabilidad } from "../../pages/trazabilidad/trazabilidad.api";
import type { ProcesoFormValues } from "./CrearProcesoModal";

import type { Dayjs } from "dayjs";

import type { Lote } from "../../pages/lotes/lotes.api";


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

export default function EditarProcesoModal({ open,
    proceso,
    cosechas,
    lotes,
    saving = false,
    onClose,
    onSubmit,
    lotes
}: EditarProcesoModalProps) {
    const [form] = Form.useForm<ProcesoFormValues>();

    const [fechaSeleccionada, setFechaSeleccionada] =
        useState<Dayjs | null>(null);

    const [loteSeleccionadoId, setLoteSeleccionadoId] =
        useState<number | null>(null);

    const cosechasFecha = useMemo(() => {
        if (!fechaSeleccionada) {
            return [];
        }

        const fechaBuscada = getFechaKey(fechaSeleccionada);

        return cosechas.filter((cosecha) => {
            const fechaCosecha = getFechaKey(cosecha.fecha);

            return fechaCosecha === fechaBuscada;
        });
    }, [cosechas, fechaSeleccionada]);

    const loteIdsFecha = useMemo(() => {
        return new Set(
            cosechasFecha.flatMap((cosecha) =>
                (cosecha.cosechaLotes ?? []).map(
                    (relacion) => relacion.loteId,
                ),
            ),
        );
    }, [cosechasFecha]);

    const lotesDisponibles = useMemo(() => {
        if (!fechaSeleccionada) {
            return [];
        }

        return lotes.filter((lote) => {
            const esLoteActual =
                lote.id === proceso?.loteId;

            return (
                loteIdsFecha.has(lote.id) &&
                (lote.activo || esLoteActual)
            );
        });
    }, [
        lotes,
        loteIdsFecha,
        fechaSeleccionada,
        proceso?.loteId,
    ]);

    const loteSeleccionado = useMemo(() => {
        return (
            lotesDisponibles.find(
                (lote) => lote.id === loteSeleccionadoId,
            ) ?? null
        );
    }, [lotesDisponibles, loteSeleccionadoId]);

    function getFechaKey(value: string | Dayjs): string {
        if (typeof value === "string") {
            return value.slice(0, 10);
        }

        return value.format("YYYY-MM-DD");
    }

    function handleFechaChange(value: Dayjs | null) {
        setFechaSeleccionada(value);
        setLoteSeleccionadoId(null);

        form.resetFields([
            "loteId",
            "kilosIngresados",
            "kilosResultantes",
            "porcentajeMerma",
        ]);
    }

    function handleLoteChange(value: number) {
        setLoteSeleccionadoId(value);

        form.resetFields([
            "kilosIngresados",
            "kilosResultantes",
            "porcentajeMerma",
        ]);
    }

    const cosechaSeleccionada = useMemo(() => {
        if (!loteSeleccionadoId) {
            return null;
        }

        return (
            cosechasFecha.find((cosecha) =>
                (cosecha.cosechaLotes ?? []).some(
                    (relacion) =>
                        relacion.loteId ===
                        loteSeleccionadoId,
                ),
            ) ?? null
        );
    }, [
        cosechasFecha,
        loteSeleccionadoId,
    ]);

    const kilosTotalesFecha = useMemo(() => {
        return cosechasFecha.reduce(
            (total, cosecha) =>
                total +
                Number(cosecha.kilosCosechados ?? 0),
            0,
        );
    }, [cosechasFecha]);

    useEffect(() => {
        if (open && proceso) {
            form.setFieldsValue({
                fecha: dayjs(proceso.fecha),
                loteId: proceso.loteId,
                cosechaId: proceso.cosechaId,
                etapa: proceso.etapa,
                tipoProceso: proceso.tipoProceso,
                kilosIngresados: proceso.kilosIngresados,
                fechaInicio: proceso.fechaInicio ? dayjs(proceso.fechaInicio) : undefined,
                fechaFin: proceso.fechaFin ? dayjs(proceso.fechaFin) : undefined,
            });

            setFechaSeleccionada(dayjs(proceso.fecha));
            setLoteSeleccionadoId(
                proceso.loteId ?? null,
            );
        }
    }, [open, proceso, form]);

    const handleFinish = async (values: ProcesoFormValues) => {
        if (proceso) {
            await onSubmit(proceso.id, values);
        }
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
            title="Editar Proceso Húmedo"
            open={open}
            onCancel={handleCancel}
            footer={null}
            destroyOnHidden
            centered
            width="min(780px, 95vw)"
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
                            rules={[{ required: true, message: "La fecha es obligatoria" }]}
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                locale={esES}
                                format="DD/MM/YYYY"
                                placeholder="Seleccione una fecha"
                                onChange={handleFechaChange}
                            />
                        </Form.Item>
                        <Form.Item
                            label="Inicio del proceso"
                            name="fechaInicio"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Seleccione cuándo comenzó el proceso",
                                },
                            ]}
                        >
                            <DatePicker
                                showTime={{ format: "HH:mm" }}
                                style={{ width: "100%" }}
                                locale={esES}
                                format="DD/MM/YYYY HH:mm"
                            />
                        </Form.Item>
                        <Form.Item
                            label="Duración del proceso"
                            name="duracionHoras"
                            rules={[
                                {
                                    required: true,
                                    message: "Ingrese la duración",
                                },
                                {
                                    type: "number",
                                    min: 0.01,
                                    message: "La duración debe ser mayor que cero",
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
                            label="Lote Origen"
                            name="loteId"
                            rules={[{ required: true, message: "El lote origen es obligatorio" }]}
                        >
                            <Select
                                placeholder="Seleccione un lote"
                                options={loteOptions}
                                showSearch
                                optionFilterProp="label"
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
                            rules={[{ required: true, message: "Los kilos ingresados son obligatorios" }]}
                        >
                            <InputNumber style={{ width: "100%" }} min={0} placeholder="Ej: 180" />
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
