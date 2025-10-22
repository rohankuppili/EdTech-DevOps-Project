import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

type UserRole = 'student' | 'educator';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('edtech_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const resp = await apiFetch<{ _id: string; name: string; email: string; role: string; token: string }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );

      const mappedRole = resp.role === 'instructor' ? 'educator' : ('student');
      const currentUser = { id: resp._id, email: resp.email, name: resp.name, role: mappedRole as UserRole };
      setUser(currentUser);
      localStorage.setItem('edtech_user', JSON.stringify(currentUser));
      localStorage.setItem('edtech_token', resp.token);
      toast({
        title: 'Login successful',
        description: `Welcome back, ${resp.name}!`,
      });
      navigate(currentUser.role === 'student' ? '/student' : '/educator');
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'Invalid email or password',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const backendRole = role === 'educator' ? 'instructor' : 'student';
      const resp = await apiFetch<{ _id: string; name: string; email: string; role: string; token: string }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ name, email, password, role: backendRole }),
        }
      );

      const mappedRole = resp.role === 'instructor' ? 'educator' : ('student');
      const currentUser = { id: resp._id, email: resp.email, name: resp.name, role: mappedRole as UserRole };
      setUser(currentUser);
      localStorage.setItem('edtech_user', JSON.stringify(currentUser));
      localStorage.setItem('edtech_token', resp.token);

      toast({
        title: 'Account created',
        description: 'Your account has been created successfully!'
      });
      navigate(currentUser.role === 'student' ? '/student' : '/educator');
    } catch (error) {
      toast({
        title: 'Signup failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('edtech_user');
    localStorage.removeItem('edtech_token');
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
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
