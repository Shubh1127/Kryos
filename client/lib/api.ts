// API service for authentication and company management
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
  keyId: string;
  name: string;
  description: string;
  permissions: string[];
  company: string;
  isActive: boolean;
  lastUsed?: string;
  expiresAt?: string;
  createdAt: string;
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
}

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get token from localStorage for authenticated requests
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
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
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
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

  async loginCompany(email: string) {
    // For now, we'll implement a simple login by email
    // In production, you'd want proper authentication
    const companies = await this.getCompanies();
    const company = companies.data.find((c: Company) => c.email === email);
    
    if (company) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', `company_${company._id}`);
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

  async updateCompany(id: string, data: Partial<Company>) {
    return this.request(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // API Key Management
  async getApiKeys(companyId?: string) {
    const company = companyId || (typeof window !== 'undefined' ? localStorage.getItem('company_id') : null);
    return this.request(`/api-keys?companyId=${company}`);
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
    // We'll need to create this endpoint in the backend
    try {
      return this.request('/analytics/dashboard');
    } catch (error) {
      // Fallback: aggregate data from existing endpoints
      const [users, entries, files, apiKeys] = await Promise.all([
        this.getUsers(1, 1),
        this.getDataEntries(1, 10),
        this.getFiles(1, 1),
        this.getApiKeys(),
      ]);

      // Mock data for now
      return {
        totalUsers: users.pagination?.total || 0,
        totalEntries: entries.pagination?.total || 0,
        totalFiles: files.pagination?.total || 0,
        totalApiKeys: Array.isArray(apiKeys.data) ? apiKeys.data.length : 0,
        recentActivity: entries.data || [],
        trafficByDay: this.generateMockTrafficData(),
        eventTypes: this.generateMockEventTypes(),
      };
    }
  }

  private generateMockTrafficData() {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        requests: Math.floor(Math.random() * 1000) + 100,
      });
    }
    return data;
  }

  private generateMockEventTypes() {
    return [
      { type: 'user_login', count: 45 },
      { type: 'user_registration', count: 12 },
      { type: 'purchase', count: 28 },
      { type: 'page_view', count: 156 },
      { type: 'custom_event', count: 67 },
    ];
  }

  // Health check
  async healthCheck() {
    return this.request('/data/health');
  }
}

export const apiService = new ApiService();