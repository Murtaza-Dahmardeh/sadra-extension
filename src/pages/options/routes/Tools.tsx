import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Drawer,
  Empty,
  Input,
  List,
  Message,
  Modal,
  Popconfirm,
  Space,
} from "@arco-design/web-react";
import Title from "@arco-design/web-react/es/Typography/title";
import { formatUnixTime } from "@App/pkg/utils/day_format";
import FileSystemParams from "@App/pages/components/FileSystemParams";
import { IconQuestionCircleFill } from "@arco-design/web-react/icon";
import type { RefInputType } from "@arco-design/web-react/es/Input/interface";
import { useTranslation } from "react-i18next";
import type { FileSystemType } from "@Packages/filesystem/factory";
import FileSystemFactory from "@Packages/filesystem/factory";
import type { File, FileReader } from "@Packages/filesystem/filesystem";
import { message, systemConfig } from "@App/pages/store/global";
import { synchronizeClient } from "@App/pages/store/features/script";
import { SystemClient } from "@App/app/service/service_worker/client";
import { migrateToChromeStorage } from "@App/app/migrate";

function Tools() {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileSystemType, setFilesystemType] = useState<FileSystemType>("webdav");
  const [fileSystemParams, setFilesystemParam] = useState<{
    [key: string]: any;
  }>({});
  const [vscodeUrl, setVscodeUrl] = useState<string>("");
  const [vscodeReconnect, setVscodeReconnect] = useState<boolean>(false);
  const [backupFileList, setBackupFileList] = useState<File[]>([]);
  const vscodeRef = useRef<RefInputType>(null);
  const { t } = useTranslation();
  const [userKey, setUserKey] = useState("");
  const [installLoading, setInstallLoading] = useState(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  // User key install logic
  const handleUserKeyInstall = async () => {
    if (!userKey) {
      Message.error("Please enter a user key.");
      return;
    }
    setInstallLoading(true);
    setInstallStatus(null);
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
            console.log("install_script_by_code result", result, chrome.runtime.lastError);
            if (result.data.success) {
              resolve(result);
            } else {
              reject(result.data.error);
            }
          }
        );
      });
      setInstallStatus("success");
      Message.success("Script installed successfully!");
    } catch (e: any) {
      console.error("Failed to install script:", e);
      setInstallStatus("error");
      Message.error(e.message || "Failed to install script");
    } finally {
      setInstallLoading(false);
    }
  };

  useEffect(() => {
    // 获取配置
    const loadConfig = async () => {
      const [backup, vscodeUrl, vscodeReconnect] = await Promise.all([
        systemConfig.getBackup(),
        systemConfig.getVscodeUrl(),
        systemConfig.getVscodeReconnect(),
      ]);
      setFilesystemType(backup.filesystem);
      setFilesystemParam(backup.params[backup.filesystem] || {});
      setVscodeUrl(vscodeUrl);
      setVscodeReconnect(vscodeReconnect);
    };
    loadConfig();
  }, []);

  return (
    <Space
      className="tools"
      direction="vertical"
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        position: "relative",
      }}
    >
      <Card className="backup" title={t("backup")} bordered={false}>
        <Space direction="vertical">
          <Title heading={6}>{t("local")}</Title>
          <Space>
            <input type="file" ref={fileRef} style={{ display: "none" }} accept=".zip" />
            <Button
              type="primary"
              loading={loading.local}
              onClick={async () => {
                setLoading((prev) => ({ ...prev, local: true }));
                await synchronizeClient.export();
                setLoading((prev) => ({ ...prev, local: false }));
              }}
            >
              {t("export_file")}
            </Button>
            <Button
              type="primary"
              onClick={() => {
                const el = fileRef.current!;
                el.onchange = async () => {
                  const { files } = el;
                  if (!files) {
                    return;
                  }
                  const file = files[0];
                  if (!file) {
                    return;
                  }
                  try {
                    await synchronizeClient.openImportWindow(file.name, file);
                    Message.success(t("select_import_script")!);
                  } catch (e) {
                    Message.error(`${t("import_error")}: ${e}`);
                  }
                };
                el.click();
              }}
            >
              {t("import_file")}
            </Button>
          </Space>
          <Title heading={6}>{t("cloud")}</Title>
          <FileSystemParams
            preNode={t("backup_to")}
            onChangeFileSystemType={(type) => {
              setFilesystemType(type);
            }}
            onChangeFileSystemParams={(params) => {
              setFilesystemParam(params);
            }}
            actionButton={[
              <Button
                key="backup"
                type="primary"
                loading={loading.cloud}
                onClick={() => {
                  // Store parameters
                  const params = { ...fileSystemParams };
                  params[fileSystemType] = fileSystemParams;
                  systemConfig.setBackup({
                    filesystem: fileSystemType,
                    params,
                  });
                  setLoading((prev) => ({ ...prev, cloud: true }));
                  Message.info(t("preparing_backup")!);
                  synchronizeClient
                    .backupToCloud(fileSystemType, fileSystemParams)
                    .then(() => {
                      Message.success(t("backup_success")!);
                    })
                    .catch((e) => {
                      Message.error(`${t("backup_failed")}: ${e}`);
                    })
                    .finally(() => {
                      setLoading((prev) => ({ ...prev, cloud: false }));
                    });
                }}
              >
                {t("backup")}
              </Button>,
              <Button
                key="list"
                type="primary"
                loading={loading.cloud}
                onClick={async () => {
                  setLoading((prev) => ({ ...prev, cloud: true }));
                  try {
                    let fs = await FileSystemFactory.create(fileSystemType, fileSystemParams);
                    fs = await fs.openDir("ScriptCat");
                    let list = await fs.list();
                    list.sort((a, b) => b.updatetime - a.updatetime);
                    // Filter non-zip files
                    list = list.filter((file) => file.name.endsWith(".zip"));
                    if (list.length === 0) {
                      Message.info(t("no_backup_files")!);
                    } else {
                      setBackupFileList(list);
                    }
                  } catch (e) {
                    Message.error(`${t("get_backup_files_failed")}: ${e}`);
                  }
                  setLoading((prev) => ({ ...prev, cloud: false }));
                }}
              >
                {t("backup_list")}
              </Button>,
            ]}
            fileSystemType={fileSystemType}
            fileSystemParams={fileSystemParams}
          />
          <Drawer
            width={400}
            title={
              <div className="flex flex-row justify-between w-full gap-10">
                <span>{t("backup_list")}</span>
                <Button
                  type="secondary"
                  size="mini"
                  onClick={async () => {
                    let fs = await FileSystemFactory.create(fileSystemType, fileSystemParams);
                    try {
                      fs = await fs.openDir("ScriptCat");
                      const url = await fs.getDirUrl();
                      if (url) {
                        window.open(url, "_black");
                      }
                    } catch (e) {
                      Message.error(`${t("get_backup_dir_url_failed")}: ${e}`);
                    }
                  }}
                >
                  {t("open_backup_dir")}
                </Button>
              </div>
            }
            visible={backupFileList.length !== 0}
            onOk={() => {
              setBackupFileList([]);
            }}
            onCancel={() => {
              setBackupFileList([]);
            }}
          >
            <List
              bordered={false}
              dataSource={backupFileList}
              render={(item: File) => (
                <List.Item key={`${item.name}_${item.updatetime}`}>
                  <List.Item.Meta title={item.name} description={formatUnixTime(item.updatetime / 1000)} />
                  <Space className="w-full justify-end">
                    <Button
                      type="primary"
                      size="small"
                      onClick={async () => {
                        Message.info(t("pulling_data_from_cloud")!);
                        let fs = await FileSystemFactory.create(fileSystemType, fileSystemParams);
                        let file: FileReader;
                        let data: Blob;
                        try {
                          fs = await fs.openDir("ScriptCat");
                          file = await fs.open(item);
                          data = (await file.read("blob")) as Blob;
                        } catch (e) {
                          Message.error(`${t("pull_failed")}: ${e}`);
                          return;
                        }
                        synchronizeClient
                          .openImportWindow(item.name, data)
                          .then(() => {
                            Message.success(t("select_import_script")!);
                          })
                          .then((e) => {
                            Message.error(`${t("import_error")}${e}`);
                          });
                      }}
                    >
                      {t("restore")}
                    </Button>
                    <Button
                      type="primary"
                      status="danger"
                      size="small"
                      onClick={() => {
                        Modal.confirm({
                          title: t("confirm_delete"),
                          content: `${t("confirm_delete_backup_file")}${item.name}?`,
                          onOk: async () => {
                            let fs = await FileSystemFactory.create(fileSystemType, fileSystemParams);
                            try {
                              fs = await fs.openDir("ScriptCat");
                              await fs.delete(item.name);
                              setBackupFileList(backupFileList.filter((i) => i.name !== item.name));
                              Message.success(t("delete_success")!);
                            } catch (e) {
                              Message.error(`${t("delete_failed")}${e}`);
                            }
                          },
                        });
                      }}
                    >
                      {t("delete")}
                    </Button>
                  </Space>
                </List.Item>
              )}
            />
          </Drawer>
          <Title heading={6}>{t("backup_strategy")}</Title>
          <Empty description={t("under_construction")} />
          <Popconfirm
            title={t("migration_confirm_message")}
            onOk={() => {
              migrateToChromeStorage();
            }}
          >
            <Button type="primary">{t("retry_migration")}</Button>
          </Popconfirm>
        </Space>
      </Card>

      <Card
        title={
          <>
            <span>{t("development_debugging")}</span>
            <Button
              type="text"
              style={{
                height: 24,
              }}
              icon={
                <IconQuestionCircleFill
                  style={{
                    margin: 0,
                  }}
                />
              }
              href="https://www.bilibili.com/video/BV16q4y157CP"
              target="_blank"
              iconOnly
            />
          </>
        }
        bordered={false}
      >
        <Space direction="vertical">
          <Title heading={6}>{t("vscode_url")}</Title>
          <Input
            ref={vscodeRef}
            value={vscodeUrl}
            onChange={(value) => {
              setVscodeUrl(value);
            }}
          />
          <Checkbox
            checked={vscodeReconnect}
            onChange={(checked) => {
              setVscodeReconnect(checked);
            }}
          >
            {t("auto_connect_vscode_service")}
          </Checkbox>
          <Button
            type="primary"
            onClick={() => {
              systemConfig.setVscodeUrl(vscodeUrl);
              systemConfig.setVscodeReconnect(vscodeReconnect);
              const systemClient = new SystemClient(message);
              systemClient
                .connectVSCode({
                  url: vscodeUrl,
                  reconnect: vscodeReconnect,
                })
                .then(() => {
                  Message.success(t("connection_success")!);
                })
                .catch((e) => {
                  Message.error(`${t("connection_failed")}: ${e}`);
                });
            }}
          >
            {t("connect")}
          </Button>
        </Space>
      </Card>

      <Card className="user-key-install" title={t("Install Script by User Key") || "Install Script by User Key"} bordered={false} style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Input
              placeholder="Enter user key"
              value={userKey}
              onChange={setUserKey}
              style={{ flex: 1 }}
              disabled={installLoading}
            />
            <Button
              type="primary"
              loading={installLoading}
              onClick={handleUserKeyInstall}
              disabled={!userKey || installLoading}
            >
              Submit
            </Button>
          </div>
          {installLoading && <span style={{ marginLeft: 8 }}>Installing...</span>}
          {installStatus === "success" && <span style={{ color: "green", marginLeft: 8 }}>Success!</span>}
          {installStatus === "error" && <span style={{ color: "red", marginLeft: 8 }}>Failed!</span>}
        </Space>
      </Card>
    </Space>
  );
}

export default Tools;
