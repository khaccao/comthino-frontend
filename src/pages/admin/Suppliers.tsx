import React, { useEffect, useMemo, useState } from 'react';
import { paymentApi } from '../../services/api';
import PermissionGuard from '../../components/PermissionGuard';
import { AlertTriangle, CalendarDays, CheckCircle, Clock3, CreditCard, Edit, Plus, Trash2, Truck, X } from 'lucide-react';

type DueStatus = 'NONE' | 'UPCOMING' | 'DUE_SOON' | 'DUE_TODAY' | 'OVERDUE';
type DebtStatus = 'PAID' | 'PENDING_PAYMENT' | 'UNPAID';

interface Supplier {
  id: string;
  name: string;
  phone?: string | null;
  taxCode?: string | null;
  address?: string | null;
  currentDebt: number;
  pendingPaymentAmount?: number;
  debtStatus?: DebtStatus;
  debtStatusLabel?: string;
  paymentTerm?: string | null;
  paymentTermDays?: number | null;
  paymentDueDate?: string | null;
  paymentWarningDays?: number;
  daysUntilDue?: number | null;
  dueStatus?: DueStatus;
  dueStatusLabel?: string;
  shouldAlert?: boolean;
  isActive: boolean;
}

const emptyForm = {
  name: '',
  phone: '',
  taxCode: '',
  address: '',
  currentDebt: '0',
  paymentTerm: '',
  paymentTermDays: '7',
  paymentDueDate: '',
  paymentWarningDays: '3',
  dueMode: 'days' as 'days' | 'date',
  isActive: true,
};

const todayKey = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const emptyPaymentForm = {
  paymentDate: todayKey(),
  amount: '',
  paymentMethodId: '',
  cashAccountId: '',
  expenseCategoryId: '',
  attachmentUrl: '',
  notes: '',
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(val || 0));

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const dueBadgeClass = (status?: DueStatus) => {
  if (status === 'OVERDUE') return 'bg-red-100 text-red-700 border-red-200';
  if (status === 'DUE_TODAY') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (status === 'DUE_SOON') return 'bg-orange-100 text-orange-700 border-orange-200';
  if (status === 'UPCOMING') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return 'bg-stone-100 text-stone-600 border-stone-200';
};

