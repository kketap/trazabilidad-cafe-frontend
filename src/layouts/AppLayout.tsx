import {
    BarChartOutlined,
    FileExcelOutlined,
    HomeOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    PartitionOutlined,
    SettingOutlined,
    ShopOutlined,
} from "@ant-design/icons";
import { Button, Grid, Layout, Menu, Typography } from "antd";
import { useState } from "react";
import type { ReactNode } from "react";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

type AppLayoutProps = {
    children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const [collapsed, setCollapsed] = useState(false);

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
                                key: "dashboard",
                                icon: <BarChartOutlined />,
                                label: "Dashboard",
                                disabled: true,
                            },
                            {
                                key: "cosechas",
                                icon: <ShopOutlined />,
                                label: "Cosechas",
                                disabled: true,
                            },
                            {
                                key: "trazabilidad",
                                icon: <PartitionOutlined />,
                                label: "Trazabilidad",
                                disabled: true,
                            },
                            {
                                key: "reportes",
                                icon: <FileExcelOutlined />,
                                label: "Reportes",
                                disabled: true,
                            },
                            {
                                key: "configuracion",
                                icon: <SettingOutlined />,
                                label: "Configuración",
                                disabled: true,
                            },
                        ]}
                    />
                </Sider>
            )}

            <Layout style={{ width: "100%", minWidth: 0 }}>
                <Header
                    style={{
                        height: isMobile ? "auto" : 80,
                        padding: isMobile ? "16px" : "0 24px",
                        background: "#ffffff",
                        borderBottom: "1px solid #e5e7eb",
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
                                    color: "#6b7280",
                                    fontSize: isMobile ? 13 : 14,
                                    lineHeight: 1.4,
                                }}
                            >
                                Control de cosecha, procesos y reportes
                            </Text>
                        </div>
                    </div>

                    {isMobile && (
                        <Menu
                            mode="horizontal"
                            defaultSelectedKeys={["inicio"]}
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
                                    disabled: true,
                                },
                                {
                                    key: "trazabilidad",
                                    icon: <PartitionOutlined />,
                                    label: "Trazabilidad",
                                    disabled: true,
                                },
                                {
                                    key: "reportes",
                                    icon: <FileExcelOutlined />,
                                    label: "Reportes",
                                    disabled: true,
                                },
                            ]}
                        />
                    )}
                </Header>

                <Content
                    style={{
                        background: "#f3f4f6",
                        padding: isMobile ? 12 : 24,
                        width: "100%",
                        minWidth: 0,
                        overflowX: "hidden",
                    }}
                >
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}