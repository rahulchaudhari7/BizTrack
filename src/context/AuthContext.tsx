import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.ts';
import { User } from '../types.ts';

interface GoogleAuthArgs {
  credential?: string;
  profile?: {
    email: string;
    name?: string;
    picture?: string;
    googleId?: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  loginWithGoogle: (authData: GoogleAuthArgs) => Promise<void>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('biztrack_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('biztrack_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('biztrack_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
      setUser(null);
      setToken(null);
      localStorage.removeItem('biztrack_token');
      localStorage.removeItem('biztrack_user');
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const loginWithGoogle = async (authData: GoogleAuthArgs) => {
    const res = await api.post('/auth/google', authData);
    const { token: receivedToken, user: receivedUser } = res.data;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('biztrack_token', receivedToken);
    localStorage.setItem('biztrack_user', JSON.stringify(receivedUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('biztrack_token');
    localStorage.removeItem('biztrack_user');
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('biztrack_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loginWithGoogle,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
