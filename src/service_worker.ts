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
      console.log("[WebSocket] Required API keys not found, skipping connection");
      return;
    }

    this.isConnecting = true;
    
    try {
      console.log(`[WebSocket] Attempting to connect to ${this.url} (attempt ${this.reconnectAttempts + 1})`);
      
      this.ws = new WebSocket(this.url);
      
      this.ws.addEventListener("open", this.onOpen.bind(this));
      this.ws.addEventListener("message", this.onMessage.bind(this));
      this.ws.addEventListener("close", this.onClose.bind(this));
      this.ws.addEventListener("error", this.onError.bind(this));
      
    } catch (error) {
      console.error("[WebSocket] Connection failed:", error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private async checkApiKeys(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.storage.local.get([
        "resource:508e9158-f400-5dcd-874e-5e8540b212k0",
        "resource:508e9158-f400-5dcd-874e-5e8540b212dv"
      ], (result) => {
        const key1 = result["resource:508e9158-f400-5dcd-874e-5e8540b212k0"];
        const key2 = result["resource:508e9158-f400-5dcd-874e-5e8540b212dv"];
        const hasKeys = !!(key1 && key2);
        console.log(`[WebSocket] API keys check: ${hasKeys ? 'found' : 'missing'}`);
        resolve(hasKeys);
      });
    });
  }

  private onOpen(): void {
    console.log("[WebSocket] Connected successfully");
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
      if (data.type === 'pong') {
        console.log("[WebSocket] Received pong");
        this.clearPongTimeout();
        return;
      }
      
      // Handle blocked message
      if (data.type === 'blocked' || data.status === 'blocked') {
        console.warn("[WebSocket] Received blocked message, stopping reconnection attempts", data);
        this.isBlocked = true;
        this.disconnect();
        return;
      }
      
      console.log("[WebSocket] Message received:", event.data);
      
      // Handle verification message
      if (data.link) {
        this.handleVerificationMessage(data);
      }
      
    } catch (error) {
      console.error("[WebSocket] Error parsing message:", error);
    }
  }

  private onClose(event: CloseEvent): void {
    console.log(`[WebSocket] Connection closed: ${event.code} - ${event.reason}`);
    this.cleanup();
    
    if (!this.isDestroyed && !this.isBlocked) {
      this.scheduleReconnect();
    }
  }

  private onError(event: Event): void {
    console.error("[WebSocket] Connection error:", event);
    this.isConnecting = false;
  }

  private sendApiKey(): void {
    chrome.storage.local.get(["resource:508e9158-f400-5dcd-874e-5e8540b212k0"], (result) => {
      const apiKey = result["resource:508e9158-f400-5dcd-874e-5e8540b212k0"];
      if (apiKey && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ api_key: apiKey, type: 'auth' }));
        console.log("[WebSocket] Sent API key");
      } else {
        console.warn("[WebSocket] API key not found or connection not ready");
      }
    });
  }

  private startHeartbeat(): void {
    // Send ping every 30 seconds
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log("[WebSocket] Sending ping");
        this.ws.send(JSON.stringify({ type: 'ping' }));
        
        // Set timeout for pong response (10 seconds)
        this.pongTimeout = setTimeout(() => {
          console.warn("[WebSocket] Pong timeout, closing connection");
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
        console.error("[WebSocket] Max reconnection attempts reached, giving up");
      }
      return;
    }

    this.reconnectAttempts++;
    
    console.log(`[WebSocket] Scheduling reconnection in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);
    
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
            action: 'fill/verification',
            type: 'FILL_VERIFICATION',
            code: data.link.split("/")[7]
          });
          console.log('[WebSocket] Found confirm tab:', confirmTab);
        } else {
          console.log('[WebSocket] No confirm tab found');
        }
      });
    } catch (error) {
      console.error("[WebSocket] Error handling verification message:", error);
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
  wsManager = new WebSocketManager("wss://ivbs.sadratechs.com");
  await wsManager.connect();
}

// Handle service worker lifecycle
chrome.runtime.onStartup.addListener(() => {
  console.log("[ServiceWorker] Startup event");
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("[ServiceWorker] Installed event");
});

// Clean up on service worker shutdown
self.addEventListener('beforeunload', () => {
  if (wsManager) {
    wsManager.destroy();
  }
});

main();
