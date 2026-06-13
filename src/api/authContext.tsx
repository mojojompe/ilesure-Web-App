import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User, UserRole, AuthState } from '../types';
import { authApi } from './authApi';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  updateRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'ilesure_web_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.accessToken && parsed.user) {
          return {
            user: parsed.user as User,
            isAuthenticated: true,
            role: parsed.role as UserRole | null,
          };
        }
      } catch {
        return { user: null, isAuthenticated: false, role: null };
      }
    }
    return { user: null, isAuthenticated: false, role: null };
  });

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);

      if (response.success && response.user && response.accessToken) {
        const { user, accessToken, refreshToken } = response;

        // ── Role gate: only agents and companies can use the web app ──
        const allowedRoles = ['agent', 'landlord', 'company', 'company_admin', 'sub_agent'];
        if (!allowedRoles.includes(user.role)) {
          return {
            success: false,
            error: 'This portal is for agents, landlords, and companies only. Please use the mobile app.',
          };
        }

        setState({
          user: {
            ...user,
            role: user.role as UserRole,
          },
          isAuthenticated: true,
          role: user.role as UserRole,
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          user: user,
          accessToken,
          refreshToken,
          role: user.role,
          isAuthenticated: true,
        }));

        return { success: true, user };
      }

      return { success: false, error: response.error?.message || 'Login failed' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    authApi.logout();
    setState({ user: null, isAuthenticated: false, role: null });
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateRole = (role: UserRole) => {
    setState(prev => {
      const newState = { ...prev, role };
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...JSON.parse(existing), ...newState }));
        } catch {}
      }
      return newState;
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}