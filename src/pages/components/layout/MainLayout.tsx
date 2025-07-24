import {
  Button,
  ConfigProvider,
  Dropdown,
  Empty,
  Input,
  Layout,
  Menu,
  Message,
  Modal,
  Space,
  Typography,
} from "@arco-design/web-react";
import type { RefTextAreaType } from "@arco-design/web-react/es/Input";
import {
  IconCheckCircle,
  IconCloseCircle,
  IconDesktop,
  IconDown,
  IconLanguage,
  IconLink,
  IconMoonFill,
  IconSunFill,
} from "@arco-design/web-react/icon";
import type { ReactNode } from "react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@App/pages/store/hooks";
import { selectThemeMode, setDarkMode } from "@App/pages/store/features/config";
import { RiFileCodeLine, RiImportLine, RiPlayListAddLine, RiTerminalBoxLine, RiTimerLine } from "react-icons/ri";
import { scriptClient } from "@App/pages/store/features/script";
import { systemConfig } from "@App/pages/store/global";
import i18n, { matchLanguage } from "@App/locales/locales";
import "./index.css";
import { arcoLocale } from "@App/locales/arco";
import { checkAuth } from "@App/app/security/auth";

const readFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    // 实例化 FileReader对象
    const reader = new FileReader();
    reader.onload = async (processEvent) => {
      // 创建blob url
      const blob = new Blob([processEvent.target!.result!], {
        type: "application/javascript",
      });
      const url = URL.createObjectURL(blob);
      resolve(url);
    };
    // 调用readerAsText方法读取文本
    reader.readAsText(file);
  });
};

const uploadFiles = async (files: File[], importByUrlsFunc: (urls: string[]) => Promise<void>) => {
  // const filterFiles = files.filter((f) => f.name.endsWith(".js"));
  const urls = await Promise.all(files.map((file) => readFile(file)));
  importByUrlsFunc(urls);
};

const MainLayout: React.FC<{
  children: React.ReactNode;
  className: string;
  pageName?: string;
}> = ({ children, className, pageName }) => {
  // All hooks at the top
  const [authValid, setAuthValid] = useState<boolean | null>(null);
  const lightMode = useAppSelector(selectThemeMode);
  const dispatch = useAppDispatch();
  const importRef = useRef<RefTextAreaType>(null);
  const [importVisible, setImportVisible] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;
    checkAuth().then((result) => { if (isMounted) setAuthValid(result); });
    return () => { isMounted = false; };
  }, []);

  return (
    <>
      {(authValid === false || authValid === null) && (
        <div style={{
          position: 'fixed',
          zIndex: 9999,
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255,255,255,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: 'red',
          fontSize: 20,
        }}>
          {authValid === false && (
            <div>Please authenticate in the extension popup before using the options page.</div>
          )}
          {authValid === null && <div>Checking authentication...</div>}
        </div>
      )}
      {authValid === true && (
        <ConfigProvider
          renderEmpty={() => {
            return <Empty description={t("no_data")} />;
          }}
          locale={arcoLocale(i18n.language)}
        >
          <Layout>
            <Layout.Header
              style={{
                height: "50px",
                borderBottom: "1px solid var(--color-neutral-3)",
              }}
              className="flex items-center justify-between px-4"
            >
              <div className="flex row items-center">
                <img style={{ height: "40px" }} src="/assets/logo.png" alt="Sadra" />
                <Typography.Title heading={4} className="!m-0 p-2">
                  Sadra Extension
                </Typography.Title>
              </div>
              <Space size="small" className="action-tools">
                
                <Dropdown
                  droplist={
                    <Menu
                      onClickMenuItem={(key) => {
                        dispatch(setDarkMode(key as "light" | "dark" | "auto"));
                      }}
                      selectedKeys={[lightMode]}
                    >
                      <Menu.Item key="light">
                        <IconSunFill /> Light
                      </Menu.Item>
                      <Menu.Item key="dark">
                        <IconMoonFill /> Dark
                      </Menu.Item>
                      <Menu.Item key="auto">
                        <IconDesktop /> {t("system_follow")}
                      </Menu.Item>
                    </Menu>
                  }
                  position="bl"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={
                      <>
                        {lightMode === "auto" && <IconDesktop />}
                        {lightMode === "light" && <IconSunFill />}
                        {lightMode === "dark" && <IconMoonFill />}
                      </>
                    }
                    style={{
                      color: "var(--color-text-1)",
                    }}
                    className="!text-lg"
                  />
                </Dropdown>
                {showLanguage && (
                  <Dropdown
                    droplist={
                      <Menu>
                        
                      </Menu>
                    }
                  >
                    <Button
                      type="text"
                      size="small"
                      iconOnly
                      icon={<IconLanguage />}
                      style={{
                        color: "var(--color-text-1)",
                      }}
                      className="!text-lg"
                    ></Button>
                  </Dropdown>
                )}
              </Space>
            </Layout.Header>
            <Layout
              className={`absolute top-50px bottom-0 w-full ${className}`}
              style={{
                background: "var(--color-fill-2)",
              }}
            >
              {children}
            </Layout>
          </Layout>
        </ConfigProvider>
      )}
    </>
  );
};

export default MainLayout;
