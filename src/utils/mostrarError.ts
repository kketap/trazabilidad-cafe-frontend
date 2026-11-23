import { notification } from "antd";
import { mensajeParaUsuario } from "./mensajeParaUsuario";

export function mostrarError(descripcion: string) {
    notification.error({ title: "Error", description: mensajeParaUsuario(descripcion), duration: 0 });
}