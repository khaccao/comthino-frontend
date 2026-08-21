import { useEffect, useState } from 'react';
import { MapPin, Plus, RefreshCw, Save, Search, Store } from 'lucide-react';
import { branchApi } from '../../services/api';

type Branch = {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  openingTime?: string;
  closingTime?: string;
  status: string;
};

const emptyForm = {
  code: '',
  name: '',
  address: '',
  phone: '',
  email: '',
  managerName: '',
  openingTime: '08:00',
  closingTime: '21:00',
  status: 'ACTIVE',
  taxCode: '',
  invoiceName: '',
};

export default function Branches() {
  const [items, setItems] = useState<Branch[]>([]);
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await branchApi.getAll({ keyword: keyword || undefined });
      setItems(data || []);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không tải được chi nhánh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [keyword]);

  const startEdit = (item: Branch | null) => {
    setEditing(item);
    setForm(item ? {
      code: item.code || '',
      name: item.name || '',
      address: item.address || '',
      phone: item.phone || '',
      email: item.email || '',
      managerName: item.managerName || '',
      openingTime: item.openingTime || '08:00',
      closingTime: item.closingTime || '21:00',
      status: item.status || 'ACTIVE',
      taxCode: '',
      invoiceName: '',
    } : emptyForm);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    try {
      if (editing) await branchApi.update(editing.id, form);
      else await branchApi.create(form);
      setMessage('Đã lưu chi nhánh.');
      startEdit(null);
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không lưu được chi nhánh.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-stone-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Chuỗi cửa hàng</p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-stone-950">Quản lý chi nhánh</h1>
            <p className="mt-1 text-stone-600">Thiết lập từng điểm bán để tách POS, menu, kho, khách hàng và báo cáo theo chi nhánh.</p>
          </div>
          <button onClick={() => startEdit(null)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 py-3 text-sm font-bold text-white hover:bg-stone-800">
            <Plus className="h-4 w-4" /> Thêm chi nhánh
          </button>
        </div>
      </div>

      {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{message}</div>}

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="rounded-3xl bg-white shadow-sm border border-stone-200 overflow-hidden">
          <div className="border-b border-stone-100 p-4">
            <div className="flex gap-3">
              <label className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm mã, tên, địa chỉ, số điện thoại..." className="w-full rounded-xl border border-stone-200 py-3 pl-10 pr-3 outline-none focus:border-amber-500" />
              </label>
              <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 font-bold hover:bg-stone-50">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Tải lại
              </button>
            </div>
          </div>
          <div className="grid gap-4 p-4 lg:grid-cols-2">
            {items.map((item) => (
              <button key={item.id} onClick={() => startEdit(item)} className="rounded-2xl border border-stone-200 bg-white p-4 text-left transition hover:border-amber-300 hover:bg-amber-50/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-amber-100 p-3 text-amber-700"><Store className="h-5 w-5" /></div>
                    <div>
                      <p className="font-bold text-stone-950">{item.name}</p>
                      <p className="text-xs font-semibold text-stone-500">{item.code}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>{item.status}</span>
                </div>
                <p className="mt-4 flex items-start gap-2 text-sm text-stone-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {item.address || 'Chưa có địa chỉ'}</p>
                <p className="mt-2 text-sm text-stone-500">{item.phone || 'Chưa có SĐT'} · {item.openingTime || '--:--'} - {item.closingTime || '--:--'}</p>
              </button>
            ))}
            {!items.length && <div className="col-span-full rounded-2xl border border-dashed border-stone-200 p-12 text-center text-stone-500">Chưa có chi nhánh phù hợp.</div>}
          </div>
        </section>

        <form onSubmit={save} className="rounded-3xl bg-white p-5 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700"><Store className="h-5 w-5" /></div>
            <div>
              <p className="font-serif text-2xl font-bold text-stone-950">{editing ? 'Cập nhật chi nhánh' : 'Thêm chi nhánh'}</p>
              <p className="text-sm text-stone-500">Mã chi nhánh dùng để scope dữ liệu vận hành.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Mã chi nhánh" className="rounded-xl border border-stone-200 px-4 py-3 uppercase outline-none focus:border-amber-500" />
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-xl border border-stone-200 px-3 py-3 outline-none focus:border-amber-500">
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Tạm tắt</option>
              </select>
            </div>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tên chi nhánh" className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" />
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Địa chỉ" className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" />
            <div className="grid grid-cols-2 gap-3">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Số điện thoại" className="rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" />
              <input value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })} placeholder="Quản lý" className="rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="time" value={form.openingTime} onChange={(e) => setForm({ ...form, openingTime: e.target.value })} className="rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" />
              <input type="time" value={form.closingTime} onChange={(e) => setForm({ ...form, closingTime: e.target.value })} className="rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" />
            </div>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" />
          </div>
          <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 font-bold text-white hover:bg-amber-700">
            <Save className="h-4 w-4" /> Lưu chi nhánh
          </button>
        </form>
      </div>
    </div>
  );
}
