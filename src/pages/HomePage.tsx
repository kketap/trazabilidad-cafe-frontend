import { Button, Card, Typography, Alert } from "antd";
import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";

const { Title, Text } = Typography;

export default function HomePage() {
    const [loading, setLoading] = useState(false);
    const [apiStatus, setApiStatus] = useState("Sin comprobar");
    const [error, setError] = useState<string | null>(null);

    async function checkApi() {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get("/health");

            setApiStatus(response.data.message || "Backend conectado correctamente");
        } catch (err) {
            console.error(err);
            setApiStatus("Error de conexión");
            setError("No se pudo conectar con el backend. Revisa VITE_API_URL o CORS en Railway.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        checkApi();
    }, []);

    return (
        <div
            style={{
                minHeight: "100vh",
                padding: 24,
                background: "#f5f5f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Card style={{ width: "100%", maxWidth: 720 }}>
                <Title level={2}>Sistema de Trazabilidad de Café</Title>

                <Text strong>Frontend: </Text>
                <Text>Netlify</Text>

                <br />

                <Text strong>Backend: </Text>
                <Text>Railway</Text>

                <br />
                <br />

                <Text strong>Estado API: </Text>
                <Text>{apiStatus}</Text>

                {error && (
                    <div style={{ marginTop: 16 }}>
                        <Alert type="error" message={error} showIcon />
                    </div>
                )}

                <div style={{ marginTop: 24 }}>
                    <Button type="primary" loading={loading} onClick={checkApi}>
                        Probar conexión con backend
                    </Button>
                </div>
            </Card>
        </div>
    );
}