import type { ScriptRunResource } from "@App/app/repo/scripts";
import type { ScriptFunc } from "./types";
import { DynamicCodeGenerator } from "@App/app/security/dynamic-code";
import { SecurityConfigManager } from "@App/app/security/config";

// 构建脚本运行代码
/**
 * @see {@link ExecScript}
 * @param scriptRes
 * @param scriptCode
 * @returns
 */
export function compileScriptCode(scriptRes: ScriptRunResource, scriptCode?: string): string {
  scriptCode = scriptCode ?? scriptRes.code;
  let requireCode = "";
  if (Array.isArray(scriptRes.metadata.require)) {
    requireCode += scriptRes.metadata.require
      .map((val) => {
        const res = scriptRes.resource[val];
        if (res) {
          return res.content;
        }
      })
      .join("\n");
  }
  
  // Add security wrapper for production builds
  const securityWrapper = SecurityConfigManager.isFeatureEnabled('enableDynamicCode') 
    ? `// Security: ${Date.now()}\n` 
    : '';
  
  const sourceURL = `//# sourceURL=${chrome.runtime.getURL(`/${encodeURI(scriptRes.name)}.user.js`)}`;
  const preCode = [requireCode].join("\n"); // 不需要 async 封装
  const code = [scriptCode, sourceURL].join("\n"); // 需要 async 封装, 可top-level await
  
  // Enhanced security wrapper
  const secureCode = `${securityWrapper}try {
  with(arguments[0]||this.$){
${preCode}
    return (async function(){
${code}
    }).call(this);
  }
} catch (e) {
  if (e.message && e.stack) {
      console.error("ERROR: Execution of script '" + arguments[1] + "' failed! " + e.message);
      console.log(e.stack);
  } else {
      console.error(e);
  }
}`;

  // Apply obfuscation if enabled
  if (SecurityConfigManager.isFeatureEnabled('enableDynamicCode')) {
    return DynamicCodeGenerator.obfuscateStringsInCode(secureCode);
  }
  
  return secureCode;
}

// 通过脚本代码编译脚本函数
export function compileScript(code: string): ScriptFunc {
  // Use dynamic code generation for enhanced security
  if (SecurityConfigManager.isFeatureEnabled('enableDynamicCode')) {
    return <ScriptFunc>DynamicCodeGenerator.generateObfuscatedFunction(code);
  }
  return <ScriptFunc>new Function(code);
}

/**
 * 将脚本函数编译为注入脚本代码
 * @param script
 * @param scriptCode
 * @param [autoDeleteMountFunction=false] 是否自动删除挂载的函数
 */
export function compileInjectScript(
  script: ScriptRunResource,
  scriptCode: string,
  autoDeleteMountFunction: boolean = false
): string {
  const autoDeleteMountCode = autoDeleteMountFunction ? `try{delete window['${script.flag}']}catch(e){}` : "";
  return `window['${script.flag}'] = function(){${autoDeleteMountCode}${scriptCode}}`;
}

export function addStyle(css: string): HTMLStyleElement {
  const dom = document.createElement("style");
  dom.textContent = css;
  if (document.head) {
    return document.head.appendChild(dom);
  }
  return document.documentElement.appendChild(dom);
}
