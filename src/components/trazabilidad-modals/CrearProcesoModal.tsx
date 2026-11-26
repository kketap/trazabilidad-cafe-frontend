import CamposOxidacion from "./CamposOxidacion";
import { formatearDuracionHoras } from "../../utils/formatearDuracion";
// src/components/trazabilidad-modals/CrearProcesoModal.tsx

import { useMemo, useState } from "react";

import {
    Button,
    Col,
    DatePicker,
    Divider,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Switch,
    Typography,
} from "antd";

import dayjs, { type Dayjs } from "dayjs";

import type { Cosecha } from "../../pages/cosechas/cosechas.api";
import type { Lote } from "../../pages/lotes/lotes.api";

import esES from "antd/es/date-picker/locale/es_ES";

const { Text } = Typography;

export type ProcesoLoteFormValue = {
    loteId: number;
    kilosUsados: number;
};

export type ProcesoFormValues = {
    fecha: Dayjs;

    fechaInicio: Dayjs;

    duracionHoras: number;

    lotes: ProcesoLoteFormValue[];
    cosechaId?: number | null;

    inicioOxidacion?: Dayjs | null;
    finOxidacion?: Dayjs | null;
    tanqueOxidacion?: string | null;

    kilosIngresados: number;

    // Proceso húmedo / fermentación
    fueDespulpado?: boolean;
    tanqueFermentacion?: string | null;

    inicioFermentacion?: Dayjs | null;
    finFermentacion?: Dayjs | null;

    nivelPh?: number | null;
    tempMaxima?: number | null;
    tempMinima?: number | null;

    fueLavado?: boolean;
};

type CrearProcesoModalProps = {
    open: boolean;

    cosechas: Cosecha[];
    lotes: Lote[];

    loading?: boolean;
    saving?: boolean;

    onClose: () => void;

    onSubmit: (
        values: ProcesoFormValues,
    ) => Promise<void> | void;
};


/**
 * Calcula la duración exacta entre dos fechas
 * expresada en horas decimales.
 *
 * Ejemplo:
 * 50 horas y 56 minutos -> 50.93 horas.
 */
function calcularDuracionHoras(
    inicio?: Dayjs | null,
    fin?: Dayjs | null,
): number | undefined {
    if (!inicio || !fin) {
        return undefined;
    }

    const diferenciaMs =
        fin.valueOf() - inicio.valueOf();

    if (diferenciaMs <= 0) {
        return undefined;
    }

    const horas =
        diferenciaMs /
        (1000 * 60 * 60);

    return Number(
        horas.toFixed(2),
    );
}

