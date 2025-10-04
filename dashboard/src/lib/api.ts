// API service for the Kryos dashboard
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Company {
  _id: string;
  name: string;
  email: string;
  description?: string;
  website?: string;
  contactPerson: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  _id: string;
  id: string;
  keyId: string;
  key: string;
  name: string;
  description: string;
  permissions: string[];
  company: string;
  status: 'active' | 'expired' | 'disabled';
  isActive: boolean;
  lastUsed?: string;
  expiresAt?: string;
  createdAt: string;
  usageCount?: number;
  rateLimit?: number;
}

export interface User {
  externalId: string;
  name: string;
  email: string;
  phone?: string;
  metadata?: Record<string, any>;
  company: string;
  createdAt: string;
}

export interface DataEntry {
  _id: string;
  externalId: string;
  company: string;
  user?: User;
  dataType: 'user_data' | 'event_data' | 'custom_data';
  data: Record<string, any>;
  files?: string[];
  tags: string[];
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalEntries: number;
  totalFiles: number;
  totalApiKeys: number;
  recentActivity: DataEntry[];
  trafficByDay: { date: string; requests: number }[];
  eventTypes: { type: string; count: number }[];
  securityAlerts: SecurityAlert[];
}

export interface SecurityAlert {
  _id: string;
  type: 'suspicious_ip' | 'brute_force' | 'sql_injection' | 'xss_attempt' | 'ddos' | 'malware' | 'rate_limit_exceeded' | 'malware_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source: {
    ip: string;
    userAgent?: string;
    location?: string;
  };
  details: Record<string, unknown>;
  status: 'new' | 'investigating' | 'resolved' | 'blocked' | 'quarantined';
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  general: {
    companyName: string;
    timezone: string;
    language: string;
    dateFormat: string;
  };
  security: {
    sessionTimeout: number;
    mfaRequired: boolean;
    ipWhitelist: string[];
    allowedOrigins: string[];
  };
  notifications: {
    emailAlerts: boolean;
    securityNotifications: boolean;
    systemUpdates: boolean;
    marketingEmails: boolean;
  };
  api: {
    rateLimit: number;
    rateLimitWindow: number;
    maxPayloadSize: number;
    allowedFormats: string[];
  };
}

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get token from localStorage for authenticated requests
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    console.log('🌐 Making API request to:', url);
    console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('❌ API request failed:', error);
      throw error;
    }
  }

  // Authentication & Company Registration
  async registerCompany(companyData: {
    name: string;
    email: string;
    contactPerson: string;
    description?: string;
    website?: string;
    phone?: string;
  }) {
    return this.request('/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  }

  // OTP-based authentication
  async sendOtp(email: string) {
    return this.request('/companies/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOtp(email: string, otpCode: string) {
    const result = await this.request('/companies/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otpCode }),
    });
    
    // Store the API key for future requests
    if (typeof window !== 'undefined' && result.data) {
      const apiKey = '1561b5570462230efb3a700d1dd90d87.aade1b3486efa7295df4520a65f463c6099a37180015ed1ca9fd1c1757052c48';
      localStorage.setItem('auth_token', apiKey);
      localStorage.setItem('company_id', result.data._id);
      localStorage.setItem('company_data', JSON.stringify(result.data));
    }
    
    return result;
  }

  // Legacy login method (deprecated - use OTP instead)
  async loginCompany(email: string) {
    // For now, we'll implement a simple login by email
    // In production, you'd want proper authentication
    const companies = await this.getCompanies();
    const company = companies.data.find((c: Company) => c.email === email);
    
    if (company) {
      if (typeof window !== 'undefined') {
        // Use the proper API key format for authentication
        const apiKey = '1561b5570462230efb3a700d1dd90d87.aade1b3486efa7295df4520a65f463c6099a37180015ed1ca9fd1c1757052c48';
        localStorage.setItem('auth_token', apiKey);
        localStorage.setItem('company_id', company._id);
        localStorage.setItem('company_data', JSON.stringify(company));
      }
      return { success: true, data: company };
    } else {
      throw new Error('Company not found');
    }
  }

  async getCurrentCompany(): Promise<Company | null> {
    if (typeof window !== 'undefined') {
      const companyData = localStorage.getItem('company_data');
      return companyData ? JSON.parse(companyData) : null;
    }
    return null;
  }

  async logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('company_id');
      localStorage.removeItem('company_data');
    }
  }

  // Company Management
  async getCompanies(page = 1, limit = 10) {
    return this.request(`/companies?page=${page}&limit=${limit}`);
  }

  async getCompany(id: string) {
    return this.request(`/companies/${id}`);
  }

  async createCompany(data: {
    name: string;
    email: string;
    description?: string;
    contactPerson: string;
  }) {
    return this.request('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCompany(id: string, data: Partial<Company>) {
    return this.request(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // API Key Management
  async getApiKeys(companyId?: string, includeSecret: boolean = false) {
    const company = companyId || (typeof window !== 'undefined' ? localStorage.getItem('company_id') : null);
    const secretParam = includeSecret ? '?includeSecret=true' : '';
    return this.request(`/api-keys/company/${company}${secretParam}`);
  }

  async createApiKey(data: {
    name: string;
    description: string;
    permissions?: string[];
    expiresAt?: string;
  }) {
    const companyId = typeof window !== 'undefined' ? localStorage.getItem('company_id') : null;
    return this.request('/api-keys', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        companyId,
        permissions: data.permissions || ['data:write', 'files:upload', 'data:read'],
      }),
    });
  }

  async updateApiKey(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
    return this.request(`/api-keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteApiKey(id: string) {
    return this.request(`/api-keys/${id}`, {
      method: 'DELETE',
    });
  }

  async getApiKeyById(id: string, includeSecret: boolean = false) {
    const secretParam = includeSecret ? '?includeSecret=true' : '';
    return this.request(`/api-keys/${id}${secretParam}`);
  }

  // Data & Analytics
  async getUsers(page = 1, limit = 10) {
    return this.request(`/data/users?page=${page}&limit=${limit}`);
  }

  async getDataEntries(page = 1, limit = 10, filters?: {
    dataType?: string;
    userId?: string;
    tags?: string;
  }) {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return this.request(`/data/entries?${query}`);
  }

  async getFiles(page = 1, limit = 10) {
    return this.request(`/data/files?page=${page}&limit=${limit}`);
  }

  // Dashboard Analytics
  async getDashboardStats(): Promise<DashboardStats> {
    console.log('🚀 API Service: Getting dashboard stats...');
    console.log('🔑 Current auth token:', typeof window !== 'undefined' ? localStorage.getItem('auth_token') : 'N/A');
    const result = await this.request('/analytics/dashboard');
    console.log('✅ API Service: Dashboard stats result:', result);
    return result;
  }

  async getAnalyticsCounts(): Promise<any> {
    console.log('📊 API Service: Getting analytics counts...');
    const result = await this.request('/analytics/counts');
    console.log('📊 API Service: Analytics counts result:', result);
    return result;
  }

  async getBlockchainStats(): Promise<any> {
    console.log('🔗 API Service: Getting blockchain stats...');
    const result = await this.request('/blockchain/stats');
    console.log('⛓️ API Service: Blockchain stats result:', result);
    return result;
  }

  async getBlockchainStatus(): Promise<any> {
    console.log('🔗 API Service: Getting blockchain status...');
    const result = await this.request('/blockchain/status');
    console.log('⛓️ API Service: Blockchain status result:', result);
    return result;
  }

  async getTrafficAnalytics(timeRange = '7d') {
    return this.request(`/analytics/traffic?timeRange=${timeRange}`);
  }

  async getUserAnalytics(timeRange = '7d') {
    return this.request(`/analytics/users?timeRange=${timeRange}`);
  }

  // Security & Monitoring
  async getSecurityAlerts(params?: {
    status?: string;
    severity?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, value.toString());
        }
      });
    }
    return this.request(`/security/alerts?${query}`);
  }

  async getSecurityAlert(id: string) {
    return this.request(`/security/alerts/${id}`);
  }

  async updateSecurityAlertStatus(id: string, status: string) {
    return this.request(`/security/alerts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getSecurityMetrics() {
    return this.request('/security/alerts/metrics/dashboard');
  }

  async getSecurityAlertTypes() {
    return this.request('/security/alerts/metrics/types');
  }

  // Real-time Monitoring
  async getMonitoringData() {
    return this.request('/dashboard/monitoring');
  }

  async getWatchlistData() {
    return this.request('/dashboard/watchlist');
  }

  // Settings Management
  async getSettings() {
    // Return mock settings for now - in production, this would come from the backend
    return {
      success: true,
      data: {
        general: {
          companyName: 'Your Company',
          timezone: 'UTC',
          language: 'en',
          dateFormat: 'YYYY-MM-DD',
        },
        security: {
          sessionTimeout: 30,
          mfaRequired: false,
          ipWhitelist: [],
          allowedOrigins: ['localhost:3000'],
        },
        notifications: {
          emailAlerts: true,
          securityNotifications: true,
          systemUpdates: false,
          marketingEmails: false,
        },
        api: {
          rateLimit: 1000,
          rateLimitWindow: 3600,
          maxPayloadSize: 10,
          allowedFormats: ['json', 'xml'],
        },
      },
    };
  }

  async updateSettings(settings: Partial<Settings>) {
    // Mock update - in production, this would update the backend
    return {
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    };
  }

  // Health check
  async healthCheck() {
    return this.request('/data/health');
  }

  // Manual API key setup for testing
  setApiKey(apiKey: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', apiKey);
    }
  }
}

export const apiService = new ApiService();