// src/App.tsx
import { useEffect, useState } from "react";
import { ConfigProvider, theme } from "antd";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import HomePage from "./pages/inicio/HomePage";
import CosechasPage from "./pages/cosechas/CosechasPage";
import ClientesPage from "./pages/clientes/ClientesPage";
import FacturacionPage from "./pages/facturacion/FacturacionPage";
import TrazabilidadPage from "./pages/trazabilidad/TrazabilidadPage";
import ReportesPage from "./pages/reportes/ReportesPage";
import ConfiguracionPage from "./pages/configuracion/ConfiguracionPage";
import LotesPage from "./pages/lotes/LotesPage";

import "./App.css";

import esES from "antd/locale/es_ES";

type ThemeMode = "light" | "dark" | "system";
type TextSize = "small" | "normal" | "large" | "xlarge";

// Colores corporativos extraídos de los banners en src/assets/Logos/.
const BRAND_GOLD = "#c4b795";
const BRAND_DARK = "#161716";

const BRAND_COFFEE = "#7A4A24";
const BRAND_COFFEE_DARK = "#3B2A1A";
const BRAND_CREAM = "#F8F1E4";
const BRAND_CARD_LIGHT = "#FFF9EF";
const BRAND_PLANTATION = "#5F7F43";

// Escala de tamaño de texto para accesibilidad (más marcada para diferencias perceptibles).
const textSizeScale: Record<TextSize, number> = {
  small: 0.8,
  normal: 1,
  large: 1.25,
  xlarge: 1.5,
};

// Tokens de fuente escalados según el tamaño de texto seleccionado.
const getFontTokens = (scale: number) => ({
  fontSizeSM: 12 * scale,
  fontSizeLG: 16 * scale,
  fontSizeXL: 20 * scale,
  fontSizeHeading1: 38 * scale,
  fontSizeHeading2: 30 * scale,
  fontSizeHeading3: 24 * scale,
  fontSizeHeading4: 20 * scale,
  fontSizeHeading5: 16 * scale,
});

function App() {
  // Controla el modo de tema elegido por el usuario.
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  // Tamaño de texto global para accesibilidad (elevado desde el layout).
  const [textSize, setTextSize] = useState<TextSize>("normal");
  // Guarda si el sistema operativo está en modo oscuro.
  const [isSystemDark, setIsSystemDark] = useState(false);

  useEffect(() => {
    // Escucha los cambios del tema del sistema.
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    setIsSystemDark(mediaQuery.matches);

    if (themeMode !== "system") {
      return;
    }

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      setIsSystemDark(event.matches);
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [themeMode]);

  // Resuelve si la interfaz debe usar modo oscuro.
  const isDarkMode = themeMode === "dark" || (themeMode === "system" && isSystemDark);
  // Tokens de fuente aplicados globalmente según el tamaño de texto.
  const fontTokens = getFontTokens(textSizeScale[textSize]);

  return (
    // Tema global de Ant Design: primario dorado; fondos oscuros corporativos en modo oscuro; fuentes escaladas.
    <ConfigProvider
      locale={esES}
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: isDarkMode
          ? {
            colorPrimary: BRAND_GOLD,
            colorInfo: BRAND_GOLD,
            colorSuccess: BRAND_PLANTATION,
            colorWarning: "#B7791F",
            colorError: "#B91C1C",

            colorBgLayout: BRAND_DARK,
            colorBgContainer: BRAND_DARK,
            colorBgElevated: "#1F170F",

            colorText: "#E8E2D2",
            colorTextSecondary: "#B8AE9A",

            colorBorder: "rgba(196, 183, 149, 0.26)",
            borderRadius: 12,

            ...fontTokens,
          }
          : {
            colorPrimary: BRAND_COFFEE,
            colorInfo: BRAND_COFFEE,
            colorSuccess: BRAND_PLANTATION,
            colorWarning: "#B7791F",
            colorError: "#B91C1C",

            colorBgLayout: BRAND_CREAM,
            colorBgContainer: BRAND_CARD_LIGHT,
            colorBgElevated: "#FFFDF8",

            colorText: BRAND_COFFEE_DARK,
            colorTextSecondary: "#6F5A44",

            colorBorder: "rgba(122, 74, 36, 0.22)",
            borderRadius: 12,

            ...fontTokens,
          },
        components: {
          Layout: {
            bodyBg: isDarkMode ? BRAND_DARK : BRAND_CREAM,
            siderBg: isDarkMode ? "#2a2118" : BRAND_CARD_LIGHT,
          },
          Card: {
            colorBgContainer: isDarkMode ? BRAND_DARK : BRAND_CARD_LIGHT,
          },
          Menu: {
            itemSelectedBg: isDarkMode
              ? "rgba(196, 183, 149, 0.14)"
              : "rgba(122, 74, 36, 0.12)",
            itemSelectedColor: isDarkMode ? "#F4EFE4" : "#5C3518",
          },
          Button: {
            colorPrimary: isDarkMode ? BRAND_GOLD : BRAND_COFFEE,
            colorPrimaryHover: isDarkMode ? "#D8CBA5" : "#9B612E",
            colorPrimaryActive: isDarkMode ? "#A8976F" : "#5C3518",
          },
          Table: {
            headerBg: isDarkMode ? "#21180F" : "#EADCC5",
            headerColor: isDarkMode ? "#F4EFE4" : BRAND_COFFEE_DARK,
            rowHoverBg: isDarkMode
              ? "rgba(196, 183, 149, 0.08)"
              : "rgba(196, 183, 149, 0.16)",
          },
          Modal: {
            contentBg: isDarkMode ? "#17120D" : BRAND_CARD_LIGHT,
            headerBg: isDarkMode ? "#17120D" : BRAND_CARD_LIGHT,
          },
          Drawer: {
            colorBgElevated: isDarkMode ? "#17120D" : BRAND_CARD_LIGHT,
          },
        },
      }}
    >
      <Routes>
        {/* isDarkMode sincroniza el estilo del sidebar con el tema activo. */}
        <Route element={<AppLayout themeMode={themeMode} isDarkMode={isDarkMode} onThemeModeChange={setThemeMode} textSize={textSize} onTextSizeChange={setTextSize} />}>
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="/inicio" element={<HomePage />} />
          <Route path="/cosechas" element={<CosechasPage />} />
          <Route path="/lotes" element={<LotesPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/facturacion" element={<FacturacionPage />} />
          <Route path="/trazabilidad" element={<TrazabilidadPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route path="*" element={<div style={{ padding: 24 }}>Página no encontrada (404)</div>} />
        </Route>
      </Routes>
    </ConfigProvider>
  );
}

export default App;