export default function CrearProcesoModal({
    open,
    cosechas: _cosechas,
    lotes,

    loading = false,
    saving = false,

    onClose,
    onSubmit,
}: CrearProcesoModalProps) {
    const [form] =
        Form.useForm<ProcesoFormValues>();

    const [errorLotes, setErrorLotes] = useState<string | null>(null);

    const lotesObservados = Form.useWatch(
        "lotes",
        {
            form,
            preserve: true,
        },
    ) as ProcesoLoteFormValue[] | undefined;

    const lotesSeleccionados = lotesObservados ?? [];

    const totalKilosIngresados = useMemo(() => {
        return lotesSeleccionados.reduce(
            (total, item) =>
                total + Number(item.kilosUsados || 0),
            0,
        );
    }, [lotesSeleccionados]);

    const lotesDisponibles = useMemo(() => {
        return (lotes ?? []).filter(
            (lote) => lote.activo,
        );
    }, [lotes]);

    const loteOptions = useMemo(() => {
        return lotesDisponibles.map(
            (lote) => ({
                value: lote.id,

                label: `${lote.codigo}${lote.nombre
                    ? ` - ${lote.nombre}`
                    : ""
                    } · ${(lote.kilosActuales ?? lote.kilosIniciales ?? 0).toLocaleString("es-CL")} kg disp.${lote.createdAt ? ` · Lote creado: ${dayjs(lote.createdAt).format("DD/MM/YYYY")}` : ""}`,
            }),
        );
    }, [lotesDisponibles]);


    /**
     * Actualiza duracionHoras en el formulario.
     */
    function actualizarDuracion(
        inicio?: Dayjs | null,
        fin?: Dayjs | null,
    ) {
        const duracion =
            calcularDuracionHoras(
                inicio,
                fin,
            );

        form.setFieldValue(
            "duracionHoras",
            duracion,
        );
    }

    function handleInicioFermentacionChange(
        value: Dayjs | null,
    ) {
        const inicio = value
            ? value.second(0).millisecond(0)
            : null;

        form.setFieldValue(
            "inicioFermentacion",
            inicio,
        );

        const fin =
            form.getFieldValue(
                "finFermentacion",
            );

        actualizarDuracion(
            inicio,
            fin,
        );

        if (fin) {
            void form.validateFields([
                "finFermentacion",
            ]);
        }
    }

    function handleFinFermentacionChange(
        value: Dayjs | null,
    ) {
        const fin = value
            ? value.second(0).millisecond(0)
            : null;

        form.setFieldValue(
            "finFermentacion",
            fin,
        );

        const inicio =
            form.getFieldValue(
                "inicioFermentacion",
            );

        actualizarDuracion(
            inicio,
            fin,
        );

        if (inicio && fin) {
            void form.validateFields([
                "finFermentacion",
            ]);
        }
    }

    function handleFechaChange(
        _value: Dayjs | null,
    ) {
        form.resetFields([
            "lotes",
            "cosechaId",
            "kilosIngresados",
        ]);

    }


    const handleFinish = async (
        values: ProcesoFormValues,
    ) => {
        const valoresActuales =
            form.getFieldsValue(true) as ProcesoFormValues;

        const distribucion =
            valoresActuales.lotes ?? values.lotes ?? [];

        if (distribucion.length === 0) {
            setErrorLotes(
                "Seleccione al menos un lote de origen",
            );
            return;
        }

        const ids = new Set<number>();

        for (const item of distribucion) {
            if (
                !Number.isSafeInteger(item.loteId) ||
                item.loteId <= 0 ||
                ids.has(item.loteId)
            ) {
                setErrorLotes(
                    "La selección contiene lotes inválidos o duplicados",
                );
                return;
            }

            ids.add(item.loteId);

            const cantidad = Number(item.kilosUsados);

            if (
                !Number.isFinite(cantidad) ||
                cantidad <= 0
            ) {
                setErrorLotes(
                    "Debe asignar una cantidad mayor que cero a cada lote",
                );
                return;
            }

            const lote = lotesDisponibles.find(
                (actual) => actual.id === item.loteId,
            );

            if (!lote) {
                setErrorLotes(
                    "Uno de los lotes seleccionados ya no está disponible",
                );
                return;
            }

            const disponible =
                lote.kilosActuales ??
                lote.kilosIniciales;

            if (
                disponible != null &&
                cantidad > disponible
            ) {
                setErrorLotes(
                    `El lote ${lote.codigo} no dispone de suficientes kilos`,
                );
                return;
            }
        }

        const total = Number(
            distribucion.reduce(
                (suma, item) =>
                    suma + Number(item.kilosUsados),
                0,
            ).toFixed(2),
        );

        if (
            !Number.isFinite(total) ||
            total <= 0
        ) {
            setErrorLotes(
                "El total de kilos ingresados debe ser mayor que cero",
            );
            return;
        }


        const duracionCalculada =
            calcularDuracionHoras(
                values.inicioFermentacion,
                values.finFermentacion,
            );


        await onSubmit({
            ...values,
            lotes: distribucion,
            kilosIngresados: total,
            duracionHoras: duracionCalculada ?? 0,
        });

        form.resetFields();
        setErrorLotes(null);
    };


    const handleCancel = () => {
        form.resetFields();

        onClose();
    };

    return (
        <Modal
            title="Registrar Proceso Húmedo"
            open={open}
            onCancel={handleCancel}
            footer={null}
            destroyOnHidden
            centered
            width="min(900px, 96vw)"
            styles={{
                body: {
                    maxHeight: "75vh",
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
                initialValues={{
                    fueDespulpado: false,
                    fueLavado: false,
                }}
            >
                {/* ── SECCIÓN: Datos generales ── */}
                <Divider titlePlacement="left" orientationMargin={0}>
                    <Text strong style={{ fontSize: 13 }}>Datos generales</Text>
                </Divider>

                <Row gutter={[16, 0]}>
                    <Col
                        xs={24}
                        md={12}
                    >
                        <Form.Item
                            label="Fecha del proceso"
                            name="fecha"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "La fecha es obligatoria",
                                },
                            ]}
                        >
                            <DatePicker
                                style={{
                                    width: "100%",
                                }}
                                locale={esES}
                                format="DD/MM/YYYY"
                                placeholder="Seleccione una fecha"
                                onChange={
                                    handleFechaChange
                                }
                            />
                        </Form.Item>
                    </Col>


                    {/* ============================================
    LOTES DE ORIGEN - SELECCIÓN MÚLTIPLE
============================================ */}

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Lotes de origen"
                            required
                            validateStatus={errorLotes ? "error" : undefined}
                            help={errorLotes}
                            tooltip="Al seleccionar un lote se cargan sus kilos disponibles. Puedes ajustar cuánto aporta cada lote."
                        >
                            <Select<number[]>
                                mode="multiple"
                                placeholder="Seleccione uno o varios lotes"
                                showSearch
                                optionFilterProp="label"
                                allowClear
                                loading={loading}
                                disabled={
                                    loading ||
                                    lotesDisponibles.length === 0
                                }
                                options={loteOptions}
                                value={lotesSeleccionados.map(
                                    (item) => item.loteId,
                                )}
                                onChange={(ids) => {
                                    const actuales =
                                        form.getFieldValue("lotes") as
                                        ProcesoLoteFormValue[] | undefined;

                                    const nuevos: ProcesoLoteFormValue[] =
                                        ids.map((id) => {
                                            const existente = actuales?.find(
                                                (item) => item.loteId === id,
                                            );

                                            if (existente) return existente;

                                            const lote = lotesDisponibles.find(
                                                (item) => item.id === id,
                                            );
                                            return {
                                                loteId: id,
                                                kilosUsados:
                                                    lote?.kilosActuales ?? lote?.kilosIniciales ?? 0,
                                            };
                                        });

                                    form.setFieldsValue({
                                        lotes: nuevos,
                                    });

                                    setErrorLotes(null);
                                }}
                            />
                        </Form.Item>
                    </Col>

                    {/* ============================================
    DISTRIBUCIÓN DE KILOS POR LOTE
============================================ */}


                    <Col xs={24}>
                        <Form.List name="lotes">
                            {(fields) => (
                                <Space
                                    direction="vertical"
                                    size="middle"
                                    style={{ width: "100%" }}
                                >
                                    {fields.map((field) => {
                                        const loteId =
                                            lotesSeleccionados[field.name]?.loteId;

                                        const lote = lotes.find(
                                            (item) => item.id === loteId,
                                        );

                                        const disponible =
                                            lote?.kilosActuales ??
                                            lote?.kilosIniciales ??
                                            null;

                                        return (
                                            <div key={field.key}>
                                                {/* Registrar loteId en el formulario */}
                                                <Form.Item
                                                    name={[field.name, "loteId"]}
                                                    hidden
                                                >
                                                    <InputNumber />
                                                </Form.Item>

                                                <Row
                                                    gutter={[16, 8]}
                                                    align="middle"
                                                >
                                                    <Col xs={24} sm={14}>
                                                        <Typography.Text strong>
                                                            {lote?.codigo ??
                                                                `Lote #${loteId ?? "?"}`}
                                                        </Typography.Text>

                                                        <div>
                                                            <Typography.Text
                                                                type="secondary"
                                                            >
                                                                {disponible !== null
                                                                    ? `Disponible: ${Number(
                                                                        disponible,
                                                                    ).toLocaleString("es-CL")} kg`
                                                                    : "Disponibilidad no registrada"}
                                                            </Typography.Text>
                                                        </div>
                                                    </Col>

                                                    <Col xs={24} sm={10}>
                                                        <Form.Item
                                                            name={[
                                                                field.name,
                                                                "kilosUsados",
                                                            ]}
                                                            label="Kilos a ingresar"
                                                            rules={[
                                                                {
                                                                    required: true,
                                                                    message:
                                                                        "Ingrese los kilos",
                                                                },
                                                                {
                                                                    validator: async (
                                                                        _,
                                                                        value,
                                                                    ) => {
                                                                        if (
                                                                            value === undefined ||
                                                                            value === null
                                                                        ) {
                                                                            return;
                                                                        }

                                                                        const cantidad =
                                                                            Number(value);

                                                                        if (
                                                                            !Number.isFinite(cantidad) ||
                                                                            cantidad <= 0
                                                                        ) {
                                                                            throw new Error(
                                                                                "Debe ingresar más de 0 kg",
                                                                            );
                                                                        }

                                                                        if (
                                                                            disponible !== null &&
                                                                            cantidad > disponible
                                                                        ) {
                                                                            throw new Error(
                                                                                `El máximo disponible es ${disponible} kg`,
                                                                            );
                                                                        }
                                                                    },
                                                                },
                                                            ]}
                                                        >
                                                            <InputNumber
                                                                min={0.01}
                                                                precision={2} decimalSeparator=","
                                                                addonAfter="kg"
                                                                placeholder="Ej: 100"
                                                                style={{
                                                                    width: "100%",
                                                                }}
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                            </div>
                                        );
                                    })}
                                </Space>
                            )}
                        </Form.List>
                    </Col>


                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Kilos ingresados"
                            tooltip="Suma de los kilos aportados por los lotes seleccionados"
                        >
                            <InputNumber
                                value={Number(
                                    totalKilosIngresados.toFixed(2),
                                )}
                                readOnly
                                controls={false}
                                addonAfter="kg"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                    </Col>

                </Row>

                <CamposOxidacion />
                {/* ── SECCIÓN: Fermentación ── */}
                <Divider titlePlacement="left" orientationMargin={0}>
                    <Text strong style={{ fontSize: 13 }}>Fermentación</Text>
                </Divider>

                <Row gutter={[16, 0]}>
                    <Col
                        xs={24}
                        md={12}
                    >
                        <Form.Item
                            label="Inicio de fermentación"
                            name="inicioFermentacion"
                            rules={[
                            ]}
                        >
                            <DatePicker
                                style={{
                                    width: "100%",
                                }}
                                locale={esES}
                                showTime={{
                                    format: "HH:mm",
                                }}
                                format="DD/MM/YYYY HH:mm"
                                placeholder="Fecha y hora de inicio"
                                onChange={
                                    handleInicioFermentacionChange
                                }
                            />
                        </Form.Item>
                    </Col>

                    <Col
                        xs={24}
                        md={12}
                    >
                        <Form.Item
                            label="Fin de fermentación"
                            name="finFermentacion"
                            dependencies={[
                                "inicioFermentacion",
                            ]}
                            rules={[
                                {
                                    validator: async (
                                        _,
                                        value,
                                    ) => {
                                        if (!value) {
                                            return;
                                        }

                                        const inicio =
                                            form.getFieldValue(
                                                "inicioFermentacion",
                                            );

                                        if (!inicio) {
                                            return;
                                        }

                                        if (
                                            value.isSame(
                                                inicio,
                                            ) ||
                                            value.isBefore(
                                                inicio,
                                            )
                                        ) {
                                            throw new Error(
                                                "El fin de fermentación debe ser posterior al inicio",
                                            );
                                        }
                                    },
                                },
                            ]}
                        >
                            <DatePicker
                                style={{
                                    width: "100%",
                                }}
                                locale={esES}
                                showTime={{
                                    format: "HH:mm",
                                }}
                                format="DD/MM/YYYY HH:mm"
                                placeholder="Fecha y hora de fin"
                                onChange={
                                    handleFinFermentacionChange
                                }
                            />
                        </Form.Item>
                    </Col>

                    <Col
                        xs={24}
                        md={12}
                    >
                        <Form.Item
                            label="Duración de fermentación"
                            name="duracionHoras"
                            getValueProps={(horas?: number) => ({
                                value: formatearDuracionHoras(horas) ?? "—",
                            })}
                            rules={[
                                {
                                    type: "number",
                                    min: 0.01,
                                    message:
                                        "La duración debe ser mayor que cero",
                                },
                            ]}
                        >
                            <Input readOnly />
                        </Form.Item>
                    </Col>

                    <Col
                        xs={24}
                        md={12}
                    >
                        <Form.Item
                            label="Posa / Tanque de fermentación"
                            name="tanqueFermentacion"
                        >
                            <Input
                                placeholder="Ej: Tanque A, Posa 3"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* ── SECCIÓN: Temperaturas y pH ── */}
                <Divider titlePlacement="left" orientationMargin={0}>
                    <Text strong style={{ fontSize: 13 }}>Temperaturas y pH</Text>
                </Divider>

                <Row gutter={[16, 0]}>
                    <Col
                        xs={24}
                        md={8}
                    >
                        <Form.Item
                            label="Temperatura máxima"
                            name="tempMaxima"
                        >
                            <InputNumber
                                style={{
                                    width: "100%",
                                }}
                                precision={1} decimalSeparator=","
                                addonAfter="°C"
                                placeholder="Ej: 28.5"
                            />
                        </Form.Item>
                    </Col>

                    <Col
                        xs={24}
                        md={8}
                    >
                        <Form.Item
                            label="Temperatura mínima"
                            name="tempMinima"
                        >
                            <InputNumber
                                style={{
                                    width: "100%",
                                }}
                                precision={1} decimalSeparator=","
                                addonAfter="°C"
                                placeholder="Ej: 18.0"
                            />
                        </Form.Item>
                    </Col>

                    <Col
                        xs={24}
                        md={8}
                    >
                        <Form.Item
                            label="pH de salida"
                            name="nivelPh"
                        >
                            <InputNumber
                                style={{
                                    width: "100%",
                                }}
                                min={0}
                                max={14}
                                step={0.1}
                                precision={1} decimalSeparator=","
                                placeholder="Ej: 3.8"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* ── SECCIÓN: Procesos aplicados ── */}
                <Divider titlePlacement="left" orientationMargin={0}>
                    <Text strong style={{ fontSize: 13 }}>Procesos aplicados</Text>
                </Divider>

                <Row gutter={[16, 0]}>
                    <Col
                        xs={24}
                        md={12}
                    >
                        <Form.Item
                            label="¿Se despulpó?"
                            name="fueDespulpado"
                            valuePropName="checked"
                        >
                            <Switch
                                checkedChildren="Sí"
                                unCheckedChildren="No"
                            />
                        </Form.Item>
                    </Col>

                    <Col
                        xs={24}
                        md={12}
                    >
                        <Form.Item
                            label="¿Se lavó?"
                            name="fueLavado"
                            valuePropName="checked"
                        >
                            <Switch
                                checkedChildren="Sí"
                                unCheckedChildren="No"
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
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={saving}
                        >
                            Guardar
                        </Button>

                        <Button
                            onClick={handleCancel}
                        >
                            Cancelar
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
}