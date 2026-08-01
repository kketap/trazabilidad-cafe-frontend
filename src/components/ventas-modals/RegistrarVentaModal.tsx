// src/components/ventas-modals/RegistrarVentaModal.tsx
import { useEffect, useMemo } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Space,
  Divider,
  Alert,
  Typography,
  Tag,
} from "antd";
import {
  DollarOutlined,
  FileTextOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Cliente } from "../../pages/clientes/clientes.api";
import type { OrdenTrilla } from "../../pages/trilla/trilla.api";
import type { CreateVentaDTO, UpdateVentaDTO, Venta } from "../../pages/ventas/ventas.api";

const { Text } = Typography;

const PRODUCTO_OPTIONS = [
  { value: "Café verde primera", label: "Café verde primera" },
  { value: "Café verde segunda", label: "Café verde segunda" },
  { value: "Café verde especial", label: "Café verde especial" },
  { value: "Café verde exportación", label: "Café verde exportación" },
  { value: "Café verde premium", label: "Café verde premium" },
  { value: "Café verde estándar", label: "Café verde estándar" },
];

const PRESENTACION_OPTIONS = [
  { value: "69", label: "Saco 69 kg" },
  { value: "23", label: "Saco 23 kg" },
  { value: "46", label: "Saco 46 kg" },
  { value: "30", label: "Saco 30 kg" },
  { value: "60", label: "Saco 60 kg" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVentaDTO | UpdateVentaDTO, id?: string) => void;
  clientes: Cliente[];
  ordenes: OrdenTrilla[];
  ventas: Venta[];
  editingVenta: Venta | null;
  loading?: boolean;
};

function calcularStockRestante(
  orden: OrdenTrilla,
  ventas: Venta[],
  excludeVentaId?: string
): number {
  const kilosYaVendidos = ventas
    .filter((v) => v.ordenTrillaId === orden.id && v.id !== excludeVentaId)
    .reduce((acc, v) => acc + (v.kilosVendidos || 0), 0);
  return (orden.kilosNetos ?? 0) - kilosYaVendidos;
}

