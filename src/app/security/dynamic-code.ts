export class DynamicCodeGenerator {
  private static readonly CODE_CACHE = new Map<string, Function>();
  private static readonly STRING_CACHE = new Map<string, string>();
  
  static generateFunction(code: string, context?: any): Function {
    try {
      // Check cache first
      const cacheKey = this.hashCode(code);
      if (this.CODE_CACHE.has(cacheKey)) {
        return this.CODE_CACHE.get(cacheKey)!;
      }
      
      // Generate function dynamically
      const func = new Function('context', `
        with(context || {}) {
          return (function() {
            ${code}
          })();
        }
      `);
      
      // Cache the function
      this.CODE_CACHE.set(cacheKey, func);
      
      return func;
    } catch (error) {
      console.error('Error generating function:', error);
      return () => {};
    }
  }
  
  static obfuscateString(str: string): string {
    // Convert strings to character codes to make them harder to read
    return str.split('').map(char => char.charCodeAt(0)).join(',');
  }
  
  static deobfuscateString(obfuscated: string): string {
    // Convert character codes back to string
    return obfuscated.split(',').map(code => String.fromCharCode(parseInt(code, 10))).join('');
  }
  
  static generateObfuscatedFunction(code: string, context?: any): Function {
    // Generate a function with obfuscated strings
    const obfuscatedCode = this.obfuscateStringsInCode(code);
    return this.generateFunction(obfuscatedCode, context);
  }
  
  static obfuscateStringsInCode(code: string): string {
    // Replace string literals with obfuscated versions
    return code.replace(/'([^']*)'/g, (match, str) => {
      const obfuscated = this.obfuscateString(str);
      return `String.fromCharCode(${obfuscated})`;
    }).replace(/"([^"]*)"/g, (match, str) => {
      const obfuscated = this.obfuscateString(str);
      return `String.fromCharCode(${obfuscated})`;
    });
  }
  
  static generateSelfModifyingFunction(baseCode: string): Function {
    // Generate a function that can modify itself
    const code = `
      let modified = false;
      const originalCode = ${JSON.stringify(baseCode)};
      
      return function(context) {
        if (!modified) {
          // Modify the function on first execution
          modified = true;
          // Add some random modifications to make analysis harder
          const randomMod = Math.random().toString(36).substring(7);
          eval(originalCode + '; // ' + randomMod);
        }
        
        // Execute the modified code
        return eval(originalCode);
      };
    `;
    
    return this.generateFunction(code);
  }
  
  static generateEncryptedFunction(code: string, key: string): Function {
    // Generate a function with encrypted code
    const encryptedCode = this.encryptCode(code, key);
    const decryptionCode = `
      const encrypted = ${JSON.stringify(encryptedCode)};
      const key = ${JSON.stringify(key)};
      const decrypted = this.decryptCode(encrypted, key);
      return eval(decrypted);
    `;
    
    return this.generateFunction(decryptionCode);
  }
  
  private static encryptCode(code: string, key: string): string {
    // Simple XOR encryption (in production, use a proper encryption library)
    let encrypted = '';
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      encrypted += String.fromCharCode(charCode);
    }
    return btoa(encrypted);
  }
  
  private static decryptCode(encrypted: string, key: string): string {
    // Simple XOR decryption
    const decoded = atob(encrypted);
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
  }
  
  static generatePolymorphicFunction(baseCode: string): Function {
    // Generate a function that changes its structure each time it's called
    const polymorphicCode = `
      let callCount = 0;
      const baseCode = ${JSON.stringify(baseCode)};
      
      return function(context) {
        callCount++;
        
        // Modify the code based on call count
        let modifiedCode = baseCode;
        
        // Add random comments
        const randomComment = '// ' + Math.random().toString(36).substring(7);
        modifiedCode = randomComment + '\\n' + modifiedCode;
        
        // Add random variable names
        const randomVar = '_' + Math.random().toString(36).substring(7);
        modifiedCode = 'const ' + randomVar + ' = ' + callCount + ';\\n' + modifiedCode;
        
        // Execute the modified code
        return eval(modifiedCode);
      };
    `;
    
    return this.generateFunction(polymorphicCode);
  }
  
  static generateStealthFunction(code: string): Function {
    // Generate a function that tries to hide its execution
    const stealthCode = `
      const code = ${JSON.stringify(code)};
      
      // Hide the function execution
      const execute = () => eval(code);
      
      // Use setTimeout to delay execution slightly
      return function(context) {
        return new Promise((resolve) => {
          setTimeout(() => {
            try {
              const result = execute.call(context);
              resolve(result);
            } catch (error) {
              resolve(null);
            }
          }, Math.random() * 10);
        });
      };
    `;
    
    return this.generateFunction(stealthCode);
  }
  
  private static hashCode(str: string): string {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
  
  static clearCache(): void {
    this.CODE_CACHE.clear();
    this.STRING_CACHE.clear();
  }
} 