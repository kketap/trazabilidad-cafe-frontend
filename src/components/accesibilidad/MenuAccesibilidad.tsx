// src/components/accesibilidad/MenuAccesibilidad.tsx
import { useState } from "react";
import {
    Card,
    Divider,
    Drawer,
    FloatButton,
    Radio,
    Select,
    Space,
    Typography,
} from "antd";
import { SettingOutlined } from "@ant-design/icons";

type ThemeMode = "light" | "dark" | "system";
type TextSize = "small" | "normal" | "large" | "xlarge";

type MenuAccesibilidadProps = {
    themeMode: ThemeMode;
    onThemeModeChange: (mode: ThemeMode) => void;
    textSize: TextSize;
    onTextSizeChange: (size: TextSize) => void;
    zoom: number;
    onZoomChange: (zoom: number) => void;
};

const textSizeOptions = [
    { label: "Pequeño", value: "small" },
    { label: "Normal", value: "normal" },
    { label: "Grande", value: "large" },
    { label: "Muy grande", value: "xlarge" },
];

const zoomOptions = [
    { label: "80%", value: 0.8 },
    { label: "90%", value: 0.9 },
    { label: "100%", value: 1 },
    { label: "110%", value: 1.1 },
    { label: "120%", value: 1.2 },
];

export default function MenuAccesibilidad({
    themeMode,
    onThemeModeChange,
    textSize,
    onTextSizeChange,
    zoom,
    onZoomChange,
}: MenuAccesibilidadProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <FloatButton
                icon={<SettingOutlined />}
                tooltip="Accesibilidad"
                style={{ right: 24, bottom: 24 }}
                onClick={() => setOpen(true)}
            />

            <Drawer
                title="Accesibilidad"
                placement="right"
                open={open}
                onClose={() => setOpen(false)}
                width="min(420px, 92vw)"
                destroyOnHidden
            >
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        Configura la apariencia, el tamaño del texto y el zoom del sistema.
                    </Typography.Paragraph>

                    <Card title="Apariencia" size="small">
                        <Typography.Paragraph type="secondary">
                            Define cómo quieres visualizar la interfaz.
                        </Typography.Paragraph>

                        <Divider />

                        <Radio.Group
                            value={themeMode}
                            onChange={(e) => onThemeModeChange(e.target.value)}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                            }}
                        >
                            <Radio value="light">Modo claro</Radio>
                            <Radio value="dark">Modo oscuro</Radio>
                            <Radio value="system">Usar configuración del sistema</Radio>
                        </Radio.Group>
                    </Card>

                    <Card title="Tamaño de texto" size="small">
                        <Typography.Paragraph type="secondary">
                            Ajusta el tamaño de las letras para mejorar la lectura.
                        </Typography.Paragraph>

                        <Divider />

                        <Select
                            value={textSize}
                            onChange={onTextSizeChange}
                            options={textSizeOptions}
                            style={{ width: "100%" }}
                        />
                    </Card>

                    <Card title="Zoom del contenido" size="small">
                        <Typography.Paragraph type="secondary">
                            Cambia la escala visual del contenido del sistema.
                        </Typography.Paragraph>

                        <Divider />

                        <Select
                            value={zoom}
                            onChange={onZoomChange}
                            options={zoomOptions}
                            style={{ width: "100%" }}
                        />

                        <Typography.Text type="secondary" style={{ display: "block", marginTop: 12 }}>
                            Zoom actual: {(zoom * 100).toFixed(0)}%
                        </Typography.Text>
                    </Card>

                    <Card size="small">
                        <Typography.Text strong>Recomendación</Typography.Text>

                        <Typography.Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                            Para uso diario, se recomienda usar el modo del sistema, texto normal
                            y zoom entre 90% y 100%.
                        </Typography.Paragraph>
                    </Card>
                </Space>
            </Drawer>
        </>
    );
}