export default function RegistrarVentaModal({
  open,
  onClose,
  onSubmit,
  clientes,
  ordenes,
  ventas,
  editingVenta,
  loading,
}: Props) {
  const [form] = Form.useForm();
  const isEditing = editingVenta !== null;

  // Orden actualmente seleccionada en el formulario
  const ordenIdWatch = Form.useWatch("ordenTrillaId", form);
  const kilosVendidosWatch = Form.useWatch("kilosVendidos", form);

  const ordenSeleccionada = useMemo(
    () => ordenes.find((o) => o.id === ordenIdWatch) ?? null,
    [ordenes, ordenIdWatch]
  );

  const stockRestante = ordenSeleccionada
    ? calcularStockRestante(ordenSeleccionada, ventas, editingVenta?.id)
    : null;
  const stockSuperado =
    stockRestante !== null &&
    kilosVendidosWatch !== undefined &&
    kilosVendidosWatch > stockRestante;

  useEffect(() => {
    if (open) {
      if (isEditing && editingVenta) {
        form.setFieldsValue({
          fechaVenta: dayjs(editingVenta.fechaVenta),
          producto: editingVenta.producto,
          kilosVendidos: editingVenta.kilosVendidos,
          presentacionSacos: editingVenta.presentacionSacos,
          precioVentaKilo: editingVenta.precioVentaKilo,
          precioCompra: editingVenta.precioCompra ?? undefined,
          numeroFactura: editingVenta.numeroFactura ?? undefined,
          numeroGuiaRemision: editingVenta.numeroGuiaRemision ?? undefined,
          fincaOrigen: editingVenta.fincaOrigen ?? undefined,
          clienteId: editingVenta.clienteId,
          ordenTrillaId: editingVenta.ordenTrillaId,
        });
      } else {
        form.resetFields();
        form.setFieldValue("fechaVenta", dayjs());
      }
    }
    if (!open) form.resetFields();
  }, [open, editingVenta, isEditing, form]);

  const handleFinish = (values: any) => {
    const payload: CreateVentaDTO = {
      fechaVenta: values.fechaVenta
        ? values.fechaVenta.toISOString()
        : new Date().toISOString(),
      producto: values.producto,
      kilosVendidos: Number(values.kilosVendidos),
      presentacionSacos: values.presentacionSacos,
      precioVentaKilo: Number(values.precioVentaKilo),
      precioCompra: values.precioCompra ? Number(values.precioCompra) : null,
      numeroFactura: values.numeroFactura?.trim() || null,
      numeroGuiaRemision: values.numeroGuiaRemision?.trim() || null,
      fincaOrigen: values.fincaOrigen?.trim() || null,
      clienteId: Number(values.clienteId),
      ordenTrillaId: values.ordenTrillaId,
    };
    onSubmit(payload, editingVenta?.id);
  };

  // Órdenes con stock restante > 0, o la orden de la venta en edición
  const ordenesDisponibles = ordenes.filter((o) => {
    if (o.kilosNetos == null) return false;
    const restante = calcularStockRestante(o, ventas, editingVenta?.id);
    return restante > 0 || (isEditing && editingVenta?.ordenTrillaId === o.id);
  });

  const totalVenta =
    kilosVendidosWatch && form.getFieldValue("precioVentaKilo")
      ? kilosVendidosWatch * form.getFieldValue("precioVentaKilo")
      : 0;

  return (
    <Modal
      title={
        <Space>
          <DollarOutlined style={{ color: "#52c41a" }} />
          <span>{isEditing ? "Editar Venta" : "Registrar Venta"}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={isEditing ? "Guardar Cambios" : "Registrar Venta"}
      cancelText="Cancelar"
      confirmLoading={loading}
      width={700}
      destroyOnClose
    >
      {!isEditing && (
        <Alert
          type="info"
          showIcon
          message="Solo se muestran órdenes de trilla que ya tienen kilos netos registrados. Los campos de factura y guía de remisión pueden completarse después."
          style={{ marginBottom: 20 }}
        />
      )}

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {/* Datos comerciales */}
        <Divider style={{ fontSize: 13 }}>
          Datos de la Venta
        </Divider>

        <Space style={{ width: "100%" }} size={16}>
          <Form.Item
            label="Fecha de Venta"
            name="fechaVenta"
            rules={[{ required: true, message: "Seleccione la fecha" }]}
            style={{ flex: 1 }}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder="Seleccionar fecha..."
            />
          </Form.Item>

          <Form.Item
            label="Finca de Origen"
            name="fincaOrigen"
            style={{ flex: 1 }}
          >
            <Input
              placeholder="Ej: Finca El Rosal"
              prefix={<ShopOutlined />}
              allowClear
            />
          </Form.Item>
        </Space>

        <Form.Item
          label="Producto"
          name="producto"
          rules={[{ required: true, message: "Seleccione el tipo de producto" }]}
        >
          <Select
            placeholder="Seleccionar tipo de café..."
            options={PRODUCTO_OPTIONS}
            showSearch
            allowClear
          />
        </Form.Item>

        {/* Selección de cliente y orden de trilla */}
        <Divider style={{ fontSize: 13 }}>
          Cliente y Origen
        </Divider>

        <Form.Item
          label="Cliente"
          name="clienteId"
          rules={[{ required: true, message: "Seleccione un cliente" }]}
        >
          <Select
            placeholder="Seleccionar cliente..."
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={clientes.map((c) => ({
              value: c.id,
              label: `${c.nombre} (${c.dniRut})`,
            }))}
            notFoundContent={
              <Text type="secondary">No hay clientes registrados</Text>
            }
          />
        </Form.Item>

        <Form.Item
          label="Orden de Trilla"
          name="ordenTrillaId"
          rules={[{ required: true, message: "Seleccione una orden de trilla" }]}
          extra={
            ordenSeleccionada ? (
              <Space style={{ marginTop: 4 }}>
                <Text type="secondary">Stock restante:</Text>
                <Text
                  strong
                  style={{ color: stockSuperado ? "#ff4d4f" : "#52c41a" }}
                >
                  {stockRestante?.toLocaleString()} kg
                </Text>
                {stockSuperado && (
                  <Tag color="error">Kilos exceden el stock</Tag>
                )}
              </Space>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Solo se muestran órdenes con kilos netos registrados
              </Text>
            )
          }
        >
          <Select
            placeholder="Seleccionar orden de trilla..."
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={ordenesDisponibles.map((o) => {
              const restante = calcularStockRestante(o, ventas, editingVenta?.id);
              return {
                value: o.id,
                label: `${o.codigoTrilla} — Stock: ${restante.toLocaleString()} kg${o.calidad ? ` | ${o.calidad}` : ""}`,
              };
            })}
            notFoundContent={
              <Text type="secondary">
                No hay órdenes con kilos netos disponibles
              </Text>
            }
          />
        </Form.Item>

        {/* Kilos y presentación */}
        <Divider style={{ fontSize: 13 }}>
          Cantidades y Precio
        </Divider>

        <Space style={{ width: "100%" }} size={16}>
          <Form.Item
            label="Kilos Vendidos"
            name="kilosVendidos"
            rules={[
              { required: true, message: "Ingrese los kilos vendidos" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (stockRestante !== null && value > stockRestante) {
                    return Promise.reject(
                      `No puede superar el stock restante (${stockRestante} kg)`
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
            style={{ flex: 1 }}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Ej: 300"
              min={0.1}
              step={0.5}
              precision={2}
              addonAfter="kg"
            />
          </Form.Item>

          <Form.Item
            label="Presentación de Saco"
            name="presentacionSacos"
            rules={[{ required: true, message: "Seleccione la presentación" }]}
            style={{ flex: 1 }}
          >
            <Select placeholder="Seleccionar presentación..." options={PRESENTACION_OPTIONS} />
          </Form.Item>
        </Space>

        <Space style={{ width: "100%" }} size={16}>
          <Form.Item
            label="Precio de Venta por Kilo"
            name="precioVentaKilo"
            rules={[{ required: true, message: "Ingrese el precio de venta" }]}
            style={{ flex: 1 }}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Ej: 8.50"
              min={0.01}
              step={0.1}
              precision={2}
              addonBefore="$"
            />
          </Form.Item>

          <Form.Item label="Precio de Compra (opcional)" name="precioCompra" style={{ flex: 1 }}>
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Ej: 5.00"
              min={0.01}
              step={0.1}
              precision={2}
              addonBefore="$"
            />
          </Form.Item>
        </Space>

        {totalVenta > 0 && (
          <Alert
            type="success"
            showIcon
            message={
              <Space>
                <Text>Total estimado de la venta:</Text>
                <Text strong style={{ fontSize: 15 }}>
                  ${totalVenta.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </Text>
              </Space>
            }
            style={{ marginBottom: 12 }}
          />
        )}

        {/* Documentos */}
        <Divider style={{ fontSize: 13 }}>
          Documentos (opcionales)
        </Divider>

        <Space style={{ width: "100%" }} size={16}>
          <Form.Item label="Número de Factura" name="numeroFactura" style={{ flex: 1 }}>
            <Input
              placeholder="Ej: F001-000123"
              prefix={<FileTextOutlined />}
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="Número de Guía de Remisión"
            name="numeroGuiaRemision"
            style={{ flex: 1 }}
          >
            <Input
              placeholder="Ej: T001-000456"
              prefix={<FileTextOutlined />}
              allowClear
            />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
}
