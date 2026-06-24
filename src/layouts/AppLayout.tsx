// src/layouts/AppLayout.tsx
import {
    FileExcelOutlined,
    DesktopOutlined,
    FileTextOutlined,
    HomeOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    MoonOutlined,
    PartitionOutlined,
    SettingOutlined,
    ShopOutlined,
    SunOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { Button, Grid, Layout, Menu, Space, Tooltip, Typography, theme as antdTheme } from "antd";
import { useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

// Acentos de la paleta corporativa para sidebar (oscuro) y topbar (claro).
const SIDEBAR_DARK_BG = "#2a2118";
const HEADER_LIGHT_BG = "#f5f1e8";

type ThemeMode = "light" | "dark" | "system";

// Props para controlar el tema y sincronizar el modo oscuro desde App.
type AppLayoutProps = {
    themeMode: ThemeMode;
    isDarkMode: boolean;
    onThemeModeChange: (themeMode: ThemeMode) => void;
};

export default function AppLayout({ themeMode, isDarkMode, onThemeModeChange }: AppLayoutProps) {
    // useNavigate permite navegar entre rutas al hacer clic en los items del menú.
    const navigate = useNavigate();
    // Tokens visuales que cambian con el tema.
    const { token } = antdTheme.useToken();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const [collapsed, setCollapsed] = useState(false);

    // Maneja el clic en cualquier menú (desktop o móvil) y navega según la key del item.
    const handleMenuClick = ({ key }: { key: string }) => {
        if (key === "inicio") {
            navigate("/inicio");
        } else if (key === "cosechas") {
            navigate("/cosechas");
        } else if (key === "clientes") {
            // Navega al módulo de clientes.
            navigate("/clientes");
        } else if (key === "facturacion") {
            // Navega al módulo de facturación.
            navigate("/facturacion");
        } else if (key === "trazabilidad") {
            navigate("/trazabilidad");
        } else if (key === "reportes") {
            navigate("/reportes");
        } else if (key === "configuracion") {
            navigate("/configuracion");
        }
    };

    const sidebarCollapsed = isMobile ? true : collapsed;

    return (
        <Layout style={{ minHeight: "100vh", width: "100%" }}>
            {!isMobile && (
                <Sider
                    collapsible
                    collapsed={sidebarCollapsed}
                    trigger={null}
                    width={280}
                    collapsedWidth={88}
                    style={{
                        // Fondo del sidebar: café oscuro en modo oscuro, beige corporativo en modo claro.
                        background: isDarkMode ? SIDEBAR_DARK_BG : HEADER_LIGHT_BG,
                        minHeight: "100vh",
                        position: "sticky",
                        top: 0,
                        left: 0,
                        overflow: "auto",
                    }}
                >
                    {/* Encabezado de marca: logo arriba y texto centrado debajo en modo expandido. */}
                    <div
                        style={{
                            height: sidebarCollapsed ? 88 : 140,
                            display: "flex",
                            flexDirection: sidebarCollapsed ? "row" : "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: sidebarCollapsed ? "0" : "16px 24px 12px",
                            gap: sidebarCollapsed ? 0 : 8,
                            borderBottom: `1px solid ${token.colorSplit}`,
                        }}
                    >
                        {/* Banner de marca distinto para modo claro y modo oscuro. */}
                        <img
                            src={isDarkMode ? "/banner-dark.png" : "/banner-light.png"}
                            alt="Fundos Noche"
                            style={{
                                maxHeight: sidebarCollapsed ? 50 : 70,
                                maxWidth: sidebarCollapsed ? 60 : "100%",
                                objectFit: "contain",
                            }}
                        />

                        {!sidebarCollapsed && (
                            <div style={{ textAlign: "center" }}>
                                <Text
                                    style={{
                                        color: token.colorText,
                                        display: "block",
                                        fontWeight: 700,
                                        fontSize: 18,
                                    }}
                                >
                                    Fundos Noche
                                </Text>

                                <Text
                                    style={{
                                        color: token.colorTextSecondary,
                                        fontSize: 13,
                                    }}
                                >
                                    Gestión de producción
                                </Text>
                            </div>
                        )}
                    </div>

                    {/* Menú lateral adaptativo al tema activo con fondo corporativo. */}
                    <Menu
                        theme={isDarkMode ? "dark" : "light"}
                        mode="inline"
                        defaultSelectedKeys={["inicio"]}
                        onClick={handleMenuClick}
                        style={{
                            // Fondo del menú igual al sidebar para mantener continuidad y contraste.
                            background: isDarkMode ? SIDEBAR_DARK_BG : HEADER_LIGHT_BG,
                            borderRight: "none",
                            padding: "16px 8px",
                        }}
                        items={[
                            {
                                key: "inicio",
                                icon: <HomeOutlined />,
                                label: "Inicio",
                            },
                            {
                                key: "cosechas",
                                icon: <ShopOutlined />,
                                label: "Cosechas",
                            },
                            {
                                key: "trazabilidad",
                                icon: <PartitionOutlined />,
                                label: "Trazabilidad",
                            },
                            {
                                key: "reportes",
                                icon: <FileExcelOutlined />,
                                label: "Reportes",
                            },
                            // Navegación reordenada: Inicio, Cosechas, Trazabilidad, Reportes, Facturación, Clientes, Configuración.
                            // Ítems activos del módulo comercial.
                            {
                                key: "facturacion",
                                icon: <FileTextOutlined />,
                                label: "Facturación",
                            },
                            {
                                key: "clientes",
                                icon: <TeamOutlined />,
                                label: "Clientes",
                            },
                            {
                                key: "configuracion",
                                icon: <SettingOutlined />,
                                label: "Configuración",
                            },
                        ]}
                    />
                </Sider>
            )}

            <Layout style={{ flex: 1, width: "100%" }}>
                <Header
                    style={{
                        height: isMobile ? "auto" : 80,
                        padding: isMobile ? "16px" : "0 24px",
                        // Fondo de la topbar: beige corporativo en modo claro, token oscuro en modo oscuro.
                        background: isDarkMode ? token.colorBgContainer : HEADER_LIGHT_BG,
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        display: "flex",
                        alignItems: isMobile ? "flex-start" : "center",
                        justifyContent: "space-between",
                        gap: 16,
                        flexDirection: isMobile ? "column" : "row",
                        lineHeight: "normal",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            width: "100%",
                        }}
                    >
                        {!isMobile && (
                            <Button
                                type="text"
                                icon={
                                    collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
                                }
                                onClick={() => setCollapsed((value) => !value)}
                                style={{
                                    fontSize: 18,
                                    flexShrink: 0,
                                }}
                            />
                        )}

                        {/* Título removido: la página activa se identifica por el sidebar. */}
                    </div>

                    {/* Botones para cambiar entre temas. */}
                    <Space.Compact style={{ width: isMobile ? "100%" : "auto", flexShrink: 0 }}>
                        <Tooltip title="Modo Claro">
                            <Button
                                type={themeMode === "light" ? "primary" : "default"}
                                icon={<SunOutlined />}
                                onClick={() => onThemeModeChange("light")}
                                aria-label="Modo Claro"
                            />
                        </Tooltip>
                        <Tooltip title="Modo Oscuro">
                            <Button
                                type={themeMode === "dark" ? "primary" : "default"}
                                icon={<MoonOutlined />}
                                onClick={() => onThemeModeChange("dark")}
                                aria-label="Modo Oscuro"
                            />
                        </Tooltip>
                        <Tooltip title="Sistema">
                            <Button
                                type={themeMode === "system" ? "primary" : "default"}
                                icon={<DesktopOutlined />}
                                onClick={() => onThemeModeChange("system")}
                                aria-label="Sistema"
                            />
                        </Tooltip>
                    </Space.Compact>

                    {isMobile && (
                        <Menu
                            mode="horizontal"
                            defaultSelectedKeys={["inicio"]}
                            onClick={handleMenuClick}
                            style={{
                                width: "100%",
                                borderBottom: "none",
                            }}
                            items={[
                                {
                                    key: "inicio",
                                    icon: <HomeOutlined />,
                                    label: "Inicio",
                                },
                                {
                                    key: "cosechas",
                                    icon: <ShopOutlined />,
                                    label: "Cosechas",
                                },
                                {
                                    key: "trazabilidad",
                                    icon: <PartitionOutlined />,
                                    label: "Trazabilidad",
                                },
                                {
                                    key: "reportes",
                                    icon: <FileExcelOutlined />,
                                    label: "Reportes",
                                },
                                // Navegación móvil con el mismo orden que el sidebar desktop.
                                // Ítems comerciales visibles en móvil.
                                {
                                    key: "facturacion",
                                    icon: <FileTextOutlined />,
                                    label: "Facturación",
                                },
                                {
                                    key: "clientes",
                                    icon: <TeamOutlined />,
                                    label: "Clientes",
                                },
                                {
                                    key: "configuracion",
                                    icon: <SettingOutlined />,
                                    label: "Configuración",
                                },
                            ]}
                        />
                    )}
                </Header>

                <Content
                    style={{
                        // Fondo adaptable al tema seleccionado.
                        background: token.colorBgLayout,
                        padding: 24,
                        flex: 1,
                        overflow: "auto",
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}