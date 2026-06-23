import { useEffect, useState } from "react";
import { ConfigProvider, theme } from "antd";
import { Routes, Route } from "react-router-dom";
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
      {/* AppLayout envuelve todas las vistas para mostrar el menú y encabezado común. */}
      <AppLayout themeMode={themeMode} onThemeModeChange={setThemeMode}>
        {/* Definición de rutas principales. El layout se mantiene mientras el contenido cambia. */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cosechas" element={<CosechasPage />} />
          {/* Rutas del módulo comercial. */}
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/facturacion" element={<FacturacionPage />} />
          <Route path="/trazabilidad" element={<TrazabilidadPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
        </Routes>
      </AppLayout>
    </ConfigProvider>
  );
}

export default App;