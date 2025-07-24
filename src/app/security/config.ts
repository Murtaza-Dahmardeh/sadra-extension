export interface SecurityConfig {
  enableIntegrityCheck: boolean;
  enableAntiTamper: boolean;
  enableLicenseValidation: boolean;
  enableDynamicCode: boolean;
  obfuscationLevel: 'low' | 'medium' | 'high';
  checkInterval: number; // milliseconds
  trialDuration: number; // milliseconds
  maxRetries: number;
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableIntegrityCheck: true,
  enableAntiTamper: true,
  enableLicenseValidation: true,
  enableDynamicCode: false, // Disabled by default as it can impact performance
  obfuscationLevel: 'medium',
  checkInterval: 5000, // 5 seconds
  trialDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
  maxRetries: 3
};

export class SecurityConfigManager {
  private static config: SecurityConfig = DEFAULT_SECURITY_CONFIG;
  
  static getConfig(): SecurityConfig {
    return { ...this.config };
  }
  
  static updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  static isFeatureEnabled(feature: keyof SecurityConfig): boolean {
    return this.config[feature] as boolean;
  }
  
  static getObfuscationLevel(): string {
    return this.config.obfuscationLevel;
  }
  
  static getCheckInterval(): number {
    return this.config.checkInterval;
  }
  
  static getTrialDuration(): number {
    return this.config.trialDuration;
  }
  
  static getMaxRetries(): number {
    return this.config.maxRetries;
  }
} 