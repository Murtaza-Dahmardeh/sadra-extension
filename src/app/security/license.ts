import CryptoJS from 'crypto-js';
import { SecurityConfigManager } from './config';

export interface LicenseInfo {
  key: string;
  validUntil: Date;
  features: string[];
  maxUsers?: number;
  domain?: string;
}

export class LicenseManager {
  private static readonly LICENSE_KEY = 'sadra-extension-license-2024';
  private static readonly VALIDATION_URL = 'https://ivbs.sadratechs.com/validate-license';
  private static licenseInfo: LicenseInfo | null = null;
  private static validationCache = new Map<string, { valid: boolean; timestamp: number }>();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  static async validateLicense(): Promise<boolean> {
    if (!SecurityConfigManager.isFeatureEnabled('enableLicenseValidation')) {
      return true; // Skip license validation if disabled
    }
    
    try {
      // Check cache first
      const cached = this.validationCache.get(this.LICENSE_KEY);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.valid;
      }
      
      // Try local validation first
      const localValid = this.checkLocalLicense();
      if (!localValid) {
        this.cacheValidation(false);
        return false;
      }
      
      // Try server validation if available
      const serverValid = await this.validateWithServer();
      this.cacheValidation(serverValid);
      
      return serverValid;
    } catch (error) {
      console.error('License validation error:', error);
      // Fallback to local validation
      const localValid = this.checkLocalLicense();
      this.cacheValidation(localValid);
      return localValid;
    }
  }
  
  private static checkLocalLicense(): boolean {
    try {
      // Check if we have stored license info
      if (this.licenseInfo) {
        return this.isLicenseValid(this.licenseInfo);
      }
      
      // Try to load from storage
      const storedLicense = this.loadLicenseFromStorage();
      if (storedLicense) {
        this.licenseInfo = storedLicense;
        return this.isLicenseValid(storedLicense);
      }
      
      // Check for trial license
      return this.checkTrialLicense();
    } catch (error) {
      return false;
    }
  }
  
  private static isLicenseValid(license: LicenseInfo): boolean {
    // Check expiration
    if (license.validUntil && new Date() > license.validUntil) {
      return false;
    }
    
    // Check domain if specified
    if (license.domain && typeof window !== 'undefined') {
      const currentDomain = window.location.hostname;
      if (currentDomain !== license.domain && !currentDomain.endsWith(license.domain)) {
        return false;
      }
    }
    
    return true;
  }
  
  private static checkTrialLicense(): boolean {
    try {
      // Check if trial period is still valid
      const trialStart = localStorage.getItem('sadra-trial-start');
      const trialDuration = SecurityConfigManager.getTrialDuration();
      
      if (!trialStart) {
        // Start trial
        localStorage.setItem('sadra-trial-start', Date.now().toString());
        return true;
      }
      
      const startTime = parseInt(trialStart, 10);
      const now = Date.now();
      
      return (now - startTime) < trialDuration;
    } catch (error) {
      return false;
    }
  }
  
  private static async validateWithServer(): Promise<boolean> {
    try {
      // This would be implemented to validate with your server
      // For now, we'll simulate a successful validation
      return true;
    } catch (error) {
      return false;
    }
  }
  
  private static loadLicenseFromStorage(): LicenseInfo | null {
    try {
      const stored = localStorage.getItem('sadra-license');
      if (!stored) return null;
      
      const decrypted = this.decryptLicense(stored);
      return JSON.parse(decrypted);
    } catch (error) {
      return null;
    }
  }
  
  private static encryptLicense(license: LicenseInfo): string {
    const licenseString = JSON.stringify(license);
    return CryptoJS.AES.encrypt(licenseString, this.LICENSE_KEY).toString();
  }
  
  private static decryptLicense(encrypted: string): string {
    const bytes = CryptoJS.AES.decrypt(encrypted, this.LICENSE_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
  
  private static cacheValidation(valid: boolean): void {
    this.validationCache.set(this.LICENSE_KEY, {
      valid,
      timestamp: Date.now()
    });
  }
  
  static setLicense(licenseKey: string): boolean {
    try {
      // Decrypt and validate the license key
      const decrypted = this.decryptLicense(licenseKey);
      const license: LicenseInfo = JSON.parse(decrypted);
      
      if (this.isLicenseValid(license)) {
        this.licenseInfo = license;
        localStorage.setItem('sadra-license', licenseKey);
        this.validationCache.clear(); // Clear cache to force re-validation
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
  
  static getLicenseInfo(): LicenseInfo | null {
    return this.licenseInfo;
  }
  
  static hasFeature(feature: string): boolean {
    if (!this.licenseInfo) return false;
    return this.licenseInfo.features.includes(feature);
  }
  
  static clearLicense(): void {
    this.licenseInfo = null;
    localStorage.removeItem('sadra-license');
    this.validationCache.clear();
  }
  
  static isTrialMode(): boolean {
    return this.checkTrialLicense();
  }
} 