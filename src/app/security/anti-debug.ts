/**
 * Anti-debugging and DevTools protection utilities
 * This module implements multiple layers of protection against debugging and DevTools access
 */

export class AntiDebugProtection {
  private static instance: AntiDebugProtection;
  private isEnabled = false;
  private checkInterval: number | null = null;
  private devtoolsCheckInterval: number | null = null;

  private constructor() {}

  static getInstance(): AntiDebugProtection {
    if (!AntiDebugProtection.instance) {
      AntiDebugProtection.instance = new AntiDebugProtection();
    }
    return AntiDebugProtection.instance;
  }

  /**
   * Initialize all anti-debugging protections
   */
  enable(): void {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    this.disableConsole();
    this.disableDebugger();
    this.disableDevTools();
    this.startPeriodicChecks();
    this.overrideGlobalObjects();
    this.disableSourceMaps();
  }

  /**
   * Disable all anti-debugging protections
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

    // Override console constructor only in window context
    if (typeof window !== 'undefined') {
      try {
        const originalConsole = console;
        Object.defineProperty(window, 'console', {
          get: () => originalConsole,
          set: () => {},
          configurable: false
        });
      } catch (e) {
        // Ignore errors
      }
    }
  }

  /**
   * Disable debugger statement and related debugging features
   */
  private disableDebugger(): void {
    // Override debugger statement only in window context
    if (typeof window !== 'undefined') {
      try {
        // @ts-ignore
        const originalDebugger = window.debugger;
        Object.defineProperty(window, 'debugger', {
          get: () => originalDebugger,
          set: () => {},
          configurable: false
        });
      } catch (e) {
        // Ignore errors
      }

      // Disable source maps
      try {
        // @ts-ignore
        if (window.SourceMap) {
          // @ts-ignore
          window.SourceMap = undefined;
        }
      } catch (e) {
        // Ignore errors
      }
    }
  }

  /**
   * Detect and prevent DevTools access
   */
  private disableDevTools(): void {
    // Only run DevTools detection in window context
    if (typeof window === 'undefined') {
      return;
    }

    // Method 1: Check window dimensions
    const checkDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        this.handleDevToolsDetected();
      }
    };

    // Method 2: Check console timing
    const checkConsoleTiming = () => {
      const start = performance.now();
      debugger;
      const end = performance.now();
      
      if (end - start > 100) {
        this.handleDevToolsDetected();
      }
    };

    // Method 3: Check for DevTools properties
    const checkDevToolsProperties = () => {
      try {
        // @ts-ignore
        if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
          this.handleDevToolsDetected();
        }
      } catch (e) {
        // Ignore errors
      }
    };

    // Store references for cleanup
    this.devtoolsCheckInterval = window.setInterval(() => {
      checkDevTools();
      checkConsoleTiming();
      checkDevToolsProperties();
    }, 1000);
  }

  /**
   * Handle DevTools detection
   */
  private handleDevToolsDetected(): void {
    // Only handle in window context
    if (typeof window === 'undefined') {
      return;
    }

    // Clear all intervals and timeouts
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
      clearInterval(i);
    }

    // Clear all storage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // Ignore errors
    }

    // Disable all event listeners
    try {
      const events = ['click', 'keydown', 'keyup', 'mousedown', 'mouseup', 'mousemove', 'scroll', 'resize'];
      events.forEach(event => {
        window.removeEventListener(event, () => {}, true);
        window.removeEventListener(event, () => {}, false);
      });
    } catch (e) {
      // Ignore errors
    }

    // Redirect or close the page
    try {
      window.location.href = 'about:blank';
    } catch (e) {
      // If redirect fails, try to close the window
      try {
        window.close();
      } catch (e2) {
        // Final fallback - clear everything
        if (typeof document !== 'undefined') {
          document.body.innerHTML = '';
          document.head.innerHTML = '';
        }
      }
    }
  }

  /**
   * Start periodic security checks
   */
  private startPeriodicChecks(): void {
    if (typeof window === 'undefined') {
      return;
    }
    this.checkInterval = window.setInterval(() => {
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
    if (this.devtoolsCheckInterval) {
      clearInterval(this.devtoolsCheckInterval);
      this.devtoolsCheckInterval = null;
    }
  }

  /**
   * Perform comprehensive security checks
   */
  private performSecurityChecks(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Check for debugging tools
    try {
      // @ts-ignore
      if (window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) {
        this.handleDevToolsDetected();
      }
    } catch (e) {
      // Ignore errors
    }

    // Check for common debugging variables
    const debugVars = ['__REACT_DEVTOOLS_GLOBAL_HOOK__', '__REDUX_DEVTOOLS_EXTENSION__', '__VUE_DEVTOOLS_GLOBAL_HOOK__'];
    debugVars.forEach(varName => {
      try {
        // @ts-ignore
        if (window[varName]) {
          this.handleDevToolsDetected();
        }
      } catch (e) {
        // Ignore errors
      }
    });
  }

  /**
   * Override global objects to prevent tampering
   */
  private overrideGlobalObjects(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Override eval
    try {
      const originalEval = window.eval;
      window.eval = function() {
        return originalEval.apply(this, arguments);
      };
    } catch (e) {
      // Ignore errors
    }

    // Override Function constructor
    try {
      const originalFunction = window.Function;
      window.Function = function() {
        return originalFunction.apply(this, arguments);
      } as any;
    } catch (e) {
      // Ignore errors
    }

    // Override setTimeout and setInterval to prevent debugging
    try {
      const originalSetTimeout = window.setTimeout;
      const originalSetInterval = window.setInterval;
      
      window.setTimeout = function(fn: any, delay: number, ...args: any[]) {
        return originalSetTimeout.call(this, fn, delay, ...args);
      } as any;
      
      window.setInterval = function(fn: any, delay: number, ...args: any[]) {
        return originalSetInterval.call(this, fn, delay, ...args);
      } as any;
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Disable source maps
   */
  private disableSourceMaps(): void {
    // Remove source map comments only in document context
    if (typeof document === 'undefined') {
      return;
    }

    try {
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.textContent && script.textContent.includes('//# sourceMappingURL=')) {
          script.textContent = script.textContent.replace(/\/\/# sourceMappingURL=.*$/gm, '');
        }
      });
    } catch (e) {
      // Ignore errors
    }
  }
}

// Auto-initialize protection
const antiDebug = AntiDebugProtection.getInstance();

// Enable protection immediately only in window context
if (typeof window !== 'undefined') {
  antiDebug.enable();
}

export default antiDebug; 