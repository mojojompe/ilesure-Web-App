import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, UserRole, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: UserRole) => Promise<void>;
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
        return JSON.parse(stored);
      } catch {
        return { user: null, isAuthenticated: false, role: null };
      }
    }
    return { user: null, isAuthenticated: false, role: null };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const login = async (email: string, _password: string, role: UserRole) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user: User = {
      id: role === 'agent' ? 'a_001' : 'c_001',
      email,
      role,
      fullName: role === 'agent' ? 'James Okonkwo' : 'Property Masters Ltd',
    };
    
    setState({ user, isAuthenticated: true, role });
  };

  const logout = () => {
    setState({ user: null, isAuthenticated: false, role: null });
  };

  const updateRole = (role: UserRole) => {
    setState(prev => ({ ...prev, role }));
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