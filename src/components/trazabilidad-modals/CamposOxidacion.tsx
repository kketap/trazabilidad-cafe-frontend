import { Col, DatePicker, Divider, Form, Input, Row, Typography } from "antd";
import type { Dayjs } from "dayjs";

export default function CamposOxidacion() {
    const form = Form.useFormInstance();
    const inicio = Form.useWatch<Dayjs>("inicioOxidacion", form);
    const fin = Form.useWatch<Dayjs>("finOxidacion", form);
    const minutos = inicio && fin ? fin.diff(inicio, "minute") : null;
    return (
        <>
            <Divider titlePlacement="left" orientationMargin={0}>
                <Typography.Text strong>Oxidación</Typography.Text>
            </Divider>
            <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                    <Form.Item label="Inicio de oxidación" name="inicioOxidacion">
                        <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Fin de oxidación" name="finOxidacion" dependencies={["inicioOxidacion"]}
                        rules={[{ validator: (_, valor: Dayjs | null) =>
                            !valor || (inicio && valor.isAfter(inicio))
                                ? Promise.resolve()
                                : Promise.reject(new Error("El fin debe ser posterior al inicio")) }]}
                    >
                        <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Duración de oxidación">
                        <Input readOnly value={minutos != null && minutos >= 0 ? `${Math.floor(minutos / 60)} h ${minutos % 60} min` : "—"} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item name="tanqueOxidacion" label="Posa / Tanque de oxidación">
                        <Input />
                    </Form.Item>
                </Col>
            </Row>
        </>
    );
}
