import React from 'react';
import { useAuthStore } from '../utils/authStore';

interface PermissionGuardProps {
  menuCode: string;
  permissionCode: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders children only if the current user has the specified permission.
 * Usage:
 *   <PermissionGuard menuCode="USER_MANAGEMENT" permissionCode="CREATE">
 *     <button>Them nguoi dung</button>
 *   </PermissionGuard>
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  menuCode,
  permissionCode,
  children,
  fallback = null,
}) => {
  const { hasPermission } = useAuthStore();
  if (!hasPermission(menuCode, permissionCode)) return <>{fallback}</>;
  return <>{children}</>;
};

export default PermissionGuard;
