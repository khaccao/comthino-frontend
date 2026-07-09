import { create } from 'zustand';
import { User, UserPermission } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  initialize: () => void;
  hasPermission: (menuCode: string, permissionCode: string) => boolean;
  canView: (menuCode: string) => boolean;
  canCreate: (menuCode: string) => boolean;
  canEdit: (menuCode: string) => boolean;
  canDelete: (menuCode: string) => boolean;
  canApprove: (menuCode: string) => boolean;
  canExport: (menuCode: string) => boolean;
  canPrint: (menuCode: string) => boolean;
  canPay: (menuCode: string) => boolean;
  canPostAccounting: (menuCode: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
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

  hasPermission: (menuCode: string, permissionCode: string): boolean => {
    const { user } = get();
    if (!user) return false;
    if (user.isSystemAdmin || user.roles?.includes('SUPERADMIN')) return true;
    if (!user.permissions) return false;
    return user.permissions.some(
      (p: UserPermission) =>
        p.menuCode === menuCode && p.permissionCode === permissionCode && p.isAllowed
    );
  },

  canView: (menuCode: string) => get().hasPermission(menuCode, 'VIEW'),
  canCreate: (menuCode: string) => get().hasPermission(menuCode, 'CREATE'),
  canEdit: (menuCode: string) => get().hasPermission(menuCode, 'EDIT'),
  canDelete: (menuCode: string) => get().hasPermission(menuCode, 'DELETE'),
  canApprove: (menuCode: string) => get().hasPermission(menuCode, 'APPROVE'),
  canExport: (menuCode: string) => get().hasPermission(menuCode, 'EXPORT'),
  canPrint: (menuCode: string) => get().hasPermission(menuCode, 'PRINT'),
  canPay: (menuCode: string) => get().hasPermission(menuCode, 'PAY'),
  canPostAccounting: (menuCode: string) => get().hasPermission(menuCode, 'POST_ACCOUNTING'),
}));

