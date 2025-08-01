import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Configurar debug para o frontend
const debugFrontend = (process.env.NODE_ENV === 'development' && 
                      (process.env.NEXT_PUBLIC_DEBUG === 'true' || 
                       typeof window !== 'undefined' && window.location.search.includes('debug=true')));

interface DebugInfo {
  type: 'REQUEST' | 'RESPONSE' | 'ERROR';
  timestamp: string;
  method: string;
  url: string;
  statusCode?: number;
  duration?: number;
  payload?: any;
  response?: any;
  error?: any;
  headers?: any;
}

class FrontendDebugLogger {
  private static instance: FrontendDebugLogger;
  private requestStartTimes: Map<string, number> = new Map();

  static getInstance(): FrontendDebugLogger {
    if (!FrontendDebugLogger.instance) {
      FrontendDebugLogger.instance = new FrontendDebugLogger();
    }
    return FrontendDebugLogger.instance;
  }

  private log(info: DebugInfo): void {
    if (!debugFrontend) return;

    const prefix = '[DEBUG]';
    const timestamp = new Date().toISOString();
    
    switch (info.type) {
      case 'REQUEST':
        console.group(`${prefix} 🚀 Frontend Request (${timestamp})`);
        console.log('📤 Method:', info.method);
        console.log('🌐 URL:', info.url);
        console.log('📋 Headers:', this.sanitizeHeaders(info.headers));
        if (info.payload) {
          console.log('📦 Payload:', this.sanitizeData(info.payload));
        }
        console.groupEnd();
        break;

      case 'RESPONSE':
        const duration = info.duration || 0;
        const statusColor = info.statusCode && info.statusCode >= 200 && info.statusCode < 300 ? '✅' : '⚠️';
        
        console.group(`${prefix} ${statusColor} Frontend Response (${timestamp})`);
        console.log('📥 Method:', info.method);
        console.log('🌐 URL:', info.url);
        console.log('📊 Status:', info.statusCode);
        console.log('⏱️ Duration:', `${duration}ms`);
        if (info.response) {
          console.log('📦 Response:', this.sanitizeData(info.response));
        }
        console.groupEnd();
        break;

      case 'ERROR':
        console.group(`${prefix} ❌ Frontend Error (${timestamp})`);
        console.log('📥 Method:', info.method);
        console.log('🌐 URL:', info.url);
        console.log('📊 Status:', info.statusCode);
        console.log('⏱️ Duration:', `${info.duration}ms`);
        console.log('🚨 Error:', info.error);
        console.groupEnd();
        break;
    }
  }

  private sanitizeHeaders(headers: any): any {
    if (!headers) return headers;
    
    const sanitized = { ...headers };
    const sensitiveKeys = ['authorization', 'cookie', 'set-cookie', 'x-api-key'];
    
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = JSON.parse(JSON.stringify(data));
    
    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      for (const key in obj) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          obj[key] = sanitizeObject(obj[key]);
        }
      }
      
      return obj;
    };
    
    return sanitizeObject(sanitized);
  }

  logRequest(config: AxiosRequestConfig): void {
    const requestId = `${config.method}-${config.url}-${Date.now()}`;
    this.requestStartTimes.set(requestId, Date.now());
    
    this.log({
      type: 'REQUEST',
      timestamp: new Date().toISOString(),
      method: config.method?.toUpperCase() || 'UNKNOWN',
      url: config.url || '',
      payload: config.data,
      headers: config.headers
    });
  }

  logResponse(response: AxiosResponse): void {
    const requestId = `${response.config.method}-${response.config.url}-${Date.now()}`;
    const startTime = this.requestStartTimes.get(requestId);
    const duration = startTime ? Date.now() - startTime : 0;
    
    this.log({
      type: 'RESPONSE',
      timestamp: new Date().toISOString(),
      method: response.config.method?.toUpperCase() || 'UNKNOWN',
      url: response.config.url || '',
      statusCode: response.status,
      duration,
      response: response.data
    });
    
    this.requestStartTimes.delete(requestId);
  }

  logError(error: AxiosError): void {
    const requestId = `${error.config?.method}-${error.config?.url}-${Date.now()}`;
    const startTime = this.requestStartTimes.get(requestId);
    const duration = startTime ? Date.now() - startTime : 0;
    
    this.log({
      type: 'ERROR',
      timestamp: new Date().toISOString(),
      method: error.config?.method?.toUpperCase() || 'UNKNOWN',
      url: error.config?.url || '',
      statusCode: error.response?.status,
      duration,
      error: {
        message: error.message,
        code: error.code,
        response: error.response?.data
      }
    });
    
    this.requestStartTimes.delete(requestId);
  }
}

export function setupDebugInterceptors(axiosInstance: any): void {
  if (!debugFrontend) return;

  const logger = FrontendDebugLogger.getInstance();

  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      logger.logRequest(config);
      return config;
    },
    (error: AxiosError) => {
      logger.logError(error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      logger.logResponse(response);
      return response;
    },
    (error: AxiosError) => {
      logger.logError(error);
      return Promise.reject(error);
    }
  );

  console.log('[DEBUG] 🔧 Interceptors de debug configurados para o frontend');
} 