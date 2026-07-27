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
    fechaInicio: Dayjs;
    duracionHoras: number;

    loteId: number;

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
    loading = false,
    saving = false,
    onClose,
    onSubmit,
    lotes
}: CrearProcesoModalProps) {
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

    const kilosTotalesFecha = useMemo(() => {
        return cosechasFecha.reduce(
            (total, cosecha) => total + Number(cosecha.kilosCosechados ?? 0),
            0,
        );
    }, [cosechasFecha]);

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

        return lotes.filter(
            (lote) =>
                lote.activo &&
                loteIdsFecha.has(lote.id),
        );
    }, [lotes, loteIdsFecha, fechaSeleccionada]);

    const loteSeleccionado = useMemo(() => {
        return (
            lotesDisponibles.find(
                (lote) => lote.id === loteSeleccionadoId,
            ) ?? null
        );
    }, [lotesDisponibles, loteSeleccionadoId]);

    const cosechaSeleccionada = useMemo(() => {
        if (!loteSeleccionadoId) {
            return null;
        }

        return (
            cosechasFecha.find((cosecha) =>
                (cosecha.cosechaLotes ?? []).some(
                    (relacion) =>
                        relacion.loteId === loteSeleccionadoId,
                ),
            ) ?? null
        );
    }, [
        cosechasFecha,
        loteSeleccionadoId,
    ]);

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

    const handleValuesChange = (
        changedValues: Partial<ProcesoFormValues>,
    ) => {
        if (
            "kilosIngresados" in changedValues ||
            "kilosResultantes" in changedValues
        ) {
            const kilosIngresados =
                form.getFieldValue("kilosIngresados") ?? 0;

            const kilosResultantes =
                form.getFieldValue("kilosResultantes") ?? 0;

            const porcentajeMerma =
                kilosIngresados > 0 &&
                    kilosResultantes >= 0 &&
                    kilosResultantes <= kilosIngresados
                    ? ((kilosIngresados -
                        kilosResultantes) /
                        kilosIngresados) *
                    100
                    : 0;

            form.setFieldsValue({
                porcentajeMerma: Number(
                    porcentajeMerma.toFixed(2),
                ),
            });

            if ("kilosIngresados" in changedValues) {
                void form.validateFields([
                    "kilosResultantes",
                ]);
            }
        }
    };

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

    return (
        <Modal
            title="Registrar Proceso"
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
                onValuesChange={handleValuesChange}
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
                                        "Seleccione cuándo comenzó el proceso",
                                },
                            ]}
                        >
                            <DatePicker
                                showTime={{
                                    format: "HH:mm",
                                }}
                                style={{ width: "100%" }}
                                locale={esES}
                                format="DD/MM/YYYY HH:mm"
                                placeholder="Fecha y hora de inicio"
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24}>
                        {fechaSeleccionada ? (
                            <Alert
                                type={
                                    cosechasFecha.length > 0
                                        ? "info"
                                        : "warning"
                                }
                                showIcon
                                message={
                                    cosechasFecha.length > 0
                                        ? "Producción registrada en la fecha"
                                        : "Sin cosechas registradas"
                                }
                                description={
                                    cosechasFecha.length > 0
                                        ? `${kilosTotalesFecha.toLocaleString(
                                            "es-CL",
                                        )} kg cosechados en ${cosechasFecha.length} registro(s).`
                                        : "No existen cosechas registradas para la fecha seleccionada."
                                }
                                style={{ marginBottom: 16 }}
                            />
                        ) : null}
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            name="loteId"
                            label="Lote productivo"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Seleccione el lote asociado al proceso",
                                },
                            ]}
                        >
                            <Select
                                showSearch
                                optionFilterProp="label"
                                placeholder={
                                    fechaSeleccionada
                                        ? "Seleccione un lote..."
                                        : "Primero seleccione una fecha"
                                }
                                loading={loading}
                                disabled={!fechaSeleccionada}
                                onChange={handleLoteChange}
                                options={lotesDisponibles.map((lote) => {
                                    const kilos =
                                        lote.kilosActuales ??
                                        lote.kilosIniciales ??
                                        0;

                                    return {
                                        value: lote.id,
                                        label:
                                            `${lote.codigo}` +
                                            `${lote.nombre ? ` - ${lote.nombre}` : ""}` +
                                            ` - ${kilos.toLocaleString("es-CL")} kg`,
                                    };
                                })}
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
                                    message:
                                        "Ingrese cuántas horas duró el proceso",
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

                    {loteSeleccionado && (
                        <Col xs={24}>
                            <Descriptions
                                bordered
                                size="small"
                                column={{
                                    xs: 1,
                                    sm: 2,
                                    md: 3,
                                }}
                                style={{ marginBottom: 16 }}
                            >
                                <Descriptions.Item label="Código del lote">
                                    {loteSeleccionado.codigo}
                                </Descriptions.Item>

                                <Descriptions.Item label="Tipo de cosecha">
                                    {cosechaSeleccionada?.tipoCosecha ?? "-"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Kilos cosechados">
                                    {cosechaSeleccionada
                                        ? `${cosechaSeleccionada.kilosCosechados.toLocaleString(
                                            "es-CL",
                                        )} kg`
                                        : "-"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Kilos iniciales">
                                    {loteSeleccionado.kilosIniciales != null
                                        ? `${loteSeleccionado.kilosIniciales.toLocaleString(
                                            "es-CL",
                                        )} kg`
                                        : "-"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Kilos actuales">
                                    {loteSeleccionado.kilosActuales != null
                                        ? `${loteSeleccionado.kilosActuales.toLocaleString(
                                            "es-CL",
                                        )} kg`
                                        : "-"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Estado">
                                    {loteSeleccionado.estado}
                                </Descriptions.Item>
                            </Descriptions>
                        </Col>
                    )}

                    <Col xs={24} md={12}>
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
                                    { value: "Clasificación", label: "Clasificación" },
                                ]}
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

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Kilos Resultantes"
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
                                            Number(
                                                form.getFieldValue(
                                                    "kilosIngresados",
                                                ),
                                            ) || 0;

                                        if (
                                            value !== undefined &&
                                            Number(value) > kilosIngresados
                                        ) {
                                            throw new Error(
                                                "Los kilos resultantes no pueden superar los ingresados",
                                            );
                                        }
                                    },
                                },
                            ]}
                        >
                            <InputNumber
                                style={{ width: "100%" }}
                                min={0}
                                placeholder="Ej: 145"
                                precision={2}
                                addonAfter="kg"
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="% Merma" name="porcentajeMerma">
                            <InputNumber
                                style={{ width: "100%" }}
                                readOnly
                                placeholder="Merma calculada"
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