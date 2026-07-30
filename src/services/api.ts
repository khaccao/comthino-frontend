import axios from 'axios';
import { useAuthStore } from '../utils/authStore';

// Determine the API base URL.
// In development, the Vite proxy handles /api. In production, we fetch relative to the host or from env.
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token if logged in
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Auto-logout on 401/403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, log out the user
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;

// --- PUBLIC APIs ---
export const publicApi = {
  getSiteSettings: () => api.get('/public/site-settings').then(res => res.data),
  getNavigation: () => api.get('/public/navigation').then(res => res.data),
  getBanners: () => api.get('/public/banners').then(res => res.data),
  getHomeSections: () => api.get('/public/home-sections').then(res => res.data),
  getMenuCategories: () => api.get('/public/menu-categories').then(res => res.data),
  getMenuItems: () => api.get('/public/menu-items').then(res => res.data),
  getMenuBook: () => api.get('/public/menu-book').then(res => res.data),
  getPromotions: () => api.get('/public/promotions').then(res => res.data),
  getGallery: () => api.get('/public/gallery').then(res => res.data),
  getTestimonials: () => api.get('/public/testimonials').then(res => res.data),
  postContact: (data: any) => api.post('/public/contact', data).then(res => res.data),
  getBlogCategories: () => api.get('/public/blog/categories').then(res => res.data),
  getBlogPosts: (params?: any) => api.get('/public/blog/posts', { params }).then(res => res.data),
  getFeaturedBlogPosts: () => api.get('/public/blog/posts/featured').then(res => res.data),
  getBlogPost: (slug: string) => api.get(`/public/blog/posts/${slug}`).then(res => res.data),
  getBlogPostsByCategory: (slug: string, params?: any) => api.get(`/public/blog/posts/category/${slug}`, { params }).then(res => res.data),
  
  // SEO Public APIs
  getSeoPages: () => api.get('/public/seo-pages').then(res => res.data),
  getSeoPageBySlug: (slug: string) => api.get(`/public/seo-pages/${slug}`).then(res => res.data),
  getFAQs: () => api.get('/public/faqs').then(res => res.data),
  getReviews: () => api.get('/public/reviews').then(res => res.data),
};

// --- AUTH APIs ---
export const authApi = {
  login: (credentials: any) => api.post('/auth/login', credentials).then(res => res.data),
  getMe: () => api.get('/auth/me').then(res => res.data),
  logout: () => api.post('/auth/logout').then(res => res.data),
};

