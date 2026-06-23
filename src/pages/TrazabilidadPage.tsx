import { Button, Card, Col, DatePicker, Form, InputNumber, Modal, Row, Select, Space, Statistic, Table, Typography } from "antd";
import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import type { Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";

type ProcesoTrazabilidad = {
    id: string;
    fecha: string;
    loteOrigen: string;
    etapa: string;
    kilosIngresados: number;
    kilosResultantes: number;
    porcentajeMerma: number;
};

type ProcesoFormValues = {
    fecha: Dayjs;
    loteOrigen: string;
    etapa: string;
    kilosIngresados: number;
    kilosResultantes: number;
    porcentajeMerma: number;
};

const MOCK_TRAZABILIDAD: ProcesoTrazabilidad[] = [
    {
        id: "1",
        fecha: "2026-06-11",
        loteOrigen: "COSECHA-2026-001",
        etapa: "Secado",
        kilosIngresados: 180,
        kilosResultantes: 145,
        porcentajeMerma: 19.44,
    },
    {
        id: "2",
        fecha: "2026-06-15",
        loteOrigen: "COSECHA-2026-002",
        etapa: "Trilla",
        kilosIngresados: 260,
        kilosResultantes: 208,
        porcentajeMerma: 20,
    },
    {
        id: "3",
        fecha: "2026-06-21",
        loteOrigen: "COSECHA-2026-003",
        etapa: "Clasificación",
        kilosIngresados: 95,
        kilosResultantes: 82,
        porcentajeMerma: 13.68,
    },
];

export default function TrazabilidadPage() {
    const [procesos, setProcesos] = useState<ProcesoTrazabilidad[]>(MOCK_TRAZABILIDAD);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm<ProcesoFormValues>();

    const handleRegister = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        form.resetFields();
    };

    const handleValuesChange = (changedValues: Partial<ProcesoFormValues>) => {
        if ("kilosIngresados" in changedValues || "kilosResultantes" in changedValues) {
            const kilosIngresados = form.getFieldValue("kilosIngresados") ?? 0;
            const kilosResultantes = form.getFieldValue("kilosResultantes") ?? 0;
            const porcentajeMerma = kilosIngresados > 0 ? ((kilosIngresados - kilosResultantes) / kilosIngresados) * 100 : 0;

            form.setFieldsValue({ porcentajeMerma });
        }
    };

    const onFinish = (values: ProcesoFormValues) => {
        const nuevoProceso: ProcesoTrazabilidad = {
            id: Date.now().toString(),
            fecha: values.fecha.format("YYYY-MM-DD"),
            loteOrigen: values.loteOrigen,
            etapa: values.etapa,
            kilosIngresados: values.kilosIngresados,
            kilosResultantes: values.kilosResultantes,
            porcentajeMerma: values.porcentajeMerma,
        };

        setProcesos((currentProcesos) => [...currentProcesos, nuevoProceso]);
        setIsModalOpen(false);
        form.resetFields();
    };

    const handleView = (proceso: ProcesoTrazabilidad) => {
        console.log("Ver proceso:", proceso);
    };

    const mermaPromedio = procesos.length > 0
        ? procesos.reduce((total, proceso) => total + proceso.porcentajeMerma, 0) / procesos.length
        : 0;
    const totalIngresado = procesos.reduce((total, proceso) => total + proceso.kilosIngresados, 0);
    const totalResultante = procesos.reduce((total, proceso) => total + proceso.kilosResultantes, 0);

    const columns: ColumnsType<ProcesoTrazabilidad> = [
        {
            title: "Fecha",
            dataIndex: "fecha",
            key: "fecha",
        },
        {
            title: "Lote Origen",
            dataIndex: "loteOrigen",
            key: "loteOrigen",
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
            render: (kilosIngresados: number) => kilosIngresados.toLocaleString("es-CL"),
        },
        {
            title: "Kilos Resultantes",
            dataIndex: "kilosResultantes",
            key: "kilosResultantes",
            render: (kilosResultantes: number) => kilosResultantes.toLocaleString("es-CL"),
        },
        {
            title: "% Merma",
            dataIndex: "porcentajeMerma",
            key: "porcentajeMerma",
            render: (porcentajeMerma: number) => `${porcentajeMerma.toLocaleString("es-CL")}%`,
        },
        {
            title: "Acciones",
            key: "acciones",
            render: (_, record) => (
                <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)} />
            ),
        },
    ];

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
                    pagination={false}
                />
            </Space>

            <Modal
                title="Registrar Proceso"
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
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
                        rules={[
                            { required: true, message: "La fecha es obligatoria" },
                        ]}
                    >
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item
                        label="Lote Origen"
                        name="loteOrigen"
                        rules={[
                            { required: true, message: "El lote origen es obligatorio" },
                        ]}
                    >
                        <Select
                            placeholder="Seleccione un lote"
                            options={[
                                { value: "COSECHA-2026-001", label: "COSECHA-2026-001" },
                                { value: "COSECHA-2026-002", label: "COSECHA-2026-002" },
                                { value: "COSECHA-2026-003", label: "COSECHA-2026-003" },
                            ]}
                        />
                    </Form.Item>

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
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Kilos Ingresados"
                        name="kilosIngresados"
                        rules={[
                            { required: true, message: "Los kilos ingresados son obligatorios" },
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
                            { required: true, message: "Los kilos resultantes son obligatorios" },
                        ]}
                    >
                        <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            placeholder="Ej: 145"
                        />
                    </Form.Item>

                    <Form.Item
                        label="% Merma"
                        name="porcentajeMerma"
                    >
                        <InputNumber
                            style={{ width: "100%" }}
                            readOnly
                            placeholder="Merma calculada"
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
        </div>
    );
}
