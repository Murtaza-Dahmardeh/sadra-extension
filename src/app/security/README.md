# Security Implementation

This directory contains the security modules for the Sadra Extension to prevent unauthorized copying and modification of the code.

## Security Features

### 1. Integrity Checker (`integrity-check.ts`)
- Verifies that critical code hasn't been modified
- Uses SHA-256 hashing to detect tampering
- Checks for the existence of critical functions
- Can be enabled/disabled via configuration

### 2. Anti-Tamper Protection (`anti-tamper.ts`)
- Disables developer tools (F12, Ctrl+Shift+I, etc.)
- Prevents right-click context menu
- Monitors for function modifications
- Overrides console methods to prevent debugging
- Makes critical functions non-writable and non-configurable

### 3. License Management (`license.ts`)
- Validates license keys locally and remotely
- Supports trial periods
- Domain-based licensing
- Feature-based access control
- Encrypted license storage

### 4. Dynamic Code Generation (`dynamic-code.ts`)
- Generates functions at runtime to make static analysis harder
- String obfuscation capabilities
- Self-modifying function generation
- Polymorphic code generation
- Stealth function execution

### 5. Security Configuration (`config.ts`)
- Centralized security settings
- Feature toggles for each security measure
- Configurable intervals and durations
- Performance impact controls

## Usage

### Basic Implementation

```typescript
import { IntegrityChecker, AntiTamper, LicenseManager } from './app/security';

// Initialize security measures
// Security features are always enabled, no development mode checks.
if (process.env.NODE_ENV === 'production') {
  // Check code integrity
  if (!IntegrityChecker.checkIntegrity()) {
    console.error('Code integrity check failed');
    return;
  }
  
  // Initialize anti-tampering
  AntiTamper.init();
  
  // Validate license
  const licenseValid = await LicenseManager.validateLicense();
  if (!licenseValid) {
    console.error('Invalid license');
    return;
  }
}
```

### Configuration

```typescript
import { SecurityConfigManager } from './app/security';

// Update security configuration
SecurityConfigManager.updateConfig({
  enableIntegrityCheck: true,
  enableAntiTamper: true,
  enableLicenseValidation: true,
  obfuscationLevel: 'high',
  checkInterval: 3000 // 3 seconds
});
```

### License Management

```typescript
import { LicenseManager } from './app/security';

// Set a license
const success = LicenseManager.setLicense('encrypted-license-key');

// Check if feature is available
if (LicenseManager.hasFeature('premium-feature')) {
  // Enable premium functionality
}

// Check trial status
if (LicenseManager.isTrialMode()) {
  // Show trial limitations
}
```

## Build Process

The build process includes:

1. **Integrity Hash Generation**: During the build, critical files are hashed and stored
2. **Code Minification**: Enhanced minification removes console logs and debugger statements
3. **Source Map Removal**: Source maps are disabled in production builds
4. **Chrome Extension Signing**: CRX files are signed with private keys

## Security Considerations

### Limitations
- Client-side security measures can be bypassed by determined attackers
- No 100% protection against reverse engineering
- Performance impact of security checks

### Best Practices
- Regularly update obfuscation patterns
- Implement server-side validation
- Use legal protection (copyright, terms of service)
- Monitor for unauthorized usage
- Keep security measures up to date

### Performance Impact
- Integrity checks: Minimal impact
- Anti-tamper protection: Low impact
- License validation: Cached to minimize impact
- Dynamic code generation: Can impact performance (disabled by default)

## Configuration Options

| Feature | Default | Description |
|---------|---------|-------------|
| `enableIntegrityCheck` | `true` | Enable code integrity verification |
| `enableAntiTamper` | `true` | Enable anti-tampering protection |
| `enableLicenseValidation` | `true` | Enable license validation |
| `enableDynamicCode` | `false` | Enable dynamic code generation |
| `obfuscationLevel` | `'medium'` | Code obfuscation level |
| `checkInterval` | `5000` | Integrity check interval (ms) |
| `trialDuration` | `30 days` | Trial period duration |
| `maxRetries` | `3` | Maximum validation retries |

## File Structure

```
src/app/security/
├── index.ts              # Main exports
├── config.ts             # Security configuration
├── integrity-check.ts    # Code integrity verification
├── anti-tamper.ts        # Anti-tampering protection
├── license.ts            # License management
├── dynamic-code.ts       # Dynamic code generation
└── README.md            # This file
```

## Integration Points

The security modules are integrated into:

1. **Service Worker** (`src/service_worker.ts`): Main security initialization
2. **Content Script** (`src/content.ts`): Anti-tamper protection
3. **Build Process** (`scripts/pack.js`): Integrity hash generation
4. **Build Configuration** (`rspack.config.ts`): Enhanced minification

## Troubleshooting

### Common Issues

1. **Security checks failing in development**: Security measures are only active in production mode
2. **Performance issues**: Disable dynamic code generation or reduce check intervals
3. **License validation errors**: Check network connectivity and license key format
4. **Build errors**: Ensure all dependencies are installed

### Debug Mode

To disable security measures for debugging:

```typescript
SecurityConfigManager.updateConfig({
  enableIntegrityCheck: false,
  enableAntiTamper: false,
  enableLicenseValidation: false
});
```

## Legal Notice

This security implementation is designed to protect intellectual property and prevent unauthorized use. Users should comply with the extension's terms of service and licensing agreements. 