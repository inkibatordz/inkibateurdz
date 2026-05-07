import React, { createContext, useContext, useState, useEffect } from 'react';

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

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (userData: Partial<User>) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  register: (userData: any) => Promise<{ success: boolean; message?: string }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    // Initialize default admin if no users exist
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.length === 0) {
      const defaultAdmin: User = {
        id: 'admin-1',
        role: 'admin',
        email: 'admin@incubator.com',
        firstName: 'Admin',
        lastName: 'System',
        approved: true,
        username: 'admin'
      };
      localStorage.setItem('users', JSON.stringify([defaultAdmin]));
      localStorage.setItem('passwords', JSON.stringify([
        { userId: 'admin-1', password: 'admin' }
      ]));
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Email ou mot de passe incorrect' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  };
  
  const loginWithGoogle = async (googleData: Partial<User>): Promise<{ success: boolean; message?: string }> => {
    // For simplicity, we'll try to register/login via a dedicated google endpoint or just reuse register
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleData.email, isGoogle: true }), // Server needs to handle this
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return { success: true };
      } else {
        // Auto register if not found
        const registerRes = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: googleData.email,
            firstName: googleData.firstName,
            lastName: googleData.lastName,
            role: 'student',
            password: 'google-auth-no-password'
          }),
        });
        const registerData = await registerRes.json();
        if (registerData.success) {
           return { success: false, message: 'Compte créé via Google. Vous pouvez maintenant vous connecter.' };
        }
        return { success: false, message: 'Erreur lors de la connexion Google' };
      }
    } catch (error) {
      return { success: false, message: 'Erreur serveur' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const register = async (userData: any): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (data.success) {
        return { success: true, message: 'Inscription réussie !' };
      } else {
        return { success: false, message: data.message || 'Erreur lors de l\'inscription' };
      }
    } catch (error) {
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  };

  const value = React.useMemo(() => ({
    user,
    login,
    loginWithGoogle,
    logout,
    register,
    isAuthenticated: !!user
  }), [user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};