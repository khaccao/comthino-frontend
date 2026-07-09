import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Loader2,
  KeyRound,
  Search,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { roleApi } from '../../services/api';
import { useAuthStore } from '../../utils/authStore';
import PermissionGuard from '../../components/PermissionGuard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
}

interface RoleFormData {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

const EMPTY_FORM: RoleFormData = {
  code: '',
  name: '',
  description: '',
  isActive: true,
};

// ---------------------------------------------------------------------------
// Toast helper
// ---------------------------------------------------------------------------
type ToastType = 'success' | 'error' | 'warning';
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

let _toastId = 0;

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => {
        const bg =
          t.type === 'success'
            ? 'bg-emerald-900/90 border-emerald-500/40 text-emerald-200'
            : t.type === 'error'
            ? 'bg-red-900/90 border-red-500/40 text-red-200'
            : 'bg-amber-900/90 border-amber-500/40 text-amber-200';
        const Icon =
          t.type === 'success'
            ? CheckCircle2
            : t.type === 'error'
            ? XCircle
            : AlertTriangle;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl max-w-sm ${bg}`}
          >
            <Icon className="w-5 h-5 mt-0.5 shrink-0" />
            <span className="text-sm leading-snug">{t.message}</span>
            <button
              className="ml-auto opacity-60 hover:opacity-100 transition-opacity"
              onClick={() => onDismiss(t.id)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Code Badge
// ---------------------------------------------------------------------------
function CodeBadge({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold tracking-wider">
      {code}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Confirm Delete Modal
// ---------------------------------------------------------------------------
interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-700/60 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-stone-100">{title}</h3>
        </div>
        <p className="text-stone-400 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-medium transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role Create / Edit Modal
// ---------------------------------------------------------------------------
interface RoleModalProps {
  open: boolean;
  editingRole: Role | null;
  onClose: () => void;
  onSaved: () => void;
  showToast: (type: ToastType, msg: string) => void;
}

function RoleModal({
  open,
  editingRole,
  onClose,
  onSaved,
  showToast,
}: RoleModalProps) {
  const [form, setForm] = useState<RoleFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (editingRole) {
      setForm({
        code: editingRole.code,
        name: editingRole.name,
        description: editingRole.description ?? '',
        isActive: editingRole.isActive,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [open, editingRole]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = 'Mã vai trò không được để trống';
    if (!form.name.trim()) e.name = 'Tên vai trò không được để trống';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim(),
        isActive: form.isActive,
      };
      if (editingRole) {
        await roleApi.update(editingRole.id, payload);
        showToast('success', 'Cập nhật vai trò thành công');
      } else {
        await roleApi.create(payload);
        showToast('success', 'Tạo vai trò thành công');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      showToast(
        'error',
        err?.response?.data?.message ?? 'Có lỗi xảy ra, vui lòng thử lại',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-700/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-100">
                {editingRole ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới'}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {editingRole
                  ? `Đang chỉnh sửa: ${editingRole.name}`
                  : 'Điền thông tin để tạo vai trò'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1.5">
              Mã vai trò <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              disabled={!!editingRole?.isSystem}
              value={form.code}
              onChange={(e) =>
                setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
              }
              placeholder="VD: ADMIN, MANAGER"
              className={`w-full px-3 py-2.5 rounded-xl bg-stone-800 border text-stone-100 placeholder-stone-600 text-sm font-mono tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.code
                  ? 'border-red-500/60'
                  : 'border-stone-700 focus:border-amber-500/60'
              }`}
            />
            {errors.code && (
              <p className="mt-1 text-xs text-red-400">{errors.code}</p>
            )}
            {!!editingRole?.isSystem && (
              <p className="mt-1 text-xs text-amber-500/70 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Mã vai trò hệ thống không thể thay
                đổi
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1.5">
              Tên vai trò <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="VD: Quản trị viên"
              className={`w-full px-3 py-2.5 rounded-xl bg-stone-800 border text-stone-100 placeholder-stone-600 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
                errors.name
                  ? 'border-red-500/60'
                  : 'border-stone-700 focus:border-amber-500/60'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1.5">
              Mô tả
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Mô tả ngắn về vai trò này..."
              className="w-full px-3 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 placeholder-stone-600 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/60 resize-none"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-800/60 border border-stone-700/60">
            <div>
              <p className="text-sm font-medium text-stone-300">Hoạt động</p>
              <p className="text-xs text-stone-500 mt-0.5">
                Vai trò này có thể được gán cho người dùng
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((f) => ({ ...f, isActive: !f.isActive }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                form.isActive ? 'bg-amber-500' : 'bg-stone-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition-all disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingRole ? 'Lưu thay đổi' : 'Tạo vai trò'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function RolesPage() {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuthStore();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchRoles = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const res = await roleApi.getAll();
        setRoles(res.data?.data ?? res.data ?? []);
      } catch {
        showToast('error', 'Không thể tải danh sách vai trò');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await roleApi.delete(deleteTarget.id);
      showToast('success', `Đã xóa vai trò "${deleteTarget.name}"`);
      setDeleteTarget(null);
      fetchRoles(true);
    } catch (err: any) {
      showToast(
        'error',
        err?.response?.data?.message ?? 'Xóa vai trò thất bại',
      );
    } finally {
      setDeleting(false);
    }
  };

  const filtered = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const total = roles.length;
  const active = roles.filter((r) => r.isActive).length;
  const system = roles.filter((r) => r.isSystem).length;

