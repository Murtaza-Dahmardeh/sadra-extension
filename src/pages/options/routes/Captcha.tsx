import React, { useEffect, useState } from "react";
import { Card, Grid, Space, Typography, Tag, Input, Button, Message } from "@arco-design/web-react";
import { IconFile, IconUser, IconRefresh } from "@arco-design/web-react/icon";
import { CaptchaItem } from "@App/app/repo/captcha";
import { formatUnixTime } from "@App/pkg/utils/day_format";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Row, Col } = Grid;

const Captcha: React.FC = () => {
  const [captchas, setCaptchas] = useState<CaptchaItem[]>([]);
  const [editKeys, setEditKeys] = useState<{ [key: string]: string }>({});
  const [secondsLeft, setSecondsLeft] = useState(120);
  const { t } = useTranslation();

  useEffect(() => {
    fetchCaptchas();
    setSecondsLeft(120);
    const refreshInterval = setInterval(() => {
      fetchCaptchas();
      setSecondsLeft(120);
    }, 120000); // 2 minutes
    const countdownInterval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  // Helper to get a unique edit key for each captcha
  const getEditKey = (item: CaptchaItem) => `${item.key}-${item.createtime}`;

  const fetchCaptchas = async () => {
    const { CaptchaDAO } = require("@App/app/repo/captcha");
    const captchaDAO = new CaptchaDAO();
    // Remove captchas older than 1 hour (Dexie.js syntax)
    const oneHourAgo = Date.now() - 3600 * 1000;
    await captchaDAO.table.where('createtime').below(oneHourAgo).delete();
    // Fetch remaining captchas
    captchaDAO.find().toArray().then((data: CaptchaItem[]) => {
      setCaptchas(data.sort((a, b) => (b.createtime || 0) - (a.createtime || 0)));
    });
  };

  const handleKeyChange = (editKey: string, newValue: string) => {
    setEditKeys((prev) => ({ ...prev, [editKey]: newValue.toUpperCase() }));
  };

  const handleUpdateKey = async (item: CaptchaItem) => {
    const { CaptchaDAO } = require("@App/app/repo/captcha");
    const captchaDAO = new CaptchaDAO();
    const editKey = getEditKey(item);
    const newKey = editKeys[editKey] ?? item.value;
    // Update the captcha: change key and set isCorrect to true
    await captchaDAO.save({ ...item, value: newKey.toUpperCase(), isCorrect: true });
    Message.success(t("update_success") || "Updated successfully");
    // Refresh list
    fetchCaptchas();
  };

  return (
    <Space direction="vertical" style={{ width: "100%", height: "100%", overflow: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <Title heading={5} style={{ margin: 0 }}><IconFile /> {t("captcha")}</Title>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button icon={<IconRefresh />} onClick={() => { fetchCaptchas(); setSecondsLeft(120); }} type="secondary" size="small">
            {t("refresh") || "Refresh"}
          </Button>
          <span style={{ minWidth: 48, textAlign: "right", color: '#888' }}>
            {secondsLeft}s
          </span>
        </div>
      </div>
      <Row gutter={16} style={{ width: "100%" }}>
        {captchas.map((item, idx) => (
          <Col key={item.key + '-' + item.value + '-' + item.createtime + '-' + idx} span={6} style={{ marginBottom: 16 }}>
            <Card
              hoverable
              style={{ textAlign: "center" }}
              cover={
                item.image ? (
                  <img
                    src={`data:image/png;base64,${item.image}`}
                    alt={item.key}
                    style={{ width: "100%", height: 80, objectFit: "contain", borderRadius: 8 }}
                  />
                ) : (
                  <div style={{ width: "100%", height: 140, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", borderRadius: 8 }}>
                    <IconUser style={{ fontSize: 48, color: "#bbb" }} />
                  </div>
                )
              }
            >
              <div style={{ marginBottom: 8 }}>
                <Input.Group compact style={{ display: "flex" }}>
                  <Input
                    value={editKeys[getEditKey(item)] ?? item.value}
                    onChange={(val) => handleKeyChange(getEditKey(item), val)}
                    onPressEnter={() => handleUpdateKey(item)}
                  />
                  <Button type="primary" onClick={() => handleUpdateKey(item)}>
                    {t("update") || "Update"}
                  </Button>
                </Input.Group>
              </div>
              <Space direction="horizontal" size="small" style={{ width: "100%" }}>
                <Tag color={item.isCorrect ? "green" : "red"}>{t("Correct")}: {item.isCorrect ? t("yes") : t("no")}</Tag>
                <Tag color="gray">{t("From")}: {dayjs(item.createtime).fromNow()}</Tag>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
};

export default Captcha; 