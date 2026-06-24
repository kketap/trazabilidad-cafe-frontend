import { useEffect, useState } from "react";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    InputNumber,
    message,
    Modal,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Typography,
} from "antd";
import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";

import { getCosechas, type Cosecha } from "../cosechas/cosechas.api";
import {
    createProcesoTrazabilidad,
    getProcesosTrazabilidad,
    type CreateProcesoTrazabilidadDto,
    type ProcesoTrazabilidad,
} from "./trazabilidad.api";

type ProcesoFormValues = {
    fecha: Dayjs;
    cosechaId: number;
    etapa: string;
    kilosIngresados: number;
    kilosResultantes: number;
    porcentajeMerma: number;
};

export default function TrazabilidadPage() {
    const [procesos, setProcesos] = useState<ProcesoTrazabilidad[]>([]);
    const [cosechas, setCosechas] = useState<Cosecha[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm<ProcesoFormValues>();

    useEffect(() => {
        cargarDatos();
    }, []);

    async function cargarDatos() {
        try {
            setLoading(true);

            const [procesosData, cosechasData] = await Promise.all([
                getProcesosTrazabilidad(),
                getCosechas(),
            ]);

            setProcesos(procesosData);
            setCosechas(cosechasData);
        } catch (error) {
            console.error("Error cargando trazabilidad:", error);
            message.error("No se pudieron cargar los datos de trazabilidad.");
        } finally {
            setLoading(false);
        }
    }

    function handleRegister() {
        setIsModalOpen(true);
    }

    function handleCancel() {
        setIsModalOpen(false);
        form.resetFields();
    }

    function handleValuesChange(changedValues: Partial<ProcesoFormValues>) {
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
    }

    async function onFinish(values: ProcesoFormValues) {
        try {
            setSaving(true);

            const payload: CreateProcesoTrazabilidadDto = {
                fecha: values.fecha.format("YYYY-MM-DD"),
                cosechaId: values.cosechaId,
                etapa: values.etapa,
                kilosIngresados: values.kilosIngresados,
                kilosResultantes: values.kilosResultantes,
            };

            const nuevoProceso = await createProcesoTrazabilidad(payload);

            setProcesos((currentProcesos) => [nuevoProceso, ...currentProcesos]);
            message.success("Proceso registrado correctamente.");

            setIsModalOpen(false);
            form.resetFields();
        } catch (error) {
            console.error("Error registrando proceso:", error);
            message.error("No se pudo registrar el proceso.");
        } finally {
            setSaving(false);
        }
    }

    function handleView(proceso: ProcesoTrazabilidad) {
        console.log("Ver proceso:", proceso);
    }

    const mermaPromedio =
        procesos.length > 0
            ? procesos.reduce(
                (total, proceso) => total + proceso.porcentajeMerma,
                0,
            ) / procesos.length
            : 0;

    const totalIngresado = procesos.reduce(
        (total, proceso) => total + proceso.kilosIngresados,
        0,
    );

    const totalResultante = procesos.reduce(
        (total, proceso) => total + proceso.kilosResultantes,
        0,
    );

    const columns: ColumnsType<ProcesoTrazabilidad> = [
        {
            title: "Fecha",
            dataIndex: "fecha",
            key: "fecha",
            render: (fecha: string) => fecha.slice(0, 10),
        },
        {
            title: "Lote Origen",
            key: "loteOrigen",
            render: (_, record) =>
                record.cosecha?.lotes ?? `Cosecha #${record.cosechaId}`,
        },
        {
            title: "Etapa",
            dataIndex: "etapa",
            key: "etapa",
        },
        {
            title: "Kilos Ingresados",
            dataIndex: "kilosIngresados",
            key: "kilosIngresados",
            render: (kilosIngresados: number) =>
                kilosIngresados.toLocaleString("es-CL"),
        },
        {
            title: "Kilos Resultantes",
            dataIndex: "kilosResultantes",
            key: "kilosResultantes",
            render: (kilosResultantes: number) =>
                kilosResultantes.toLocaleString("es-CL"),
        },
        {
            title: "% Merma",
            dataIndex: "porcentajeMerma",
            key: "porcentajeMerma",
            render: (porcentajeMerma: number) =>
                `${porcentajeMerma.toLocaleString("es-CL", {
                    maximumFractionDigits: 2,
                })}%`,
        },
        {
            title: "Acciones",
            key: "acciones",
            render: (_, record) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => handleView(record)}
                />
            ),
        },
    ];

    const cosechaOptions = cosechas.map((cosecha) => ({
        value: cosecha.id,
        label: `${cosecha.lotes} - ${cosecha.fecha.slice(0, 10)} - ${cosecha.kilosCosechados.toLocaleString("es-CL")} kg`,
    }));

    return (
        <div>
            <Space orientation="vertical" size="large" style={{ width: "100%" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 16,
                    }}
                >
                    <Typography.Title level={2} style={{ margin: 0 }}>
                        Control de Trazabilidad
                    </Typography.Title>

                    <Button type="primary" icon={<PlusOutlined />} onClick={handleRegister}>
                        Registrar Proceso
                    </Button>
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                        <Card hoverable>
                            <Statistic
                                title="Merma Promedio"
                                value={mermaPromedio}
                                suffix="%"
                                precision={2}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} md={8}>
                        <Card hoverable>
                            <Statistic
                                title="Total Ingresado (Kg)"
                                value={totalIngresado}
                                suffix="kg"
                                formatter={(value) => Number(value).toLocaleString("es-CL")}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} md={8}>
                        <Card hoverable>
                            <Statistic
                                title="Total Resultante (Kg)"
                                value={totalResultante}
                                suffix="kg"
                                formatter={(value) => Number(value).toLocaleString("es-CL")}
                            />
                        </Card>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={procesos}
                    rowKey="id"
                    bordered
                    loading={loading}
                    pagination={false}
                />
            </Space>

            <Modal
                title="Registrar Proceso"
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
                destroyOnHidden
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
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
                        rules={[
                            { required: true, message: "El lote origen es obligatorio" },
                        ]}
                    >
                        <Select
                            placeholder="Seleccione una cosecha"
                            options={cosechaOptions}
                            showSearch
                            optionFilterProp="label"
                            disabled={cosechas.length === 0}
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
        </div>
    );
}