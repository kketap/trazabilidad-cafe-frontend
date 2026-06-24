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

type ThemeMode = "light" | "dark" | "system";

// Props para controlar el tema desde App.
type AppLayoutProps = {
    themeMode: ThemeMode;
    onThemeModeChange: (themeMode: ThemeMode) => void;
};

export default function AppLayout({ themeMode, onThemeModeChange }: AppLayoutProps) {
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
                        background: "#111827",
                        minHeight: "100vh",
                        position: "sticky",
                        top: 0,
                        left: 0,
                        overflow: "auto",
                    }}
                >
                    <div
                        style={{
                            height: 88,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: sidebarCollapsed ? "center" : "flex-start",
                            padding: sidebarCollapsed ? "0" : "0 24px",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        <ShopOutlined
                            style={{
                                color: "#facc15",
                                fontSize: 30,
                                marginRight: sidebarCollapsed ? 0 : 12,
                            }}
                        />

                        {!sidebarCollapsed && (
                            <div>
                                <Text
                                    style={{
                                        color: "white",
                                        display: "block",
                                        fontWeight: 700,
                                        fontSize: 18,
                                    }}
                                >
                                    Trazabilidad Café
                                </Text>

                                <Text
                                    style={{
                                        color: "#9ca3af",
                                        fontSize: 13,
                                    }}
                                >
                                    Gestión de producción
                                </Text>
                            </div>
                        )}
                    </div>

                    <Menu
                        theme="dark"
                        mode="inline"
                        defaultSelectedKeys={["inicio"]}
                        onClick={handleMenuClick}
                        style={{
                            background: "#111827",
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
                            // Ítems activos del módulo comercial.
                            {
                                key: "clientes",
                                icon: <TeamOutlined />,
                                label: "Clientes",
                            },
                            {
                                key: "facturacion",
                                icon: <FileTextOutlined />,
                                label: "Facturación",
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
                        background: token.colorBgContainer,
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

                        <div style={{ minWidth: 0 }}>
                            <Text
                                style={{
                                    display: "block",
                                    fontWeight: 700,
                                    fontSize: isMobile ? 18 : 20,
                                    lineHeight: 1.25,
                                }}
                            >
                                Sistema de Trazabilidad de Café
                            </Text>

                            <Text
                                style={{
                                    color: token.colorTextSecondary,
                                    fontSize: isMobile ? 13 : 14,
                                    lineHeight: 1.4,
                                }}
                            >
                                Control de cosecha, procesos y reportes
                            </Text>
                        </div>
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
                                // Ítems comerciales visibles en móvil.
                                {
                                    key: "clientes",
                                    icon: <TeamOutlined />,
                                    label: "Clientes",
                                },
                                {
                                    key: "facturacion",
                                    icon: <FileTextOutlined />,
                                    label: "Facturación",
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