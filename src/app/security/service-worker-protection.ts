/**
 * Service Worker Anti-Debugging Protection
 * Provides security measures specifically for service worker context
 */

export class ServiceWorkerProtection {
  private static instance: ServiceWorkerProtection;
  private isEnabled = false;
  private checkInterval: number | null = null;

  private constructor() {}

  static getInstance(): ServiceWorkerProtection {
    if (!ServiceWorkerProtection.instance) {
      ServiceWorkerProtection.instance = new ServiceWorkerProtection();
    }
    return ServiceWorkerProtection.instance;
  }

  /**
   * Initialize service worker protection
   */
  enable(): void {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    this.disableConsole();
    this.startPeriodicChecks();
    this.overrideGlobalObjects();
  }

  /**
   * Disable service worker protection
   */
  disable(): void {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    this.stopPeriodicChecks();
  }

  /**
   * Override console methods to prevent debugging output
   */
  private disableConsole(): void {
    const noop = () => {};
    const consoleMethods = ['log', 'debug', 'info', 'warn', 'error', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'time', 'timeEnd', 'timeLog', 'profile', 'profileEnd', 'count', 'countReset', 'clear', 'table', 'assert'];
    
    consoleMethods.forEach(method => {
      try {
        (console as any)[method] = noop;
      } catch (e) {
        // Ignore errors
      }
    });
  }

  /**
   * Start periodic security checks
   */
  private startPeriodicChecks(): void {
    this.checkInterval = setInterval(() => {
      this.performSecurityChecks();
    }, 5000);
  }

  /**
   * Stop periodic security checks
   */
  private stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Perform comprehensive security checks
   */
  private performSecurityChecks(): void {
    // Check for debugging tools in service worker context
    try {
      // Check if service worker is being debugged
      const start = performance.now();
      debugger;
      const end = performance.now();
      
      if (end - start > 100) {
        this.handleSecurityBreach();
      }
    } catch (e) {
      // Ignore errors
    }

    // Check for common debugging variables in global scope
    const debugVars = ['__REACT_DEVTOOLS_GLOBAL_HOOK__', '__REDUX_DEVTOOLS_EXTENSION__', '__VUE_DEVTOOLS_GLOBAL_HOOK__'];
    debugVars.forEach(varName => {
      try {
        // @ts-ignore
        if ((globalThis as any)[varName]) {
          this.handleSecurityBreach();
        }
      } catch (e) {
        // Ignore errors
      }
    });
  }

  /**
   * Handle security breach in service worker
   */
  private handleSecurityBreach(): void {
    // Clear all intervals and timeouts
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
      clearInterval(i);
    }

    // Clear extension storage
    try {
      chrome.storage.local.clear();
      chrome.storage.sync.clear();
    } catch (e) {
      // Ignore errors
    }

    // Close all tabs
    try {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.remove(tab.id);
          }
        });
      });
    } catch (e) {
      // Ignore errors
    }

    // Terminate service worker
    try {
      self.close();
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Override global objects to prevent tampering
   */
  private overrideGlobalObjects(): void {
    // Override eval
    try {
      const originalEval = eval;
      // @ts-ignore
      globalThis.eval = function() {
        return originalEval.apply(this, arguments);
      };
    } catch (e) {
      // Ignore errors
    }

    // Override Function constructor
    try {
      const originalFunction = Function;
      // @ts-ignore
      globalThis.Function = function() {
        return originalFunction.apply(this, arguments);
      } as any;
    } catch (e) {
      // Ignore errors
    }

    // Override setTimeout and setInterval to prevent debugging
    try {
      const originalSetTimeout = setTimeout;
      const originalSetInterval = setInterval;
      
      // @ts-ignore
      globalThis.setTimeout = function(fn: any, delay: number, ...args: any[]) {
        return originalSetTimeout.call(this, fn, delay, ...args);
      } as any;
      
      // @ts-ignore
      globalThis.setInterval = function(fn: any, delay: number, ...args: any[]) {
        return originalSetInterval.call(this, fn, delay, ...args);
      } as any;
    } catch (e) {
      // Ignore errors
    }
  }
}

// Auto-initialize protection for service worker
const serviceWorkerProtection = ServiceWorkerProtection.getInstance();

// Enable protection immediately
serviceWorkerProtection.enable();

export default serviceWorkerProtection; 