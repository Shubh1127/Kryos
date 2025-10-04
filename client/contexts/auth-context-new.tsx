'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, Company } from '@/lib/api';

interface AuthContextType {
  company: Company | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  register: (companyData: {
    name: string;
    email: string;
    contactPerson: string;
    description?: string;
    website?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuthStatus = async () => {
      try {
        const savedCompany = await apiService.getCurrentCompany();
        if (savedCompany) {
          setCompany(savedCompany);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const result = await apiService.loginCompany(email);
      setCompany(result.data);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (companyData: {
    name: string;
    email: string;
    contactPerson: string;
    description?: string;
    website?: string;
    phone?: string;
  }) => {
    setIsLoading(true);
    try {
      const result = await apiService.registerCompany(companyData);
      // Auto-login after successful registration
      await login(companyData.email);
    } catch (error) {
      console.error('Registration failed:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    setCompany(null);
  };

  const value: AuthContextType = {
    company,
    isLoading,
    isAuthenticated: !!company,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};