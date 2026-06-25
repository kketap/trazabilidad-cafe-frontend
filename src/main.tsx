// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// BrowserRouter habilita el enrutamiento del lado del cliente para toda la aplicación.
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Envolvemos App con BrowserRouter para que todas las rutas de react-router-dom funcionen. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
