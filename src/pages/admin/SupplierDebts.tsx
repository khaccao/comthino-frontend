import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Edit2, FileText, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { paymentApi } from '../../services/api';
import PermissionGuard from '../../components/PermissionGuard';

const MENU_CODE = 'SUPPLIER_DEBT';

const todayKey = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const monthStart = () => {
  const date = new Date();
  date.setDate(1);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const emptyForm = {
  supplierId: '',
  debtDate: todayKey(),
  dueDate: '',
  title: '',
  description: '',
  amount: '',
  attachmentUrl: '',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('vi-VN');
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

const inputClass = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm font-bold text-stone-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100';

export default function SupplierDebts() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [filters, setFilters] = useState({
    from: monthStart(),
    to: todayKey(),
    supplierId: '',
    status: 'ALL',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [supplierData, debtData, summaryData] = await Promise.all([
        paymentApi.getSuppliers(),
        paymentApi.getSupplierDebts(filters),
        paymentApi.getSupplierDebtSummary(),
      ]);
      setSuppliers(supplierData);
      setDebts(debtData);
      setSummary(summaryData);
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

  const openModal = (item?: any) => {
    if (item) {
      setEditingDebt(item);
      setFormData({
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
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const saveDebt = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount.replace(/[^0-9]/g, '')),
        dueDate: formData.dueDate || null,
        attachmentUrl: formData.attachmentUrl || null,
      };
      if (editingDebt) await paymentApi.updateSupplierDebt(editingDebt.id, payload);
      else await paymentApi.createSupplierDebt(payload);
      setIsModalOpen(false);
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi lưu phiếu công nợ.');
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
            <p className="mt-2 text-sm text-stone-500">Tạo khoản nợ theo từng hóa đơn/lần nhập hàng, theo dõi hạn trả và tổng hợp theo từng nhà cung cấp.</p>
          </div>
          <PermissionGuard menuCode={MENU_CODE} permissionCode="CREATE">
            <button onClick={() => openModal()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white hover:bg-amber-700">
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
          <button onClick={loadData} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-stone-700 hover:bg-white">
            <RefreshCw className="h-4 w-4" />
            Lọc
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="font-serif text-2xl font-black text-stone-950">Tổng hợp theo NCC</h2>
          <div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {summary.map(item => (
              <button
                key={item.supplier.id}
                onClick={() => {
                  setFilters(prev => ({ ...prev, supplierId: item.supplier.id, status: 'ALL' }));
                  setTimeout(loadData, 0);
                }}
                className="w-full rounded-2xl border border-stone-200 p-4 text-left hover:border-amber-300 hover:bg-amber-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-stone-950">{item.supplier.name}</h3>
                    <p className="mt-1 text-xs text-stone-500">{item.openDebtCount} phiếu còn nợ / {item.debtCount} phiếu</p>
                  </div>
                  <p className="font-black text-red-600">{formatCurrency(item.remainingDebt)}</p>
                </div>
                {item.nearestDueDate && (
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-bold text-amber-800">
                    <CalendarDays className="h-3 w-3" />
                    Gần nhất {formatDate(item.nearestDueDate)} · {item.nearestDueStatusLabel}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
                <tr>
                  <th className="p-4">Mã / Ngày</th>
                  <th>NCC</th>
                  <th>Nội dung nợ</th>
                  <th>Hạn trả</th>
                  <th className="text-right">Phát sinh</th>
                  <th className="text-right">Đã trả</th>
                  <th className="text-right">Còn nợ</th>
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
                      <div className="max-w-[220px] truncate font-semibold" title={item.title}>{item.title}</div>
                      <div className="max-w-[220px] truncate text-xs text-stone-500" title={item.description}>{item.description || '-'}</div>
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
                    <td className="text-center">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {item.attachmentUrl && <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-stone-500 hover:bg-stone-100" title="Chứng từ"><FileText className="h-4 w-4" /></a>}
                        {item.status !== 'PAID' && item.status !== 'CANCELLED' && (
                          <PermissionGuard menuCode={MENU_CODE} permissionCode="EDIT">
                            <button onClick={() => openModal(item)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" title="Sửa">
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
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <h2 className="text-xl font-black">{editingDebt ? 'Sửa phiếu công nợ' : 'Tạo phiếu công nợ'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-2 hover:bg-stone-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={saveDebt} className="space-y-4 p-6">
              <Field label="Nhà cung cấp *">
                <select required value={formData.supplierId} onChange={e => setFormData({ ...formData, supplierId: e.target.value })} className={inputClass}>
                  <option value="">Chọn NCC</option>
                  {suppliers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Ngày phát sinh *">
                  <input type="date" required value={formData.debtDate} onChange={e => setFormData({ ...formData, debtDate: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Hạn trả">
                  <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Số tiền *">
                  <input
                    required
                    value={formData.amount}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, amount: val ? Number(val).toLocaleString('en-US') : '' });
                    }}
                    className={`${inputClass} text-right font-black text-red-600`}
                  />
                </Field>
              </div>
              <Field label="Nội dung công nợ *">
                <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className={inputClass} placeholder="VD: Nhập thịt, rau ngày 30/7" />
              </Field>
              <Field label="Chi tiết">
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={`${inputClass} min-h-24`} />
              </Field>
              <Field label="Link chứng từ">
                <input type="url" value={formData.attachmentUrl} onChange={e => setFormData({ ...formData, attachmentUrl: e.target.value })} className={inputClass} />
              </Field>
              <div className="flex justify-end gap-3 border-t border-stone-100 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl bg-stone-200 px-4 py-2 font-bold text-stone-700">Hủy</button>
                <button type="submit" className="rounded-xl bg-amber-600 px-5 py-2 font-bold text-white hover:bg-amber-700">Lưu</button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-stone-500">{label}</span>
      {children}
    </label>
  );
}
