// src/components/trazabilidad-modals/EditarProcesoModal.tsx

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Alert,
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
    Switch,
    Typography,
    theme,
} from "antd";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import type { Dayjs } from "dayjs";

dayjs.extend(utc);

import type { Cosecha } from "../../pages/cosechas/cosechas.api";
import type { Lote } from "../../pages/lotes/lotes.api";
import type { ProcesoTrazabilidad } from "../../pages/trazabilidad/trazabilidad.api";
import type { ProcesoFormValues } from "./CrearProcesoModal";

import esES from "antd/es/date-picker/locale/es_ES";

const { Text } = Typography;

type EditarProcesoModalProps = {
    open: boolean;

    proceso:
    | ProcesoTrazabilidad
    | null;

    cosechas: Cosecha[];

    lotes: Lote[];

    saving?: boolean;

    onClose: () => void;

    onSubmit: (
        id: number,
        values: ProcesoFormValues,
    ) => Promise<void> | void;
};

const ETAPA_OPTIONS = [
    {
        value: "Despulpado",
        label: "Despulpado",
    },
    {
        value: "Lavado",
        label: "Lavado",
    },
    {
        value: "Secado",
        label: "Secado",
    },
    {
        value: "Trilla",
        label: "Trilla",
    },
    {
        value: "Clasificación",
        label: "Clasificación",
    },
];

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

