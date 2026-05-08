import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'student' | 'mentor' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  email: string;
  firstName: string;
  lastName: string;
  approved: boolean;
  label?: string;
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



  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        const loggedUser = data.user;
        
        // Block students who are not approved
        if (loggedUser.role === 'student' && !loggedUser.approved) {
          return { 
            success: false, 
            message: "Votre compte est en attente d'approbation. Vous recevrez un e-mail une fois validé par l'administration." 
          };
        }

        setUser(loggedUser);
        localStorage.setItem('currentUser', JSON.stringify(loggedUser));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Email ou mot de passe incorrect' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
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