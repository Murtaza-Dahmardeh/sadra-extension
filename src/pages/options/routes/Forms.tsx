import React, { useEffect, useState } from "react";
import { Card, Grid, Space, Typography, Tag, Badge, Button, Popconfirm, Message } from "@arco-design/web-react";
import { IconFile, IconUser, IconDelete } from "@arco-design/web-react/icon";
import { FormsItem } from "@App/app/repo/forms";
import { formatUnixTime } from "@App/pkg/utils/day_format";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Meta from "@arco-design/web-react/es/Card/meta";

const { Title, Text } = Typography;
const { Row, Col } = Grid;

const Forms: React.FC = () => {
  const [forms, setForms] = useState<FormsItem[]>([]);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    // Instantiate FormsDAO only after first render
    const { FormsDAO } = require("@App/app/repo/forms");
    const formsDAO = new FormsDAO();
    formsDAO.find().toArray().then((data: FormsItem[]) => {
      setForms(data.sort((a, b) => (b.updatetime || 0) - (a.updatetime || 0)));
    });
  }, []);

  const openDetails = (item: FormsItem) => {
    navigate(`/forms/${encodeURIComponent(item.key)}`);
  };

  const handleDelete = async (item: FormsItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    try {
      const { FormsDAO } = require("@App/app/repo/forms");
      const formsDAO = new FormsDAO();
      await formsDAO.delete({ key: item.key });
      
      // Remove the item from the local state
      setForms(prevForms => prevForms.filter(form => form.key !== item.key));
      
      Message.success(t("delete_success") || "Form deleted successfully");
    } catch (error) {
      console.error("Error deleting form:", error);
      Message.error(t("delete_error") || "Failed to delete form");
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%", height: "100%", overflow: "auto" }}>
      <Title heading={5} style={{ marginBottom: 16 }}><IconFile /> {t("forms")}</Title>
      <Row gutter={16} style={{ width: "100%" }}>
        {forms.map((item) => (
          <Col key={item.key} span={6} style={{ minWidth: 220, marginBottom: 16 }}>
            <Card
              hoverable
              style={{ cursor: "pointer" }}
              onClick={() => openDetails(item)}
              cover={
                item.photo ? (
                  <img
                    src={item.photo}
                    alt={item.name}
                    style={{ width: "100%", height: 215, objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: 140, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", borderRadius: 8 }}>
                    <IconUser style={{ fontSize: 48, color: "#bbb" }} />
                  </div>
                )
              }
            >
              <Meta
                title={item.name + " " + item.lastname}
                description={item.mobile}
              />
              <Space direction="horizontal" size="small" style={{ width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                <Space direction="horizontal" size="small">
                  <Badge text={item.isAuto ? t("Auto") : t("Manual")} status='error'/>
                  {item.isKabul && <Badge text={t("Kabul")} status='success'/>}
                  {item.isJalal && <Badge text={t("Jalal")} status='processing'/>}
                  {item.order > 0 ? <Badge text={item.order.toString()} status='success'/> : null}
                </Space>
                <Popconfirm
                  title={t("confirm_delete_form") || "Are you sure you want to delete this form?"}
                  icon={<IconDelete />}
                  onOk={(e) => handleDelete(item, e)}
                >
                  <Button 
                    type="text" 
                    iconOnly 
                    icon={<IconDelete />} 
                    status="danger"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
};

export default Forms; 