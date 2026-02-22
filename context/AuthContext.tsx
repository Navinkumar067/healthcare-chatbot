"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/loading-spinner';

interface AuthContextType {
  token: string | null;
  role: 'user' | 'admin' | null;
  login: (token: string, role: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<'user' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session on mount
    const storedToken = sessionStorage.getItem('token');
    const storedRole = sessionStorage.getItem('userRole') as 'user' | 'admin' | null;
    
    if (storedToken) {
      setToken(storedToken);
      setRole(storedRole);
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newRole: string) => {
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('userRole', newRole);
    setToken(newToken);
    setRole(newRole as 'user' | 'admin');
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userRole');
    setToken(null);
    setRole(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Protected Route Wrapper Component
export const ProtectedRoute = ({ children, allowedRoles = [] }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { token, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!token) {
        router.push('/login');
      } else if (allowedRoles.length > 0 && !allowedRoles.includes(role || '')) {
        router.push('/'); 
      }
    }
  }, [isLoading, token, role, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }
  
  if (!token || (allowedRoles.length > 0 && !allowedRoles.includes(role || ''))) {
    return null; // Render nothing while redirecting
  }

  return <>{children}</>;
};