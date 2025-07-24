import { SecurityInitializer } from './init';
import { SecurityConfigManager } from './config';

export interface SecurityMiddlewareOptions {
  requireIntegrity?: boolean;
  requireLicense?: boolean;
  maxRetries?: number;
  timeout?: number;
}

export class SecurityMiddleware {
  private static retryCount = new Map<string, number>();
  
  static async wrap<T>(
    operation: () => Promise<T>,
    options: SecurityMiddlewareOptions = {},
    operationId?: string
  ): Promise<T> {
    const {
      requireIntegrity = true,
      requireLicense = true,
      maxRetries = SecurityConfigManager.getMaxRetries(),
      timeout = 30000
    } = options;
    
    const id = operationId || `operation_${Date.now()}_${Math.random()}`;
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        // Security validation
        if (requireIntegrity || requireLicense) {
          const securityValid = await SecurityInitializer.validateSecurity();
          if (!securityValid) {
            throw new Error('Security validation failed');
          }
        }
        
        // Execute operation with timeout
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), timeout)
          )
        ]);
        
        // Reset retry count on success
        this.retryCount.delete(id);
        return result;
        
      } catch (error) {
        retries++;
        this.retryCount.set(id, retries);
        
        if (retries > maxRetries) {
          console.error(`Operation failed after ${maxRetries} retries:`, error);
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, retries - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Operation failed');
  }
  
  static async wrapSync<T>(
    operation: () => T,
    options: SecurityMiddlewareOptions = {},
    operationId?: string
  ): Promise<T> {
    return this.wrap(
      () => Promise.resolve(operation()),
      options,
      operationId
    );
  }
  
  static getRetryCount(operationId: string): number {
    return this.retryCount.get(operationId) || 0;
  }
  
  static clearRetryCount(operationId: string): void {
    this.retryCount.delete(operationId);
  }
  
  static clearAllRetryCounts(): void {
    this.retryCount.clear();
  }
} 