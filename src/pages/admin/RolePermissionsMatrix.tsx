import React, { useEffect, useState } from 'react';
import { roleApi, permissionApi } from '../../services/api';
import { useAuthStore } from '../../utils/authStore';
import PermissionGuard from '../../components/PermissionGuard';
import { Save, Check, Key } from 'lucide-react';
import { Role, Menu, Permission, RolePermission } from '../../types';
import { useSearchParams } from 'react-router-dom';

export default function RolePermissionsMatrix() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const MENU_CODE = 'PERMISSION_MANAGEMENT';
  const { user } = useAuthStore();

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, menusData, permsData] = await Promise.all([
        roleApi.getAll(),
        permissionApi.getMenus(),
        permissionApi.getAll(),
      ]);
      setRoles(rolesData);
      setMenus(menusData);
      setPermissionsList(permsData);

      const rId = searchParams.get('roleId') || (rolesData.length > 0 ? rolesData[0].id : '');
      if (rId) {
        setSelectedRoleId(rId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      loadRolePermissions(selectedRoleId);
      setSearchParams({ roleId: selectedRoleId });
    }
  }, [selectedRoleId]);

  const loadRolePermissions = async (roleId: string) => {
    try {
      const rpData: any[] = await roleApi.getPermissions(roleId);
      
      const newMatrix: Record<string, Record<string, boolean>> = {};
      menus.forEach(m => {
        newMatrix[m.code] = {};
        permissionsList.forEach(p => {
          newMatrix[m.code][p.code] = false;
        });
      });

      rpData.forEach((rp: any) => {
        const menuCode = rp.menuCode || (rp.menu && rp.menu.code);
        const permissionCode = rp.permissionCode || (rp.permission && rp.permission.code);
        if (menuCode && permissionCode && newMatrix[menuCode]) {
          newMatrix[menuCode][permissionCode] = rp.isAllowed;
        }
      });

      setMatrix(newMatrix);
    } catch (err: any) {
      alert('Không thể tải quyền của vai trò này');
    }
  };

  const handleCheckboxChange = (menuCode: string, permissionCode: string, checked: boolean) => {
    setMatrix(prev => ({
      ...prev,
      [menuCode]: {
        ...prev[menuCode],
        [permissionCode]: checked
      }
    }));
  };

  const handleSelectAllRow = (menuCode: string, selectAll: boolean) => {
    setMatrix(prev => {
      const row = { ...prev[menuCode] };
      Object.keys(row).forEach(k => row[k] = selectAll);
      return { ...prev, [menuCode]: row };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // transform matrix to array
      const permissions: any[] = [];
      Object.keys(matrix).forEach(mCode => {
        Object.keys(matrix[mCode]).forEach(pCode => {
          if (matrix[mCode][pCode]) {
            permissions.push({ menuCode: mCode, permissionCode: pCode });
          }
        });
      });

      await roleApi.updatePermissions(selectedRoleId, permissions);
      alert('Đã lưu phân quyền thành công!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi lưu phân quyền');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const selectedRole = roles.find(r => r.id === selectedRoleId);
  const isSuperadmin = selectedRole?.code === 'SUPERADMIN';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Ma trận Phân quyền</h1>
          <p className="text-sm text-stone-500 mt-1">Cấu hình quyền truy cập chi tiết cho từng vai trò</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="px-4 py-2 border border-stone-300 rounded-lg bg-white shadow-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none min-w-[200px]"
          >
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
            ))}
          </select>
          <PermissionGuard menuCode={MENU_CODE} permissionCode="EDIT">
            <button
              onClick={handleSave}
              disabled={isSuperadmin || saving}
              className={`flex items-center px-4 py-2 text-white rounded-lg transition-colors ${
                isSuperadmin || saving ? 'bg-stone-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </PermissionGuard>
        </div>
      </div>

      {isSuperadmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-start">
          <Key className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold">Vai trò Quản trị cấp cao (SUPERADMIN)</h3>
            <p className="text-sm mt-1">Vai trò này mặc định có toàn bộ quyền trong hệ thống. Bạn không thể chỉnh sửa ma trận quyền của SUPERADMIN.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="sticky top-0 z-10 bg-stone-100 shadow-sm">
              <tr className="border-b border-stone-200 text-xs font-bold text-stone-700 uppercase tracking-wider">
                <th className="p-4 sticky left-0 bg-stone-100 border-r border-stone-200 z-20 w-64">Danh mục Menu</th>
                <th className="p-4 text-center border-r border-stone-200 w-24">Tất cả</th>
                {permissionsList.map(p => (
                  <th key={p.code} className="p-4 text-center border-r border-stone-200 w-24" title={p.description || undefined}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-sm text-stone-700">
              {menus.map(menu => {
                const row = matrix[menu.code] || {};
                const allChecked = permissionsList.length > 0 && permissionsList.every(p => row[p.code]);
                
                return (
                  <tr key={menu.code} className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 font-medium sticky left-0 bg-white group-hover:bg-stone-50 border-r border-stone-200 z-10">
                      {menu.name}
                    </td>
                    <td className="p-4 text-center border-r border-stone-200 bg-stone-50/50">
                      <input
                        type="checkbox"
                        disabled={isSuperadmin}
                        checked={allChecked}
                        onChange={(e) => handleSelectAllRow(menu.code, e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500 cursor-pointer disabled:opacity-50"
                      />
                    </td>
                    {permissionsList.map(p => (
                      <td key={p.code} className="p-4 text-center border-r border-stone-200">
                        <input
                          type="checkbox"
                          disabled={isSuperadmin}
                          checked={row[p.code] || false}
                          onChange={(e) => handleCheckboxChange(menu.code, p.code, e.target.checked)}
                          className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500 cursor-pointer disabled:opacity-50"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}