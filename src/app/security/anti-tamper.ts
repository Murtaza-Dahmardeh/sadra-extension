import { SecurityConfigManager } from './config';

export class AntiTamper {
  private static isInitialized = false;
  private static originalFunctions = new Map<string, any>();
  private static checkInterval: NodeJS.Timeout | null = null;
  
  static init() {
    if (this.isInitialized) return;
    // Always run anti-tamper logic as if in production mode
    if (SecurityConfigManager.isFeatureEnabled('enableAntiTamper')) {
      this.disableDevTools();
      this.detectTampering();
      this.obfuscateConsole();
      this.protectCriticalFunctions();
      this.isInitialized = true;
    }
  }
  
  private static disableDevTools() {
    // Disable F12, Ctrl+Shift+I, Ctrl+U, right-click
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.key === 'u') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }, true);
      
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }, true);
      
      // Disable view source
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'u') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }, true);
    }
  }
  
  private static detectTampering() {
    // Check if functions have been modified periodically
    this.checkInterval = setInterval(() => {
      this.verifyFunctionIntegrity();
    }, SecurityConfigManager.getCheckInterval()); // Use configured interval
  }
  
  private static verifyFunctionIntegrity() {
    try {
      // Check if critical functions still exist and haven't been modified
      const criticalFunctions = [
        'RuntimeService',
        'ScriptService',
        'GMApi',
        'createContext'
      ];
      
      for (const funcName of criticalFunctions) {
        const globalScope = typeof window !== 'undefined' ? window : global as any;
        if (typeof globalScope[funcName] === 'undefined') {
          this.handleTamperingDetected();
          return;
        }
      }
    } catch (error) {
      this.handleTamperingDetected();
    }
  }
  
  private static handleTamperingDetected() {
    // Clear the check interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    // Disable functionality
    this.disableExtension();
    
    // Log tampering attempt (in production, this might be sent to a server)
    console.error('Tampering detected - Extension disabled');
  }
  
  private static disableExtension() {
    // Disable critical functionality
    try {
      const globalScope = typeof window !== 'undefined' ? window : global as any;
      
      // Override critical functions with no-ops
      const noop = () => { throw new Error('Extension disabled due to tampering'); };
      
      if (globalScope.RuntimeService) {
        globalScope.RuntimeService = noop;
      }
      if (globalScope.ScriptService) {
        globalScope.ScriptService = noop;
      }
      if (globalScope.GMApi) {
        globalScope.GMApi = noop;
      }
    } catch (error) {
      // Silently fail
    }
  }
  
  private static obfuscateConsole() {
    // Override console methods to prevent debugging
    const noop = () => {};
    const originalConsole = { ...console };
    
    // Store original methods
    this.originalFunctions.set('console.log', originalConsole.log);
    this.originalFunctions.set('console.debug', originalConsole.debug);
    this.originalFunctions.set('console.info', originalConsole.info);
    this.originalFunctions.set('console.warn', originalConsole.warn);
    this.originalFunctions.set('console.error', originalConsole.error);
    
    // Override with no-ops
    console.log = noop;
    console.debug = noop;
    console.info = noop;
    console.warn = noop;
    console.error = noop;
  }
  
  private static protectCriticalFunctions() {
    try {
      const globalScope = typeof window !== 'undefined' ? window : global as any;
      
      // Make critical functions non-configurable and non-writable
      const criticalFunctions = ['RuntimeService', 'ScriptService', 'GMApi'];
      
      for (const funcName of criticalFunctions) {
        if (globalScope[funcName]) {
          try {
            Object.defineProperty(globalScope, funcName, {
              value: globalScope[funcName],
              writable: false,
              configurable: false,
              enumerable: true
            });
          } catch (error) {
            // Function might already be protected
          }
        }
      }
    } catch (error) {
      // Silently fail
    }
  }
  
  static cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    // Restore original console methods
    const originalConsole = this.originalFunctions.get('console.log');
    if (originalConsole) {
      console.log = originalConsole;
      console.debug = this.originalFunctions.get('console.debug') || console.log;
      console.info = this.originalFunctions.get('console.info') || console.log;
      console.warn = this.originalFunctions.get('console.warn') || console.log;
      console.error = this.originalFunctions.get('console.error') || console.log;
    }
  }
} 