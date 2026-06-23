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
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
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
  getDashboard: () => api.get('/admin/dashboard').then(res => res.data),
  
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
};