// --- ADMIN APIs ---
export const adminApi = {
  getDashboard: (otp?: string) =>
    api.get('/admin/dashboard', otp ? { headers: { 'x-otp-code': otp } } : undefined).then(res => res.data),
  
  // Site Settings
  getSiteSettings: () => api.get('/admin/site-settings').then(res => res.data),
  updateSiteSettings: (data: any) => api.put('/admin/site-settings', data).then(res => res.data),
  
  // Navigation Items
  getNavigationItems: () => api.get('/admin/navigation-items').then(res => res.data),
  createNavigationItem: (data: any) => api.post('/admin/navigation-items', data).then(res => res.data),
  updateNavigationItem: (id: string, data: any) => api.put(`/admin/navigation-items/${id}`, data).then(res => res.data),
  deleteNavigationItem: (id: string) => api.delete(`/admin/navigation-items/${id}`).then(res => res.data),

  // Banners
  getBanners: () => api.get('/admin/banners').then(res => res.data),
  createBanner: (data: any) => api.post('/admin/banners', data).then(res => res.data),
  updateBanner: (id: string, data: any) => api.put(`/admin/banners/${id}`, data).then(res => res.data),
  deleteBanner: (id: string) => api.delete(`/admin/banners/${id}`).then(res => res.data),

  // Home Sections
  getHomeSections: () => api.get('/admin/home-sections').then(res => res.data),
  createHomeSection: (data: any) => api.post('/admin/home-sections', data).then(res => res.data),
  updateHomeSection: (id: string, data: any) => api.put(`/admin/home-sections/${id}`, data).then(res => res.data),
  deleteHomeSection: (id: string) => api.delete(`/admin/home-sections/${id}`).then(res => res.data),

  // Menu Categories
  getMenuCategories: () => api.get('/admin/menu-categories').then(res => res.data),
  createMenuCategory: (data: any) => api.post('/admin/menu-categories', data).then(res => res.data),
  updateMenuCategory: (id: string, data: any) => api.put(`/admin/menu-categories/${id}`, data).then(res => res.data),
  deleteMenuCategory: (id: string) => api.delete(`/admin/menu-categories/${id}`).then(res => res.data),

  // Menu Items
  getMenuItems: () => api.get('/admin/menu-items').then(res => res.data),
  createMenuItem: (data: any) => api.post('/admin/menu-items', data).then(res => res.data),
  updateMenuItem: (id: string, data: any) => api.put(`/admin/menu-items/${id}`, data).then(res => res.data),
  deleteMenuItem: (id: string) => api.delete(`/admin/menu-items/${id}`).then(res => res.data),

  // Promotions
  getPromotions: () => api.get('/admin/promotions').then(res => res.data),
  createPromotion: (data: any) => api.post('/admin/promotions', data).then(res => res.data),
  updatePromotion: (id: string, data: any) => api.put(`/admin/promotions/${id}`, data).then(res => res.data),
  deletePromotion: (id: string) => api.delete(`/admin/promotions/${id}`).then(res => res.data),

  // Gallery
  getGalleryImages: () => api.get('/admin/gallery-images').then(res => res.data),
  createGalleryImage: (data: any) => api.post('/admin/gallery-images', data).then(res => res.data),
  updateGalleryImage: (id: string, data: any) => api.put(`/admin/gallery-images/${id}`, data).then(res => res.data),
  deleteGalleryImage: (id: string) => api.delete(`/admin/gallery-images/${id}`).then(res => res.data),

  // Testimonials
  getTestimonials: () => api.get('/admin/testimonials').then(res => res.data),
  createTestimonial: (data: any) => api.post('/admin/testimonials', data).then(res => res.data),
  updateTestimonial: (id: string, data: any) => api.put(`/admin/testimonials/${id}`, data).then(res => res.data),
  deleteTestimonial: (id: string) => api.delete(`/admin/testimonials/${id}`).then(res => res.data),

  // Contact Messages
  getContactMessages: () => api.get('/admin/contact-messages').then(res => res.data),
  updateContactMessage: (id: string, status: string) => api.put(`/admin/contact-messages/${id}`, { status }).then(res => res.data),
  deleteContactMessage: (id: string) => api.delete(`/admin/contact-messages/${id}`).then(res => res.data),

  // Media File Manager
  getMedia: () => api.get('/admin/media').then(res => res.data),
  deleteMedia: (id: string) => api.delete(`/admin/media/${id}`).then(res => res.data),
  updateMedia: (id: string, data: any) => api.put(`/admin/media/${id}`, data).then(res => res.data),
  uploadImage: (formData: FormData) => api.post('/admin/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),

  // Blog / News
  getBlogCategories: () => api.get('/admin/blog/categories').then(res => res.data),
  createBlogCategory: (data: any) => api.post('/admin/blog/categories', data).then(res => res.data),
  updateBlogCategory: (id: string, data: any) => api.put(`/admin/blog/categories/${id}`, data).then(res => res.data),
  deleteBlogCategory: (id: string) => api.delete(`/admin/blog/categories/${id}`).then(res => res.data),
  getBlogPosts: (params?: any) => api.get('/admin/blog/posts', { params }).then(res => res.data),
  getBlogPost: (id: string) => api.get(`/admin/blog/posts/${id}`).then(res => res.data),
  createBlogPost: (data: any) => api.post('/admin/blog/posts', data).then(res => res.data),
  updateBlogPost: (id: string, data: any) => api.put(`/admin/blog/posts/${id}`, data).then(res => res.data),
  deleteBlogPost: (id: string) => api.delete(`/admin/blog/posts/${id}`).then(res => res.data),
  publishBlogPost: (id: string) => api.post(`/admin/blog/posts/${id}/publish`).then(res => res.data),
  unpublishBlogPost: (id: string) => api.post(`/admin/blog/posts/${id}/unpublish`).then(res => res.data),

  // SEO Manager
  getSeoPages: () => api.get('/admin/seo-pages').then(res => res.data),
  getSeoPage: (id: string) => api.get(`/admin/seo-pages/${id}`).then(res => res.data),
  createSeoPage: (data: any) => api.post('/admin/seo-pages', data).then(res => res.data),
  updateSeoPage: (id: string, data: any) => api.put(`/admin/seo-pages/${id}`, data).then(res => res.data),
  deleteSeoPage: (id: string) => api.delete(`/admin/seo-pages/${id}`).then(res => res.data),

  getFAQs: () => api.get('/admin/faqs').then(res => res.data),
  createFAQ: (data: any) => api.post('/admin/faqs', data).then(res => res.data),
  updateFAQ: (id: string, data: any) => api.put(`/admin/faqs/${id}`, data).then(res => res.data),
  deleteFAQ: (id: string) => api.delete(`/admin/faqs/${id}`).then(res => res.data),

  getReviews: () => api.get('/admin/reviews').then(res => res.data),
  createReview: (data: any) => api.post('/admin/reviews', data).then(res => res.data),
  updateReview: (id: string, data: any) => api.put(`/admin/reviews/${id}`, data).then(res => res.data),
  deleteReview: (id: string) => api.delete(`/admin/reviews/${id}`).then(res => res.data),

  // POS
  getPosBootstrap: () => api.get('/admin/pos/bootstrap').then(res => res.data),
  upsertPosTable: (data: any, id?: string) =>
    (id ? api.put(`/admin/pos/tables/${id}`, data) : api.post('/admin/pos/tables', data)).then(res => res.data),
  updatePosTableLayout: (tables: any[]) => api.put('/admin/pos/tables/layout', { tables }).then(res => res.data),
  upsertPosMenuCategory: (data: any, id?: string) =>
    (id ? api.put(`/admin/pos/menu-categories/${id}`, data) : api.post('/admin/pos/menu-categories', data)).then(res => res.data),
  upsertPosMenuItem: (data: any, id?: string) =>
    (id ? api.put(`/admin/pos/menu-items/${id}`, data) : api.post('/admin/pos/menu-items', data)).then(res => res.data),
  openPosOrder: (tableId: string) => api.post('/admin/pos/orders/open', { tableId }).then(res => res.data),
  getPosOrder: (id: string) => api.get(`/admin/pos/orders/${id}`).then(res => res.data),
  updatePosOrder: (id: string, data: any) => api.put(`/admin/pos/orders/${id}`, data).then(res => res.data),
  addPosOrderItem: (orderId: string, data: any) => api.post(`/admin/pos/orders/${orderId}/items`, data).then(res => res.data),
  updatePosOrderItem: (orderId: string, itemId: string, data: any) =>
    api.put(`/admin/pos/orders/${orderId}/items/${itemId}`, data).then(res => res.data),
  deletePosOrderItem: (orderId: string, itemId: string) =>
    api.delete(`/admin/pos/orders/${orderId}/items/${itemId}`).then(res => res.data),
  confirmPosKitchen: (orderId: string) => api.post(`/admin/pos/orders/${orderId}/confirm-kitchen`).then(res => res.data),
  payPosOrder: (orderId: string, paymentMethod: string) =>
    api.post(`/admin/pos/orders/${orderId}/pay`, { paymentMethod }).then(res => res.data),
  getPosHistory: (date?: string, otp?: string) =>
    api.get('/admin/pos/orders/history', { params: { date }, ...(otp ? { headers: { 'x-otp-code': otp } } : {}) }).then(res => res.data),
  getPosDashboard: (date?: string, otp?: string) =>
    api.get('/admin/pos/dashboard', { params: { date }, ...(otp ? { headers: { 'x-otp-code': otp } } : {}) }).then(res => res.data),
  updatePosPaymentSetting: (data: any) => api.put('/admin/pos/payment-setting', data).then(res => res.data),
  updatePosPrintTemplate: (code: string, content: string) =>
    api.put(`/admin/pos/print-templates/${code}`, { content }).then(res => res.data),
};

// --- RBAC API ---
const unwrapItems = (response: any) => response.data?.items ?? response.data?.data ?? response.data;
const unwrapData = (response: any) => response.data?.data ?? response.data;

export const userApi = {
  getAll: () => api.get('/admin/users').then(unwrapItems),
  getById: (id: string) => api.get(`/admin/users/${id}`).then(unwrapData),
  create: (data: any) => api.post('/admin/users', data).then(unwrapData),
  update: (id: string, data: any) => api.put(`/admin/users/${id}`, data).then(unwrapData),
  lock: (id: string) => api.patch(`/admin/users/${id}/lock`).then(unwrapData),
  unlock: (id: string) => api.patch(`/admin/users/${id}/unlock`).then(unwrapData),
  delete: (id: string) => api.delete(`/admin/users/${id}`).then(unwrapData),
  setupTwoFactor: (id: string) => api.post(`/admin/users/${id}/2fa/setup`).then(unwrapData),
  disableTwoFactor: (id: string) => api.delete(`/admin/users/${id}/2fa`).then(unwrapData),
  getRoles: (userId: string) => api.get(`/admin/users/${userId}/roles`).then(unwrapItems),
  updateRoles: (userId: string, roles: string[]) =>
    api.put(`/admin/users/${userId}/roles`, { roles }).then(unwrapData),
};

export const roleApi = {
  getAll: () => api.get('/admin/roles').then(unwrapItems),
  getById: (id: string) => api.get(`/admin/roles/${id}`).then(unwrapData),
  create: (data: any) => api.post('/admin/roles', data).then(unwrapData),
  update: (id: string, data: any) => api.put(`/admin/roles/${id}`, data).then(unwrapData),
  delete: (id: string) => api.delete(`/admin/roles/${id}`).then(unwrapData),
  getPermissions: (roleId: string) => api.get(`/admin/roles/${roleId}/permissions`).then(unwrapItems),
  updatePermissions: (roleId: string, permissions: any[]) =>
    api.put(`/admin/roles/${roleId}/permissions`, { permissions }).then(unwrapData),
};

export const permissionApi = {
  getAll: () => api.get('/admin/permissions').then(unwrapItems),
  getMenus: () => api.get('/admin/menus').then(unwrapItems),
};

// --- PAYMENT API ---
export const paymentApi = {
  // Master data
  getExpenseCategories: () => api.get('/admin/payments/categories').then(unwrapItems),
  getPaymentMethods: () => api.get('/admin/payments/methods').then(unwrapItems),
  getCashAccounts: () => api.get('/admin/payments/cash-accounts').then(unwrapItems),
  // Suppliers
  getSuppliers: () => api.get('/admin/suppliers').then(unwrapItems),
  getSupplierDueAlerts: () => api.get('/admin/suppliers/due-alerts').then(unwrapItems),
  createSupplier: (data: any) => api.post('/admin/suppliers', data).then(unwrapData),
  updateSupplier: (id: string, data: any) => api.put(`/admin/suppliers/${id}`, data).then(unwrapData),
  deleteSupplier: (id: string) => api.delete(`/admin/suppliers/${id}`).then(unwrapData),
  // Payment Requests
  getRequests: () => api.get('/admin/payments/requests').then(unwrapItems),
  createRequest: (data: any) => api.post('/admin/payments/requests', data).then(unwrapData),
  approveRequest: (id: string, status: string) =>
    api.patch(`/admin/payments/requests/${id}/approve`, { status }).then(unwrapData),
  deleteRequest: (id: string) => api.delete(`/admin/payments/requests/${id}`).then(unwrapData),
  // Payment Vouchers
  getVouchers: () => api.get('/admin/payments/vouchers').then(unwrapItems),
  createVoucher: (data: any) => api.post('/admin/payments/vouchers', data).then(unwrapData),
  postVoucher: (id: string) => api.post(`/admin/payments/vouchers/${id}/post`).then(unwrapData),
  deleteVoucher: (id: string) => api.delete(`/admin/payments/vouchers/${id}`).then(unwrapData),
  // Dashboard
  getDashboard: () => api.get('/admin/payments/dashboard').then(unwrapData),
};

// --- PAYROLL API ---
export const payrollApi = {
  getBootstrap: () => api.get('/admin/payroll/bootstrap').then(unwrapData),
  getShifts: () => api.get('/admin/payroll/shifts').then(unwrapItems),
  createShift: (data: any) => api.post('/admin/payroll/shifts', data).then(unwrapData),
  updateShift: (id: string, data: any) => api.put(`/admin/payroll/shifts/${id}`, data).then(unwrapData),
  deleteShift: (id: string) => api.delete(`/admin/payroll/shifts/${id}`).then(unwrapData),
  getEmployees: () => api.get('/admin/payroll/employees').then(unwrapItems),
  createEmployee: (data: any) => api.post('/admin/payroll/employees', data).then(unwrapData),
  updateEmployee: (id: string, data: any) => api.put(`/admin/payroll/employees/${id}`, data).then(unwrapData),
  deleteEmployee: (id: string) => api.delete(`/admin/payroll/employees/${id}`).then(unwrapData),
  getAttendances: (params?: { from?: string; to?: string }) =>
    api.get('/admin/payroll/attendance', { params }).then(unwrapItems),
  createAttendance: (data: any) => api.post('/admin/payroll/attendance', data).then(unwrapData),
  updateAttendance: (id: string, data: any) => api.put(`/admin/payroll/attendance/${id}`, data).then(unwrapData),
  deleteAttendance: (id: string) => api.delete(`/admin/payroll/attendance/${id}`).then(unwrapData),
  getRuns: () => api.get('/admin/payroll/runs').then(unwrapItems),
  generateRun: (data: any) => api.post('/admin/payroll/runs/generate', data).then(unwrapData),
  deleteRun: (id: string) => api.delete(`/admin/payroll/runs/${id}`).then(unwrapData),
  getKpiLevels: () => api.get('/admin/payroll/kpi-levels').then(unwrapItems),
  createKpiLevel: (data: any) => api.post('/admin/payroll/kpi-levels', data).then(unwrapData),
  updateKpiLevel: (id: string, data: any) => api.put(`/admin/payroll/kpi-levels/${id}`, data).then(unwrapData),
  deleteKpiLevel: (id: string) => api.delete(`/admin/payroll/kpi-levels/${id}`).then(unwrapData),
  getKpiRecords: (params?: { from?: string; to?: string }) =>
    api.get('/admin/payroll/kpi-records', { params }).then(unwrapItems),
  createKpiRecord: (data: any) => api.post('/admin/payroll/kpi-records', data).then(unwrapData),
  updateKpiRecord: (id: string, data: any) => api.put(`/admin/payroll/kpi-records/${id}`, data).then(unwrapData),
  deleteKpiRecord: (id: string) => api.delete(`/admin/payroll/kpi-records/${id}`).then(unwrapData),
  getAdjustmentCategories: () => api.get('/admin/payroll/adjustment-categories').then(unwrapItems),
  createAdjustmentCategory: (data: any) => api.post('/admin/payroll/adjustment-categories', data).then(unwrapData),
  updateAdjustmentCategory: (id: string, data: any) => api.put(`/admin/payroll/adjustment-categories/${id}`, data).then(unwrapData),
  deleteAdjustmentCategory: (id: string) => api.delete(`/admin/payroll/adjustment-categories/${id}`).then(unwrapData),
  getAdjustments: (params?: { from?: string; to?: string }) =>
    api.get('/admin/payroll/adjustments', { params }).then(unwrapItems),
  createAdjustment: (data: any) => api.post('/admin/payroll/adjustments', data).then(unwrapData),
  updateAdjustment: (id: string, data: any) => api.put(`/admin/payroll/adjustments/${id}`, data).then(unwrapData),
  deleteAdjustment: (id: string) => api.delete(`/admin/payroll/adjustments/${id}`).then(unwrapData),
};

// --- AUDIT LOG API ---
export const auditApi = {
  getLogs: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/audit-logs', { params }).then(r => r.data),
};

// --- KITCHEN INVENTORY API ---
export const kitchenInventoryApi = {
  getBootstrap: (date?: string) => api.get('/admin/kitchen-inventory/bootstrap', { params: { date } }).then(unwrapData),
  createUnit: (data: any) => api.post('/admin/kitchen-inventory/units', data).then(unwrapData),
  updateUnit: (id: string, data: any) => api.put(`/admin/kitchen-inventory/units/${id}`, data).then(unwrapData),
  deleteUnit: (id: string) => api.delete(`/admin/kitchen-inventory/units/${id}`).then(unwrapData),
  createIngredient: (data: any) => api.post('/admin/kitchen-inventory/ingredients', data).then(unwrapData),
  updateIngredient: (id: string, data: any) => api.put(`/admin/kitchen-inventory/ingredients/${id}`, data).then(unwrapData),
  deleteIngredient: (id: string) => api.delete(`/admin/kitchen-inventory/ingredients/${id}`).then(unwrapData),
  createStockEntry: (data: any) => api.post('/admin/kitchen-inventory/stock-entries', data).then(unwrapData),
  createRecipe: (data: any) => api.post('/admin/kitchen-inventory/recipes', data).then(unwrapData),
  updateRecipe: (id: string, data: any) => api.put(`/admin/kitchen-inventory/recipes/${id}`, data).then(unwrapData),
  deleteRecipe: (id: string) => api.delete(`/admin/kitchen-inventory/recipes/${id}`).then(unwrapData),
};
