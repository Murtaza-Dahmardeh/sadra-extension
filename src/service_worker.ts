import ServiceWorkerManager from "./app/service/service_worker";
import LoggerCore from "./app/logger/core";
import DBWriter from "./app/logger/db_writer";
import { LoggerDAO } from "./app/repo/logger";
import { LocalStorageDAO } from "./app/repo/localStorage";
import { FormsDAO } from "./app/repo/forms";
import { CaptchaDAO } from "./app/repo/captcha";
import { ExtensionMessage } from "@Packages/message/extension_message";
import { Server } from "@Packages/message/server";
import { MessageQueue } from "@Packages/message/message_queue";
import { ServiceWorkerMessageSend } from "@Packages/message/window_message";
import migrate from "./app/migrate";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Global onMessage received:", msg);
});

// Unified CRUD handler for localStorage, forms, and captcha tables
export async function handleDbCrud(msg: any): Promise<any> {
  console.log(msg)
  const table = msg.table || 'localStorage';
  
  let dao;
  switch (table) {
    case 'forms':
      dao = new FormsDAO();
      break;
    case 'captcha':
      dao = new CaptchaDAO();
      break;
    case 'localStorage':
    default:
      dao = new LocalStorageDAO();
      break;
  }
  try {
    switch (msg.action_op) {
      case 'create':
      case 'update': {
        const now = Date.now();
        console.log("Murtaza handleDbCrud", { msg: msg as any });
        const value = { ...msg.value, key: msg.key, updatetime: now };
        if (!value.createtime) value.createtime = now;
        await dao.save(value);
        return { success: true };
      }
      case 'read': {
        const value = await dao.get(msg.key);
        return { success: true, value };
      }
      case 'delete': {
        await dao.delete(msg.key);
        return { success: true };
      }
      case 'list': {
        const value = await dao.all();
        return { success: true, value };
      }
      default:
        return { success: false, error: 'Unknown action' };
    }
  } catch (e: any) {
    return { success: false, error: e.message || String(e) };
  }
}

migrate();

const OFFSCREEN_DOCUMENT_PATH = "src/offscreen.html";

let creating: Promise<void> | null;

async function hasDocument() {
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [offscreenUrl],
  });
  return existingContexts.length > 0;
}

async function setupOffscreenDocument() {
  //if we do not have a document, we are already setup and can skip
  if (!(await hasDocument())) {
    // create offscreen document
    if (creating) {
      await creating;
    } else {
      creating = chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: [
          chrome.offscreen.Reason.BLOBS,
          chrome.offscreen.Reason.CLIPBOARD,
          chrome.offscreen.Reason.DOM_SCRAPING,
          chrome.offscreen.Reason.LOCAL_STORAGE,
        ],
        justification: "offscreen page",
      });

      await creating;
      creating = null;
    }
  }
}

async function main() {
  // 初始化管理器
  const message = new ExtensionMessage(true);
  // 初始化日志组件
  const loggerCore = new LoggerCore({
    writer: new DBWriter(new LoggerDAO()),
    labels: { env: "service_worker" },
  });
  loggerCore.logger().debug("service worker start");
  const server = new Server("serviceWorker", message);
  const messageQueue = new MessageQueue();
  const manager = new ServiceWorkerManager(server, messageQueue, new ServiceWorkerMessageSend());
  manager.initManager();
  // 初始化沙盒环境
  await setupOffscreenDocument();
}

main();
