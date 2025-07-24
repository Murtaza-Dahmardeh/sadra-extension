import Logger from "@App/pages/options/routes/Logger";
import ScriptEditor from "@App/pages/options/routes/script/ScriptEditor";
import ScriptList from "@App/pages/options/routes/ScriptList";
import Setting from "@App/pages/options/routes/Setting";
import SubscribeList from "@App/pages/options/routes/SubscribeList";
import Tools from "@App/pages/options/routes/Tools";
import Forms from "@App/pages/options/routes/Forms";
import FormsDetail from "@App/pages/options/routes/FormsDetail";
import Captcha from "@App/pages/options/routes/Captcha";
import UserKeyInstall from "@App/pages/options/routes/UserKeyInstall";
import { Layout, Menu } from "@arco-design/web-react";
import {
  IconCode,
  IconFile,
  IconGithub,
  IconLeft,
  IconLink,
  IconQuestion,
  IconRight,
  IconSettings,
  IconSubscribe,
  IconTool,
} from "@arco-design/web-react/icon";
import React, { useCallback, useRef, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RiFileCodeLine, RiGuideLine, RiLinkM } from "react-icons/ri";
import CustomLink from "../CustomLink";
import { localePath } from "@App/locales/locales";

const MenuItem = Menu.Item;
let { hash } = window.location;
if (!hash.length) {
  hash = "/";
} else {
  hash = hash.substring(1);
}

const Sider: React.FC = () => {
  const [menuSelect, setMenuSelect] = useState(hash);
  const [collapsed, setCollapsed] = useState(localStorage.collapsed === "true");
  const { t } = useTranslation();
  const guideRef = useRef<{ open: () => void }>(null);

  const handleMenuClick = useCallback((key: string) => {
    setMenuSelect(key);
  }, []);

  return (
    <HashRouter>
      <Layout.Sider className="h-full" collapsed={collapsed} width={170}>
        <div className="flex flex-col justify-between h-full">
          <Menu style={{ width: "100%" }} selectedKeys={[menuSelect]} selectable onClickMenuItem={handleMenuClick}>
            {/* <CustomLink to="/">
              <MenuItem key="/" className="menu-script">
                <IconCode /> {t("Dashboard")}
              </MenuItem>
            </CustomLink> */}
            <CustomLink to="/forms">
              <MenuItem key="/forms">
                <IconFile /> {t("forms")}
              </MenuItem>
            </CustomLink>
            <CustomLink to="/captcha">
              <MenuItem key="/captcha">
                <IconFile /> {t("captcha")}
              </MenuItem>
            </CustomLink>
          </Menu>
          <Menu
            style={{ width: "100%", borderTop: "1px solid var(--color-bg-5)" }}
            selectedKeys={[]}
            selectable
            onClickMenuItem={handleMenuClick}
            mode="pop"
          >
            <MenuItem
              key="/collapsible"
              onClick={() => {
                localStorage.collapsed = !collapsed;
                setCollapsed(!collapsed);
              }}
            >
              {collapsed ? <IconRight /> : <IconLeft />} {t("hide_sidebar")}
            </MenuItem>
          </Menu>
        </div>
      </Layout.Sider>
      <Layout.Content
        style={{
          borderLeft: "1px solid var(--color-bg-5)",
          overflow: "hidden",
          padding: 10,
          height: "100%",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <Routes>
          {/* <Route index element={<ScriptList />} /> */}
          <Route path="/forms" >
            <Route index element={<Forms />} />
            <Route path=":key" element={<FormsDetail />} />
          </Route>
          <Route path="/captcha" element={<Captcha />} />
        </Routes>
      </Layout.Content>
    </HashRouter>
  );
};

export default Sider;