const debtBadgeClass = (status?: DebtStatus) => {
  if (status === 'PAID') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'PENDING_PAYMENT') return 'bg-blue-100 text-blue-800 border-blue-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [categories, setCategories] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  const MENU_CODE = 'SUPPLIER_CATEGORY';
  const PAYMENT_VOUCHER_MENU = 'PAYMENT_VOUCHER';

  const dueAlerts = useMemo(
    () => suppliers.filter(item => item.shouldAlert).sort((a, b) => Number(a.daysUntilDue ?? 9999) - Number(b.daysUntilDue ?? 9999)),
    [suppliers],
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, catData, metData, accData] = await Promise.all([
        paymentApi.getSuppliers(),
        paymentApi.getExpenseCategories(),
        paymentApi.getPaymentMethods(),
        paymentApi.getCashAccounts(),
      ]);
      setSuppliers(data);
      setCategories(catData.filter((item: any) => item.isActive));
      setMethods(metData.filter((item: any) => item.isActive));
      setAccounts(accData.filter((item: any) => item.isActive));
    } catch (err: any) {
      alert('Lỗi tải danh sách nhà cung cấp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (sup?: Supplier) => {
    if (sup) {
      setEditingSupplier(sup);
      setFormData({
        name: sup.name,
        phone: sup.phone || '',
        taxCode: sup.taxCode || '',
        address: sup.address || '',
        currentDebt: String(Number(sup.currentDebt || 0).toLocaleString('en-US')),
        paymentTerm: sup.paymentTerm || '',
        paymentTermDays: sup.paymentTermDays?.toString() || '7',
        paymentDueDate: sup.paymentDueDate || '',
        paymentWarningDays: String(sup.paymentWarningDays ?? 3),
        dueMode: sup.paymentDueDate && !sup.paymentTermDays ? 'date' : 'days',
        isActive: sup.isActive,
      });
    } else {
      setEditingSupplier(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const debt = Number(formData.currentDebt.replace(/[^0-9]/g, '')) || 0;
      const termDays = formData.dueMode === 'days' ? Number(formData.paymentTermDays || 0) : null;
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        taxCode: formData.taxCode.trim() || null,
        address: formData.address.trim() || null,
        currentDebt: debt,
        paymentTerm: formData.paymentTerm.trim() || (termDays !== null ? `${termDays} ngày` : null),
        paymentTermDays: termDays,
        paymentDueDate: formData.dueMode === 'date' ? formData.paymentDueDate : null,
        paymentWarningDays: Number(formData.paymentWarningDays || 3),
        isActive: formData.isActive,
      };

      if (formData.dueMode === 'date' && !formData.paymentDueDate) {
        alert('Vui lòng chọn ngày hạn thanh toán.');
        return;
      }

      if (editingSupplier) {
        await paymentApi.updateSupplier(editingSupplier.id, payload);
      } else {
        await paymentApi.createSupplier(payload);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi lưu nhà cung cấp');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Xóa nhà cung cấp này? Các dữ liệu liên quan sẽ không thể phục hồi.')) {
      try {
        await paymentApi.deleteSupplier(id);
        await loadData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Lỗi xóa nhà cung cấp');
      }
    }
  };

  const handleOpenPaymentModal = (supplier: Supplier) => {
    setPayingSupplier(supplier);
    setPaymentForm({
      ...emptyPaymentForm,
      paymentDate: todayKey(),
      amount: String(Number(supplier.currentDebt || 0).toLocaleString('en-US')),
      paymentMethodId: methods[0]?.id || '',
      cashAccountId: accounts[0]?.id || '',
      expenseCategoryId: categories[0]?.id || '',
      notes: `Thanh toán công nợ nhà cung cấp ${supplier.name}`,
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!payingSupplier) return;

    try {
      const amount = Number(paymentForm.amount.replace(/[^0-9]/g, '')) || 0;
      if (amount <= 0) {
        alert('Số tiền thanh toán phải lớn hơn 0.');
        return;
      }
      if (amount > Number(payingSupplier.currentDebt || 0)) {
        alert('Số tiền thanh toán không được vượt quá công nợ hiện tại.');
        return;
      }

      await paymentApi.createVoucher({
        paymentDate: paymentForm.paymentDate,
        supplierId: payingSupplier.id,
        receiverName: payingSupplier.name,
        reason: `Thanh toán công nợ nhà cung cấp ${payingSupplier.name}`,
        amount,
        paymentMethodId: paymentForm.paymentMethodId,
        cashAccountId: paymentForm.cashAccountId,
        expenseCategoryId: paymentForm.expenseCategoryId,
        attachmentUrl: paymentForm.attachmentUrl || null,
        notes: paymentForm.notes || null,
      });

      setIsPaymentModalOpen(false);
      setPayingSupplier(null);
      await loadData();
      alert('Đã tạo phiếu chi công nợ ở trạng thái Chưa ghi sổ. Cấp có quyền ghi sổ cần duyệt/ghi sổ để khoản chi vào báo cáo tháng.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi tạo phiếu chi công nợ');
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-700">Quản lý công nợ</p>
          <h1 className="font-serif text-3xl font-black text-stone-950">Nhà cung cấp</h1>
        </div>
        <PermissionGuard menuCode={MENU_CODE} permissionCode="CREATE">
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-amber-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Thêm NCC
          </button>
        </PermissionGuard>
      </div>

      {dueAlerts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-100 p-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-amber-950">Cảnh báo hạn thanh toán nhà cung cấp</h2>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {dueAlerts.slice(0, 4).map(item => (
                  <div key={item.id} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm">
                    <span className="font-bold text-stone-950">{item.name}</span>
                    <span className="mx-2 text-stone-400">•</span>
                    <span className="font-bold text-red-600">{formatCurrency(item.currentDebt)}</span>
                    <span className="mx-2 text-stone-400">•</span>
                    <span className="text-amber-800">{item.dueStatusLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-sm font-bold text-stone-600">
                <th className="p-4">Tên NCC</th>
                <th className="p-4">Liên hệ / MST</th>
                <th className="p-4">Hạn thanh toán</th>
                <th className="p-4 text-right">Công nợ hiện tại</th>
                <th className="p-4 text-right">Chờ ghi sổ</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-sm text-stone-700">
              {suppliers.map(sup => (
                <tr key={sup.id} className="hover:bg-stone-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-500">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-stone-950">{sup.name}</div>
                        <div className="text-xs text-stone-500">{sup.address || 'Chưa có địa chỉ'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>{sup.phone || '-'}</div>
                    <div className="text-xs text-stone-500">MST: {sup.taxCode || '-'}</div>
                  </td>
                  <td className="p-4">
                    {sup.paymentDueDate ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-semibold text-stone-900">
                          <CalendarDays className="h-4 w-4 text-stone-400" />
                          {formatDate(sup.paymentDueDate)}
                        </div>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${dueBadgeClass(sup.dueStatus)}`}>
                          {sup.dueStatusLabel}
                        </span>
                      </div>
                    ) : (
                      <span className="text-stone-400">-</span>
                    )}
                  </td>
                  <td className="p-4 text-right font-black text-red-600">
                    {formatCurrency(sup.currentDebt)}
                  </td>
                  <td className="p-4 text-right font-bold text-blue-700">
                    {Number(sup.pendingPaymentAmount || 0) > 0 ? formatCurrency(Number(sup.pendingPaymentAmount || 0)) : '-'}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${debtBadgeClass(sup.debtStatus)}`}>
                      {sup.debtStatus === 'PAID' && <CheckCircle className="mr-1 h-3 w-3" />}
                      {sup.debtStatusLabel || (sup.currentDebt > 0 ? 'Còn nợ' : 'Đã trả')}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      {sup.currentDebt > 0 && (
                        <PermissionGuard menuCode={PAYMENT_VOUCHER_MENU} permissionCode="CREATE">
                          <button onClick={() => handleOpenPaymentModal(sup)} className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50" title="Tạo phiếu chi công nợ">
                            <CreditCard className="h-4 w-4" />
                          </button>
                        </PermissionGuard>
                      )}
                      <PermissionGuard menuCode={MENU_CODE} permissionCode="EDIT">
                        <button onClick={() => handleOpenModal(sup)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50">
                          <Edit className="h-4 w-4" />
                        </button>
                      </PermissionGuard>
                      <PermissionGuard menuCode={MENU_CODE} permissionCode="DELETE">
                        <button onClick={() => handleDelete(sup.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </PermissionGuard>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <h2 className="text-xl font-black text-stone-950">{editingSupplier ? 'Sửa NCC' : 'Thêm NCC'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-2 hover:bg-stone-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <form id="supForm" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-bold text-stone-700">Tên nhà cung cấp *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-bold text-stone-700">Số điện thoại</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-bold text-stone-700">Mã số thuế</label>
                    <input type="text" value={formData.taxCode} onChange={e => setFormData({ ...formData, taxCode: e.target.value })} className="w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-stone-700">Địa chỉ</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 font-black text-stone-950">
                    <Clock3 className="h-4 w-4 text-amber-700" />
                    Hạn thanh toán
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, dueMode: 'days' })}
                      className={`rounded-xl border px-4 py-3 text-left font-bold ${formData.dueMode === 'days' ? 'border-amber-500 bg-white text-amber-700 shadow-sm' : 'border-stone-200 bg-white/70 text-stone-600'}`}
                    >
                      Theo số ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, dueMode: 'date' })}
                      className={`rounded-xl border px-4 py-3 text-left font-bold ${formData.dueMode === 'date' ? 'border-amber-500 bg-white text-amber-700 shadow-sm' : 'border-stone-200 bg-white/70 text-stone-600'}`}
                    >
                      Chọn ngày cụ thể
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {formData.dueMode === 'days' ? (
                      <div>
                        <label className="mb-1 block text-sm font-bold text-stone-700">Số ngày</label>
                        <input type="number" min={0} value={formData.paymentTermDays} onChange={e => setFormData({ ...formData, paymentTermDays: e.target.value })} className="w-full rounded-xl border border-stone-300 px-3 py-3 text-right outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
                      </div>
                    ) : (
                      <div>
                        <label className="mb-1 block text-sm font-bold text-stone-700">Ngày hạn</label>
                        <input type="date" min={todayKey()} value={formData.paymentDueDate} onChange={e => setFormData({ ...formData, paymentDueDate: e.target.value })} className="w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block text-sm font-bold text-stone-700">Nhắc trước</label>
                      <input type="number" min={0} max={365} value={formData.paymentWarningDays} onChange={e => setFormData({ ...formData, paymentWarningDays: e.target.value })} className="w-full rounded-xl border border-stone-300 px-3 py-3 text-right outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-bold text-stone-700">Ghi chú kỳ hạn</label>
                      <input type="text" placeholder="VD: 7 ngày, cuối tháng..." value={formData.paymentTerm} onChange={e => setFormData({ ...formData, paymentTerm: e.target.value })} className="w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-bold text-stone-700">Công nợ hiện tại</label>
                    <input
                      type="text"
                      value={formData.currentDebt}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, currentDebt: val ? Number(val).toLocaleString('en-US') : '0' });
                      }}
                      className="w-full rounded-xl border border-stone-300 px-3 py-3 text-right font-black text-red-600 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                  <label className="mt-7 flex items-center rounded-xl border border-stone-200 px-4 py-3">
                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4 rounded text-amber-600" />
                    <span className="ml-2 text-sm font-bold">Hoạt động</span>
                  </label>
                </div>
              </form>
            </div>
            <div className="flex justify-end gap-3 border-t bg-stone-50 px-6 py-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl bg-stone-200 px-4 py-2 font-bold text-stone-700">Hủy</button>
              <button type="submit" form="supForm" className="rounded-xl bg-amber-600 px-5 py-2 font-bold text-white hover:bg-amber-700">Lưu</button>
            </div>
          </div>
        </div>
      )}

      {isPaymentModalOpen && payingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-black text-stone-950">Thanh toán công nợ</h2>
                <p className="mt-1 text-sm text-stone-500">{payingSupplier.name} - còn nợ {formatCurrency(payingSupplier.currentDebt)}</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="rounded-lg p-2 hover:bg-stone-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                Phiếu chi sẽ được tạo ở trạng thái <strong>Chưa ghi sổ</strong>. Khoản chi chỉ vào báo cáo tháng và công nợ chỉ chuyển <strong>Đã trả</strong> sau khi người có quyền ghi sổ duyệt/ghi sổ phiếu chi.
              </div>

              <form id="supplierPaymentForm" onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-bold text-stone-700">Ngày chi *</label>
                    <input
                      type="date"
                      required
                      value={paymentForm.paymentDate}
                      onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-bold text-stone-700">Số tiền thanh toán *</label>
                    <input
                      type="text"
                      required
                      value={paymentForm.amount}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setPaymentForm({ ...paymentForm, amount: val ? Number(val).toLocaleString('en-US') : '' });
                      }}
                      className="w-full rounded-xl border border-stone-300 px-3 py-3 text-right font-black text-red-600 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-bold text-stone-700">Phương thức *</label>
                    <select
                      required
                      value={paymentForm.paymentMethodId}
                      onChange={e => setPaymentForm({ ...paymentForm, paymentMethodId: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    >
                      <option value="">-- Chọn --</option>
                      {methods.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-bold text-stone-700">Tài khoản chi *</label>
                    <select
                      required
                      value={paymentForm.cashAccountId}
                      onChange={e => setPaymentForm({ ...paymentForm, cashAccountId: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    >
                      <option value="">-- Chọn --</option>
                      {accounts.map(item => <option key={item.id} value={item.id}>{item.name} ({formatCurrency(item.currentBalance || item.balance)})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-bold text-stone-700">Khoản chi *</label>
                    <select
                      required
                      value={paymentForm.expenseCategoryId}
                      onChange={e => setPaymentForm({ ...paymentForm, expenseCategoryId: e.target.value })}
                      className="w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    >
                      <option value="">-- Chọn --</option>
                      {categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-stone-700">Link chứng từ</label>
                  <input
                    type="url"
                    value={paymentForm.attachmentUrl}
                    onChange={e => setPaymentForm({ ...paymentForm, attachmentUrl: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    placeholder="URL hóa đơn/chứng từ"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-stone-700">Ghi chú</label>
                  <input
                    type="text"
                    value={paymentForm.notes}
                    onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 px-3 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-3 border-t bg-stone-50 px-6 py-4">
              <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="rounded-xl bg-stone-200 px-4 py-2 font-bold text-stone-700">Hủy</button>
              <button type="submit" form="supplierPaymentForm" className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700">Tạo phiếu chi chờ ghi sổ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
