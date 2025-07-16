import { ExtVersion } from "@App/app/const";
import { Alert, Badge, Button, Card, Collapse, Dropdown, Menu, Switch, Input, Message, Spin } from "@arco-design/web-react";
import {
  IconBook,
  IconBug,
  IconGithub,
  IconMoreVertical,
  IconNotification,
  IconPlus,
  IconSearch,
  IconSettings,
  IconSync,
} from "@arco-design/web-react/icon";
import { useEffect, useMemo, useState, useCallback } from "react";
import { RiMessage2Line } from "react-icons/ri";
import semver from "semver";
import { useTranslation } from "react-i18next";
import ScriptMenuList from "../components/ScriptMenuList";
import { popupClient, scriptClient } from "../store/features/script";
import type { ScriptMenu } from "@App/app/service/service_worker/types";
import { systemConfig } from "../store/global";
import { localePath } from "@App/locales/locales";
import { isUserScriptsAvailable, getBrowserType, BrowserType } from "@App/pkg/utils/utils";

const CollapseItem = Collapse.Item;

const iconStyle = {
  marginRight: 8,
  fontSize: 16,
  transform: "translateY(1px)",
};

function App() {
  const [scriptList, setScriptList] = useState<ScriptMenu[]>([]);
  const [backScriptList, setBackScriptList] = useState<ScriptMenu[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [permissionReqResult, setPermissionReqResult] = useState("");
  const [checkUpdate, setCheckUpdate] = useState<Parameters<typeof systemConfig.setCheckUpdate>[0]>({
    version: ExtVersion,
    notice: "",
    isRead: false,
  });
  const [currentUrl, setCurrentUrl] = useState("");
  const [isEnableScript, setIsEnableScript] = useState(true);
  const [isBlacklist, setIsBlacklist] = useState(false);
  const { t } = useTranslation();

  // User key state and loading
  const [userKey, setUserKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  // Download and store script logic
  const handleUserKeySubmit = async () => {
    if (!userKey) {
      Message.error("Please enter a user key.");
      return;
    }
    setLoading(true);
    setDownloadStatus(null);
    try {
      // 1. POST user_key to server
      const resp = await fetch("http://localhost:3007/get-download-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_key: userKey }),
      });
      if (!resp.ok) throw new Error("Failed to get download URL");
      const data = await resp.json();
      if (!data.download_url) throw new Error("No download_url in response");
      // 2. Download script
      const scriptResp = await fetch(data.download_url);
      if (!scriptResp.ok) throw new Error("Failed to download script");
      const scriptText = await scriptResp.text();
      // 3. Store script (use background logic via message passing)
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
            // Debug: log the full result for troubleshooting
            console.log("install_script_by_code result", result, chrome.runtime.lastError);
            if (result.data.success) {
              resolve(result);
            } else {
              reject(result.data.error);
            }
          }
        );
      });
      setDownloadStatus("success");
      Message.success("Script installed successfully!");
    } catch (e: any) {
      setDownloadStatus("error");
      Message.error(e.message || "Failed to install script");
    } finally {
      setLoading(false);
    }
  };

  let url: URL | undefined;
  try {
    url = new URL(currentUrl);
  } catch (_: any) {
    // ignore error
  }

  useEffect(() => {
    let isMounted = true;

    const onCurrentUrlUpdated = (tabs: chrome.tabs.Tab[]) => {
      checkScriptEnableAndUpdate();
      popupClient
        .getPopupData({ url: tabs[0].url!, tabId: tabs[0].id! })
        .then((resp) => {
          if (!isMounted) return;

          // 确保响应有效
          if (!resp || !resp.scriptList) {
            console.warn("Invalid popup data response:", resp);
            return;
          }

          // 按照开启状态和更新时间排序
          const list = resp.scriptList;
          list.sort(
            (a, b) =>
              //@ts-ignore
              b.enable - a.enable ||
              // 根据菜单数排序
              b.menus.length - a.menus.length ||
              b.runNum - a.runNum ||
              b.updatetime - a.updatetime
          );
          setScriptList(list);
          setBackScriptList(resp.backScriptList || []);
          setIsBlacklist(resp.isBlacklist || false);
          checkScriptEnableAndUpdate();
        })
        .catch((error) => {
          console.error("Failed to get popup data:", error);
          if (!isMounted) return;
          // 设置默认值以防止错误
          setScriptList([]);
          setBackScriptList([]);
          setIsBlacklist(false);
        });
    };

    const checkScriptEnableAndUpdate = async () => {
      const [isEnableScript, checkUpdate] = await Promise.all([
        systemConfig.getEnableScript(),
        systemConfig.getCheckUpdate(),
      ]);
      if (!isMounted) return;
      setIsEnableScript(isEnableScript);
      setCheckUpdate(checkUpdate);
    };
    const queryTabInfo = () => {
      // 只跑一次 tab 资讯，不绑定在 currentUrl
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          console.error("chrome.runtime.lastError in chrome.tabs.query:", lastError);
          return;
        }
        if (!isMounted || !tabs.length) return;
        const newUrl = tabs[0].url || "";
        setCurrentUrl((prev) => {
          if (newUrl !== prev) {
            onCurrentUrlUpdated(tabs);
          }
          return newUrl;
        });
      });
    };

    checkScriptEnableAndUpdate();
    queryTabInfo();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleEnableScriptChange = useCallback((val: boolean) => {
    setIsEnableScript(val);
    systemConfig.setEnableScript(val);
  }, []);

  const handleSettingsClick = useCallback(() => {
    // 用a链接的方式,vivaldi竟然会直接崩溃
    window.open("/src/options.html", "_blank");
  }, []);

  const handleNotificationClick = useCallback(() => {
    setShowAlert((prev) => !prev);
    const updatedCheckUpdate = { ...checkUpdate, isRead: true };
    setCheckUpdate(updatedCheckUpdate);
    systemConfig.setCheckUpdate(updatedCheckUpdate);
  }, [checkUpdate]);

  const handleMenuClick = useCallback(
    async (key: string) => {
      switch (key) {
        case "newScript":
          await chrome.storage.local.set({
            activeTabUrl: { url: currentUrl },
          });
          window.open("/src/options.html#/script/editor?target=initial", "_blank");
          break;
        case "checkUpdate":
          await scriptClient.requestCheckUpdate("");
          window.close();
          break;
        case "report_issue": {
          const browserInfo = `${navigator.userAgent}`;
          const issueUrl =
            `https://github.com/scriptscat/scriptcat/issues/new?` +
            `template=bug_report${localePath === "/en" ? "_en" : ""}.yaml&scriptcat-version=${ExtVersion}&` +
            `browser-version=${encodeURIComponent(browserInfo)}`;
          window.open(issueUrl, "_blank");
          break;
        }
        default:
          window.open(key, "_blank");
          break;
      }
    },
    [currentUrl]
  );

  const [isUserScriptsAvailableState, setIsUserScriptsAvailableState] = useState(false);

  const updateIsUserScriptsAvailableState = async () => {
    const flag = await isUserScriptsAvailable();
    setIsUserScriptsAvailableState(flag);
  };
  updateIsUserScriptsAvailableState();

  const warningMessageHTML = useMemo(() => {
    // 可使用UserScript的话，不查browserType
    const browserType = !isUserScriptsAvailableState ? getBrowserType() : null;

    const warningMessageHTML = browserType
      ? browserType.firefox
        ? t("develop_mode_guide")
        : browserType.chrome
          ? browserType.chrome & BrowserType.chromeA
            ? t("lower_version_browser_guide")
            : browserType.chrome & BrowserType.chromeC && browserType.chrome & BrowserType.Chrome
              ? t("allow_user_script_guide")
              : t("develop_mode_guide") // Edge浏览器目前没有允许用户脚本选项，开启开发者模式即可
          : "UNKNOWN"
      : "";

    return warningMessageHTML;
  }, [isUserScriptsAvailableState]);

  // 权限要求详见：https://github.com/mdn/webextensions-examples/blob/main/userScripts-mv3/options.mjs

  const [showRequestButton, setShowRequestButton] = useState(false);
  //@ts-ignore
  if (chrome.permissions?.contains && chrome.permissions?.request) {
    chrome.permissions.contains(
      {
        permissions: ["userScripts"],
      },
      function (permissionOK) {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          console.error("chrome.runtime.lastError in chrome.permissions.contains:", lastError.message);
          // runtime 错误的话不显示按钮
          return;
        }
        if (permissionOK === false) {
          // 假设browser能支持 `chrome.permissions.contains` 及在 callback返回一个false值的话，
          // chrome.permissions.request 应该可以执行
          // 因此在这裡显示按钮
          setShowRequestButton(true);
        }
      }
    );
  }

  return (
    <>
      {/* User Key Input Section */}
      <Card size="small" style={{ marginBottom: 16 }}>
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
            onClick={handleUserKeySubmit}
            disabled={!userKey || loading}
          >
            Submit
          </Button>
        </div>
        {loading && <Spin style={{ marginLeft: 8 }} />}
        {downloadStatus === "success" && <span style={{ color: "green", marginLeft: 8 }}>Success!</span>}
        {downloadStatus === "error" && <span style={{ color: "red", marginLeft: 8 }}>Failed!</span>}
      </Card>
      {warningMessageHTML && (
        <Alert
          type="warning"
          content={
            <div
              dangerouslySetInnerHTML={{
                __html: warningMessageHTML,
              }}
            />
          }
        />
      )}
      {showRequestButton && (
        <Button
          onClick={() => {
            chrome.permissions.request({ permissions: ["userScripts"] }, function (granted) {
              const lastError = chrome.runtime.lastError;
              if (lastError) {
                granted = false;
                console.error("chrome.runtime.lastError in chrome.permissions.request:", lastError.message);
              }
              if (granted) {
                console.log("Permission granted");
                setPermissionReqResult("✅");
                // 需要进行UserScript API相关的通讯初始化
                // 或是使用 用 chrome.permissions.onAdded.addListener
                // 及 chrome.permissions.onRemoved.addListener
                // 来实现
                updateIsUserScriptsAvailableState();
              } else {
                console.log("Permission denied");
                setPermissionReqResult("❎");
              }
            });
          }}
        >
          {t("request_permission")} {permissionReqResult}
        </Button>
      )}
      {isBlacklist && <Alert type="warning" content={t("page_in_blacklist")} />}
      <Card
        size="small"
        title={
          <div className="flex justify-between">
            <span className="text-xl">ScriptCat</span>
            <div className="flex flex-row items-center">
              <Switch size="small" className="mr-1" checked={isEnableScript} onChange={handleEnableScriptChange} />
              <Button type="text" icon={<IconSettings />} iconOnly onClick={handleSettingsClick} />
              <Badge count={checkUpdate.isRead ? 0 : 1} dot offset={[-8, 6]}>
                <Button type="text" icon={<IconNotification />} iconOnly onClick={handleNotificationClick} />
              </Badge>
              <Dropdown
                droplist={
                  <Menu
                    style={{
                      maxHeight: "none",
                    }}
                    onClickMenuItem={handleMenuClick}
                  >
                    <Menu.Item key="newScript">
                      <IconPlus style={iconStyle} />
                      {t("create_script")}
                    </Menu.Item>
                    <Menu.Item key={`https://scriptcat.org/search?domain=${url && url.host}`}>
                      <IconSearch style={iconStyle} />
                      {t("get_script")}
                    </Menu.Item>
                    <Menu.Item key={"checkUpdate"}>
                      <IconSync style={iconStyle} />
                      {t("check_update")}
                    </Menu.Item>
                    <Menu.Item key="report_issue">
                      <IconBug style={iconStyle} />
                      {t("report_issue")}
                    </Menu.Item>
                    <Menu.Item key={`https://docs.scriptcat.org${localePath}`}>
                      <IconBook style={iconStyle} />
                      {t("project_docs")}
                    </Menu.Item>
                    <Menu.Item key="https://bbs.tampermonkey.net.cn/">
                      <RiMessage2Line style={iconStyle} />
                      {t("community")}
                    </Menu.Item>
                    <Menu.Item key="https://github.com/scriptscat/scriptcat">
                      <IconGithub style={iconStyle} />
                      GitHub
                    </Menu.Item>
                  </Menu>
                }
                trigger="click"
              >
                <Button type="text" icon={<IconMoreVertical />} iconOnly />
              </Dropdown>
            </div>
          </div>
        }
        bodyStyle={{ padding: 0 }}
      >
        <Alert
          style={{ display: showAlert ? "flex" : "none" }}
          type="info"
          content={<div dangerouslySetInnerHTML={{ __html: checkUpdate.notice || "" }} />}
        />
        <Collapse
          bordered={false}
          defaultActiveKey={["script", "background"]}
          style={{ maxWidth: 640, maxHeight: 500, overflow: "auto" }}
        >
          <CollapseItem
            header={t("current_page_scripts")}
            name="script"
            style={{ padding: "0" }}
            contentStyle={{ padding: "0" }}
          >
            <ScriptMenuList script={scriptList} isBackscript={false} currentUrl={currentUrl} />
          </CollapseItem>

          <CollapseItem
            header={t("enabled_background_scripts")}
            name="background"
            style={{ padding: "0" }}
            contentStyle={{ padding: "0" }}
          >
            <ScriptMenuList script={backScriptList} isBackscript={true} currentUrl={currentUrl} />
          </CollapseItem>
        </Collapse>
        <div className="flex flex-row arco-card-header !h-6">
          <span className="text-[12px] font-500">{`v${ExtVersion}`}</span>
          {semver.lt(ExtVersion, checkUpdate.version) && (
            <span
              onClick={() => {
                window.open(`https://github.com/scriptscat/scriptcat/releases/tag/v${checkUpdate.version}`);
              }}
              className="text-[10px] font-500 cursor-pointer underline text-blue-500 underline-offset-2"
            >
              {t("popup.new_version_available")}
            </span>
          )}
        </div>
      </Card>
    </>
  );
}

export default App;
