// src/components/accesibilidad/MenuAccesibilidad.tsx
import { FloatButton, Popover, Radio, Select, Space, Typography } from "antd";
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
    const content = (
        <Space direction="vertical" style={{ width: 220 }}>
            <div>
                <Typography.Text strong>Apariencia</Typography.Text>
                <Radio.Group
                    value={themeMode}
                    onChange={(e) => onThemeModeChange(e.target.value)}
                    style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}
                >
                    <Radio value="light">Modo Claro</Radio>
                    <Radio value="dark">Modo Oscuro</Radio>
                    <Radio value="system">Sistema</Radio>
                </Radio.Group>
            </div>

            <div>
                <Typography.Text strong>Tamaño de texto</Typography.Text>
                <Select
                    value={textSize}
                    onChange={onTextSizeChange}
                    options={textSizeOptions}
                    style={{ width: "100%", marginTop: 8 }}
                />
            </div>

            <div>
                <Typography.Text strong>Zoom del contenido</Typography.Text>
                <Select
                    value={zoom}
                    onChange={onZoomChange}
                    options={zoomOptions}
                    style={{ width: "100%", marginTop: 8 }}
                />
            </div>
        </Space>
    );

    return (
        <Popover content={content} placement="topRight" trigger="click">
            <FloatButton
                icon={<SettingOutlined />}
                tooltip="Accesibilidad"
                style={{ right: 24, bottom: 24 }}
            />
        </Popover>
    );
}
