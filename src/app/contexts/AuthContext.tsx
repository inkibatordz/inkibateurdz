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
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const passwords = JSON.parse(localStorage.getItem('passwords') || '[]');

    // For admin, check username
    let foundUser = users.find(u =>
      u.role === 'admin' ? u.username === email : u.email === email
    );

    if (!foundUser) {
      return { success: false, message: 'Email ou mot de passe incorrect' };
    }

    const passwordEntry = passwords.find((p: any) => p.userId === foundUser!.id);
    if (!passwordEntry || passwordEntry.password !== password) {
      return { success: false, message: 'Email ou mot de passe incorrect' };
    }

    if (!foundUser.approved) {
      return {
        success: false,
        message: 'Compte non activé – veuillez attendre l\'approbation de l\'administrateur'
      };
    }

    setUser(foundUser);
    localStorage.setItem('currentUser', JSON.stringify(foundUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    // Navigation will be handled by the component calling logout
  };

  const register = async (userData: any): Promise<{ success: boolean; message?: string }> => {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const passwords = JSON.parse(localStorage.getItem('passwords') || '[]');

    // Check if email already exists
    const emailExists = users.some(u => u.email === userData.email);
    if (emailExists) {
      return { success: false, message: 'Cet email est déjà utilisé' };
    }

    const newUser: User = {
      id: `${userData.role}-${Date.now()}`,
      role: userData.role,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      approved: false,
      ...(userData.role === 'student' && {
        university: userData.university,
        department: userData.department,
        level: userData.level,
        studentId: userData.studentId
      }),
      ...(userData.role === 'mentor' && {
        department: userData.department,
        staffId: userData.staffId
      })
    };

    users.push(newUser);
    passwords.push({ userId: newUser.id, password: userData.password });

    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('passwords', JSON.stringify(passwords));

    return { success: true, message: 'Inscription réussie ! En attente de l\'approbation de l\'administrateur.' };
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