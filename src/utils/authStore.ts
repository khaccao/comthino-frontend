import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  login: (token, user) => {
    localStorage.setItem('comthino_token', token);
    localStorage.setItem('comthino_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('comthino_token');
    localStorage.removeItem('comthino_user');
    set({ token: null, user: null, isAuthenticated: false });
  },
  initialize: () => {
    const token = localStorage.getItem('comthino_token');
    const userStr = localStorage.getItem('comthino_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true });
      } catch (e) {
        localStorage.removeItem('comthino_token');
        localStorage.removeItem('comthino_user');
      }
    }
  },
}));
