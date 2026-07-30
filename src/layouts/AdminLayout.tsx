import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../utils/authStore';
import { paymentApi } from '../services/api';
import {
  LayoutDashboard, Settings, Menu as MenuIcon, Image as ImageIcon, MessageSquare,
  Sparkles, Layers, Utensils, FolderOpen, FileImage, Navigation, LogOut,
  ChevronRight, User as UserIcon, X, Newspaper, PenLine, Globe, Shield,
  Users, Key, History, FileText, CheckSquare, CreditCard, DollarSign,
  BookOpen, BarChart2, Truck, ChevronDown, Monitor, CalendarClock, AlertTriangle, Package
} from 'lucide-react';

interface NavGroup {
  label: string;
  items: { label: string; path: string; icon: React.ElementType; menuCode?: string }[];
}

interface SupplierDueAlert {
  id: string;
  name: string;
  currentDebt: number;
  paymentDueDate?: string | null;
  dueStatus?: 'DUE_SOON' | 'DUE_TODAY' | 'OVERDUE' | 'UPCOMING' | 'NONE';
  dueStatusLabel?: string;
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

export default function AdminLayout() {
  const { isAuthenticated, user, logout, canView } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  });
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [supplierDueAlerts, setSupplierDueAlerts] = useState<SupplierDueAlert[]>([]);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !canView('SUPPLIER_CATEGORY')) {
      setSupplierDueAlerts([]);
      return;
    }

    let cancelled = false;
    paymentApi.getSupplierDueAlerts()
      .then((items: SupplierDueAlert[]) => {
        if (!cancelled) setSupplierDueAlerts(items);
      })
      .catch(() => {
        if (!cancelled) setSupplierDueAlerts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, location.pathname, canView]);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: prev[key] === false ? true : false }));
  };

  const isGroupExpanded = (label: string) => expandedGroups[label] !== false;

  const navGroups: NavGroup[] = [
    {
      label: 'TỔNG QUAN',
      items: [
        { label: 'Thống kê chung', path: '/admin/dashboard', icon: LayoutDashboard, menuCode: 'DASHBOARD' },
        { label: 'Máy POS', path: '/admin/pos', icon: Monitor, menuCode: 'ORDER_POS' },
        { label: 'Kho bếp & định lượng', path: '/admin/kitchen-inventory', icon: Package, menuCode: 'KITCHEN_INVENTORY' },
      ],
    },
    {
      label: 'WEBSITE',
      items: [
        { label: 'Thông tin website', path: '/admin/site-settings', icon: Settings, menuCode: 'SYSTEM_CONFIG' },
        { label: 'Banners', path: '/admin/banners', icon: Sparkles, menuCode: 'SYSTEM_CONFIG' },
        { label: 'Các phần trang chủ', path: '/admin/home-sections', icon: FolderOpen, menuCode: 'SYSTEM_CONFIG' },
        { label: 'Menu điều hướng', path: '/admin/navigation-items', icon: Navigation, menuCode: 'SYSTEM_CONFIG' },
        { label: 'Khuyến mãi', path: '/admin/promotions', icon: Sparkles, menuCode: 'SYSTEM_CONFIG' },
        { label: 'Thư viện ảnh', path: '/admin/gallery', icon: ImageIcon, menuCode: 'SYSTEM_CONFIG' },
        { label: 'Đánh giá khách', path: '/admin/testimonials', icon: MessageSquare, menuCode: 'SYSTEM_CONFIG' },
        { label: 'Liên hệ', path: '/admin/contact-messages', icon: MessageSquare, menuCode: 'SYSTEM_CONFIG' },
        { label: 'Quản lý Media', path: '/admin/media', icon: FileImage, menuCode: 'SYSTEM_CONFIG' },
      ],
    },
    {
      label: 'THỰC ĐƠN',
      items: [
        { label: 'Danh mục món', path: '/admin/menu-categories', icon: Layers, menuCode: 'DISH_CATEGORY' },
        { label: 'Món ăn', path: '/admin/menu-items', icon: Utensils, menuCode: 'MENU_MANAGEMENT' },
      ],
    },
    {
      label: 'NỘI DUNG',
      items: [
        { label: 'Danh mục tin', path: '/admin/blog/categories', icon: Newspaper },
        { label: 'Bài viết', path: '/admin/blog/posts', icon: Newspaper },
        { label: 'Viết bài mới', path: '/admin/blog/posts/new', icon: PenLine },
        { label: 'SEO Landing Pages', path: '/admin/seo-pages', icon: Globe },
        { label: 'FAQs', path: '/admin/faqs', icon: Sparkles },
        { label: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
      ],
    },
    {
      label: 'CHI TIỀN',
      items: [
        { label: 'Dashboard chi tiền', path: '/admin/payments/dashboard', icon: BarChart2, menuCode: 'CASH_BOOK' },
        { label: 'Đề nghị chi', path: '/admin/payments/requests', icon: FileText, menuCode: 'PAYMENT_REQUEST' },
        { label: 'Duyệt đề nghị chi', path: '/admin/payments/approvals', icon: CheckSquare, menuCode: 'PAYMENT_REQUEST_APPROVAL' },
        { label: 'Phiếu chi', path: '/admin/payments/vouchers', icon: CreditCard, menuCode: 'PAYMENT_VOUCHER' },
        { label: 'Nhà cung cấp', path: '/admin/suppliers', icon: Truck, menuCode: 'SUPPLIER_CATEGORY' },
        { label: 'Công nợ NCC', path: '/admin/suppliers/debt', icon: AlertTriangle, menuCode: 'SUPPLIER_DEBT' },
        { label: 'Tài khoản tiền', path: '/admin/cash/accounts', icon: BookOpen, menuCode: 'BANK_ACCOUNT' },
        { label: 'Báo cáo thu chi', path: '/admin/reports/cash', icon: BarChart2, menuCode: 'CASH_REPORT' },
      ],
    },
    {
      label: 'NHÂN SỰ',
      items: [
        { label: 'Chấm công & lương', path: '/admin/payroll', icon: CalendarClock, menuCode: 'PAYROLL' },
      ],
    },
    {
      label: 'HỆ THỐNG',
      items: [
        { label: 'Người dùng', path: '/admin/users', icon: Users, menuCode: 'USER_MANAGEMENT' },
        { label: 'Vai trò', path: '/admin/roles', icon: Shield, menuCode: 'ROLE_MANAGEMENT' },
        { label: 'Phân quyền', path: '/admin/permissions', icon: Key, menuCode: 'PERMISSION_MANAGEMENT' },
        { label: 'Nhật ký hệ thống', path: '/admin/audit-logs', icon: History, menuCode: 'AUDIT_LOG' },
      ],
    },
  ];

  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => !item.menuCode || canView(item.menuCode)),
  })).filter(group => group.items.length > 0);

  const isSingleGroup = (group: NavGroup) => group.label === 'TỔNG QUAN';

  return (
    <div className="admin-shell min-h-screen flex bg-stone-100 text-stone-800">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close admin menu overlay"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        className={`bg-stone-900 text-stone-200 w-[min(18rem,calc(100vw-2rem))] lg:w-64 fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static transition-transform duration-300 ease-in-out z-30 flex flex-col border-r border-stone-800`}
      >
        <div className="p-5 bg-stone-950 flex justify-between items-center border-b border-stone-800">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-serif font-bold text-xl text-amber-500 tracking-wider">Thị Nở Admin</span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredGroups.map((group) => (
            <div key={group.label}>
              {isSingleGroup(group) ? (
                group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => { if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                        isActive ? 'bg-amber-600 text-white shadow' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                    </Link>
                  );
                })
              ) : (
                <div className="mb-1">
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold text-stone-400 uppercase tracking-wider hover:text-stone-200 transition-colors"
                  >
                    <span>{group.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isGroupExpanded(group.label) ? 'rotate-180' : ''}`} />
                  </button>
                  {isGroupExpanded(group.label) && (
                    <div className="mt-1 space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path ||
                          (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path + '/'));
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => { if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                              isActive ? 'bg-amber-600 text-white shadow' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon className="w-4 h-4 shrink-0" />
                              <span>{item.label}</span>
                            </div>
                            {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center font-bold text-white shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="truncate text-xs">
              <p className="font-medium text-stone-200 truncate">{user?.fullName}</p>
              <p className="text-stone-400 truncate text-[10px]">{user?.roles?.[0] || user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} title="Đăng xuất" className="p-2 rounded hover:bg-stone-800 text-stone-400 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="min-h-16 bg-white border-b border-stone-200 flex items-center justify-between gap-3 px-4 py-3 sm:px-6 z-20 shrink-0">
          <div className="flex min-w-0 items-center">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden -ml-2 p-2 rounded-md hover:bg-stone-100 text-stone-600" aria-label="Open admin menu">
              <MenuIcon className="w-6 h-6" />
            </button>
            <span className="hidden lg:block text-stone-500 font-medium text-sm">Hệ quản trị nội dung - Cơm Thị Nở</span>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-4">
            <a href="/" target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 py-1.5 px-3 rounded transition-colors">
              Xem trang chủ
            </a>
            <div className="h-4 w-px bg-stone-200 hidden sm:block"></div>
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-stone-600 text-sm font-medium">Xin chào, {user?.fullName}</span>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full uppercase border border-amber-200">
                {user?.roles?.[0] || user?.role}
              </span>
            </div>
          </div>
        </header>
        <main className="admin-content flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {supplierDueAlerts.length > 0 && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-bold text-amber-950">Cảnh báo hạn thanh toán nhà cung cấp</h2>
                      <p className="text-sm text-amber-800">
                        Có {supplierDueAlerts.length} NCC sắp đến hạn, đến hạn hoặc quá hạn thanh toán.
                      </p>
                    </div>
                    <Link to="/admin/suppliers" className="inline-flex rounded-xl bg-amber-600 px-3 py-2 text-sm font-bold text-white hover:bg-amber-700">
                      Xem công nợ
                    </Link>
                  </div>
                  <div className="mt-3 grid gap-2 lg:grid-cols-2">
                    {supplierDueAlerts.slice(0, 4).map(item => (
                      <div key={item.id} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm">
                        <span className="font-bold text-stone-950">{item.name}</span>
                        <span className="mx-2 text-stone-400">•</span>
                        <span className="font-bold text-red-600">{formatMoney(item.currentDebt)}</span>
                        <span className="mx-2 text-stone-400">•</span>
                        <span className="font-semibold text-amber-800">{item.dueStatusLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
