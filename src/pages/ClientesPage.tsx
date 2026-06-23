import { useState } from "react";
import { Avatar, Button, Card, List, Space, Tag, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, UserOutlined } from "@ant-design/icons";

// Datos que representa cada cliente en la lista.
type Cliente = {
    id: string;
    nombreRazonSocial: string;
    rut: string;
    contacto: string;
};

// Datos de prueba mientras no hay backend.
const MOCK_CLIENTES: Cliente[] = [
    {
        id: "1",
        nombreRazonSocial: "San Crispín",
        rut: "76.123.456-7",
        contacto: "contacto@sancrispin.cl",
    },
    {
        id: "2",
        nombreRazonSocial: "Agronoche",
        rut: "77.987.654-3",
        contacto: "ventas@agronoche.cl",
    },
];

export default function ClientesPage() {
    // Estado local para mostrar clientes en la lista.
    const [clientes] = useState<Cliente[]>(MOCK_CLIENTES);

    // Acción temporal para crear cliente.
    const handleNewCliente = () => {
        console.log("Nuevo cliente");
    };

    const handleEdit = (cliente: Cliente) => {
        console.log("Editar cliente:", cliente);
    };

    const handleDelete = (cliente: Cliente) => {
        console.log("Eliminar cliente:", cliente);
    };

    return (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
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
                        Gestión de Clientes
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        Registro y gestión de clientes comerciales.
                    </Typography.Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleNewCliente}>
                    Nuevo Cliente
                </Button>
            </div>

            {/* Lista principal de clientes. */}
            <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
                dataSource={clientes}
                renderItem={(cliente) => (
                    <List.Item>
                        <Card
                            hoverable
                            actions={[
                                <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => handleEdit(cliente)} />,
                                <Button key="delete" type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(cliente)} />,
                            ]}
                            style={{
                                borderRadius: 18,
                                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                                overflow: "hidden",
                                border: "1px solid rgba(15, 23, 42, 0.08)",
                            }}
                        >
                            <Card.Meta
                                avatar={
                                    <Avatar
                                        size={48}
                                        icon={cliente.nombreRazonSocial ? undefined : <UserOutlined />}
                                        style={{
                                            backgroundColor: "#1677ff",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {cliente.nombreRazonSocial.charAt(0).toUpperCase()}
                                    </Avatar>
                                }
                                title={cliente.nombreRazonSocial}
                                description={
                                    <Space direction="vertical" size={6}>
                                        <Typography.Text type="secondary">RUT: {cliente.rut}</Typography.Text>
                                        <Typography.Text type="secondary">Contacto: {cliente.contacto}</Typography.Text>
                                        <Tag color="blue" style={{ width: "fit-content", marginInlineEnd: 0 }}>
                                            Cliente Activo
                                        </Tag>
                                    </Space>
                                }
                            />
                        </Card>
                    </List.Item>
                )}
            />
        </Space>
    );
}
