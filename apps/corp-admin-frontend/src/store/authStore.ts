import { create } from 'zustand';
import api from '../lib/api';

interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getMe: () => Promise<void>;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  token: localStorage.getItem('corp_token'),
  isAuthenticated: !!localStorage.getItem('corp_token'),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, admin } = response.data;
      localStorage.setItem('corp_token', token);
      set({ admin, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('corp_token');
      set({ admin: null, token: null, isAuthenticated: false });
    }
  },

  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      set({ admin: response.data.admin, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('corp_token');
      set({ admin: null, token: null, isAuthenticated: false });
    }
  },

  setToken: (token: string) => {
    localStorage.setItem('corp_token', token);
    set({ token, isAuthenticated: true });
  }
}));

