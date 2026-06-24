// src/pages/facturacion/FacturacionPage.tsx
import { useState } from "react";
import { Button, Card, Col, Row, Space, Statistic, Table, Tag, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import CrearFacturaModal, { type EstadoPago, type FacturaFormValues } from "../../components/facturacion-modals/CrearFacturaModal";

// Datos que representa cada factura en la tabla.
type Factura = {
    id: string;
    numeroFactura: string;
    fechaEmision: string;
    rutCliente: string;
    cliente: string;
    glosaDescripcion: string;
    loteCafe: string;
    kgVendidos: number;
    precioUnitario: number;
    anticipo: number;
    montoVenta: number;
    detraccion: number;
    totalDepositar: number;
    moneda: string;
    estadoPago: EstadoPago;
};

// Datos de prueba mientras no hay backend.
const MOCK_FACTURAS: Factura[] = [
    {
        id: "1",
        numeroFactura: "F001-000123",
        fechaEmision: "2026-06-10",
        rutCliente: "76.123.456-7",
        cliente: "San Crispín",
        glosaDescripcion: "Venta de café pergamino seco premium",
        loteCafe: "L-CF-2026-001",
        kgVendidos: 180,
        precioUnitario: 1250,
        anticipo: 25000,
        montoVenta: 225000,
        detraccion: 4500,
        totalDepositar: 195500,
        moneda: "CLP",
        estadoPago: "Pagado",
    },
    {
        id: "2",
        numeroFactura: "F001-000124",
        fechaEmision: "2026-06-14",
        rutCliente: "77.987.654-3",
        cliente: "Agronoche",
        glosaDescripcion: "Venta de café verde selección exportación",
        loteCafe: "L-CF-2026-002",
        kgVendidos: 260,
        precioUnitario: 980,
        anticipo: 50000,
        montoVenta: 254800,
        detraccion: 7600,
        totalDepositar: 197200,
        moneda: "CLP",
        estadoPago: "Pendiente",
    },
    {
        id: "3",
        numeroFactura: "F001-000125",
        fechaEmision: "2026-06-20",
        rutCliente: "80.456.789-1",
        cliente: "Exportadora Andina",
        glosaDescripcion: "Venta de microlote Geisha lavado",
        loteCafe: "L-CF-2026-003",
        kgVendidos: 95,
        precioUnitario: 2200,
        anticipo: 30000,
        montoVenta: 209000,
        detraccion: 6200,
        totalDepositar: 172800,
        moneda: "USD",
        estadoPago: "Pagado",
    },
];

export default function FacturacionPage() {
    // Estado local para mostrar facturas en la tabla.
    const [facturas, setFacturas] = useState<Factura[]>(MOCK_FACTURAS);
    // Controla la apertura del modal.
    const [isModalOpen, setIsModalOpen] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    // Agrega una factura temporal al enviar el formulario.
    const handleSubmit = (values: FacturaFormValues) => {
        const nuevaFactura: Factura = {
            id: Date.now().toString(),
            numeroFactura: values.numeroFactura,
            fechaEmision: values.fechaEmision.format("YYYY-MM-DD"),
            rutCliente: values.rutCliente,
            cliente: values.cliente,
            glosaDescripcion: values.glosaDescripcion,
            loteCafe: values.loteCafe,
            kgVendidos: values.kgVendidos,
            precioUnitario: values.precioUnitario,
            anticipo: values.anticipo,
            montoVenta: values.montoVenta,
            detraccion: values.detraccion,
            totalDepositar: values.totalDepositar,
            moneda: values.moneda,
            estadoPago: values.estadoPago,
        };

        setFacturas((currentFacturas) => [...currentFacturas, nuevaFactura]);
        setIsModalOpen(false);
    };

    const handleEdit = (_factura: Factura) => {
        // TODO: implementar edición de factura.
    };

    const handleDelete = (_factura: Factura) => {
        // TODO: implementar eliminación de factura.
    };

    const totalFacturado = facturas.reduce((total, factura) => total + factura.montoVenta, 0);
    const totalPorDepositar = facturas.reduce((total, factura) => total + factura.totalDepositar, 0);
    const facturasPendientes = facturas.filter((factura) => factura.estadoPago === "Pendiente").length;

    // Columnas visibles de la tabla de facturación.
    const columns: ColumnsType<Factura> = [
        {
            title: "N° Factura",
            dataIndex: "numeroFactura",
            key: "numeroFactura",
            fixed: "left",
        },
        {
            title: "Fecha Emisión",
            dataIndex: "fechaEmision",
            key: "fechaEmision",
        },
        {
            title: "RUC/RUT Cliente",
            dataIndex: "rutCliente",
            key: "rutCliente",
        },
        {
            title: "Cliente",
            dataIndex: "cliente",
            key: "cliente",
        },
        {
            title: "Glosa / Descripción",
            dataIndex: "glosaDescripcion",
            key: "glosaDescripcion",
            ellipsis: true,
        },
        {
            title: "Lote Café",
            dataIndex: "loteCafe",
            key: "loteCafe",
        },
        {
            title: "Kg Vendidos",
            dataIndex: "kgVendidos",
            key: "kgVendidos",
        },
        {
            title: "Precio Unit.",
            dataIndex: "precioUnitario",
            key: "precioUnitario",
            render: (precioUnitario: number) => precioUnitario.toLocaleString("es-CL"),
        },
        {
            title: "Anticipo",
            dataIndex: "anticipo",
            key: "anticipo",
            render: (anticipo: number) => anticipo.toLocaleString("es-CL"),
        },
        {
            title: "Monto Venta",
            dataIndex: "montoVenta",
            key: "montoVenta",
            render: (montoVenta: number) => montoVenta.toLocaleString("es-CL"),
        },
        {
            title: "Detracción",
            dataIndex: "detraccion",
            key: "detraccion",
            render: (detraccion: number) => detraccion.toLocaleString("es-CL"),
        },
        {
            title: "Total a depositar",
            dataIndex: "totalDepositar",
            key: "totalDepositar",
            render: (totalDepositar: number) => totalDepositar.toLocaleString("es-CL"),
        },
        {
            title: "Moneda",
            dataIndex: "moneda",
            key: "moneda",
        },
        {
            title: "Estado de pago",
            dataIndex: "estadoPago",
            key: "estadoPago",
            render: (estadoPago: EstadoPago) => (
                <Tag color={estadoPago === "Pagado" ? "green" : "orange"}>
                    {estadoPago}
                </Tag>
            ),
        },
        {
            title: "Acciones",
            key: "acciones",
            fixed: "right",
            render: (_, record) => (
                <Space size="small">
                    <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
                </Space>
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
                    <div>
                        <Typography.Title level={2} style={{ margin: 0 }}>
                            Facturación
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            Historial de transacciones comerciales.
                        </Typography.Text>
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                        Nueva Factura
                    </Button>
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} md={6}>
                        <Card>
                            <Statistic
                                title="Facturaciones registradas"
                                value={facturas.length}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} md={6}>
                        <Card>
                            <Statistic
                                title="Total facturado"
                                value={totalFacturado}
                                prefix="$"
                                formatter={(value) => Number(value).toLocaleString("es-CL")}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} md={6}>
                        <Card>
                            <Statistic
                                title="Total a depositar"
                                value={totalPorDepositar}
                                prefix="$"
                                formatter={(value) => Number(value).toLocaleString("es-CL")}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} md={6}>
                        <Card>
                            <Statistic
                                title="Facturas pendientes"
                                value={facturasPendientes}
                                suffix={`/ ${facturas.length}`}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Tabla principal de facturación. */}
                <Table
                    columns={columns}
                    dataSource={facturas}
                    rowKey="id"
                    bordered
                    pagination={false}
                    scroll={{ x: 1800 }}
                />
            </Space>

            <CrearFacturaModal
                open={isModalOpen}
                onClose={handleCancel}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
