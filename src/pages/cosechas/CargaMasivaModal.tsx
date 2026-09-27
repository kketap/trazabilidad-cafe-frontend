// src/pages/cosechas/CargaMasivaModal.tsx
import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Modal,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Steps,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
  theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  FileExcelOutlined,
  InboxOutlined,
  UserOutlined,
} from "@ant-design/icons";

import type {
  FilaCosechaPreview,
  PreviewCargaMasivaResponse,
} from "./cosechas.api";
import {
  confirmarCargaMasivaApi,
  previewCargaMasivaApi,
} from "./cosechas.api";

interface CargaMasivaModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CargaMasivaModal({
  open,
  onClose,
  onSuccess,
}: CargaMasivaModalProps) {
  const { token } = theme.useToken();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [nombreArchivo, setNombreArchivo] = useState<string>("");
  const [previewData, setPreviewData] = useState<PreviewCargaMasivaResponse | null>(null);
  const [filas, setFilas] = useState<FilaCosechaPreview[]>([]);

  function resetState() {
    setCurrentStep(0);
    setAnalyzing(false);
    setSubmitting(false);
    setNombreArchivo("");
    setPreviewData(null);
    setFilas([]);
  }

  function handleClose() {
    if (analyzing || submitting) return;
    resetState();
    onClose();
  }

  async function handleFileSelect(file: File) {
    setNombreArchivo(file.name);
    setAnalyzing(true);

    const hideLoading = message.loading({
      content: "Analizando y validando archivo Excel...",
      key: "preview-loading",
      duration: 0,
    });

    try {
      const data = await previewCargaMasivaApi(file);
      hideLoading();

      setPreviewData(data);
      setFilas(data.filas);
      setCurrentStep(1); // Pasar al paso de previsualización
    } catch (error: any) {
      hideLoading();
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Error al leer y validar el archivo Excel.";
      message.error({
        content: errorMsg,
        key: "preview-loading",
        duration: 5,
      });
    } finally {
      setAnalyzing(false);
    }
  }

  function handleEliminarFila(index: number) {
    const nuevasFilas = filas.filter((_, i) => i !== index);
    setFilas(nuevasFilas);
    message.info("Fila descartada de la previsualización.");
  }

  // Métricas calculadas en tiempo real de las filas visibles
  const filasValidas = filas.filter((f) => f.esValida);
  const filasConError = filas.filter((f) => !f.esValida);
  const totalKilos = filas.reduce((acc, f) => acc + (f.kilosRecolectados || 0), 0);
  const gruposEstimados = new Set(filas.map((f) => `${f.fecha}__${f.tipoCosecha}`)).size;
  const tieneErrores = filasConError.length > 0;

  async function handleConfirmarCarga() {
    if (filas.length === 0) {
      message.warning("No hay filas para importar.");
      return;
    }

    if (tieneErrores) {
      message.error("Debes eliminar las filas con error antes de confirmar la carga.");
      return;
    }

    setSubmitting(true);
    const hideLoading = message.loading({
      content: "Guardando cosechas en la base de datos...",
      key: "confirm-loading",
      duration: 0,
    });

    try {
      const payload = filas.map((f) => ({
        filaNumero: f.filaNumero,
        fecha: f.fecha,
        tipoCosecha: f.tipoCosecha,
        trabajadorDni: f.trabajadorDni,
        kilosRecolectados: f.kilosRecolectados,
        codigosLotes: f.codigosLotes,
        totalHectareas: f.totalHectareas,
        varietal: f.varietal,
      }));

      const res = await confirmarCargaMasivaApi(payload);
      hideLoading();

      message.success({
        content: `¡Carga exitosa! Se procesaron ${res.totalFilasProcesadas} filas y se crearon ${res.totalGruposCreados} cosechas.`,
        key: "confirm-loading",
        duration: 4,
      });

      handleClose();
      onSuccess();
    } catch (error: any) {
      hideLoading();
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Error al confirmar la carga masiva.";
      message.error({
        content: errorMsg,
        key: "confirm-loading",
        duration: 5,
      });
    } finally {
      setSubmitting(false);
    }
  }

  function getTipoCosechaColor(tipo?: string) {
    switch (tipo?.toLowerCase()) {
      case "selectiva":
        return "gold";
      case "rebusca":
        return "purple";
      case "plena":
      default:
        return "green";
    }
  }

  const columns: ColumnsType<FilaCosechaPreview> = [
    {
      title: "# Fila",
      dataIndex: "filaNumero",
      key: "filaNumero",
      width: 70,
      align: "center",
      render: (num: number) => <Typography.Text type="secondary">{num}</Typography.Text>,
    },
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      width: 110,
    },
    {
      title: "Tipo",
      dataIndex: "tipoCosecha",
      key: "tipoCosecha",
      width: 100,
      render: (tipo: string) => (
        <Tag color={getTipoCosechaColor(tipo)} style={{ textTransform: "capitalize" }}>
          {tipo}
        </Tag>
      ),
    },
    {
      title: "Trabajador",
      key: "trabajador",
      width: 200,
      render: (_: unknown, record: FilaCosechaPreview) => {
        if (record.trabajadorExiste) {
          return (
            <Tag icon={<UserOutlined />} color="blue">
              {record.trabajadorNombre || record.trabajadorDni}
            </Tag>
          );
        }

        return (
          <Tooltip title="Este DNI no existe en el registro de Trabajadores">
            <Tag icon={<CloseCircleOutlined />} color="error">
              DNI: {record.trabajadorDni} (No existe)
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Lotes",
      key: "lotes",
      width: 160,
      render: (_: unknown, record: FilaCosechaPreview) => (
        <Space wrap orientation="horizontal" size={[4, 4]}>
          {record.lotesValidos.map((lote) =>
            lote.existe ? (
              <Tag key={lote.codigo} color="geekblue">
                {lote.codigo}
              </Tag>
            ) : (
              <Tooltip key={lote.codigo} title={`El lote '${lote.codigo}' no está registrado`}>
                <Tag color="error">
                  {lote.codigo} (No existe)
                </Tag>
              </Tooltip>
            )
          )}
        </Space>
      ),
    },
    {
      title: "Kilos",
      dataIndex: "kilosRecolectados",
      key: "kilosRecolectados",
      width: 110,
      align: "right",
      render: (kg: number) => (
        <Typography.Text strong style={{ color: kg > 0 ? token.colorText : token.colorError }}>
          {Number(kg || 0).toLocaleString("es-CL")} kg
        </Typography.Text>
      ),
    },
    {
      title: "Hectáreas",
      dataIndex: "totalHectareas",
      key: "totalHectareas",
      width: 100,
      align: "right",
      render: (ha: number) => `${ha ?? 0} ha`,
    },
    {
      title: "Varietal",
      dataIndex: "varietal",
      key: "varietal",
      width: 100,
      render: (v: string | null) => v || <Typography.Text type="secondary">-</Typography.Text>,
    },
    {
      title: "Estado",
      key: "estado",
      width: 110,
      align: "center",
      render: (_: unknown, record: FilaCosechaPreview) =>
        record.esValida ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Válido
          </Tag>
        ) : (
          <Tooltip title={record.errores.join(" | ")}>
            <Tag icon={<ExclamationCircleOutlined />} color="error" style={{ cursor: "pointer" }}>
              Error
            </Tag>
          </Tooltip>
        ),
    },
    {
      title: "Acción",
      key: "accion",
      width: 80,
      align: "center",
      render: (_: unknown, __: FilaCosechaPreview, index: number) => (
        <Popconfirm
          title="¿Descartar fila?"
          description="Se quitará esta fila de la carga masiva."
          onConfirm={() => handleEliminarFila(index)}
          okText="Quitar"
          cancelText="Cancelar"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            title="Quitar esta fila"
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space align="center">
          <FileExcelOutlined style={{ color: "#52c41a", fontSize: 22 }} />
          <span>Carga Masiva de Cosechas</span>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      destroyOnClose
      width={currentStep === 0 ? 600 : "min(1100px, 95vw)"}
      style={{ top: 20 }}
      footer={
        currentStep === 0 ? (
          <Button onClick={handleClose}>Cancelar</Button>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => setCurrentStep(0)}
              disabled={submitting}
            >
              Cambiar Archivo
            </Button>

            <Space>
              <Button onClick={handleClose} disabled={submitting}>
                Cancelar
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={submitting}
                disabled={filas.length === 0 || tieneErrores}
                onClick={handleConfirmarCarga}
                style={{
                  backgroundColor:
                    filas.length > 0 && !tieneErrores && !submitting
                      ? "#52c41a"
                      : undefined,
                  borderColor:
                    filas.length > 0 && !tieneErrores && !submitting
                      ? "#52c41a"
                      : undefined,
                }}
              >
                {tieneErrores
                  ? "Corrige los errores para importar"
                  : `Confirmar e Importar (${filas.length} registros)`}
              </Button>
            </Space>
          </div>
        )
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
        <Steps
          current={currentStep}
          size="small"
          items={[
            { title: "Seleccionar Archivo" },
            { title: "Previsualizar y Validar" },
          ]}
        />

        {/* PASO 0: SUBIDA Y SELECCIÓN DE ARCHIVO */}
        {currentStep === 0 && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                backgroundColor: token.colorFillAlter,
                borderRadius: 8,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <div>
                <Typography.Text strong style={{ display: "block" }}>
                  Plantilla Oficial de Cosechas
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  Descarga el formato Excel (.xlsx) con la estructura de columnas requerida.
                </Typography.Text>
              </div>
              <Button
                type="primary"
                ghost
                icon={<DownloadOutlined />}
                href="/Plantilla_Cosecha.xlsx"
                download="Plantilla_Cosecha.xlsx"
              >
                Descargar Plantilla
              </Button>
            </div>

            <Upload.Dragger
              name="file"
              multiple={false}
              showUploadList={false}
              accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              beforeUpload={(file) => {
                const isExcel =
                  file.name.endsWith(".xlsx") ||
                  file.name.endsWith(".xls") ||
                  file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                  file.type === "application/vnd.ms-excel";

                if (!isExcel) {
                  message.error("Solo se permiten archivos Excel (.xlsx o .xls)");
                  return Upload.LIST_IGNORE;
                }

                handleFileSelect(file);
                return false;
              }}
              disabled={analyzing}
              style={{ padding: "32px 16px" }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 52, color: token.colorPrimary }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 16, fontWeight: 500 }}>
                {analyzing
                  ? "Analizando archivo..."
                  : "Haz clic o arrastra tu archivo Excel aquí"}
              </p>
              <p className="ant-upload-hint" style={{ color: token.colorTextSecondary, fontSize: 13 }}>
                El sistema validará automáticamente los trabajadores y lotes contra la base de datos y te mostrará una previsualización antes de guardar.
              </p>
            </Upload.Dragger>
          </>
        )}

        {/* PASO 1: PREVISUALIZACIÓN Y CONFIRMACIÓN */}
        {currentStep === 1 && (
          <>
            {/* Alerta de Estado */}
            {tieneErrores ? (
              <Alert
                message={`Se detectaron ${filasConError.length} fila(s) con datos no encontrados en la base de datos`}
                description="Los trabajadores o códigos de lote en color rojo no existen en el sistema. Puedes eliminar las filas con error presionando el ícono de papelera (Acción) para continuar con las filas válidas."
                type="error"
                showIcon
              />
            ) : (
              <Alert
                message="¡Validación completada con éxito!"
                description="Todos los trabajadores y lotes fueron encontrados en el sistema. Revisa el resumen y presiona 'Confirmar e Importar'."
                type="success"
                showIcon
              />
            )}

            {/* Tarjetas de Resumen */}
            <Row gutter={[12, 12]}>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ borderRadius: 8, textAlign: "center" }}>
                  <Statistic
                    title="Total Registros"
                    value={filas.length}
                    suffix={`(${filasValidas.length} válidos)`}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ borderRadius: 8, textAlign: "center" }}>
                  <Statistic
                    title="Kilos Totales"
                    value={totalKilos}
                    precision={1}
                    suffix="kg"
                    valueStyle={{ color: token.colorPrimary }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ borderRadius: 8, textAlign: "center" }}>
                  <Statistic
                    title="Cosechas Estimadas"
                    value={gruposEstimados}
                    suffix="grupos"
                    valueStyle={{ color: "#722ed1" }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small" style={{ borderRadius: 8, textAlign: "center" }}>
                  <Statistic
                    title="Filas con Error"
                    value={filasConError.length}
                    valueStyle={{ color: tieneErrores ? token.colorError : token.colorSuccess }}
                    prefix={tieneErrores ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Tabla con detalle de filas */}
            <Table
              dataSource={filas}
              columns={columns}
              rowKey="filaNumero"
              size="small"
              pagination={{ pageSize: 8, showSizeChanger: false }}
              scroll={{ x: 900, y: 340 }}
              rowClassName={(record) => (!record.esValida ? "ant-table-row-error" : "")}
            />
          </>
        )}
      </div>
    </Modal>
  );
}
