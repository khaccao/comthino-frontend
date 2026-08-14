import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../utils/authStore';
import { getFirstAllowedAdminPath, hasAdminPermission } from '../utils/adminPermissions';

interface AdminRouteGuardProps {
  menuCode: string;
  permissionCode?: string;
  children: React.ReactNode;
}

export default function AdminRouteGuard({
  menuCode,
  permissionCode = 'VIEW',
  children,
}: AdminRouteGuardProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (hasAdminPermission(user, menuCode, permissionCode)) {
    return <>{children}</>;
  }

  const firstAllowedPath = getFirstAllowedAdminPath(user);

  return (
    <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Không có quyền</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-stone-950">Bạn chưa được cấp quyền xem màn này</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Tài khoản hiện tại không có quyền {permissionCode} cho mã menu {menuCode}. Vui lòng bật quyền trong phần Vai trò nếu cần truy cập.
        </p>
        {firstAllowedPath !== '/admin/no-permission' && (
          <Link
            to={firstAllowedPath}
            replace
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-stone-950 px-5 py-3 text-sm font-bold text-white hover:bg-stone-800"
          >
            Về màn được phép xem
          </Link>
        )}
      </div>
    </div>
  );
}
