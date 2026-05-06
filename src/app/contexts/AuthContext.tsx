import React, { createContext, useContext, useState } from 'react';
import { getApiBase } from '@/lib/api';

export type UserRole = 'student' | 'mentor' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  email: string;
  firstName: string;
  lastName: string;
  approved: boolean;
  // Student specific
  university?: string;
  department?: string; // This will act as 'spécialité'
  level?: 'L3' | 'M2';
  studentId?: string;
  // Mentor specific
  staffId?: string;
  // Admin
  username?: string;
}

interface AuthResult {
  success: boolean;
  message?: string;
  user?: User | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: (userData: Partial<User>) => Promise<AuthResult>;
  logout: () => void;
  register: (userData: Record<string, unknown>) => Promise<AuthResult>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    try {
      return savedUser ? (JSON.parse(savedUser) as User) : null;
    } catch {
      return null;
    }
  });

  const apiRoot = () => `${getApiBase().replace(/\/$/, '')}`;

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const res = await fetch(`${apiRoot()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok || !data.success || !data.user) {
      return { success: false, message: data.message || 'Échec de connexion', user: null };
    }

    const u = data.user as User;
    setUser(u);
    localStorage.setItem('currentUser', JSON.stringify(u));
    return { success: true, user: u };
  };

  const loginWithGoogle = async (googleData: Partial<User>): Promise<AuthResult> => {
    const res = await fetch(`${apiRoot()}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: googleData.email,
        firstName: googleData.firstName,
        lastName: googleData.lastName,
      }),
    });
    const data = await res.json();

    if (!data.success) {
      return { success: false, message: data.message, user: null };
    }

    const u = data.user as User;
    setUser(u);
    localStorage.setItem('currentUser', JSON.stringify(u));
    return { success: true, user: u };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const register = async (userData: Record<string, unknown>): Promise<AuthResult> => {
    const res = await fetch(`${apiRoot()}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'student',
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        university: userData.university,
        department: userData.department,
        level: userData.level,
        studentId: userData.studentId,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, message: data.message || 'Inscription échouée' };
    }
    return { success: true, message: data.message };
  };

  const value = React.useMemo(
    () => ({
      user,
      login,
      loginWithGoogle,
      logout,
      register,
      isAuthenticated: !!user,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
