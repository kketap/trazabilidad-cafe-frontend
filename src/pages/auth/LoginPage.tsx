// src/pages/auth/LoginPage.tsx
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography, theme } from "antd";
import type { AxiosError } from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login, saveToken, saveUserName } from "../../api/auth";
import MenuAccesibilidad from "../../components/accesibilidad/MenuAccesibilidad";

const { Title, Text } = Typography;

type LoginFormValues = {
  email: string;
  password: string;
};

type ThemeMode = "light" | "dark" | "system";
type TextSize = "small" | "normal" | "large" | "xlarge";

type LoginPageProps = {
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  textSize: TextSize;
  onTextSizeChange: (size: TextSize) => void;
};

export default function LoginPage({ themeMode, onThemeModeChange, textSize, onTextSizeChange }: LoginPageProps) {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(0.9);

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      const resultado = await login(values.email, values.password);

      saveToken(resultado.token);
      saveUserName(resultado.usuario.nombre);

      navigate("/inicio", { replace: true });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;

      const mensaje =
        axiosError.response?.data?.message ??
        "Error al iniciar sesión. Verifique sus credenciales.";

      console.error("Error de login:", mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: token.colorBgLayout,
        padding: 24,
      }}
    >
      <Card
        style={{
          width: 400,
          maxWidth: "100%",
          background: token.colorBgContainer,
          borderColor: token.colorBorderSecondary,
          boxShadow: token.boxShadowSecondary,
        }}
        styles={{
          body: { padding: "40px 32px" },
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src="/banner-dark.png"
            alt="Fundos Noche"
            style={{
              maxHeight: 64,
              maxWidth: "100%",
              objectFit: "contain",
              marginBottom: 16,
            }}
          />
          <Title
            level={3}
            style={{
              color: token.colorText,
              marginBottom: 4,
            }}
          >
            Iniciar Sesión
          </Title>
          <Text
            style={{
              color: token.colorTextSecondary,
              fontSize: token.fontSizeSM,
            }}
          >
            Gestión de producción cafetalera
          </Text>
        </div>

        <Form<LoginFormValues>
          name="login"
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            label="Correo electrónico"
            rules={[
              { required: true, message: "Ingrese su correo electrónico" },
              { type: "email", message: "Correo no válido" },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: token.colorTextTertiary }} />}
              placeholder="correo@ejemplo.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Contraseña"
            rules={[{ required: true, message: "Ingrese su contraseña" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />}
              placeholder="••••••••"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Ingresar
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <MenuAccesibilidad
        themeMode={themeMode}
        onThemeModeChange={onThemeModeChange}
        textSize={textSize}
        onTextSizeChange={onTextSizeChange}
        zoom={zoom}
        onZoomChange={setZoom}
      />
    </div>
  );
}
