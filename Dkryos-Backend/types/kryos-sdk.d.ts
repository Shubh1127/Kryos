// Minimal ambient type declarations for kryos-sdk
// Extend as SDK surface grows.
declare module 'kryos-sdk' {
  interface KryosSDKInitOptions {
    keyId: string;
    keySecret: string;
    baseUrl?: string;
    serviceName?: string;
    serviceVersion?: string;
    enableDefaultMetrics?: boolean;
    enableLogging?: boolean;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    customTags?: Record<string, any>;
  }

  interface UserData { externalId: string; [k: string]: any }
  interface EntryData { externalId: string; dataType: string; data: any; tags?: string[]; [k: string]: any }
  interface EventData { eventType: string; [k: string]: any }
  interface ErrorData { message: string; stack?: string; code?: any; severity?: string; context?: any }

  class KryosSDK {
    constructor(options: KryosSDKInitOptions);
    static init(options: KryosSDKInitOptions): KryosSDK;
    static version: string;
    config: any;
    monitoring: any;
    api: any;
    middleware: any;
    utils: any;
    getConfig(): any;
    testConnection(): Promise<any>;
    getMetrics(): Promise<string>;
    sendUserData(userData: UserData, files?: string[]): Promise<any>;
    sendEntryData(entryData: EntryData, files?: string[]): Promise<any>;
    sendMetrics(customMetrics?: Record<string, any>): Promise<any>;
    shutdown(): Promise<void>;
    getRequestLogger(): import('express').RequestHandler;
    getMetricsMiddleware(): import('express').RequestHandler;
  }

  export default KryosSDK;
}
