const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

class RspackObfuscationPlugin {
  constructor(options = {}) {
    this.options = {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.4,
      debugProtection: false,
      debugProtectionInterval: 0,
      disableConsoleOutput: true,
      identifierNamesGenerator: 'hexadecimal',
      log: false,
      numbersToExpressions: true,
      renameGlobals: false,
      selfDefending: true,
      simplify: true,
      splitStrings: true,
      splitStringsChunkLength: 10,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayThreshold: 0.75,
      transformObjectKeys: true,
      unicodeEscapeSequence: false,
      ...options
    };
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('RspackObfuscationPlugin', (compilation, callback) => {
      const outputPath = compilation.outputOptions.path;
      
      if (!outputPath) {
        callback();
        return;
      }

      // Get all emitted files
      const emittedFiles = Object.keys(compilation.assets);
      
      // Filter for JavaScript files that should be obfuscated
      const jsFiles = emittedFiles.filter(file => {
        return file.endsWith('.js') && 
               !file.includes('worker') && 
               !file.includes('editor') &&
               !file.includes('ts.worker') &&
               !file.includes('linter.worker');
      });

      console.log(`Obfuscating ${jsFiles.length} JavaScript files...`);

      jsFiles.forEach(file => {
        const filePath = path.join(outputPath, file);
        
        try {
          // Read the file
          const code = fs.readFileSync(filePath, 'utf8');
          
          // Apply obfuscation
          const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, this.options).getObfuscatedCode();
          
          // Write the obfuscated code back
          fs.writeFileSync(filePath, obfuscatedCode);
          
          console.log(`✓ Obfuscated: ${file}`);
        } catch (error) {
          console.error(`✗ Failed to obfuscate ${file}:`, error.message);
        }
      });

      callback();
    });
  }
}

module.exports = RspackObfuscationPlugin; 