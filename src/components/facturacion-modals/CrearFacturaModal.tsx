// src/components/facturacion-modals/CrearFacturaModal.tsx
import { Button, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select } from "antd";
import type { Dayjs } from "dayjs";

export type EstadoPago = "Pagado" | "Pendiente";

export type FacturaFormValues = {
    numeroFactura: string;
    fechaEmision: Dayjs;
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

type CrearFacturaModalProps = {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: FacturaFormValues) => void;
};

export default function CrearFacturaModal({ open, onClose, onSubmit }: CrearFacturaModalProps) {
    const [form] = Form.useForm<FacturaFormValues>();

    const handleValuesChange = (changedValues: Partial<FacturaFormValues>) => {
        if (
            "kgVendidos" in changedValues ||
            "precioUnitario" in changedValues ||
            "anticipo" in changedValues ||
            "detraccion" in changedValues
        ) {
            const kgVendidos = form.getFieldValue("kgVendidos") ?? 0;
            const precioUnitario = form.getFieldValue("precioUnitario") ?? 0;
            const anticipo = form.getFieldValue("anticipo") ?? 0;
            const detraccion = form.getFieldValue("detraccion") ?? 0;
            const montoVenta = kgVendidos * precioUnitario;
            const totalDepositar = montoVenta - anticipo - detraccion;

            form.setFieldsValue({ montoVenta, totalDepositar });
        }
    };

    const handleFinish = (values: FacturaFormValues) => {
        onSubmit(values);
        form.resetFields();
        onClose();
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            title="Nueva Factura"
            open={open}
            onCancel={handleCancel}
            footer={null}
            width={860}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                onValuesChange={handleValuesChange}
                autoComplete="off"
                initialValues={{
                    anticipo: 0,
                    detraccion: 0,
                    montoVenta: 0,
                    totalDepositar: 0,
                    moneda: "CLP",
                    estadoPago: "Pendiente",
                }}
            >
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="N° Factura"
                            name="numeroFactura"
                            rules={[{ required: true, message: "El número de factura es obligatorio" }]}
                        >
                            <Input placeholder="Ej: F001-000126" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Fecha Emisión"
                            name="fechaEmision"
                            rules={[{ required: true, message: "La fecha de emisión es obligatoria" }]}
                        >
                            <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="RUC/RUT Cliente"
                            name="rutCliente"
                            rules={[{ required: true, message: "El RUC/RUT del cliente es obligatorio" }]}
                        >
                            <Input placeholder="Ej: 76.123.456-7" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Cliente"
                            name="cliente"
                            rules={[{ required: true, message: "El cliente es obligatorio" }]}
                        >
                            <Input placeholder="Ej: San Crispín" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    label="Glosa / Descripción"
                    name="glosaDescripcion"
                    rules={[{ required: true, message: "La glosa o descripción es obligatoria" }]}
                >
                    <Input.TextArea rows={3} placeholder="Detalle comercial de la venta" />
                </Form.Item>

                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Lote Café"
                            name="loteCafe"
                            rules={[{ required: true, message: "El lote de café es obligatorio" }]}
                        >
                            <Input placeholder="Ej: L-CF-2026-004" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Kg Vendidos"
                            name="kgVendidos"
                            rules={[{ required: true, message: "Los kg vendidos son obligatorios" }]}
                        >
                            <InputNumber style={{ width: "100%" }} min={0} placeholder="Ej: 150" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Precio Unit."
                            name="precioUnitario"
                            rules={[{ required: true, message: "El precio unitario es obligatorio" }]}
                        >
                            <InputNumber style={{ width: "100%" }} min={0} placeholder="Ej: 1250" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Anticipo"
                            name="anticipo"
                            rules={[{ required: true, message: "El anticipo es obligatorio" }]}
                        >
                            <InputNumber style={{ width: "100%" }} min={0} placeholder="Ej: 25000" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Monto Venta"
                            name="montoVenta"
                        >
                            <InputNumber style={{ width: "100%" }} readOnly placeholder="Monto calculado" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Detracción"
                            name="detraccion"
                            rules={[{ required: true, message: "La detracción es obligatoria" }]}
                        >
                            <InputNumber style={{ width: "100%" }} min={0} placeholder="Ej: 4500" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Total a depositar"
                            name="totalDepositar"
                        >
                            <InputNumber style={{ width: "100%" }} readOnly placeholder="Total calculado" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Moneda"
                            name="moneda"
                            rules={[{ required: true, message: "La moneda es obligatoria" }]}
                        >
                            <Select
                                options={[
                                    { value: "CLP", label: "CLP" },
                                    { value: "USD", label: "USD" },
                                    { value: "PEN", label: "PEN" },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    label="Estado de pago"
                    name="estadoPago"
                    rules={[{ required: true, message: "El estado de pago es obligatorio" }]}
                >
                    <Select
                        options={[
                            { value: "Pagado", label: "Pagado" },
                            { value: "Pendiente", label: "Pendiente" },
                        ]}
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
    );
}
