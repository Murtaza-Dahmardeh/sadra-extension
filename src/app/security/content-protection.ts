/**
 * Content script protection for web pages
 * Injects anti-debugging measures into web pages
 */

export class ContentProtection {
  private static instance: ContentProtection;
  private isEnabled = false;

  private constructor() {}

  static getInstance(): ContentProtection {
    if (!ContentProtection.instance) {
      ContentProtection.instance = new ContentProtection();
    }
    return ContentProtection.instance;
  }

  /**
   * Enable content protection
   */
  enable(): void {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    this.injectProtectionScript();
    this.overrideConsole();
    this.disableDevTools();
  }

  /**
   * Disable content protection
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * Inject protection script into the page
   */
  private injectProtectionScript(): void {
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        'use strict';
        
        // Disable console methods
        const noop = function() {};
        const consoleMethods = ['log', 'debug', 'info', 'warn', 'error', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'time', 'timeEnd', 'timeLog', 'profile', 'profileEnd', 'count', 'countReset', 'clear', 'table', 'assert'];
        consoleMethods.forEach(function(method) {
          try {
            console[method] = noop;
          } catch(e) {}
        });

        // Disable debugger
        try {
          Object.defineProperty(window, 'debugger', {
            get: function() { return function() {}; },
            set: function() {},
            configurable: false
          });
        } catch(e) {}

        // DevTools detection
        function detectDevTools() {
          const threshold = 160;
          const widthThreshold = window.outerWidth - window.innerWidth > threshold;
          const heightThreshold = window.outerHeight - window.innerHeight > threshold;
          
          if (widthThreshold || heightThreshold) {
            // Clear page content
            document.body.innerHTML = '';
            document.head.innerHTML = '';
            // Redirect to blank page
            window.location.href = 'about:blank';
          }
        }

        // Check for DevTools every second
        setInterval(detectDevTools, 1000);

        // Additional DevTools detection methods
        function checkConsoleTiming() {
          const start = performance.now();
          debugger;
          const end = performance.now();
          
          if (end - start > 100) {
            detectDevTools();
          }
        }

        setInterval(checkConsoleTiming, 2000);

        // Override eval and Function constructor
        try {
          const originalEval = window.eval;
          window.eval = function() {
            return originalEval.apply(this, arguments);
          };
        } catch(e) {}

        try {
          const originalFunction = window.Function;
          window.Function = function() {
            return originalFunction.apply(this, arguments);
          };
        } catch(e) {}

        // Disable source maps
        try {
          const scripts = document.querySelectorAll('script');
          scripts.forEach(function(script) {
            if (script.textContent && script.textContent.includes('//# sourceMappingURL=')) {
              script.textContent = script.textContent.replace(/\/\/# sourceMappingURL=.*$/gm, '');
            }
          });
        } catch(e) {}

        // Override performance timing
        try {
          const originalGetEntries = performance.getEntries;
          performance.getEntries = function() {
            return [];
          };
        } catch(e) {}

        // Disable common debugging tools
        try {
          delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
          delete window.__REDUX_DEVTOOLS_EXTENSION__;
          delete window.__VUE_DEVTOOLS_GLOBAL_HOOK__;
        } catch(e) {}

        // Override document.write to prevent debugging
        try {
          const originalWrite = document.write;
          document.write = function() {
            return originalWrite.apply(this, arguments);
          };
        } catch(e) {}

        // Disable localStorage and sessionStorage access for debugging
        try {
          const originalSetItem = localStorage.setItem;
          const originalGetItem = localStorage.getItem;
          const originalRemoveItem = localStorage.removeItem;
          const originalClear = localStorage.clear;

          localStorage.setItem = function(key, value) {
            // Allow only specific keys
            const allowedKeys = ['sadra_extension_data', 'sadra_user_config'];
            if (allowedKeys.includes(key)) {
              return originalSetItem.call(this, key, value);
            }
            return;
          };

          localStorage.getItem = function(key) {
            const allowedKeys = ['sadra_extension_data', 'sadra_user_config'];
            if (allowedKeys.includes(key)) {
              return originalGetItem.call(this, key);
            }
            return null;
          };

          localStorage.removeItem = function(key) {
            const allowedKeys = ['sadra_extension_data', 'sadra_user_config'];
            if (allowedKeys.includes(key)) {
              return originalRemoveItem.call(this, key);
            }
            return;
          };

          localStorage.clear = function() {
            // Only clear allowed keys
            const allowedKeys = ['sadra_extension_data', 'sadra_user_config'];
            allowedKeys.forEach(key => {
              if (localStorage.getItem(key)) {
                originalRemoveItem.call(this, key);
              }
            });
          };
        } catch(e) {}

        // Override XMLHttpRequest to prevent debugging
        try {
          const originalOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            // Block debugging-related requests
            if (url && (url.includes('debugger') || url.includes('devtools') || url.includes('console'))) {
              return;
            }
            return originalOpen.call(this, method, url, async, user, password);
          };
        } catch(e) {}

        // Override fetch to prevent debugging
        try {
          const originalFetch = window.fetch;
          window.fetch = function(input, init) {
            const url = typeof input === 'string' ? input : input.url;
            if (url && (url.includes('debugger') || url.includes('devtools') || url.includes('console'))) {
              return Promise.reject(new Error('Blocked'));
            }
            return originalFetch.call(this, input, init);
          };
        } catch(e) {}

        // Disable WebSocket connections for debugging
        try {
          const originalWebSocket = window.WebSocket;
          window.WebSocket = function(url, protocols) {
            if (url && (url.includes('debugger') || url.includes('devtools') || url.includes('console'))) {
              throw new Error('Blocked');
            }
            return new originalWebSocket(url, protocols);
          };
        } catch(e) {}

        // Override Error constructor to prevent stack traces
        try {
          const originalError = window.Error;
          window.Error = function(message) {
            const error = new originalError(message);
            error.stack = undefined;
            return error;
          };
        } catch(e) {}

        // Disable performance marks and measures
        try {
          performance.mark = function() {};
          performance.measure = function() {};
          performance.getEntriesByType = function() { return []; };
        } catch(e) {}

        // Override Date to prevent timing attacks
        try {
          const originalDate = window.Date;
          const originalNow = Date.now;
          Date.now = function() {
            return Math.floor(originalNow() / 1000) * 1000; // Round to nearest second
          };
        } catch(e) {}

        // Disable requestAnimationFrame for debugging
        try {
          const originalRAF = window.requestAnimationFrame;
          window.requestAnimationFrame = function(callback) {
            return originalRAF.call(this, function(timestamp) {
              // Round timestamp to prevent precise timing
              const roundedTimestamp = Math.floor(timestamp / 100) * 100;
              return callback(roundedTimestamp);
            });
          };
        } catch(e) {}

        console.log('Content protection enabled');
      })();
    `;
    
    // Inject the script
    (document.head || document.documentElement).appendChild(script);
    
    // Remove the script element after injection
    script.remove();
  }

  /**
   * Override console methods in the content script context
   */
  private overrideConsole(): void {
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
   * Disable DevTools in content script context
   */
  private disableDevTools(): void {
    // Check for DevTools every 2 seconds
    setInterval(() => {
      try {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
          // Send message to service worker to handle DevTools detection
          chrome.runtime.sendMessage({
            type: 'devtools_detected',
            url: window.location.href
          });
        }
      } catch (e) {
        // Ignore errors
      }
    }, 2000);
  }
}

// Auto-initialize protection
const contentProtection = ContentProtection.getInstance();

// Enable protection immediately
contentProtection.enable();

export default contentProtection; 