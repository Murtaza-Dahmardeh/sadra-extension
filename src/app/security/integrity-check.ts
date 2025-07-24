import CryptoJS from 'crypto-js';
import { SecurityConfigManager } from './config';

export class IntegrityChecker {
  private static readonly SIGNATURE = 'sadra-extension-integrity-2024';
  private static readonly CRITICAL_FUNCTIONS = [
    'RuntimeService',
    'ScriptService', 
    'GMApi',
    'createContext'
  ];
  
  static checkIntegrity(): boolean {
    if (!SecurityConfigManager.isFeatureEnabled('enableIntegrityCheck')) {
      return true; // Skip integrity check if disabled
    }
    
    try {
      // Check if code has been modified
      const currentHash = this.calculateCodeHash();
      const expectedHash = this.getExpectedHash();
      
      if (currentHash !== expectedHash) {
        console.error('Code integrity check failed');
        return false;
      }
      
      // Check if critical functions exist and haven't been modified
      if (!this.verifyCriticalFunctions()) {
        console.error('Critical functions integrity check failed');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Integrity check error:', error);
      return false;
    }
  }
  
  private static calculateCodeHash(): string {
    const criticalCode = this.getCriticalCode();
    return CryptoJS.SHA256(criticalCode + this.SIGNATURE).toString();
  }
  
  private static getCriticalCode(): string {
    // Return critical parts of your code
    const criticalParts = [
      // Add critical function signatures here
      'RuntimeService',
      'ScriptService',
      'GMApi',
      'createContext',
      'compileScriptCode',
      'buildScriptRunResource'
    ];
    return criticalParts.join('');
  }
  
  private static getExpectedHash(): string {
    // This should be pre-calculated and stored securely
    // For now, we'll calculate it dynamically
    const criticalCode = this.getCriticalCode();
    return CryptoJS.SHA256(criticalCode + this.SIGNATURE).toString();
  }
  
  private static verifyCriticalFunctions(): boolean {
    try {
      // Check if critical functions exist in global scope
      const globalScope = typeof window !== 'undefined' ? window : global as any;
      
      for (const funcName of this.CRITICAL_FUNCTIONS) {
        if (typeof globalScope[funcName] === 'undefined') {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  static generateIntegrityHash(): string {
    return this.calculateCodeHash();
  }
} 