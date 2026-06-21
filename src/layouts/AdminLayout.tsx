import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../utils/authStore';
import {
  LayoutDashboard,
  Settings,
  Menu as MenuIcon,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  Layers,
  Utensils,
  FolderOpen,
  FileImage,
  Navigation,
  LogOut,
  ChevronRight,
  User as UserIcon,
  X
} from 'lucide-react';

export default function AdminLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navLinks = [
    { label: 'Thống kê chung', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Thông tin website', path: '/admin/site-settings', icon: Settings },
    { label: 'Menu điều hướng', path: '/admin/navigation-items', icon: Navigation },
    { label: 'Banners trang chủ', path: '/admin/banners', icon: Sparkles },
    { label: 'Các phần trang chủ', path: '/admin/home-sections', icon: FolderOpen },
    { label: 'Danh mục món', path: '/admin/menu-categories', icon: Layers },
    { label: 'Món ăn', path: '/admin/menu-items', icon: Utensils },
    { label: 'Khuyến mãi', path: '/admin/promotions', icon: Sparkles },
    { label: 'Thư viện ảnh', path: '/admin/gallery', icon: ImageIcon },
    { label: 'Đánh giá khách', path: '/admin/testimonials', icon: MessageSquare },
    { label: 'Hòm thư liên hệ', path: '/admin/contact-messages', icon: MessageSquare },
    { label: 'Quản lý Media', path: '/admin/media', icon: FileImage },
  ];

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

      {/* Sidebar for Desktop */}
      <aside
        className={`bg-stone-900 text-stone-200 w-[min(18rem,calc(100vw-2rem))] lg:w-64 fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static transition-transform duration-300 ease-in-out z-30 flex flex-col border-r border-stone-800`}
      >
        {/* Sidebar Header */}
        <div className="p-6 bg-stone-950 flex justify-between items-center border-b border-stone-800">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-serif font-bold text-xl text-amber-500 tracking-wider">
              Thị Nở Admin
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => {
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'rotate-90' : ''}`} />
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center font-bold text-white shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="truncate text-xs">
              <p className="font-medium text-stone-200 truncate">{user?.fullName}</p>
              <p className="text-stone-400 truncate text-[10px]">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-2 rounded hover:bg-stone-800 text-stone-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="min-h-16 bg-white border-b border-stone-200 flex items-center justify-between gap-3 px-4 py-3 sm:px-6 z-20 shrink-0">
          <div className="flex min-w-0 items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden -ml-2 p-2 rounded-md hover:bg-stone-100 text-stone-600"
              aria-label="Open admin menu"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <span className="hidden lg:block text-stone-500 font-medium text-sm">
              Hệ quản trị nội dung website Cơm Thị Nở
            </span>
          </div>

          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-4">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 py-1.5 px-3 rounded transition-colors"
            >
              Xem trang chủ
            </a>
            <div className="h-4 w-px bg-stone-200 hidden sm:block"></div>
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-stone-600 text-sm font-medium">Xin chào, {user?.fullName}</span>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full uppercase border border-amber-200">
                {user?.role}
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Pages Mount */}
        <main className="admin-content flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
