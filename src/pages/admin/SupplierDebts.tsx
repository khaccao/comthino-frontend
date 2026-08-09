import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, CreditCard, Edit2, FileText, Plus, RefreshCw, Trash2, WalletCards, X } from 'lucide-react';
import { paymentApi } from '../../services/api';
import PermissionGuard from '../../components/PermissionGuard';

const MENU_CODE = 'SUPPLIER_DEBT';

const todayKey = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const monthStart = () => {
  const date = new Date();
  date.setDate(1);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const emptyDebtForm = {
  supplierId: '',
  debtDate: todayKey(),
  dueDate: '',
  title: '',
  description: '',
  amount: '',
  attachmentUrl: '',
};

const emptyPaymentForm = {
  supplierId: '',
  supplierDebtId: '',
  paymentDate: todayKey(),
  amount: '',
  paymentMethodId: '',
  cashAccountId: '',
  expenseCategoryId: '',
  recipientName: '',
  reason: '',
  notes: '',
  attachmentUrl: '',
  postNow: true,
};

const inputClass = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm font-bold text-stone-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100';

const defaultFilters = () => ({
  from: monthStart(),
  to: todayKey(),
  supplierId: '',
  status: 'ALL',
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('vi-VN');
};

const parseMoney = (value: string) => Number(String(value || '').replace(/[^0-9]/g, ''));
const moneyInput = (value: string) => {
  const clean = String(value || '').replace(/[^0-9]/g, '');
  return clean ? Number(clean).toLocaleString('en-US') : '';
};

const statusLabel = (status: string) => {
  if (status === 'PAID') return 'Đã trả';
  if (status === 'PARTIAL') return 'Trả một phần';
  if (status === 'CANCELLED') return 'Đã hủy';
  return 'Còn nợ';
};

const statusClass = (status: string) => {
  if (status === 'PAID') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'PARTIAL') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (status === 'CANCELLED') return 'bg-stone-100 text-stone-500 border-stone-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

const dueClass = (status?: string) => {
  if (status === 'OVERDUE') return 'bg-red-100 text-red-700 border-red-200';
  if (status === 'DUE_TODAY') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (status === 'DUE_SOON') return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-stone-100 text-stone-600 border-stone-200';
};

export default function SupplierDebts() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [cashAccounts, setCashAccounts] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<any | null>(null);
  const [paymentMode, setPaymentMode] = useState<'debt' | 'supplier'>('debt');
  const [debtForm, setDebtForm] = useState(emptyDebtForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [filters, setFilters] = useState(defaultFilters());
  const [savingPayment, setSavingPayment] = useState(false);

  const loadData = async (nextFilters = filters) => {
    try {
      setLoading(true);
      const [supplierData, debtData, summaryData, methodData, accountData, categoryData] = await Promise.all([
        paymentApi.getSuppliers(),
        paymentApi.getSupplierDebts(nextFilters),
        paymentApi.getSupplierDebtSummary(nextFilters),
        paymentApi.getPaymentMethods(),
        paymentApi.getCashAccounts(),
        paymentApi.getExpenseCategories(),
      ]);
      setSuppliers(supplierData);
      setDebts(debtData);
      setSummary(summaryData);
      setPaymentMethods(methodData);
      setCashAccounts(accountData);
      setExpenseCategories(categoryData);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi tải công nợ nhà cung cấp.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totals = useMemo(() => ({
    amount: debts.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    paid: debts.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0),
    remaining: debts.reduce((sum, item) => sum + Number(item.remainingAmount || 0), 0),
    due: debts.filter((item) => ['OVERDUE', 'DUE_TODAY', 'DUE_SOON'].includes(item.dueStatus)).length,
  }), [debts]);

  const summaryTotals = useMemo(() => ({
    amount: summary.reduce((sum, item) => sum + Number(item.totalDebt || 0), 0),
    paid: summary.reduce((sum, item) => sum + Number(item.totalPaid || 0), 0),
    remaining: summary.reduce((sum, item) => sum + Number(item.remainingDebt || 0), 0),
    suppliers: summary.length,
  }), [summary]);

  const resetFilters = () => {
    const nextFilters = defaultFilters();
    setFilters(nextFilters);
    loadData(nextFilters);
  };

  const openDebtModal = (item?: any) => {
    if (item) {
      setEditingDebt(item);
      setDebtForm({
        supplierId: item.supplierId,
        debtDate: item.debtDate || todayKey(),
        dueDate: item.dueDate || '',
        title: item.title || '',
        description: item.description || '',
        amount: Number(item.amount || 0).toLocaleString('en-US'),
        attachmentUrl: item.attachmentUrl || '',
      });
    } else {
      setEditingDebt(null);
      setDebtForm(emptyDebtForm);
    }
    setIsDebtModalOpen(true);
  };

  const openPaymentModal = (mode: 'debt' | 'supplier', item: any) => {
    const supplier = mode === 'debt' ? item.supplier : item.supplier;
    const amount = mode === 'debt' ? Number(item.remainingAmount || 0) : Number(item.remainingDebt || 0);
    const supplierId = mode === 'debt' ? item.supplierId : item.supplier.id;
    const firstMethod = paymentMethods[0]?.id || '';
    const firstAccount = cashAccounts[0]?.id || '';
    const firstCategory = expenseCategories[0]?.id || '';

    setPaymentMode(mode);
    setPaymentTarget(item);
    setPaymentForm({
      ...emptyPaymentForm,
      supplierId,
      supplierDebtId: mode === 'debt' ? item.id : '',
      amount: amount ? Number(amount).toLocaleString('en-US') : '',
      paymentMethodId: firstMethod,
      cashAccountId: firstAccount,
      expenseCategoryId: firstCategory,
      recipientName: supplier?.name || '',
      reason: mode === 'debt'
        ? `Thanh toán công nợ ${item.code} - ${item.title}`
        : `Thanh toán công nợ nhà cung cấp ${supplier?.name || ''}`,
      postNow: true,
    });
    setIsPaymentModalOpen(true);
  };

  const saveDebt = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        ...debtForm,
        amount: parseMoney(debtForm.amount),
        dueDate: debtForm.dueDate || null,
        attachmentUrl: debtForm.attachmentUrl || null,
      };
      if (editingDebt) await paymentApi.updateSupplierDebt(editingDebt.id, payload);
      else await paymentApi.createSupplierDebt(payload);
      setIsDebtModalOpen(false);
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi lưu phiếu công nợ.');
    }
  };

  const savePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = parseMoney(paymentForm.amount);
    if (amount <= 0) {
      alert('Số tiền thanh toán phải lớn hơn 0.');
      return;
    }

    try {
      setSavingPayment(true);
      await paymentApi.paySupplierDebt({
        ...paymentForm,
        supplierDebtId: paymentForm.supplierDebtId || null,
        amount,
        notes: paymentForm.notes || null,
        attachmentUrl: paymentForm.attachmentUrl || null,
      });
      setIsPaymentModalOpen(false);
      setPaymentTarget(null);
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi thanh toán công nợ.');
    } finally {
      setSavingPayment(false);
    }
  };

  const deleteDebt = async (id: string) => {
    if (!confirm('Hủy phiếu công nợ này?')) return;
    try {
      await paymentApi.deleteSupplierDebt(id);
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi hủy phiếu công nợ.');
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Công nợ nhà cung cấp</p>
            <h1 className="font-serif text-3xl font-black text-stone-950">Phiếu công nợ NCC</h1>
            <p className="mt-2 text-sm text-stone-500">Tạo khoản nợ theo từng hóa đơn/lần nhập hàng, theo dõi hạn trả và ghi phiếu chi trực tiếp khi đã thanh toán.</p>
          </div>
          <PermissionGuard menuCode={MENU_CODE} permissionCode="CREATE">
            <button onClick={() => openDebtModal()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white hover:bg-amber-700">
              <Plus className="h-4 w-4" />
              Tạo phiếu công nợ
            </button>
          </PermissionGuard>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Tổng phát sinh" value={formatCurrency(totals.amount)} helper={`${debts.length} phiếu trong bộ lọc`} />
        <Metric label="Đã trả" value={formatCurrency(totals.paid)} helper="Theo phiếu chi đã ghi sổ" />
        <Metric label="Còn phải trả" value={formatCurrency(totals.remaining)} helper="Công nợ mở" />
        <Metric label="Cần chú ý" value={String(totals.due)} helper="Gần hạn, đến hạn hoặc quá hạn" />
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[160px_160px_1fr_180px_auto] lg:items-end">
          <Field label="Từ ngày">
            <input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Đến ngày">
            <input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Nhà cung cấp">
            <select value={filters.supplierId} onChange={e => setFilters({ ...filters, supplierId: e.target.value })} className={inputClass}>
              <option value="">Tất cả NCC</option>
              {suppliers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </Field>
          <Field label="Trạng thái">
            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className={inputClass}>
              <option value="ALL">Tất cả</option>
              <option value="UNPAID">Còn nợ</option>
              <option value="PARTIAL">Trả một phần</option>
              <option value="PAID">Đã trả</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </Field>
          <div className="flex gap-2">
            <button onClick={() => loadData()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-stone-700 hover:bg-white">
              <RefreshCw className="h-4 w-4" />
              Lọc
            </button>
            <button onClick={resetFilters} className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-bold text-stone-500 hover:bg-stone-50" title="Xóa lọc">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[430px_1fr]">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="font-serif text-2xl font-black text-stone-950">Tổng hợp theo NCC</h2>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-stone-400">
            {summaryTotals.suppliers} NCC · còn nợ {formatCurrency(summaryTotals.remaining)}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-stone-50 p-3 text-xs">
            <SummaryNumber label="Phát sinh" value={formatCurrency(summaryTotals.amount)} />
            <SummaryNumber label="Đã trả" value={formatCurrency(summaryTotals.paid)} tone="emerald" />
            <SummaryNumber label="Còn nợ" value={formatCurrency(summaryTotals.remaining)} tone="red" />
          </div>
          <div className="mt-4 max-h-[620px] space-y-3 overflow-y-auto pr-1">
            {summary.map(item => (
              <div key={item.supplier.id} className="rounded-2xl border border-stone-200 p-4 hover:border-amber-300 hover:bg-amber-50">
                <button
                  onClick={() => {
                    const nextFilters = { ...filters, supplierId: item.supplier.id, status: 'ALL' };
                    setFilters(nextFilters);
                    loadData(nextFilters);
                  }}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-stone-950">{item.supplier.name}</h3>
                      <p className="mt-1 text-xs text-stone-500">{item.openDebtCount} phiếu còn nợ / {item.debtCount} phiếu</p>
                    </div>
                    <p className="font-black text-red-600">{formatCurrency(item.remainingDebt)}</p>
                  </div>
                </button>
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-white/70 p-2 text-xs font-bold text-stone-500">
                  <span>PS: {formatCurrency(item.totalDebt)}</span>
                  <span>Trả: {formatCurrency(item.totalPaid)}</span>
                  <span>Còn: {formatCurrency(item.remainingDebt)}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {item.nearestDueDate && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-bold text-amber-800">
                      <CalendarDays className="h-3 w-3" />
                      Gần nhất {formatDate(item.nearestDueDate)} · {item.nearestDueStatusLabel}
                    </span>
                  )}
                  {Number(item.remainingDebt || 0) > 0 && (
                    <PermissionGuard menuCode={MENU_CODE} permissionCode="EDIT">
                      <button onClick={() => openPaymentModal('supplier', item)} className="inline-flex items-center gap-1 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-black text-white hover:bg-amber-700">
                        <WalletCards className="h-3.5 w-3.5" />
                        Thanh toán NCC
                      </button>
                    </PermissionGuard>
                  )}
                </div>
              </div>
            ))}
            {!summary.length && (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center text-sm font-bold text-stone-500">
                Không có công nợ NCC trong bộ lọc hiện tại.
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
                <tr>
                  <th className="p-4">Mã / Ngày</th>
                  <th>NCC</th>
                  <th>Nội dung nợ</th>
                  <th>Hạn trả</th>
                  <th className="text-right">Phát sinh</th>
                  <th className="text-right">Đã trả</th>
                  <th className="text-right">Còn nợ</th>
                  <th>Phiếu chi</th>
                  <th className="text-center">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {debts.map(item => (
                  <tr key={item.id} className="hover:bg-stone-50">
                    <td className="p-4">
                      <b className="text-amber-700">{item.code}</b>
                      <div className="text-xs text-stone-500">{formatDate(item.debtDate)}</div>
                    </td>
                    <td className="font-bold">{item.supplier?.name}</td>
                    <td>
                      <div className="max-w-[240px] truncate font-semibold" title={item.title}>{item.title}</div>
                      <div className="max-w-[240px] truncate text-xs text-stone-500" title={item.description}>{item.description || '-'}</div>
                    </td>
                    <td>
                      <div>{formatDate(item.dueDate)}</div>
                      {item.dueStatus !== 'NONE' && (
                        <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${dueClass(item.dueStatus)}`}>
                          {item.dueStatusLabel}
                        </span>
                      )}
                    </td>
                    <td className="text-right font-bold">{formatCurrency(item.amount)}</td>
                    <td className="text-right font-bold text-emerald-700">{formatCurrency(item.paidAmount)}</td>
                    <td className="text-right font-black text-red-600">{formatCurrency(item.remainingAmount)}</td>
                    <td className="max-w-[170px]">
                      {(item.paymentVouchers || []).length ? (
                        <div className="space-y-1">
                          {item.paymentVouchers.slice(0, 2).map((voucher: any) => (
                            <div key={voucher.id} className="text-xs font-bold text-stone-600">
                              {voucher.code} · {formatCurrency(voucher.amount)}
                            </div>
                          ))}
                          {item.paymentVouchers.length > 2 && <div className="text-xs text-stone-400">+{item.paymentVouchers.length - 2} phiếu khác</div>}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="text-center">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {Number(item.remainingAmount || 0) > 0 && item.status !== 'CANCELLED' && (
                          <PermissionGuard menuCode={MENU_CODE} permissionCode="EDIT">
                            <button onClick={() => openPaymentModal('debt', item)} className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50" title="Thanh toán phiếu này">
                              <CreditCard className="h-4 w-4" />
                            </button>
                          </PermissionGuard>
                        )}
                        {item.attachmentUrl && <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-stone-500 hover:bg-stone-100" title="Chứng từ"><FileText className="h-4 w-4" /></a>}
                        {item.status !== 'PAID' && item.status !== 'CANCELLED' && (
                          <PermissionGuard menuCode={MENU_CODE} permissionCode="EDIT">
                            <button onClick={() => openDebtModal(item)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" title="Sửa">
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </PermissionGuard>
                        )}
                        {Number(item.paidAmount || 0) <= 0 && item.status !== 'CANCELLED' && (
                          <PermissionGuard menuCode={MENU_CODE} permissionCode="DELETE">
                            <button onClick={() => deleteDebt(item.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Hủy">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </PermissionGuard>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!debts.length && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-sm font-bold text-stone-500">
                      Không có phiếu công nợ nào trong bộ lọc hiện tại.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {isDebtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <h2 className="text-xl font-black">{editingDebt ? 'Sửa phiếu công nợ' : 'Tạo phiếu công nợ'}</h2>
              <button onClick={() => setIsDebtModalOpen(false)} className="rounded-lg p-2 hover:bg-stone-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={saveDebt} className="space-y-4 p-6">
              <Field label="Nhà cung cấp *">
                <select required value={debtForm.supplierId} onChange={e => setDebtForm({ ...debtForm, supplierId: e.target.value })} className={inputClass}>
                  <option value="">Chọn NCC</option>
                  {suppliers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Ngày phát sinh *">
                  <input type="date" required value={debtForm.debtDate} onChange={e => setDebtForm({ ...debtForm, debtDate: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Hạn trả">
                  <input type="date" value={debtForm.dueDate} onChange={e => setDebtForm({ ...debtForm, dueDate: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Số tiền *">
                  <input required value={debtForm.amount} onChange={e => setDebtForm({ ...debtForm, amount: moneyInput(e.target.value) })} className={`${inputClass} text-right font-black text-red-600`} />
                </Field>
              </div>
              <Field label="Nội dung công nợ *">
                <input required value={debtForm.title} onChange={e => setDebtForm({ ...debtForm, title: e.target.value })} className={inputClass} placeholder="VD: Nhập thịt, rau ngày 30/7" />
              </Field>
              <Field label="Chi tiết">
                <textarea value={debtForm.description} onChange={e => setDebtForm({ ...debtForm, description: e.target.value })} className={`${inputClass} min-h-24`} />
              </Field>
              <Field label="Link chứng từ">
                <input type="url" value={debtForm.attachmentUrl} onChange={e => setDebtForm({ ...debtForm, attachmentUrl: e.target.value })} className={inputClass} />
              </Field>
              <div className="flex justify-end gap-3 border-t border-stone-100 pt-4">
                <button type="button" onClick={() => setIsDebtModalOpen(false)} className="rounded-xl bg-stone-200 px-4 py-2 font-bold text-stone-700">Hủy</button>
                <button type="submit" className="rounded-xl bg-amber-600 px-5 py-2 font-bold text-white hover:bg-amber-700">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-stone-200 px-6 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Phiếu chi công nợ</p>
                <h2 className="text-xl font-black">{paymentMode === 'debt' ? 'Thanh toán phiếu lẻ' : 'Thanh toán gộp nhà cung cấp'}</h2>
                <p className="mt-1 text-sm font-semibold text-stone-500">
                  {paymentMode === 'debt'
                    ? `${paymentTarget?.code || ''} · còn nợ ${formatCurrency(paymentTarget?.remainingAmount || 0)}`
                    : `${paymentTarget?.supplier?.name || ''} · còn nợ ${formatCurrency(paymentTarget?.remainingDebt || 0)}`}
                </p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="rounded-lg p-2 hover:bg-stone-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={savePayment} className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Ngày chi *">
                  <input type="date" required value={paymentForm.paymentDate} onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Số tiền *">
                  <input required value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: moneyInput(e.target.value) })} className={`${inputClass} text-right text-red-600`} />
                </Field>
                <Field label="Người nhận">
                  <input value={paymentForm.recipientName} onChange={e => setPaymentForm({ ...paymentForm, recipientName: e.target.value })} className={inputClass} />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Phương thức chi *">
                  <select required value={paymentForm.paymentMethodId} onChange={e => setPaymentForm({ ...paymentForm, paymentMethodId: e.target.value })} className={inputClass}>
                    <option value="">Chọn phương thức</option>
                    {paymentMethods.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </Field>
                <Field label="Tài khoản/quỹ *">
                  <select required value={paymentForm.cashAccountId} onChange={e => setPaymentForm({ ...paymentForm, cashAccountId: e.target.value })} className={inputClass}>
                    <option value="">Chọn quỹ</option>
                    {cashAccounts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </Field>
                <Field label="Danh mục chi *">
                  <select required value={paymentForm.expenseCategoryId} onChange={e => setPaymentForm({ ...paymentForm, expenseCategoryId: e.target.value })} className={inputClass}>
                    <option value="">Chọn danh mục</option>
                    {expenseCategories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Lý do chi">
                <input value={paymentForm.reason} onChange={e => setPaymentForm({ ...paymentForm, reason: e.target.value })} className={inputClass} />
              </Field>
              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <Field label="Ghi chú">
                  <textarea value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} className={`${inputClass} min-h-24`} placeholder="VD: trả trước một phần, chuyển khoản lần 1..." />
                </Field>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <input type="checkbox" checked={paymentForm.postNow} onChange={e => setPaymentForm({ ...paymentForm, postNow: e.target.checked })} className="h-5 w-5 accent-emerald-600" />
                  <span>
                    <span className="block text-sm font-black text-emerald-900">Ghi sổ ngay</span>
                    <span className="mt-1 block text-xs font-semibold text-emerald-700">Trừ quỹ, tăng tiền chi và giảm công nợ ngay khi lưu.</span>
                  </span>
                </label>
              </div>
              <Field label="Link chứng từ">
                <input type="url" value={paymentForm.attachmentUrl} onChange={e => setPaymentForm({ ...paymentForm, attachmentUrl: e.target.value })} className={inputClass} />
              </Field>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm font-semibold text-stone-600">
                {paymentMode === 'supplier'
                  ? 'Thanh toán gộp sẽ tự phân bổ tiền vào các phiếu còn nợ theo hạn trả gần nhất.'
                  : 'Có thể nhập số tiền nhỏ hơn số còn nợ để trả trước một phần cho phiếu này.'}
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="rounded-xl bg-stone-200 px-4 py-3 font-bold text-stone-700">Hủy</button>
                <button disabled={savingPayment} type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
                  <CheckCircle2 className="h-4 w-4" />
                  {savingPayment ? 'Đang lưu...' : paymentForm.postNow ? 'Lưu và ghi sổ' : 'Tạo phiếu chi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-stone-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-stone-950">{value}</p>
      <p className="mt-2 text-sm font-semibold text-stone-500">{helper}</p>
    </div>
  );
}

function SummaryNumber({ label, value, tone = 'stone' }: { label: string; value: string; tone?: 'stone' | 'emerald' | 'red' }) {
  const color = tone === 'emerald' ? 'text-emerald-700' : tone === 'red' ? 'text-red-600' : 'text-stone-950';
  return (
    <div>
      <p className="font-black uppercase text-stone-400">{label}</p>
      <p className={`mt-1 font-black ${color}`}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-stone-500">{label}</span>
      {children}
    </label>
  );
}
