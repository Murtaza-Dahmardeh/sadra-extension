import React, { useEffect, useState } from "react";
import { Form, Input, InputNumber, Button, Space, Typography, Upload, Switch, Message } from "@arco-design/web-react";
import Row from "@arco-design/web-react/es/Grid/row";
import Col from "@arco-design/web-react/es/Grid/col";
import { IconArrowLeft, IconUser, IconUpload } from "@arco-design/web-react/icon";
import { FormsItem } from "@App/app/repo/forms";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

const fieldLabels: Record<string, string> = {
  name: "Name",
  lastname: "Last Name",
  fathername: "Father Name",
  gender: "Gender",
  birth: "Birth Date",
  passport: "Passport",
  issue: "Issue Place",
  expire: "Expire Date",
  job: "Job",
  mobile: "Mobile",
  iranPhone: "Iran Phone",
  address: "Address",
  iranAddress: "Iran Address",
  duration: "Duration",
  entry: "Entry",
  purpose: "Purpose",
  arrival: "Arrival",
  departure: "Departure",
  photo: "Photo",
  pass: "Passport Image",
  tsf: "TSF Image",
  tsb: "TSB Image",
  update: "Update Image",
  isAuto: "Auto Fill",
  isKabul: "Kabul",
  isJalal: "Jalal",
  order: "Order",
  createtime: "Create Time",
  updatetime: "Update Time",
};

const imageFields = ["photo", "pass", "tsf", "tsb", "update"];
const switchFields = ["isAuto", "isKabul", "isJalal"];

const FormsDetail: React.FC = () => {
  const { key } = useParams<{ key: string }>();
  const [form, setForm] = useState<FormsItem | null>(null);
  const [formState, setFormState] = useState<Partial<FormsItem>>({});
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Save handler for switches and order
  const updateField = (field: keyof FormsItem, value: any) => {
    setFormState((prev) => {
      const updated = { ...prev, [field]: value };
      if (key) {
        const { FormsDAO } = require("@App/app/repo/forms");
        const formsDAO = new FormsDAO();
        formsDAO.save({ ...(form as FormsItem), ...updated });
      }
      return updated;
    });
  };

  // Save to DB on button click
  const handleUpdate = async () => {
    if (key) {
      const { FormsDAO } = require("@App/app/repo/forms");
      const formsDAO = new FormsDAO();
      await formsDAO.save({ ...(form as FormsItem), ...formState });
      Message.success(t("update_success") || "Updated successfully");
    }
  };

  useEffect(() => {
    if (key) {
      // Instantiate FormsDAO only after first render
      const { FormsDAO } = require("@App/app/repo/forms");
      const formsDAO = new FormsDAO();
      formsDAO.findOne({ key }).then((data: FormsItem) => {
        setForm(data || null);
        setFormState(data || {});
      });
    }
  }, [key]);

  if (!form) {
    return <Typography.Text type="secondary">{t("loading")}</Typography.Text>;
  }

  // Show all image fields at the top in a row of five columns
  const imageItems = imageFields
    .map((imgField) =>
      formState[imgField as keyof FormsItem]
        ? (
            <Col span={6} key={imgField} style={{ marginBottom: 16 }}>
              <Form.Item label={fieldLabels[imgField] || imgField} style={{ maxWidth: 400 }}>
                <img
                  src={String(formState[imgField as keyof FormsItem])}
                  alt={imgField}
                  style={{ width: "100%", maxWidth: 400, maxHeight: 180, objectFit: "cover", borderRadius: 8, marginBottom: 8 }}
                />
              </Form.Item>
            </Col>
          )
        : null
    )
    .filter(Boolean);

  // Prepare fields for 4-column layout (excluding image fields and excluded fields)
  const excludedFields = ["key", "id", "order", "isAuto", "isKabul", "isJalal", "createtime", "updatetime", ...imageFields];
  const fields = Object.entries(formState).filter(([k]) => !excludedFields.includes(k));
  const columns = 4;
  const rows = Math.ceil(fields.length / columns);
  const fieldGrid: Array<Array<[string, any]>> = Array.from({ length: rows }, (_, i) =>
    fields.slice(i * columns, i * columns + columns)
  );

  return (
    <Space direction="vertical" style={{ width: "100%", maxWidth: 1100, margin: "0 auto", height: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Space>
          <Button icon={<IconArrowLeft />} onClick={() => navigate(-1)} style={{ marginBottom: 0 }}>
            {t("back")}
          </Button>
          <Title heading={5} style={{ marginBottom: 0 }}>{form.name} {form.lastname}</Title>
        </Space>
        <Space>
          <Form layout="inline" style={{ width: "100%" }} size="mini">
            <Form.Item label={fieldLabels["order"]} style={{ marginBottom: 0, marginRight: 8 }}>
              <InputNumber
                min={0}
                value={formState.order as number}
                onChange={(val) => updateField("order", val)}
                style={{ width: 40 }}
              />
            </Form.Item>
            <Form.Item label={fieldLabels["isAuto"]} style={{ marginBottom: 0, marginRight: 8 }}>
              <Switch checked={!!formState.isAuto} onChange={(val) => updateField("isAuto", val)} />
            </Form.Item>
            <Form.Item label={fieldLabels["isKabul"]} style={{ marginBottom: 0, marginRight: 8 }}>
              <Switch checked={!!formState.isKabul} onChange={(val) => updateField("isKabul", val)} />
            </Form.Item>
            <Form.Item label={fieldLabels["isJalal"]} style={{ marginBottom: 0, marginRight: 8 }}>
              <Switch checked={!!formState.isJalal} onChange={(val) => updateField("isJalal", val)} />
            </Form.Item>
          </Form>
        </Space>
      </div>
      <div style={{ overflow: "auto", maxHeight: "calc(100vh - 120px)", paddingRight: 8 }}>
        <Form layout="vertical" style={{ width: "100%" }}>
          {/* Show all image fields at the top in a row of five columns */}
          {imageItems.length > 0 && (
            <Row gutter={16}>{imageItems}</Row>
          )}
          <Row>
            {fieldGrid.map((row, rowIdx) => (
              row.map(([k, v], colIdx) => (
                <Col span={6} key={k} style={{ marginBottom: 16 }}>
                  <Form.Item label={fieldLabels[k] || k} key={k}>
                    {typeof v === "boolean" ? (
                      <Input
                        type="text"
                        value={v ? "Yes" : "No"}
                        onChange={(val) => updateField(k as keyof FormsItem, val === "Yes")}
                      />
                    ) : (
                      <Input
                        value={v == null ? "" : String(v)}
                        onChange={(val) => updateField(k as keyof FormsItem, val)}
                      />
                    )}
                  </Form.Item>
                </Col>
              ))
            ))}
          </Row>
          <div style={{ textAlign: "right", marginBottom: 24 }}>
            <Button type="primary" onClick={handleUpdate}>{t("update") || "Update"}</Button>
          </div>
        </Form>
      </div>
    </Space>
  );
};

export default FormsDetail; 