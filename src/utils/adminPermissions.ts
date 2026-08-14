import { User, UserPermission } from '../types';

export interface AdminPermissionRoute {
  path: string;
  menuCode: string;
}

export const ADMIN_VIEW_ROUTES: AdminPermissionRoute[] = [
  { path: '/admin/dashboard', menuCode: 'DASHBOARD' },
  { path: '/admin/pos', menuCode: 'ORDER_POS' },
  { path: '/admin/pos/runner', menuCode: 'POS_RUNNER' },
  { path: '/admin/kitchen-inventory', menuCode: 'KITCHEN_INVENTORY' },
  { path: '/admin/site-settings', menuCode: 'SYSTEM_CONFIG' },
  { path: '/admin/banners', menuCode: 'SYSTEM_CONFIG' },
  { path: '/admin/home-sections', menuCode: 'SYSTEM_CONFIG' },
  { path: '/admin/navigation-items', menuCode: 'SYSTEM_CONFIG' },
  { path: '/admin/promotions', menuCode: 'SYSTEM_CONFIG' },
  { path: '/admin/gallery', menuCode: 'SYSTEM_CONFIG' },
  { path: '/admin/testimonials', menuCode: 'SYSTEM_CONFIG' },
  { path: '/admin/contact-messages', menuCode: 'SYSTEM_CONFIG' },
  { path: '/admin/media', menuCode: 'SYSTEM_CONFIG' },
  { path: '/admin/menu-categories', menuCode: 'DISH_CATEGORY' },
  { path: '/admin/menu-items', menuCode: 'MENU_MANAGEMENT' },
  { path: '/admin/blog/categories', menuCode: 'BLOG_CATEGORY' },
  { path: '/admin/blog/posts', menuCode: 'BLOG_POST' },
  { path: '/admin/seo-pages', menuCode: 'SEO_PAGE' },
  { path: '/admin/faqs', menuCode: 'FAQ_MANAGEMENT' },
  { path: '/admin/reviews', menuCode: 'REVIEW_MANAGEMENT' },
  { path: '/admin/payments/dashboard', menuCode: 'CASH_BOOK' },
  { path: '/admin/payments/requests', menuCode: 'PAYMENT_REQUEST' },
  { path: '/admin/payments/approvals', menuCode: 'PAYMENT_REQUEST_APPROVAL' },
  { path: '/admin/payments/vouchers', menuCode: 'PAYMENT_VOUCHER' },
  { path: '/admin/suppliers', menuCode: 'SUPPLIER_CATEGORY' },
  { path: '/admin/suppliers/debt', menuCode: 'SUPPLIER_DEBT' },
  { path: '/admin/cash/accounts', menuCode: 'BANK_ACCOUNT' },
  { path: '/admin/reports/cash', menuCode: 'CASH_REPORT' },
  { path: '/admin/payroll', menuCode: 'PAYROLL' },
  { path: '/admin/users', menuCode: 'USER_MANAGEMENT' },
  { path: '/admin/roles', menuCode: 'ROLE_MANAGEMENT' },
  { path: '/admin/permissions', menuCode: 'PERMISSION_MANAGEMENT' },
  { path: '/admin/audit-logs', menuCode: 'AUDIT_LOG' },
];

export const isSystemAdminUser = (user?: User | null) =>
  Boolean(user?.isSystemAdmin || user?.role === 'SUPERADMIN' || user?.roles?.includes('SUPERADMIN'));

export const hasAdminPermission = (user: User | null, menuCode: string, permissionCode = 'VIEW') => {
  if (!user) return false;
  if (isSystemAdminUser(user)) return true;
  return Boolean(user.permissions?.some(
    (permission: UserPermission) =>
      permission.menuCode === menuCode &&
      permission.permissionCode === permissionCode &&
      permission.isAllowed,
  ));
};

export const getFirstAllowedAdminPath = (user: User | null) => {
  if (!user) return '/admin/login';
  if (isSystemAdminUser(user)) return '/admin/dashboard';
  return ADMIN_VIEW_ROUTES.find((route) => hasAdminPermission(user, route.menuCode, 'VIEW'))?.path || '/admin/no-permission';
};
