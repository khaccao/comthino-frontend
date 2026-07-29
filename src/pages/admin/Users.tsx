import React, { useEffect, useState } from 'react';
import { userApi, roleApi } from '../../services/api';
import { useAuthStore } from '../../utils/authStore';
import PermissionGuard from '../../components/PermissionGuard';
import { User as UserIcon, Lock, Unlock, Edit, Trash2, Plus, Shield, X, KeyRound, ShieldCheck } from 'lucide-react';
import { User, Role } from '../../types';

export default function Users() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{
    secret: string;
    otpauthUrl: string;
    user: { id: string; email: string; fullName: string };
  } | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    isActive: true,
    roles: [] as string[]
  });

  const MENU_CODE = 'USER_MANAGEMENT';
  const isSuperAdmin = Boolean(currentUser?.isSystemAdmin || currentUser?.roles?.includes('SUPERADMIN') || currentUser?.role === 'SUPERADMIN');

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        userApi.getAll(),
        roleApi.getAll()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        fullName: user.fullName || '',
        phone: user.phone || '',
        isActive: user.isActive,
        roles: user.roles || []
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        isActive: true,
        roles: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await userApi.update(editingUser.id, {
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone,
          isActive: formData.isActive,
          ...(formData.password ? { password: formData.password } : {})
        });
        await userApi.updateRoles(editingUser.id, formData.roles);
      } else {
        await userApi.create(formData);
      }
      handleCloseModal();
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi lưu người dùng');
    }
  };

  const handleToggleLock = async (user: User) => {
    if (window.confirm(`Bạn có chắc muốn ${user.isActive ? 'khóa' : 'mở khóa'} người dùng này?`)) {
      try {
        if (user.isActive) {
          await userApi.lock(user.id);
        } else {
          await userApi.unlock(user.id);
        }
        loadData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Lỗi khi thực hiện thao tác');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await userApi.delete(id);
        loadData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Lỗi khi xóa người dùng');
      }
    }
  };

  const handleSetupTwoFactor = async (user: User) => {
    const label = user.twoFactorEnabled ? 'reset mã 2FA' : 'bật 2FA';
    if (!window.confirm(`Bạn có chắc muốn ${label} cho ${user.email}?`)) return;
    try {
      const data = await userApi.setupTwoFactor(user.id);
      setTwoFactorSetup(data);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi kích hoạt 2FA');
    }
  };

  const handleDisableTwoFactor = async (user: User) => {
    if (!window.confirm(`Tắt 2FA cho ${user.email}? Tài khoản này sẽ không xem được doanh thu cho tới khi bật lại.`)) return;
    try {
      await userApi.disableTwoFactor(user.id);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi tắt 2FA');
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Quản lý Người dùng</h1>
        </div>
        <PermissionGuard menuCode={MENU_CODE} permissionCode="CREATE">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg"
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm người dùng
          </button>
        </PermissionGuard>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-sm font-medium text-stone-600">
              <th className="p-4">Họ tên</th>
              <th className="p-4">Email / SĐT</th>
              <th className="p-4">Vai trò</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4">2FA</th>
              <th className="p-4">Ngày tạo</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 text-sm text-stone-700">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-stone-50">
                <td className="p-4 font-medium">
                  {user.fullName || 'Chưa cập nhật'}
                </td>
                <td className="p-4">
                  <div>{user.email}</div>
                  <div className="text-xs text-stone-500">{user.phone}</div>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {user.roles?.map(role => (
                      <span key={role} className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800">{role}</span>
                    ))}
                    {user.isSystemAdmin && (
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800">System Admin</span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                    user.twoFactorEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                  }`}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {user.twoFactorEnabled ? 'Đã bật' : 'Chưa bật'}
                  </span>
                </td>
                <td className="p-4 text-stone-500">
                  {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <PermissionGuard menuCode={MENU_CODE} permissionCode="EDIT">
                      {!user.isSystemAdmin && (
                        <button
                          onClick={() => handleToggleLock(user)}
                          className={`p-1.5 rounded hover:bg-stone-200 ${
                            user.isActive ? 'text-amber-600' : 'text-green-600'
                          }`}
                        >
                          {user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="p-1.5 text-blue-600 rounded hover:bg-stone-200"
                        title="Sửa tài khoản"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {isSuperAdmin && (
                        <>
                          <button
                            onClick={() => handleSetupTwoFactor(user)}
                            className="p-1.5 text-emerald-700 rounded hover:bg-emerald-50"
                            title={user.twoFactorEnabled ? 'Reset 2FA' : 'Bật 2FA'}
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          {user.twoFactorEnabled && (
                            <button
                              onClick={() => handleDisableTwoFactor(user)}
                              className="p-1.5 text-stone-500 rounded hover:bg-stone-200"
                              title="Tắt 2FA"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </PermissionGuard>
                    <PermissionGuard menuCode={MENU_CODE} permissionCode="DELETE">
                      {!user.isSystemAdmin && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1.5 text-red-600 rounded hover:bg-stone-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </PermissionGuard>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {twoFactorSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Google Authenticator</p>
                <h2 className="text-xl font-black text-stone-950">Thiết lập 2FA</h2>
              </div>
              <button onClick={() => setTwoFactorSetup(null)} className="rounded-lg p-2 hover:bg-stone-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                Mở Google Authenticator, chọn thêm tài khoản mới, rồi nhập setup key dưới đây cho tài khoản <b>{twoFactorSetup.user.email}</b>.
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-stone-700">Setup key</label>
                <div className="flex gap-2">
                  <input readOnly value={twoFactorSetup.secret} className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-stone-50 px-3 py-3 font-mono text-sm font-bold tracking-wider" />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(twoFactorSetup.secret)}
                    className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-bold text-white"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-stone-700">OTP Auth URL</label>
                <textarea readOnly value={twoFactorSetup.otpauthUrl} className="h-24 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-3 text-xs font-semibold text-stone-600" />
              </div>
              <p className="text-xs font-semibold text-stone-500">
                Sau khi lưu key vào Google Authenticator, người dùng nhập mã 6 số để xem Dashboard tổng và Doanh thu POS.
              </p>
            </div>
            <div className="flex justify-end border-t bg-stone-50 px-6 py-4">
              <button onClick={() => setTwoFactorSetup(null)} className="rounded-xl bg-amber-600 px-5 py-2 font-bold text-white">
                Đã lưu mã
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl flex flex-col">
            <div className="px-6 py-4 border-b border-stone-200 flex justify-between">
              <h2 className="text-xl font-bold">{editingUser ? 'Sửa Người dùng' : 'Thêm Người dùng'}</h2>
              <button onClick={handleCloseModal}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <form id="userForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Email *</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" disabled={!!editingUser} />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Mật khẩu {editingUser && '(Để trống nếu không đổi)'}</label>
                    <input type="password" required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Họ tên</label>
                    <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Số điện thoại</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
                {!editingUser?.isSystemAdmin && (
                  <div>
                    <label className="block text-sm mb-2">Vai trò</label>
                    <div className="grid grid-cols-2 gap-2">
                      {roles.map(role => (
                        <label key={role.id} className="flex items-center p-2 border rounded-lg cursor-pointer">
                          <input type="checkbox" checked={formData.roles.includes(role.code)} onChange={e => {
                            if (e.target.checked) setFormData({...formData, roles: [...formData.roles, role.code]});
                            else setFormData({...formData, roles: formData.roles.filter(r => r !== role.code)});
                          }} className="w-4 h-4 text-amber-600 rounded" />
                          <span className="ml-2 text-sm">{role.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {!editingUser?.isSystemAdmin && (
                  <label className="flex items-center mt-4">
                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-amber-600 rounded" />
                    <span className="ml-2 text-sm">Hoạt động</span>
                  </label>
                )}
              </form>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-stone-50">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-stone-200 rounded-lg">Hủy</button>
              <button type="submit" form="userForm" className="px-4 py-2 bg-amber-600 text-white rounded-lg">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
