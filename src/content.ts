import LoggerCore from "./app/logger/core";
import MessageWriter from "./app/logger/message_writer";
import { ExtensionMessage, ExtensionMessageSend } from "@Packages/message/extension_message";
import { CustomEventMessage } from "@Packages/message/custom_event_message";
import { RuntimeClient } from "./app/service/service_worker/client";
import { Server } from "@Packages/message/server";
import ContentRuntime from "./app/service/content/content";

// 建立与service_worker页面的连接
const send = new ExtensionMessageSend();

// 初始化日志组件
const loggerCore = new LoggerCore({
  writer: new MessageWriter(send),
  labels: { env: "content" },
});

const client = new RuntimeClient(send);
client.pageLoad().then((data) => {
  loggerCore.logger().debug("content start");
  const extMsg = new ExtensionMessage();
  const msg = new CustomEventMessage(data.flag, true);
  const server = new Server("content", msg);
  // Opera中没有chrome.runtime.onConnect，并且content也不需要chrome.runtime.onConnect
  // 所以不需要处理连接，设置为false
  const extServer = new Server("content", extMsg, false);
  // 初始化运行环境
  const runtime = new ContentRuntime(extServer, server, send, msg);
  runtime.start(data.scripts, data.envInfo);
});

// --- IndexedDB CRUD DOM Event Bridge ---
window.addEventListener('extension-db-request', async (event: Event) => {
  const customEvent = event as CustomEvent;
  const detail = customEvent.detail;
  console.log("murt",detail.value)
  // Map op to action for the service worker
  const response = await chrome.runtime.sendMessage({
    action: 'serviceWorker/EXT_DB_CRUD',
    data: {
      action_op: detail.op, // pass the actual CRUD op
    key: detail.key,
    value: detail.value,
    table: detail.table,
    }
  });
  // Dispatch response event back to the page
  window.dispatchEvent(new CustomEvent('extension-db-response', { detail: response }));
});
// --- End Bridge ---

// Listen for messages from the service worker to fill verification code
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Content Script] Message received:', message);
  if (message && message.type === 'FILL_VERIFICATION') {
    const input = document.querySelector('#id_activation_key');
    const button = document.querySelector('#first_step_submit');
    if (input) {
      (input as HTMLInputElement).value = message.code;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('[Content Script] Filled verification input');
      if (button) {
        (button as HTMLElement).click();
        console.log('[Content Script] Clicked confirm button');
      }
    } else {
      console.warn('[Content Script] Verification input not found');
    }
  }
});
