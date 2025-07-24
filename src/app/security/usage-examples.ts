// Security Usage Examples
// This file demonstrates how to use the security features in your extension

import { 
  SecurityInitializer, 
  SecurityConfigManager, 
  LicenseManager, 
  SecurityMiddleware,
  IntegrityChecker,
  AntiTamper,
  DynamicCodeGenerator 
} from './index';

// Example 1: Basic Security Initialization
export async function initializeSecurity() {
  try {
    const success = await SecurityInitializer.initialize();
    if (success) {
      console.log('Security initialized successfully');
    } else {
      console.error('Security initialization failed');
    }
  } catch (error) {
    console.error('Security initialization error:', error);
  }
}

// Example 2: Configure Security Settings
export function configureSecurity() {
  SecurityConfigManager.updateConfig({
    enableIntegrityCheck: true,
    enableAntiTamper: true,
    enableLicenseValidation: true,
    enableDynamicCode: false, // Disabled for performance
    obfuscationLevel: 'high',
    checkInterval: 3000, // 3 seconds
    trialDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxRetries: 3
  });
}

// Example 3: License Management
export async function manageLicense() {
  // Set a license key
  const licenseKey = 'your-encrypted-license-key';
  const success = LicenseManager.setLicense(licenseKey);
  
  if (success) {
    console.log('License set successfully');
    
    // Check if feature is available
    if (LicenseManager.hasFeature('premium-feature')) {
      console.log('Premium feature available');
    }
    
    // Check trial status
    if (LicenseManager.isTrialMode()) {
      console.log('Running in trial mode');
    }
  } else {
    console.error('Failed to set license');
  }
}

// Example 4: Secure API Calls
export async function secureApiCall() {
  const result = await SecurityMiddleware.wrap(
    async () => {
      // Your API call here
      const response = await fetch('https://api.example.com/data');
      return response.json();
    },
    {
      requireIntegrity: true,
      requireLicense: true,
      maxRetries: 3,
      timeout: 10000
    },
    'api_call_001'
  );
  
  return result;
}

// Example 5: Dynamic Code Generation
export function useDynamicCode() {
  const code = `
    function calculateSum(a, b) {
      return a + b;
    }
    calculateSum(5, 3);
  `;
  
  // Generate obfuscated function
  const obfuscatedFunc = DynamicCodeGenerator.generateObfuscatedFunction(code);
  
  // Generate polymorphic function
  const polymorphicFunc = DynamicCodeGenerator.generatePolymorphicFunction(code);
  
  // Generate stealth function
  const stealthFunc = DynamicCodeGenerator.generateStealthFunction(code);
  
  return { obfuscatedFunc, polymorphicFunc, stealthFunc };
}

// Example 6: Manual Security Checks
export async function manualSecurityChecks() {
  // Check integrity
  const integrityValid = IntegrityChecker.checkIntegrity();
  if (!integrityValid) {
    console.error('Code integrity check failed');
    return false;
  }
  
  // Check license
  const licenseValid = await LicenseManager.validateLicense();
  if (!licenseValid) {
    console.error('License validation failed');
    return false;
  }
  
  return true;
}

// Example 7: Anti-Tamper Protection
export function setupAntiTamper() {
  // Initialize anti-tamper protection
  AntiTamper.init();
  
  // Later, cleanup when needed
  // AntiTamper.cleanup();
}

// Example 8: Secure Script Execution
export function secureScriptExecution(scriptCode: string) {
  // Wrap script execution with security checks
  return SecurityMiddleware.wrap(
    async () => {
      // Execute the script
      const func = new Function(scriptCode);
      return func();
    },
    {
      requireIntegrity: true,
      requireLicense: true,
      maxRetries: 2,
      timeout: 5000
    },
    'script_execution'
  );
}

// Example 9: Security Monitoring
export function setupSecurityMonitoring() {
  // Monitor security status periodically
  setInterval(async () => {
    const securityValid = await SecurityInitializer.validateSecurity();
    if (!securityValid) {
      console.error('Security validation failed during monitoring');
      // Take action: disable features, show warning, etc.
    }
  }, 10000); // Check every 10 seconds
}

// Example 10: Debug Mode
export function enableDebugMode() {
  // Disable security measures for debugging
  SecurityConfigManager.updateConfig({
    enableIntegrityCheck: false,
    enableAntiTamper: false,
    enableLicenseValidation: false,
    enableDynamicCode: false
  });
  
  console.log('Security measures disabled for debugging');
}

// Example 11: Production Mode
export function enableProductionMode() {
  // Enable all security measures for production
  SecurityConfigManager.updateConfig({
    enableIntegrityCheck: true,
    enableAntiTamper: true,
    enableLicenseValidation: true,
    enableDynamicCode: false, // Keep disabled for performance
    obfuscationLevel: 'high',
    checkInterval: 5000,
    maxRetries: 3
  });
  
  console.log('Production security mode enabled');
}

// Example 12: Custom Security Validation
export async function customSecurityValidation() {
  // Custom validation logic
  const checks = [
    IntegrityChecker.checkIntegrity(),
    LicenseManager.validateLicense(),
    // Add your custom checks here
  ];
  
  const results = await Promise.all(checks);
  const allValid = results.every(result => result === true);
  
  if (!allValid) {
    throw new Error('Custom security validation failed');
  }
  
  return true;
}

// Example 13: Error Handling
export async function secureOperationWithErrorHandling() {
  try {
    const result = await SecurityMiddleware.wrap(
      async () => {
        // Your operation here
        throw new Error('Operation failed');
      },
      { maxRetries: 2 }
    );
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage === 'Security validation failed') {
      console.error('Security check failed, operation blocked');
      // Handle security failure
    } else if (errorMessage === 'Operation timeout') {
      console.error('Operation timed out');
      // Handle timeout
    } else {
      console.error('Operation failed:', error);
      // Handle other errors
    }
    
    throw error;
  }
}

// Example 14: Performance Monitoring
export function monitorSecurityPerformance() {
  const startTime = performance.now();
  
  SecurityInitializer.validateSecurity().then(() => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 100) { // More than 100ms
      console.warn(`Security validation took ${duration}ms`);
    }
  });
}

// Example 15: Integration with Extension Lifecycle
export class SecurityLifecycleManager {
  static async onExtensionStart() {
    await initializeSecurity();
    configureSecurity();
    setupSecurityMonitoring();
  }
  
  static async onExtensionStop() {
    SecurityInitializer.cleanup();
    SecurityMiddleware.clearAllRetryCounts();
  }
  
  static async onPageLoad() {
    setupAntiTamper();
  }
  
  static async onScriptExecution(scriptCode: string) {
    return secureScriptExecution(scriptCode);
  }
} 