const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// Configuration for obfuscation
const obfuscationOptions = {
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
  unicodeEscapeSequence: false
};

function obfuscateFile(filePath) {
  try {
    console.log(`Obfuscating: ${path.basename(filePath)}`);
    
    // Read the file
    const code = fs.readFileSync(filePath, 'utf8');
    
    // Apply obfuscation
    const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, obfuscationOptions).getObfuscatedCode();
    
    // Write the obfuscated code back
    fs.writeFileSync(filePath, obfuscatedCode);
    
    console.log(`✓ Successfully obfuscated: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to obfuscate ${path.basename(filePath)}:`, error.message);
    return false;
  }
}

function obfuscateDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    console.error(`Directory does not exist: ${directoryPath}`);
    return;
  }

  const files = fs.readdirSync(directoryPath);
  let successCount = 0;
  let totalCount = 0;

  files.forEach(file => {
    const filePath = path.join(directoryPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively obfuscate subdirectories
      const subResult = obfuscateDirectory(filePath);
      successCount += subResult.successCount;
      totalCount += subResult.totalCount;
    } else if (file.endsWith('.js')) {
      // Skip worker files and editor files
      if (!file.includes('worker') && 
          !file.includes('editor') && 
          !file.includes('ts.worker') && 
          !file.includes('linter.worker')) {
        
        totalCount++;
        if (obfuscateFile(filePath)) {
          successCount++;
        }
      } else {
        console.log(`Skipping worker file: ${file}`);
      }
    }
  });

  return { successCount, totalCount };
}

// Main execution
function main() {
  const distPath = path.join(__dirname, '..', 'dist', 'ext', 'src');
  
  console.log('🚀 Starting JavaScript obfuscation...');
  console.log(`📁 Target directory: ${distPath}`);
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build directory not found. Please run the build first.');
    process.exit(1);
  }

  const result = obfuscateDirectory(distPath);
  
  console.log('\n📊 Obfuscation Summary:');
  console.log(`✅ Successfully obfuscated: ${result.successCount} files`);
  console.log(`📝 Total files processed: ${result.totalCount} files`);
  
  if (result.successCount === result.totalCount) {
    console.log('🎉 All files obfuscated successfully!');
  } else {
    console.log('⚠️  Some files failed to obfuscate.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { obfuscateFile, obfuscateDirectory, obfuscationOptions }; 