import React, { useEffect, useState } from "react";
import { Card, Grid, Space, Typography, Tag, Badge } from "@arco-design/web-react";
import { IconFile, IconUser } from "@arco-design/web-react/icon";
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
              <Space direction="horizontal" size="small" style={{ width: "100%" }}>
              <Badge text={item.isAuto ? t("Auto") : t("Manual")} status='error'/>
              {item.isKabul && <Badge text={t("Kabul")} status='success'/>}
              {item.isJalal && <Badge text={t("Jalal")} status='processing'/>}
              {item.order > 0 ? <Badge text={item.order.toString()} status='success'/> : null}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
};

export default Forms; 