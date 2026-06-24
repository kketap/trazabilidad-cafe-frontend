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

type ThemeMode = "light" | "dark" | "system";
type TextSize = "small" | "normal" | "large" | "xlarge";

// Colores corporativos extraídos de los banners en src/assets/Logos/.
const BRAND_GOLD = "#c4b795";
const BRAND_DARK = "#161716";

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
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: isDarkMode
          ? {
              colorPrimary: BRAND_GOLD,
              colorBgContainer: BRAND_DARK,
              colorBgLayout: BRAND_DARK,
              ...fontTokens,
            }
          : {
              colorPrimary: BRAND_GOLD,
              ...fontTokens,
            },
      }}
    >
      <Routes>
        {/* isDarkMode sincroniza el estilo del sidebar con el tema activo. */}
        <Route element={<AppLayout themeMode={themeMode} isDarkMode={isDarkMode} onThemeModeChange={setThemeMode} textSize={textSize} onTextSizeChange={setTextSize} />}>
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="/inicio" element={<HomePage />} />
          <Route path="/cosechas" element={<CosechasPage />} />
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