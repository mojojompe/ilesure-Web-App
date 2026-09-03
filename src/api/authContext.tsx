import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { User, UserRole, AuthState } from '../types';
import { authApi } from './authApi';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string; nextStep?: string }>;
  logout: () => void;
  updateRole: (role: UserRole) => void;
  /**
   * Establish a session from tokens obtained outside `login()` (registration,
   * OTP verification). Keeps React state and the localStorage blob in sync so
   * client-side navigation immediately sees the new user (QA-AGT-003 / QA-CO-002).
   */
  setSession: (user: User, accessToken: string) => void;
  /** Merge freshly-saved profile fields into the cached user (QA-AGT-004 / QA-CO-005). */
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'ilesure_web_auth';
/** Email of an account that registered but has not yet verified its OTP. */
export const PENDING_EMAIL_KEY = 'ilesure_pending_email';

function readStoredAuth(): { user: User; accessToken: string; role: UserRole | null } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed.accessToken && parsed.user) {
      return { user: parsed.user as User, accessToken: parsed.accessToken, role: (parsed.role || parsed.user.role) as UserRole | null };
    }
  } catch {
    /* corrupt blob — treat as signed out */
  }
  return null;
}

function writeStoredAuth(user: User, accessToken: string, role: UserRole | null) {
  // SECURITY-FIX (W-H1): only the short-lived access token + non-sensitive profile
  // are persisted. The refresh token stays in the backend-set httpOnly cookie.
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, accessToken, role, isAuthenticated: true }));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const stored = readStoredAuth();
    if (stored) {
      return { user: stored.user, isAuthenticated: true, role: stored.role };
    }
    return { user: null, isAuthenticated: false, role: null };
  });

  const setSession = useCallback((user: User, accessToken: string) => {
    const role = user.role as UserRole;
    setState({ user: { ...user, role }, isAuthenticated: true, role });
    writeStoredAuth(user, accessToken, role);
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setState(prev => {
      if (!prev.user) return prev;
      const user = { ...prev.user, ...patch };
      const stored = readStoredAuth();
      if (stored) writeStoredAuth(user, stored.accessToken, prev.role);
      return { ...prev, user };
    });
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);

      if (response.success && response.user && response.accessToken) {
        // SECURITY-FIX (W-H1): refreshToken is intentionally NOT destructured or persisted.
        const { user, accessToken } = response;

        // ── Role gate: only agents and companies can use the web app ──
        const allowedRoles = ['agent', 'landlord', 'company', 'company_admin', 'sub_agent'];
        if (!allowedRoles.includes(user.role)) {
          return {
            success: false,
            error: 'This portal is for agents, landlords, and companies only. Please use the mobile app.',
          };
        }

        setSession(user, accessToken);
        sessionStorage.removeItem(PENDING_EMAIL_KEY);

        return { success: true, user, nextStep: response.nextStep };
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
    <AuthContext.Provider value={{ ...state, login, logout, updateRole, setSession, updateUser }}>
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
