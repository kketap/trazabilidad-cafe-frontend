import CamposOxidacion from "./CamposOxidacion";
import { formatearDuracionHoras } from "../../utils/formatearDuracion";
// src/components/trazabilidad-modals/EditarProcesoModal.tsx

import {
    useEffect,
    useMemo,
} from "react";

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
    Switch,
    Typography,
    theme,
    Space
} from "antd";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import type { Dayjs } from "dayjs";

dayjs.extend(utc);

import type { Cosecha } from "../../pages/cosechas/cosechas.api";
import type { Lote } from "../../pages/lotes/lotes.api";
import type { ProcesoTrazabilidad } from "../../pages/trazabilidad/trazabilidad.api";
import type { ProcesoFormValues, ProcesoLoteFormValue } from "./CrearProcesoModal";

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
    cosechas: _cosechas,
    lotes,

    saving = false,

    onClose,
    onSubmit,
}: EditarProcesoModalProps) {
    const [form] =
        Form.useForm<ProcesoFormValues>();

    const { token } =
        theme.useToken();

    const lotesObservados = Form.useWatch(
        "lotes",
        {
            form,
            preserve: true,
        },
    ) as ProcesoLoteFormValue[] | undefined;

    const lotesSeleccionados =
        lotesObservados ?? [];

    const lotesDisponibles = useMemo(() => {
        const idsActuales = new Set(
            proceso?.procesoLotes?.map(
                (item) => item.loteId,
            ) ?? [],
        );

        return (lotes ?? []).filter(
            (lote) =>
                lote.activo ||
                idsActuales.has(lote.id) ||
                lote.id === proceso?.loteId,
        );
    }, [lotes, proceso]);

    const loteOptions = useMemo(() => {
        return lotesDisponibles.map(
            (lote) => ({
                value: lote.id,

                label: `${lote.codigo}${lote.nombre
                    ? ` - ${lote.nombre}`
                    : ""
                    }${!lote.activo ? " (Inactivo)" : ""} · ${(lote.kilosActuales ?? lote.kilosIniciales ?? 0).toLocaleString("es-CL")} kg disp.${lote.createdAt ? ` · Lote creado: ${dayjs(lote.createdAt).format("DD/MM/YYYY")}` : ""}`,

                disabled: !lote.activo &&
                    !proceso?.procesoLotes?.some(
                        (item) => item.loteId === lote.id,
                    ) &&
                    lote.id !== proceso?.loteId,
            }),
        );
    }, [lotesDisponibles, proceso]);

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

            const lotesActuales: ProcesoLoteFormValue[] =
                proceso.procesoLotes?.length
                    ? proceso.procesoLotes.map(
                        (item) => ({
                            loteId: item.loteId,
                            kilosUsados: item.kilosUsados,
                        }),
                    )
                    : proceso.loteId != null
                        ? [{
                            loteId: proceso.loteId,
                            kilosUsados: proceso.kilosIngresados,
                        }]
                        : [];

            form.setFieldsValue({
                inicioOxidacion: proceso.inicioOxidacion ? dayjs(proceso.inicioOxidacion) : null,
                finOxidacion: proceso.finOxidacion ? dayjs(proceso.finOxidacion) : null,
                tanqueOxidacion: proceso.tanqueOxidacion ?? null,
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

                lotes: lotesActuales,

                cosechaId:
                    proceso.cosechaId ??
                    null,

                kilosIngresados:
                    proceso.kilosIngresados,

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

        }

        if (!open) {
            form.resetFields();
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
            "lotes",
            "cosechaId",
            "kilosIngresados",
        ]);
    }

    const totalKilosIngresados = useMemo(() => {
        return Number(
            lotesSeleccionados.reduce(
                (total, item) =>
                    total + Number(item.kilosUsados || 0),
                0,
            ).toFixed(2),
        );
    }, [lotesSeleccionados]);

    const handleFinish = async (
        values: ProcesoFormValues,
    ) => {
        if (!proceso) {
            return;
        }

        const lotesSeleccionados = form.getFieldValue("lotes") as ProcesoLoteFormValue[] | undefined;

        if (!lotesSeleccionados?.length) {
            form.setFields([
                {
                    name: "lotes",
                    errors: [
                        "Seleccione al menos un lote de origen",
                    ],
                },
            ]);
            return;
        }

        const total = lotesSeleccionados.reduce(
            (suma, item) =>
                suma + Number(item.kilosUsados),
            0,
        );

        const duracionCalculada =
            calcularDuracionHoras(
                values.inicioFermentacion,
                values.finFermentacion,
            );

        if (
            !Number.isFinite(total) ||
            total <= 0
        ) {
            return;
        }

        const valuesFinales: ProcesoFormValues = {
            ...values,

            lotes: lotesSeleccionados,

            kilosIngresados:
                Number(total.toFixed(2)),

            duracionHoras: duracionCalculada ?? 0,
        };

        await onSubmit(
            proceso.id,
            valuesFinales,
        );
    };

    const handleCancel = () => {
        form.resetFields();

        onClose();
    };

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


                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Lotes de origen"
                            required
                            tooltip="Puede agregar, quitar o modificar los lotes relacionados con este proceso húmedo."
                        >
                            <Select
                                mode="multiple"
                                aria-label="Lotes de origen"
                                placeholder="Seleccione los lotes"
                                showSearch
                                optionFilterProp="label"
                                allowClear
                                options={loteOptions}
                                value={lotesSeleccionados.map(
                                    (item) => item.loteId,
                                )}
                                onChange={(ids: number[]) => {
                                    const actuales =
                                        form.getFieldValue("lotes") as
                                        ProcesoLoteFormValue[] | undefined;

                                    const nuevos = ids.map((id) => {
                                        const existente = actuales?.find(
                                            (item) => item.loteId === id,
                                        );

                                        if (existente) return existente;

                                        const lote = lotesDisponibles.find((item) => item.id === id);
                                        return {
                                            loteId: id,
                                            kilosUsados: lote?.kilosActuales ?? lote?.kilosIniciales ?? 0,
                                        };
                                    });

                                    form.setFieldValue("lotes", nuevos);
                                }}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24}>
                        <Form.List name="lotes">
                            {(fields) => (
                                <Space
                                    direction="vertical"
                                    size="middle"
                                    style={{ width: "100%" }}
                                >
                                    {fields.map((field) => {
                                        const item =
                                            lotesSeleccionados[field.name];

                                        const lote = lotesDisponibles.find(
                                            (actual) =>
                                                actual.id === item?.loteId,
                                        );

                                        const disponible =
                                            lote?.kilosActuales ??
                                            lote?.kilosIniciales;

                                        return (
                                            <div key={field.key}>
                                                {/* ID del lote asociado */}
                                                <Form.Item
                                                    name={[field.name, "loteId"]}
                                                    hidden
                                                >
                                                    <InputNumber />
                                                </Form.Item>

                                                <Row
                                                    gutter={[12, 8]}
                                                    align="middle"
                                                >
                                                    <Col xs={24} sm={14}>
                                                        <Typography.Text strong>
                                                            {lote?.codigo ?? `Lote #${item?.loteId ?? "?"}`}
                                                        </Typography.Text>

                                                        <div>
                                                            <Typography.Text type="secondary">
                                                                {disponible != null
                                                                    ? `Disponible: ${Number(
                                                                        disponible,
                                                                    ).toLocaleString("es-CL")} kg`
                                                                    : "Disponibilidad sin registrar"}
                                                            </Typography.Text>
                                                        </div>
                                                    </Col>

                                                    <Col xs={24} sm={10}>
                                                        <Form.Item
                                                            name={[
                                                                field.name,
                                                                "kilosUsados",
                                                            ]}
                                                            label="Kilos aportados"
                                                            rules={[
                                                                {
                                                                    required: true,
                                                                    message: "Ingrese los kilos",
                                                                },
                                                                {
                                                                    validator: async (_, value) => {
                                                                        if (value == null) return;

                                                                        const cantidad = Number(value);

                                                                        if (
                                                                            !Number.isFinite(cantidad) ||
                                                                            cantidad <= 0
                                                                        ) {
                                                                            throw new Error(
                                                                                "Debe ingresar más de 0 kg",
                                                                            );
                                                                        }

                                                                        if (
                                                                            disponible != null &&
                                                                            cantidad > Number(disponible)
                                                                        ) {
                                                                            throw new Error(
                                                                                `Máximo disponible: ${disponible} kg`,
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
                                                                style={{ width: "100%" }}
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
                            label="Total de kilos ingresados"
                            htmlFor="editar-proceso-kilos-ingresados"
                            tooltip="Suma de los aportes. Para cambiar el total, ajusta los kilos aportados de cada lote."
                        >
                            <InputNumber
                                id="editar-proceso-kilos-ingresados"
                                value={totalKilosIngresados}
                                readOnly
                                controls={false}
                                precision={2}
                                decimalSeparator=","
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