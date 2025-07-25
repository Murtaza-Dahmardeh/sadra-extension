import { IntegrityChecker } from './integrity-check';
import { AntiTamper } from './anti-tamper';
import { LicenseManager } from './license';
import { SecurityConfigManager } from './config';

export class SecurityInitializer {
  private static isInitialized = false;
  
  static async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }
    
    try {
      // Always run security measures as if in production mode
      console.log('Initializing security measures...');
      // 1. Check code integrity
      if (!IntegrityChecker.checkIntegrity()) {
        console.error('Security initialization failed: Code integrity check failed');
        return false;
      }
      // 2. Initialize anti-tampering protection
      if (SecurityConfigManager.isFeatureEnabled('enableAntiTamper')) {
        AntiTamper.init();
        console.log('Anti-tamper protection initialized');
      }
      // 3. Validate license
      if (SecurityConfigManager.isFeatureEnabled('enableLicenseValidation')) {
        const licenseValid = await LicenseManager.validateLicense();
        if (!licenseValid) {
          console.error('Security initialization failed: Invalid license');
          return false;
        }
        console.log('License validation passed');
      }
      console.log('Security initialization completed successfully');
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Security initialization error:', error);
      return false;
    }
  }
  
  static isSecurityEnabled(): boolean {
    // Security is always enabled if initialized
    return this.isInitialized;
  }
  
  static async validateSecurity(): Promise<boolean> {
    if (!this.isSecurityEnabled()) {
      return true;
    }
    
    try {
      // Check integrity
      if (!IntegrityChecker.checkIntegrity()) {
        return false;
      }
      
      // Check license
      if (SecurityConfigManager.isFeatureEnabled('enableLicenseValidation')) {
        return await LicenseManager.validateLicense();
      }
      
      return true;
    } catch (error) {
      console.error('Security validation error:', error);
      return false;
    }
  }
  
  static cleanup(): void {
    if (this.isInitialized) {
      AntiTamper.cleanup();
      this.isInitialized = false;
    }
  }
} 