export default function EditarProcesoModal({
    open,
    proceso,
    cosechas,
    lotes,

    saving = false,

    onClose,
    onSubmit,
}: EditarProcesoModalProps) {
    const [form] =
        Form.useForm<ProcesoFormValues>();

    const { token } =
        theme.useToken();

    const [
        loteSeleccionadoId,
        setLoteSeleccionadoId,
    ] = useState<number | null>(null);

    const lotesDisponibles = useMemo(() => {
        return (lotes ?? []).filter(
            (lote) => {
                const esLoteActual =
                    lote.id === proceso?.loteId;

                return (
                    lote.activo ||
                    esLoteActual
                );
            },
        );
    }, [
        lotes,
        proceso?.loteId,
    ]);

    const loteSeleccionado =
        useMemo(() => {
            return (
                lotesDisponibles.find(
                    (lote) =>
                        lote.id ===
                        loteSeleccionadoId,
                ) ?? null
            );
        }, [
            lotesDisponibles,
            loteSeleccionadoId,
        ]);

    const loteOptions = useMemo(() => {
        return lotesDisponibles.map(
            (lote) => ({
                value: lote.id,

                label: `${lote.codigo}${lote.nombre
                    ? ` - ${lote.nombre}`
                    : ""
                    }`,
            }),
        );
    }, [lotesDisponibles]);

    const cosechaOptions = useMemo(() => {
        return (cosechas ?? []).map(
            (cosecha) => ({
                value: cosecha.id,

                label:
                    `COS-${String(
                        cosecha.id,
                    ).padStart(3, "0")}` +
                    ` | Lote: ${cosecha.lotes || "N/A"
                    }` +
                    ` | ${cosecha.fecha
                        ? String(
                            cosecha.fecha,
                        ).slice(0, 10)
                        : ""
                    }` +
                    ` | ${(
                        cosecha.kilosCosechados ?? 0
                    ).toLocaleString(
                        "es-CL",
                    )} kg`,
            }),
        );
    }, [cosechas]);

    useEffect(() => {
        if (open && proceso) {
            const inicio =
                proceso.inicioFermentacion
                    ? dayjs(proceso.inicioFermentacion)
                        .second(0)
                        .millisecond(0)
                    : undefined;

            const fin =
                proceso.finFermentacion
                    ? dayjs(proceso.finFermentacion)
                        .second(0)
                        .millisecond(0)
                    : undefined;

            const duracionCalculada =
                calcularDuracionHoras(
                    inicio,
                    fin,
                );

            form.setFieldsValue({
                fecha:
                    dayjs.utc(proceso.fecha),

                inicioFermentacion:
                    inicio,

                finFermentacion:
                    fin,

                /*
                 * Siempre priorizamos el cálculo
                 * obtenido desde las fechas.
                 *
                 * El valor guardado en BD queda como
                 * fallback para registros históricos
                 * que todavía no tengan ambas fechas.
                 */
                duracionHoras:
                    duracionCalculada ??
                    proceso.duracionHoras ??
                    undefined,

                loteId:
                    proceso.loteId ?? null,

                cosechaId:
                    proceso.cosechaId ??
                    null,

                etapa:
                    proceso.etapa ??
                    undefined,

                kilosIngresados:
                    proceso.kilosIngresados,

                kilosResultantes:
                    proceso.kilosResultantes ??
                    undefined,

                fueDespulpado:
                    proceso.fueDespulpado ??
                    false,

                tanqueFermentacion:
                    proceso.tanqueFermentacion ??
                    undefined,

                nivelPh:
                    proceso.nivelPh ??
                    undefined,

                tempMaxima:
                    proceso.tempMaxima ??
                    undefined,

                tempMinima:
                    proceso.tempMinima ??
                    undefined,

                fueLavado:
                    proceso.fueLavado ??
                    false,
            });

            setLoteSeleccionadoId(
                proceso.loteId ?? null,
            );
        }

        if (!open) {
            form.resetFields();

            setLoteSeleccionadoId(
                null,
            );
        }
    }, [
        open,
        proceso,
        form,
    ]);

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
            "loteId",
            "cosechaId",
            "kilosIngresados",
            "kilosResultantes",
        ]);

        setLoteSeleccionadoId(null);
    }

    function handleLoteChange(
        value: number | null,
    ) {
        setLoteSeleccionadoId(value);

        form.resetFields([
            "kilosIngresados",
            "kilosResultantes",
        ]);
    }

    const handleFinish = async (
        values: ProcesoFormValues,
    ) => {
        if (!proceso) {
            return;
        }

        const duracionCalculada =
            calcularDuracionHoras(
                values.inicioFermentacion,
                values.finFermentacion,
            );

        if (
            duracionCalculada === undefined
        ) {
            return;
        }

        const valuesFinales: ProcesoFormValues =
        {
            ...values,

            duracionHoras:
                duracionCalculada,
        };

        await onSubmit(
            proceso.id,
            valuesFinales,
        );
    };

    const handleCancel = () => {
        form.resetFields();

        setLoteSeleccionadoId(
            null,
        );

        onClose();
    };

    const kilosDisponibles =
        loteSeleccionado?.kilosActuales ??
        loteSeleccionado?.kilosIniciales;

    return (
        <Modal
            title="Editar Proceso Húmedo"
            open={open}
            onCancel={handleCancel}
            footer={null}
            destroyOnHidden
            centered
            width="min(920px, 96vw)"
            styles={{
                body: {
                    maxHeight: "78vh",
                    overflowY: "auto",
                    overflowX: "hidden",
                    paddingRight: 12,
                    paddingBottom: 8,
                },
            }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                autoComplete="off"
            >
                {/* ── SECCIÓN: Datos generales ── */}

                <Divider
                    orientationMargin={0}
                    style={{
                        margin:
                            "18px 0 16px",
                    }}
                >
                    <Text
                        strong
                        style={{
                            fontSize: 13,
                            color:
                                token.colorTextHeading,
                        }}
                    >
                        Datos generales
                    </Text>
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

                    <Col
                        xs={24}
                        md={12}
                    >
                        <Form.Item
                            label="Lote de origen"
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
                                options={
                                    loteOptions
                                }
                                showSearch
                                optionFilterProp="label"
                                onChange={
                                    handleLoteChange
                                }
                            />
                        </Form.Item>
                    </Col>

                    {loteSeleccionado && (
                        <Col xs={24}>
                            <Alert
                                className="proceso-alert-disponible"
                                type="success"
                                showIcon
                                message={
                                    <span>
                                        Kg disponibles en
                                        lote:{" "}
                                        <strong>
                                            {(
                                                kilosDisponibles ??
                                                0
                                            ).toLocaleString(
                                                "es-CL",
                                            )}{" "}
                                            kg
                                        </strong>
                                    </span>
                                }
                                style={{
                                    marginBottom: 16,
                                }}
                            />
                        </Col>
                    )}

                    <Col
                        xs={24}
                        md={12}
                    >
                        <Form.Item
                            label="Cosecha relacionada"
                            name="cosechaId"
                        >
                            <Select
                                placeholder="Seleccione una cosecha (opcional)"
                                options={
                                    cosechaOptions
                                }
                                showSearch
                                optionFilterProp="label"
                                allowClear
                            />
                        </Form.Item>
                    </Col>

                    <Col
                        xs={24}
                        md={12}
                    >
                        <Form.Item
                            label="Etapa"
                            name="etapa"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Seleccione la etapa",
                                },
                            ]}
                        >
                            <Select
                                placeholder="Seleccione una etapa"
                                options={
                                    ETAPA_OPTIONS
                                }
                            />
                        </Form.Item>
                    </Col>

                    <Col
                        xs={24}
                        md={12}
                    >
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
                                    validator: async (
                                        _,
                                        value,
                                    ) => {
                                        if (
                                            kilosDisponibles !=
                                            null &&
                                            Number(value) >
                                            kilosDisponibles
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
                                style={{
                                    width: "100%",
                                }}
                                min={0.01}
                                max={
                                    kilosDisponibles ??
                                    undefined
                                }
                                precision={2}
                                addonAfter="kg"
                                placeholder="Ej: 180"
                            />
                        </Form.Item>
                    </Col>

                    <Col
                        xs={24}
                        md={12}
                    >
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
                                    validator: async (
                                        _,
                                        value,
                                    ) => {
                                        const kilosIngresados =
                                            form.getFieldValue(
                                                "kilosIngresados",
                                            );

                                        if (
                                            kilosIngresados !=
                                            null &&
                                            Number(value) >
                                            Number(
                                                kilosIngresados,
                                            )
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
                                style={{
                                    width: "100%",
                                }}
                                min={0}
                                precision={2}
                                addonAfter="kg"
                                placeholder="Ej: 150"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* ── SECCIÓN: Fermentación ── */}

                <Divider
                    orientationMargin={0}
                >
                    <Text
                        strong
                        style={{
                            fontSize: 13,
                        }}
                    >
                        Fermentación
                    </Text>
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
                                {
                                    required: true,
                                    message:
                                        "Ingrese la fecha y hora de inicio",
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
                                    required: true,
                                    message:
                                        "Ingrese la fecha y hora de fin",
                                },
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
                            label="Duración del proceso"
                            name="duracionHoras"
                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Seleccione el inicio y fin de fermentación",
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
                                style={{
                                    width: "100%",
                                }}
                                precision={2}
                                addonAfter="horas"
                                readOnly
                                controls={false}
                                placeholder="Se calcula automáticamente"
                            />
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

                <Divider
                    orientationMargin={0}
                >
                    <Text
                        strong
                        style={{
                            fontSize: 13,
                        }}
                    >
                        Temperaturas y pH
                    </Text>
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
                                precision={1}
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
                                precision={1}
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
                                precision={1}
                                placeholder="Ej: 3.8"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {/* ── SECCIÓN: Procesos aplicados ── */}

                <Divider
                    orientationMargin={0}
                >
                    <Text
                        strong
                        style={{
                            fontSize: 13,
                        }}
                    >
                        Procesos aplicados
                    </Text>
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
                        paddingTop: 16,
                        marginTop: 8,

                        borderTop:
                            `1px solid ${token.colorBorderSecondary}`,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent:
                                "flex-end",
                            gap: 8,
                        }}
                    >
                        <Button
                            onClick={handleCancel}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={saving}
                        >
                            Actualizar
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </Modal>
    );
}