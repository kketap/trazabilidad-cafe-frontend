// src/layouts/AppLayout.tsx
import {
    FileExcelOutlined,
    FileTextOutlined,
    HomeOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    PartitionOutlined,
    SettingOutlined,
    ShopOutlined,
    TeamOutlined,
    SolutionOutlined,
    AppstoreOutlined,
    FireOutlined,
    InboxOutlined,
    ExperimentOutlined,
    DollarOutlined,
} from "@ant-design/icons";
import { Button, Grid, Layout, Menu, Tooltip, Typography, theme as antdTheme } from "antd";
import { useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import MenuAccesibilidad from "../components/accesibilidad/MenuAccesibilidad";
import { removeToken, getUserName } from "../api/auth";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

// Acentos de la paleta corporativa para sidebar (oscuro) y topbar (claro).
const SIDEBAR_DARK_BG = "#2a2118";

const HEADER_LIGHT_BG = "linear-gradient(180deg, #fff9ef 0%, #f1dfc7 100%)";

type ThemeMode = "light" | "dark" | "system";
type TextSize = "small" | "normal" | "large" | "xlarge";

// Props para controlar el tema, el modo oscuro y el tamaño de texto desde App.
type AppLayoutProps = {
    themeMode: ThemeMode;
    isDarkMode: boolean;
    onThemeModeChange: (themeMode: ThemeMode) => void;
    textSize: TextSize;
    onTextSizeChange: (textSize: TextSize) => void;
};

export default function AppLayout({ themeMode, isDarkMode, onThemeModeChange, textSize, onTextSizeChange }: AppLayoutProps) {
    // useNavigate permite navegar entre rutas al hacer clic en los items del menú.
    const navigate = useNavigate();
    // Tokens visuales que cambian con el tema.
    const { token } = antdTheme.useToken();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const [collapsed, setCollapsed] = useState(false);
    // Zoom de accesibilidad controlado localmente (inicia en 90%).
    const [zoom, setZoom] = useState(0.9);

    // Maneja el clic en cualquier menú (desktop o móvil) y navega según la key del item.
    const handleMenuClick = ({ key }: { key: string }) => {
        navigate(key);
    };

    const location = useLocation();

    const sidebarCollapsed = isMobile ? true : collapsed;

    const handleLogout = () => {
        removeToken();
        navigate("/login", { replace: true });
    };

    return (
        <Layout
            style={{
                minHeight: "100vh",
                width: "100%",
                // Variable CSS global para el zoom de accesibilidad.
                ["--app-zoom" as string]: zoom,
            }}
        >
            {!isMobile && (
                <Sider
                    collapsed={sidebarCollapsed}
                    trigger={null}
                    width={280}
                    collapsedWidth={88}
                    style={{
                        background: isDarkMode
                            ? SIDEBAR_DARK_BG
                            : "linear-gradient(180deg, #fff9ef 0%, #f1dfc7 100%)",
                        height: "100vh",
                        minHeight: "100vh",
                        position: "fixed",
                        top: 0,
                        left: 0,
                        bottom: 0,
                        overflowY: "auto",
                        zIndex: 100,
                    }}
                >
                    {/* Encabezado de marca con botón al nivel del logo */}
                    <div
                        style={{
                            minHeight: sidebarCollapsed ? 96 : 150,
                            padding: sidebarCollapsed ? "16px 8px" : "18px 18px 16px",
                            borderBottom: `1px solid ${token.colorSplit}`,
                        }}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: sidebarCollapsed ? "1fr" : "1fr 36px",
                                alignItems: "center",
                                columnGap: 8,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    minWidth: 0,
                                }}
                            >
                                <img
                                    src={isDarkMode ? "/banner-dark.png" : "/banner-light.png"}
                                    alt="Fundos Noche"
                                    style={{
                                        maxHeight: sidebarCollapsed ? 44 : 76,
                                        maxWidth: sidebarCollapsed ? 52 : "100%",
                                        objectFit: "contain",
                                    }}
                                />
                            </div>

                            {!sidebarCollapsed && (
                                <Tooltip title="Contraer menú">
                                    <Button
                                        type="text"
                                        icon={<MenuFoldOutlined />}
                                        onClick={() => setCollapsed((value) => !value)}
                                        style={{
                                            color: token.colorText,
                                            fontSize: 18,
                                            borderRadius: 8,
                                        }}
                                        aria-label="Contraer menú"
                                    />
                                </Tooltip>
                            )}

                            {sidebarCollapsed && (
                                <Tooltip title="Expandir menú">
                                    <Button
                                        type="text"
                                        icon={<MenuUnfoldOutlined />}
                                        onClick={() => setCollapsed((value) => !value)}
                                        style={{
                                            color: token.colorText,
                                            fontSize: 18,
                                            borderRadius: 8,
                                            margin: "8px auto 0",
                                        }}
                                        aria-label="Expandir menú"
                                    />
                                </Tooltip>
                            )}
                        </div>

                        {!sidebarCollapsed && (
                            <div
                                style={{
                                    textAlign: "center",
                                    marginTop: 14,
                                }}
                            >
                                <Text
                                    style={{
                                        color: token.colorTextSecondary,
                                        fontSize: 13,
                                    }}
                                >
                                    Gestión de producción
                                </Text>
                                <Text
                                    style={{
                                        color: token.colorPrimary,
                                        fontSize: token.fontSizeSM,
                                        display: "block",
                                        marginTop: 4,
                                    }}
                                >
                                    Bienvenido, {getUserName() ?? "Usuario"}
                                </Text>
                            </div>
                        )}
                    </div>

                    {/* Menú lateral adaptativo al tema activo con fondo corporativo. */}
                    <Menu
                        theme={isDarkMode ? "dark" : "light"}
                        mode="inline"
                        selectedKeys={[location.pathname]}
                        onClick={handleMenuClick}
                        style={{
                            background: isDarkMode ? SIDEBAR_DARK_BG : HEADER_LIGHT_BG,
                            borderRight: "none",
                            padding: "8px 4px",
                            fontSize: 13,
                        }}
                        items={[
                            {
                                key: "/inicio",
                                icon: <HomeOutlined />,
                                label: "Inicio",
                            },
                            {
                                type: "group",
                                label: sidebarCollapsed ? null : "Campo & Producción",
                                children: [
                                    { key: "/cosechas", icon: <ShopOutlined />, label: "Cosechas" },
                                    { key: "/lotes", icon: <AppstoreOutlined />, label: "Lotes" },
                                    { key: "/trazabilidad", icon: <PartitionOutlined />, label: "Proceso Húmedo" },
                                    { key: "/secado", icon: <FireOutlined />, label: "Secado" },
                                    { key: "/empaque", icon: <InboxOutlined />, label: "Empaque" },
                                    { key: "/trilla", icon: <ExperimentOutlined />, label: "Trilla" },
                                ],
                            },
                            {
                                type: "group",
                                label: sidebarCollapsed ? null : "Comercial & Gestión",
                                children: [
                                    { key: "/ventas", icon: <DollarOutlined />, label: "Ventas" },
                                    { key: "/facturacion", icon: <FileTextOutlined />, label: "Facturación" },
                                    { key: "/clientes", icon: <TeamOutlined />, label: "Clientes" },
                                    { key: "/reportes", icon: <FileExcelOutlined />, label: "Reportes" },
                                ],
                            },
                            {
                                type: "group",
                                label: sidebarCollapsed ? null : "Administración",
                                children: [
                                    { key: "/trabajadores", icon: <SolutionOutlined />, label: "Trabajadores" },
                                    { key: "/configuracion", icon: <SettingOutlined />, label: "Configuración" },
                                ],
                            },
                        ]}
                    />

                    <div
                        style={{
                            marginTop: "auto",
                            padding: "16px 8px",
                            borderTop: `1px solid ${token.colorSplit}`,
                        }}
                    >
                        <Button
                            type="text"
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                            style={{
                                color: token.colorText,
                                fontSize: token.fontSize,
                                borderRadius: 8,
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-start",
                                gap: 8,
                            }}
                            aria-label="Cerrar sesión"
                        >
                            Cerrar sesión
                        </Button>
                    </div>
                </Sider>
            )}

            <Layout
                style={{
                    flex: 1,
                    width: "100%",
                    minHeight: "100vh",
                    marginLeft: isMobile ? 0 : sidebarCollapsed ? 88 : 280,
                    transition: "margin-left 0.2s ease",
                }}
            >
                {isMobile && (
                    <Header
                        style={{
                            height: "auto",
                            padding: "16px",
                            background: isDarkMode
                                ? token.colorBgContainer
                                : "linear-gradient(135deg, #fff9ef, #f1dfc7)",
                            borderBottom: `1px solid ${token.colorBorderSecondary}`,
                            zoom: "var(--app-zoom)",
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 16,
                            flexDirection: "column",
                            lineHeight: "normal",
                            position: "sticky",
                            top: 0,
                            zIndex: 90,
                        }}
                    >
                        <Menu
                            mode="horizontal"
                            selectedKeys={[location.pathname]}
                            onClick={handleMenuClick}
                            style={{
                                width: "100%",
                                borderBottom: "none",
                            }}
                            items={[
                                {
                                    key: "/inicio",
                                    icon: <HomeOutlined />,
                                    label: "Inicio",
                                },
                                {
                                    key: "/cosechas",
                                    icon: <ShopOutlined />,
                                    label: "Cosechas",
                                },
                                {
                                    key: "/lotes",
                                    icon: <AppstoreOutlined />,
                                    label: "Lotes",
                                },
                                {
                                    key: "/trazabilidad",
                                    icon: <PartitionOutlined />,
                                    label: "Proceso Húmedo",
                                },
                                {
                                    key: "/secado",
                                    icon: <FireOutlined />,
                                    label: "Secado",
                                },
                                {
                                    key: "/empaque",
                                    icon: <InboxOutlined />,
                                    label: "Empaque",
                                },
                                {
                                    key: "/trilla",
                                    icon: <ExperimentOutlined />,
                                    label: "Trilla",
                                },
                                {
                                    key: "/reportes",
                                    icon: <FileExcelOutlined />,
                                    label: "Reportes",
                                },
                                {
                                    key: "/facturacion",
                                    icon: <FileTextOutlined />,
                                    label: "Facturación",
                                },
                                {
                                    key: "/clientes",
                                    icon: <TeamOutlined />,
                                    label: "Clientes",
                                },
                                {
                                    key: "/trabajadores",
                                    icon: <SolutionOutlined />,
                                    label: "Trabajadores",
                                },
                                {
                                    key: "/configuracion",
                                    icon: <SettingOutlined />,
                                    label: "Configuración",
                                },
                            ]}
                        />
                        <Button
                            type="text"
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                            style={{
                                color: token.colorText,
                                fontSize: 18,
                                borderRadius: 8,
                                alignSelf: "flex-end",
                            }}
                            aria-label="Cerrar sesión"
                        />
                    </Header>
                )}

                <Content
                    className={
                        isDarkMode
                            ? "app-content-gradient app-content-gradient-dark theme-dark"
                            : "app-content-gradient app-content-gradient-light theme-light"
                    }
                    style={{
                        padding: isMobile ? 16 : "24px",
                        flex: 1,
                        minHeight: "100vh",
                        overflow: "visible",
                        zoom: "var(--app-zoom)",
                    }}
                >
                    <Outlet />
                </Content>

                {/* Botón flotante de accesibilidad: apariencia, zoom y tamaño de texto. */}
                <MenuAccesibilidad
                    themeMode={themeMode}
                    onThemeModeChange={onThemeModeChange}
                    textSize={textSize}
                    onTextSizeChange={onTextSizeChange}
                    zoom={zoom}
                    onZoomChange={setZoom}
                />
            </Layout>
        </Layout>
    );
}