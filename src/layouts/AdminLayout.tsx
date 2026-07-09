import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../utils/authStore';
import {
  LayoutDashboard, Settings, Menu as MenuIcon, Image as ImageIcon, MessageSquare,
  Sparkles, Layers, Utensils, FolderOpen, FileImage, Navigation, LogOut,
  ChevronRight, User as UserIcon, X, Newspaper, PenLine, Globe, Shield,
  Users, Key, History, FileText, CheckSquare, CreditCard, DollarSign,
  BookOpen, BarChart2, Truck, ChevronDown, Monitor
} from 'lucide-react';

interface NavGroup {
  label: string;
  items: { label: string; path: string; icon: React.ElementType; menuCode?: string }[];
}

export default function AdminLayout() {
  const { isAuthenticated, user, logout, canView } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  });
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      label: 'TONG QUAN',
      items: [
        { label: 'Thong ke chung', path: '/admin/dashboard', icon: LayoutDashboard, menuCode: 'DASHBOARD' },
        { label: 'May POS', path: '/admin/pos', icon: Monitor, menuCode: 'ORDER_POS' },
      ],
    },
    {
      label: 'WEBSITE',
      items: [
        { label: 'Thong tin website', path: '/admin/site-settings', icon: Settings, menuCode: 'SYSTEM_CONFIG' },
        { label: 'Banners', path: '/admin/banners', icon: Sparkles, menuCode: 'SYSTEM_CONFIG' },
        { label: 'Cac phan trang chu', path: '/admin/home-sections', icon: FolderOpen, menuCode: 'SYSTEM_CONFIG' },
        { label: 'Menu dieu huong', path: '/admin/navigation-items', icon: Navigation, menuCode: 'SYSTEM_CONFIG' },
        { label: 'Khuyen mai', path: '/admin/promotions', icon: Sparkles, menuCode: 'SYSTEM_CONFIG' },
        { label: 'Thu vien anh', path: '/admin/gallery', icon: ImageIcon, menuCode: 'SYSTEM_CONFIG' },
        { label: 'Danh gia khach', path: '/admin/testimonials', icon: MessageSquare, menuCode: 'SYSTEM_CONFIG' },
        { label: 'Lien he', path: '/admin/contact-messages', icon: MessageSquare, menuCode: 'SYSTEM_CONFIG' },
        { label: 'Quan ly Media', path: '/admin/media', icon: FileImage, menuCode: 'SYSTEM_CONFIG' },
      ],
    },
    {
      label: 'THUC DON',
      items: [
        { label: 'Danh muc mon', path: '/admin/menu-categories', icon: Layers, menuCode: 'DISH_CATEGORY' },
        { label: 'Mon an', path: '/admin/menu-items', icon: Utensils, menuCode: 'MENU_MANAGEMENT' },
      ],
    },
    {
      label: 'NOI DUNG',
      items: [
        { label: 'Danh muc tin', path: '/admin/blog/categories', icon: Newspaper },
        { label: 'Bai viet', path: '/admin/blog/posts', icon: Newspaper },
        { label: 'Viet bai moi', path: '/admin/blog/posts/new', icon: PenLine },
        { label: 'SEO Landing Pages', path: '/admin/seo-pages', icon: Globe },
        { label: 'FAQs', path: '/admin/faqs', icon: Sparkles },
        { label: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
      ],
    },
    {
      label: 'CHI TIEN',
      items: [
        { label: 'Dashboard chi tien', path: '/admin/payments/dashboard', icon: BarChart2, menuCode: 'CASH_BOOK' },
        { label: 'De nghi chi', path: '/admin/payments/requests', icon: FileText, menuCode: 'PAYMENT_REQUEST' },
        { label: 'Duyet de nghi chi', path: '/admin/payments/approvals', icon: CheckSquare, menuCode: 'PAYMENT_REQUEST_APPROVAL' },
        { label: 'Phieu chi', path: '/admin/payments/vouchers', icon: CreditCard, menuCode: 'PAYMENT_VOUCHER' },
        { label: 'Nha cung cap', path: '/admin/suppliers', icon: Truck, menuCode: 'SUPPLIER_CATEGORY' },
        { label: 'Tai khoan tien', path: '/admin/cash/accounts', icon: BookOpen, menuCode: 'BANK_ACCOUNT' },
        { label: 'Bao cao thu chi', path: '/admin/reports/cash', icon: BarChart2, menuCode: 'CASH_REPORT' },
      ],
    },
    {
      label: 'HE THONG',
      items: [
        { label: 'Nguoi dung', path: '/admin/users', icon: Users, menuCode: 'USER_MANAGEMENT' },
        { label: 'Vai tro', path: '/admin/roles', icon: Shield, menuCode: 'ROLE_MANAGEMENT' },
        { label: 'Phan quyen', path: '/admin/permissions', icon: Key, menuCode: 'PERMISSION_MANAGEMENT' },
        { label: 'Nhat ky he thong', path: '/admin/audit-logs', icon: History, menuCode: 'AUDIT_LOG' },
      ],
    },
  ];

  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => !item.menuCode || canView(item.menuCode)),
  })).filter(group => group.items.length > 0);

  const isSingleGroup = (group: NavGroup) => group.label === 'TONG QUAN';

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
            <span className="font-serif font-bold text-xl text-amber-500 tracking-wider">Thi No Admin</span>
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
          <button onClick={handleLogout} title="Dang xuat" className="p-2 rounded hover:bg-stone-800 text-stone-400 hover:text-red-400 transition-colors">
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
            <span className="hidden lg:block text-stone-500 font-medium text-sm">He quan tri noi dung – Com Thi No</span>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-4">
            <a href="/" target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 py-1.5 px-3 rounded transition-colors">
              Xem trang chu
            </a>
            <div className="h-4 w-px bg-stone-200 hidden sm:block"></div>
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-stone-600 text-sm font-medium">Xin chao, {user?.fullName}</span>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full uppercase border border-amber-200">
                {user?.roles?.[0] || user?.role}
              </span>
            </div>
          </div>
        </header>
        <main className="admin-content flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
