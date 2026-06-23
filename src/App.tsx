import { useEffect, useState } from "react";
import { ConfigProvider, theme } from "antd";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import HomePage from "./pages/HomePage";
import CosechasPage from "./pages/CosechasPage";
import ClientesPage from "./pages/ClientesPage";
import FacturacionPage from "./pages/FacturacionPage";
import TrazabilidadPage from "./pages/TrazabilidadPage";
import ReportesPage from "./pages/ReportesPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";

type ThemeMode = "light" | "dark" | "system";

function App() {
  // Controla el modo de tema elegido por el usuario.
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
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

  return (
    // Aplica la paleta cafetera y el algoritmo de tema global.
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#d46b08",
        },
      }}
    >
      <Routes>
        <Route element={<AppLayout themeMode={themeMode} onThemeModeChange={setThemeMode} />}>
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