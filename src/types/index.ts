export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  id: string;
  siteName: string;
  slogan?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  phone?: string;
  email?: string;
  address?: string;
  facebookUrl?: string;
  zaloUrl?: string;
  googleMapUrl?: string;
  openingHours?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  faviconUrl?: string;
  logoUrl?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  buttonText?: string;
  buttonLink?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface NavigationItem {
  id: string;
  label: string;
  url: string;
  displayOrder: number;
  isActive: boolean;
}

export interface HomeSection {
  id: string;
  sectionKey: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  menuItems?: MenuItem[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  imageUrl: string;
  price: number | string;
  salePrice?: number | string | null;
  shortDescription?: string;
  description?: string;
  ingredients?: string;
  isFeatured: boolean;
  isAvailable: boolean;
  displayOrder: number;
  category?: MenuCategory;
}

export interface Promotion {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  discountText?: string;
  buttonText?: string;
  buttonLink?: string;
  isActive: boolean;
}

export interface GalleryImage {
  id: string;
  title?: string;
  imageUrl: string;
  altText?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Testimonial {
  id: string;
  customerName: string;
  content: string;
  rating: number;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  message: string;
  status: 'NEW' | 'CONTACTED' | 'DONE';
  createdAt: string;
}

export interface MediaFile {
  id: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}
