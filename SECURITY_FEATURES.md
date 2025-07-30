# Security Features - Chrome DevTools & Debugging Protection

This document outlines the comprehensive security measures implemented to protect the Sadra Extension against Chrome DevTools access and debugging attempts.

## 🔒 Security Overview

The extension implements multiple layers of protection to prevent debugging, DevTools access, and reverse engineering attempts.

## 🛡️ Implemented Security Measures

### 1. Content Security Policy (CSP)
- **Location**: `src/manifest.json`
- **Purpose**: Restricts script execution and resource loading
- **Implementation**: 
  ```json
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'none'; base-uri 'none';"
  }
  ```

### 2. Anti-Debugging Protection
- **Location**: `src/app/security/anti-debug.ts`
- **Features**:
  - Console method override (disables all console output)
  - Debugger statement override
  - DevTools detection via window dimensions
  - Console timing detection
  - Periodic security checks
  - Global object protection

### 3. Content Script Protection
- **Location**: `src/app/security/content-protection.ts`
- **Features**:
  - Injects protection script into web pages
  - Overrides console methods in page context
  - Disables DevTools access
  - Protects against debugging tools
  - Blocks debugging-related network requests

### 4. Service Worker Security
- **Location**: `src/service_worker.ts`
- **Features**:
  - DevTools detection message handling
  - Automatic tab closure on DevTools detection
  - Extension data clearing on security breach
  - WebSocket connection protection

### 5. Build-Time Security
- **Location**: `scripts/post-build-security.js`
- **Features**:
  - Source map removal
  - Console statement removal
  - Debugger statement removal
  - Comment stripping
  - String obfuscation
  - Security headers injection

## 🚀 Usage

### Development Mode
```bash
# Normal development (with debugging enabled)
npm run dev

# Development without source maps
npm run dev:noMap
```

### Production Builds
```bash
# Standard production build
npm run build

# Production build with security measures
npm run build:secure

# Production build with obfuscation
npm run build:obfuscated

# Production build with both security and obfuscation
npm run build:secure-obfuscated
```

### Packaging
```bash
# Standard packaging
npm run pack

# Packaging with security measures
npm run pack:secure

# Packaging with obfuscation
npm run pack:obfuscated

# Packaging with both security and obfuscation
npm run pack:secure-obfuscated
```

## 🔧 Configuration

### Environment Variables
- `NODE_ENV=production`: Enables all security measures
- `NODE_ENV=development`: Disables security measures for debugging

### Build Configuration
- Source maps are disabled in production builds
- CSP is automatically applied in production
- Anti-debugging protection is enabled by default

## 🛡️ Security Features Details

### DevTools Detection
The extension uses multiple methods to detect DevTools:

1. **Window Dimension Check**: Monitors `outerWidth/innerWidth` and `outerHeight/innerHeight` differences
2. **Console Timing**: Measures execution time of debugger statements
3. **Property Detection**: Checks for DevTools-specific properties
4. **Periodic Monitoring**: Continuous checks every 1-5 seconds

### Console Protection
- All console methods are overridden with no-op functions
- Console constructor is protected against tampering
- Console output is completely disabled in production

### Network Protection
- Blocks debugging-related requests (debugger, devtools, console)
- Overrides XMLHttpRequest, fetch, and WebSocket constructors
- Prevents connections to debugging tools

### Storage Protection
- Restricts localStorage access to specific keys
- Clears all storage on security breach detection
- Protects against debugging-related storage access

### Code Protection
- Source maps are removed in production
- Comments are stripped to prevent information leakage
- Sensitive strings are obfuscated
- Debugger statements are removed

## 🚨 Security Responses

When DevTools or debugging is detected:

1. **Immediate Response**:
   - Clear all intervals and timeouts
   - Clear localStorage and sessionStorage
   - Remove all event listeners

2. **Page Protection**:
   - Clear page content (body and head)
   - Redirect to `about:blank`
   - Attempt to close the window

3. **Extension Protection**:
   - Close the affected tab
   - Clear extension storage
   - Log security event

## 🔍 Testing Security

### Verify Protection is Active
1. Open the extension in Chrome
2. Try to open DevTools (F12)
3. Check console for any output
4. Verify that debugging is blocked

### Security Verification
The extension creates a `security-verification.js` file that can be used to verify protection is active.

## ⚠️ Important Notes

1. **Development**: Security measures are disabled in development mode to allow debugging
2. **Performance**: Security checks add minimal overhead
3. **Compatibility**: All protection measures are designed to be non-breaking
4. **Updates**: Security measures are automatically applied in production builds

## 🔧 Troubleshooting

### If Security Measures Break Functionality
1. Check if you're in development mode
2. Verify the security configuration
3. Review console for any error messages
4. Ensure all security files are properly imported

### If DevTools Still Work
1. Verify you're using a production build
2. Check that the security scripts are loaded
3. Ensure CSP is properly configured
4. Verify anti-debugging protection is enabled

## 📝 Security Logs

Security events are logged to the console (when available) and can be monitored for:
- DevTools detection
- Debugging attempts
- Security breaches
- Protection activations

## 🔄 Updates and Maintenance

Security measures are automatically updated with each build. To manually update security:

```bash
# Apply security measures to existing build
npm run secure

# Rebuild with latest security
npm run build:secure
```

---

**Note**: These security measures are designed to protect against common debugging and reverse engineering attempts. They provide multiple layers of protection but should be considered as part of a broader security strategy. 