  return (
    <PermissionGuard menuCode="ROLE_MANAGEMENT" permissionCode="VIEW">
      <div className="min-h-screen bg-stone-950 text-stone-100">
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />

        {/* Page Header */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 shadow-lg shadow-amber-900/10">
                <Shield className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-100 tracking-tight">
                  Quản lý Vai trò
                </h1>
                <p className="text-sm text-stone-500 mt-0.5">
                  Phân quyền và kiểm soát truy cập hệ thống
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingRole(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-sm font-semibold shadow-lg shadow-amber-900/30 transition-all hover:shadow-amber-900/50 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              Tạo vai trò
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 mb-6 grid grid-cols-3 gap-4 max-w-md">
          {[
            {
              label: 'Tổng vai trò',
              value: total,
              color: 'text-stone-300',
              dot: 'bg-stone-400',
            },
            {
              label: 'Hoạt động',
              value: active,
              color: 'text-emerald-400',
              dot: 'bg-emerald-400',
            },
            {
              label: 'Hệ thống',
              value: system,
              color: 'text-amber-400',
              dot: 'bg-amber-400',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center py-3 px-2 rounded-xl bg-stone-900 border border-stone-800"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${s.dot}`}
                />
                <span className="text-xs text-stone-500">{s.label}</span>
              </div>
              <span className={`text-2xl font-bold ${s.color}`}>
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="px-6 mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input
              type="text"
              placeholder="Tìm kiếm vai trò..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 placeholder-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-colors"
            />
          </div>
          <button
            onClick={() => fetchRoles(true)}
            disabled={refreshing}
            title="Làm mới"
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {/* Table */}
        <div className="px-6 pb-10">
          <div className="rounded-2xl border border-stone-800 overflow-hidden shadow-2xl">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                <p className="text-stone-500 text-sm">Đang tải dữ liệu...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="p-4 rounded-full bg-stone-900 border border-stone-800">
                  <Shield className="w-8 h-8 text-stone-600" />
                </div>
                <p className="text-stone-400 font-medium">
                  Không có vai trò nào
                </p>
                <p className="text-stone-600 text-sm">
                  {search
                    ? 'Thử tìm kiếm với từ khóa khác'
                    : 'Nhấn "Tạo vai trò" để bắt đầu'}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-900/80 border-b border-stone-800">
                    {[
                      'Mã',
                      'Tên vai trò',
                      'Mô tả',
                      'Hệ thống',
                      'Trạng thái',
                      'Thao tác',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {filtered.map((role) => (
                    <tr
                      key={role.id}
                      className="bg-stone-950 hover:bg-stone-900/50 transition-colors group"
                    >
                      {/* Mã */}
                      <td className="px-4 py-3.5">
                        <CodeBadge code={role.code} />
                      </td>

                      {/* Tên vai trò */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {role.isSystem && (
                            <Lock className="w-3.5 h-3.5 text-amber-500/60 shrink-0" />
                          )}
                          <span className="font-medium text-stone-200">
                            {role.name}
                          </span>
                        </div>
                      </td>

                      {/* Mô tả */}
                      <td className="px-4 py-3.5 max-w-xs">
                        {role.description ? (
                          <span className="text-stone-400 line-clamp-2">
                            {role.description}
                          </span>
                        ) : (
                          <span className="italic text-stone-600 text-xs">
                            Chưa có mô tả
                          </span>
                        )}
                      </td>

                      {/* Hệ thống */}
                      <td className="px-4 py-3.5">
                        {role.isSystem ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-medium">
                            <Lock className="w-3 h-3" /> Có
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-800 border border-stone-700 text-stone-500 text-xs">
                            Không
                          </span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-4 py-3.5">
                        {role.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-800 border border-stone-700 text-stone-500 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
                            Ngừng hoạt động
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {/* Phân quyền */}
                          <button
                            onClick={() =>
                              navigate(
                                `/admin/permissions?roleId=${role.id}`,
                              )
                            }
                            title="Phân quyền"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-amber-400 text-xs font-medium border border-stone-700/60 hover:border-amber-500/30 transition-all group/btn"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Quyền</span>
                            <ChevronRight className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                          </button>

                          {/* Chỉnh sửa */}
                          <button
                            onClick={() => {
                              setEditingRole(role);
                              setModalOpen(true);
                            }}
                            title="Chỉnh sửa"
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-blue-400 border border-stone-700/60 hover:border-blue-500/30 transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Xóa */}
                          <button
                            onClick={() =>
                              !role.isSystem && setDeleteTarget(role)
                            }
                            disabled={role.isSystem}
                            title={
                              role.isSystem
                                ? 'Không thể xóa vai trò hệ thống'
                                : 'Xóa vai trò'
                            }
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-red-400 border border-stone-700/60 hover:border-red-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-stone-800 disabled:hover:text-stone-400 disabled:hover:border-stone-700/60"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {!loading && filtered.length > 0 && (
            <p className="mt-3 text-xs text-stone-600 text-right">
              Hiển thị {filtered.length} / {total} vai trò
            </p>
          )}
        </div>

        {/* Modals */}
        <RoleModal
          open={modalOpen}
          editingRole={editingRole}
          onClose={() => setModalOpen(false)}
          onSaved={() => fetchRoles(true)}
          showToast={showToast}
        />

        <ConfirmModal
          open={!!deleteTarget}
          title="Xóa vai trò"
          message={`Bạn có chắc chắn muốn xóa vai trò "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      </div>
    </PermissionGuard>
  );
}
