import React, { useState, useEffect } from "react";
import { Card, Input, Button, Space, Message, Spin } from "@arco-design/web-react";
import { useTranslation } from "react-i18next";

// Helper to get the unique device id from chrome.storage.local
async function getDeviceId(): Promise<string | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["__cat_bg_color"], (result) => {
      resolve(result["__cat_bg_color"]);
    });
  });
}

// Helper to store the API key in chrome.storage.local
async function storeApiKey(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ __cat_api_key: apiKey }, () => resolve());
  });
}

// Helper to get the API key from chrome.storage.local
async function getApiKey(): Promise<string | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["__cat_api_key"], (result) => {
      resolve(result["__cat_api_key"]);
    });
  });
}

const UserKeyInstall: React.FC = () => {
  const { t } = useTranslation();
  const [userKey, setUserKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [activationStatus, setActivationStatus] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getApiKey().then((key) => {
      if (key) setActivated(true);
    });
  }, []);

  // Function to activate API key
  const handleActivateApiKey = async () => {
    if (!userKey) {
      Message.error("Please enter a user key.");
      return;
    }
    setLoading(true);
    setActivationStatus(null);
    try {
      const deviceId = await getDeviceId();
      if (!deviceId) throw new Error("Device ID not found. Please reinstall the extension.");
      const activateResp = await fetch("https://ivbs.sadratechs.com/api/activate-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: userKey, device_id: deviceId }),
      });
      if (!activateResp.ok) {
        const err = await activateResp.text();
        throw new Error("API key activation failed: " + err);
      }
      await storeApiKey(userKey);
      setActivated(true);
      setActivationStatus("success");
      Message.success("API key activated successfully!");
    } catch (e: any) {
      setActivationStatus("error");
      Message.error(e.message || "API key activation failed");
    } finally {
      setLoading(false);
    }
  };

  // Function to download and install script
  const handleDownloadScript = async () => {
    setDownloading(true);
    setDownloadStatus(null);
    try {
      // Get API key and device ID
      const apiKey = await getApiKey();
      const deviceId = await getDeviceId();
      if (!apiKey) throw new Error("API key not found. Please activate first.");
      if (!deviceId) throw new Error("Device ID not found. Please reinstall the extension.");
      // Download script from static URL with required headers
      const scriptResp = await fetch("https://ivbs.sadratechs.com/download/resources", {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-Device-ID': deviceId,
        },
      });
      if (!scriptResp.ok) throw new Error("Failed to download resource");
      const scriptText = await scriptResp.text();
      // Install script
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            action: "serviceWorker/install_script_by_code",
            data: {
              code: scriptText,
              source: "user",
            },
          },
          (result) => {
            if (result.data.success) {
              resolve(result);
            } else {
              reject(result.data.error);
            }
          }
        );
      });
      setDownloadStatus("success");
      Message.success("Application installed successfully!");
    } catch (e: any) {
      setDownloadStatus("error");
      Message.error(e.message || "Failed to install Application");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="user-key-install" title={t("Install Application by User Key") || "Install Application by User Key"} bordered={false} style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        {!activated && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Input
              placeholder="Enter user key"
              value={userKey}
              onChange={setUserKey}
              style={{ flex: 1 }}
              disabled={loading}
            />
            <Button
              type="primary"
              loading={loading}
              onClick={handleActivateApiKey}
              disabled={!userKey || loading}
            >
              Submit
            </Button>
            {loading && <Spin style={{ marginLeft: 8 }} />}
            {activationStatus === "success" && <span style={{ color: "green", marginLeft: 8 }}>Activated!</span>}
            {activationStatus === "error" && <span style={{ color: "red", marginLeft: 8 }}>Activation Failed!</span>}
          </div>
        )}
        {activated && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Button
              type="primary"
              loading={downloading}
              onClick={handleDownloadScript}
              disabled={downloading}
            >
              Perform Auto Installation
            </Button>
            {downloading && <Spin style={{ marginLeft: 8 }} />}
            {downloadStatus === "success" && <span style={{ color: "green", marginLeft: 8 }}>Success!</span>}
            {downloadStatus === "error" && <span style={{ color: "red", marginLeft: 8 }}>Failed!</span>}
          </div>
        )}
      </Space>
    </Card>
  );
};

export default UserKeyInstall; 