import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Heart, Plus, RefreshCw, Save, Search, Settings, UserRound } from 'lucide-react';
import { customerApi } from '../../services/api';

type Customer = {
  id: string;
  code: string;
  fullName: string;
  phone?: string;
  email?: string;
  gender?: string;
  status: string;
  currentPoints: number;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
  tier?: Tier | null;
  registeredBranch?: { id: string; name: string } | null;
};

type Tier = {
  id: string;
  code: string;
  name: string;
  minSpent: number;
  minPoints: number;
  discountPercent: number;
  description?: string;
  isActive?: boolean;
};

type Voucher = {
  id: string;
  code: string;
  name: string;
  discountType: 'AMOUNT' | 'PERCENT';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number | null;
  pointsCost?: number;
  scope: string;
  isActive?: boolean;
};

const emptyForm = {
  fullName: '',
  phone: '',
  email: '',
  birthday: '',
  gender: '',
  registeredBranchId: '',
  tierId: '',
  note: '',
  status: 'ACTIVE',
};

const emptyTierForm = {
  code: '',
  name: '',
  minSpent: 0,
  minPoints: 0,
  discountPercent: 0,
  description: '',
  isActive: true,
};

const emptyVoucherForm = {
  code: '',
  name: '',
  discountType: 'AMOUNT' as 'AMOUNT' | 'PERCENT',
  discountValue: 0,
  minOrderAmount: 0,
  maxDiscount: 0,
  pointsCost: 0,
  scope: 'ALL_BRANCHES',
  isActive: true,
};

const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

export default function Customers() {
  const [items, setItems] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [setting, setSetting] = useState({
    pointsPerAmount: 1000,
    pointsEarned: 1,
    minOrderAmount: 0,
    maxRedeemPercent: 30,
    pointValueAmount: 1000,
    pointExpiryDays: 0,
    isActive: true,
  });
  const [keyword, setKeyword] = useState('');
  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [tierEditingId, setTierEditingId] = useState<string | null>(null);
  const [tierForm, setTierForm] = useState(emptyTierForm);
  const [voucherEditingId, setVoucherEditingId] = useState<string | null>(null);
  const [voucherForm, setVoucherForm] = useState(emptyVoucherForm);
  const [message, setMessage] = useState('');

  const filteredParams = useMemo(() => ({ keyword: keyword || undefined, branchId: branchId || undefined, limit: 50 }), [keyword, branchId]);

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const boot = await customerApi.getBootstrap();
      setBranches(boot.branches || []);
      setTiers(boot.tiers || []);
      setVouchers(boot.vouchers || []);
      if (boot.setting) setSetting({
        pointsPerAmount: Number(boot.setting.pointsPerAmount || 1000),
        pointsEarned: Number(boot.setting.pointsEarned || 1),
        minOrderAmount: Number(boot.setting.minOrderAmount || 0),
        maxRedeemPercent: Number(boot.setting.maxRedeemPercent || 30),
        pointValueAmount: Number(boot.setting.pointValueAmount || 1000),
        pointExpiryDays: Number(boot.setting.pointExpiryDays || 0),
        isActive: boot.setting.isActive !== false,
      });
      const res = await customerApi.getAll(filteredParams);
      setItems(res.items || []);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không tải được khách hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filteredParams]);

  const startEdit = (item: Customer | null) => {
    setEditing(item);
    setForm(item ? {
      fullName: item.fullName || '',
      phone: item.phone || '',
      email: item.email || '',
      birthday: '',
      gender: item.gender || '',
      registeredBranchId: item.registeredBranch?.id || '',
      tierId: item.tier?.id || '',
      note: '',
      status: item.status || 'ACTIVE',
    } : emptyForm);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    try {
      if (editing) await customerApi.update(editing.id, form);
      else await customerApi.create(form);
      setMessage('Đã lưu khách hàng.');
      startEdit(null);
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không lưu được khách hàng.');
    }
  };

  const saveSetting = async () => {
    try {
      const saved = await customerApi.updateLoyaltySetting(setting);
      setSetting({ ...setting, ...saved });
      setMessage('Đã lưu cấu hình tích điểm.');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không lưu được cấu hình tích điểm.');
    }
  };

  const saveTier = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (tierEditingId) await customerApi.updateTier(tierEditingId, tierForm);
      else await customerApi.createTier(tierForm);
      setTierEditingId(null);
      setTierForm(emptyTierForm);
      setMessage('Đã lưu hạng thành viên.');
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không lưu được hạng thành viên.');
    }
  };

  const editTier = (tier: Tier) => {
    setTierEditingId(tier.id);
    setTierForm({
      code: tier.code || '',
      name: tier.name || '',
      minSpent: Number(tier.minSpent || 0),
      minPoints: Number(tier.minPoints || 0),
      discountPercent: Number(tier.discountPercent || 0),
      description: tier.description || '',
      isActive: tier.isActive !== false,
    });
  };

  const saveVoucher = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        ...voucherForm,
        maxDiscount: Number(voucherForm.maxDiscount || 0) > 0 ? Number(voucherForm.maxDiscount) : null,
      };
      if (voucherEditingId) await customerApi.updateVoucher(voucherEditingId, payload);
      else await customerApi.createVoucher(payload);
      setVoucherEditingId(null);
      setVoucherForm(emptyVoucherForm);
      setMessage('Đã lưu voucher.');
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error.message || 'Không lưu được voucher.');
    }
  };

  const editVoucher = (voucher: Voucher) => {
    setVoucherEditingId(voucher.id);
    setVoucherForm({
      code: voucher.code || '',
      name: voucher.name || '',
      discountType: voucher.discountType || 'AMOUNT',
      discountValue: Number(voucher.discountValue || 0),
      minOrderAmount: Number(voucher.minOrderAmount || 0),
      maxDiscount: Number(voucher.maxDiscount || 0),
      pointsCost: Number(voucher.pointsCost || 0),
      scope: voucher.scope || 'ALL_BRANCHES',
      isActive: voucher.isActive !== false,
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Khách hàng & loyalty</p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-stone-950">Quản lý khách hàng</h1>
            <p className="mt-1 text-stone-600">Tích điểm, hạng thành viên, voucher và ưu đãi cho POS.</p>
          </div>
          <button onClick={() => startEdit(null)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 py-3 text-sm font-bold text-white hover:bg-stone-800">
            <Plus className="h-4 w-4" /> Thêm khách
          </button>
        </div>
      </div>

      {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{message}</div>}

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_260px_auto]">
              <label className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm tên, mã, số điện thoại..." className="w-full rounded-xl border border-stone-200 py-3 pl-10 pr-3 outline-none focus:border-amber-500" />
              </label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="rounded-xl border border-stone-200 px-3 py-3 outline-none focus:border-amber-500">
                <option value="">Tất cả chi nhánh</option>
                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select>
              <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 font-bold hover:bg-stone-50">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Tải lại
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Hạng/điểm</th>
                  <th className="px-4 py-3">Chi nhánh</th>
                  <th className="px-4 py-3 text-right">Tổng chi</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/40">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700"><UserRound className="h-5 w-5" /></div>
                        <div>
                          <p className="font-bold text-stone-950">{item.fullName}</p>
                          <p className="text-xs text-stone-500">{item.code} · {item.phone || 'Chưa có SĐT'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold">{item.tier?.name || 'Thành viên'}</p>
                      <p className="text-xs text-emerald-700">{item.currentPoints || 0} điểm</p>
                    </td>
                    <td className="px-4 py-4 text-stone-600">{item.registeredBranch?.name || '-'}</td>
                    <td className="px-4 py-4 text-right font-bold">{money(item.totalSpent)}</td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => startEdit(item)} className="rounded-lg border border-stone-200 px-3 py-2 font-bold hover:bg-stone-50">Sửa</button>
                    </td>
                  </tr>
                ))}
                {!items.length && <tr><td colSpan={5} className="px-4 py-16 text-center text-stone-500">Chưa có khách hàng phù hợp bộ lọc.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <form onSubmit={save} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700"><Heart className="h-5 w-5" /></div>
            <div>
              <p className="font-serif text-2xl font-bold text-stone-950">{editing ? 'Cập nhật khách' : 'Thêm khách mới'}</p>
              <p className="text-sm text-stone-500">Dùng ở POS để tích điểm và áp voucher.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Tên khách hàng" className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Số điện thoại" className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.registeredBranchId} onChange={(e) => setForm({ ...form, registeredBranchId: e.target.value })} className="rounded-xl border border-stone-200 px-3 py-3 outline-none focus:border-amber-500">
                <option value="">Chi nhánh mặc định</option>
                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select>
              <select value={form.tierId} onChange={(e) => setForm({ ...form, tierId: e.target.value })} className="rounded-xl border border-stone-200 px-3 py-3 outline-none focus:border-amber-500">
                <option value="">Hạng tự động</option>
                {tiers.map((tier) => <option key={tier.id} value={tier.id}>{tier.name}</option>)}
              </select>
            </div>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Ghi chú khách hàng" className="min-h-24 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" />
          </div>
          <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 font-bold text-white hover:bg-amber-700">
            <Save className="h-4 w-4" /> Lưu khách hàng
          </button>
        </form>
      </div>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-stone-100 p-3 text-stone-700"><Settings className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Thiết lập loyalty</p>
            <h2 className="font-serif text-2xl font-bold text-stone-950">Điểm, hạng và voucher</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 p-4">
            <h3 className="font-bold text-stone-950">Quy tắc tích điểm</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <label className="text-xs font-bold uppercase text-stone-500">Số tiền
                <input type="number" min={1} value={setting.pointsPerAmount} onChange={(e) => setSetting({ ...setting, pointsPerAmount: Number(e.target.value || 0) })} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-base normal-case text-stone-950 outline-none focus:border-amber-500" />
              </label>
              <label className="text-xs font-bold uppercase text-stone-500">Điểm cộng
                <input type="number" min={1} value={setting.pointsEarned} onChange={(e) => setSetting({ ...setting, pointsEarned: Number(e.target.value || 0) })} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-base normal-case text-stone-950 outline-none focus:border-amber-500" />
              </label>
              <label className="text-xs font-bold uppercase text-stone-500">Giá trị 1 điểm
                <input type="number" min={0} value={setting.pointValueAmount} onChange={(e) => setSetting({ ...setting, pointValueAmount: Number(e.target.value || 0) })} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-base normal-case text-stone-950 outline-none focus:border-amber-500" />
              </label>
              <label className="text-xs font-bold uppercase text-stone-500">Đổi tối đa %
                <input type="number" min={0} max={100} value={setting.maxRedeemPercent} onChange={(e) => setSetting({ ...setting, maxRedeemPercent: Number(e.target.value || 0) })} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-base normal-case text-stone-950 outline-none focus:border-amber-500" />
              </label>
            </div>
            <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
              Hiện tại: {Number(setting.pointsPerAmount || 0).toLocaleString('vi-VN')}đ = {setting.pointsEarned} điểm.
            </p>
            <button type="button" onClick={saveSetting} className="mt-4 w-full rounded-xl bg-stone-950 px-4 py-3 text-sm font-bold text-white hover:bg-stone-800">Lưu cấu hình</button>
          </div>

          <form onSubmit={saveTier} className="rounded-2xl border border-stone-200 p-4">
            <h3 className="font-bold text-stone-950">{tierEditingId ? 'Sửa hạng' : 'Thêm hạng'}</h3>
            <div className="mt-4 grid gap-3">
              <input required value={tierForm.code} onChange={(e) => setTierForm({ ...tierForm, code: e.target.value })} placeholder="Mã hạng: GOLD" className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-amber-500" />
              <input required value={tierForm.name} onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })} placeholder="Tên hạng" className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-amber-500" />
              <div className="grid grid-cols-3 gap-2">
                <input type="number" min={0} value={tierForm.minPoints} onChange={(e) => setTierForm({ ...tierForm, minPoints: Number(e.target.value || 0) })} placeholder="Điểm" className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-amber-500" />
                <input type="number" min={0} value={tierForm.minSpent} onChange={(e) => setTierForm({ ...tierForm, minSpent: Number(e.target.value || 0) })} placeholder="Tổng chi" className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-amber-500" />
                <input type="number" min={0} max={100} value={tierForm.discountPercent} onChange={(e) => setTierForm({ ...tierForm, discountPercent: Number(e.target.value || 0) })} placeholder="% giảm" className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-amber-500" />
              </div>
              <textarea value={tierForm.description} onChange={(e) => setTierForm({ ...tierForm, description: e.target.value })} placeholder="Mô tả ưu đãi" className="min-h-20 rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-amber-500" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white hover:bg-amber-700">Lưu hạng</button>
              <button type="button" onClick={() => { setTierEditingId(null); setTierForm(emptyTierForm); }} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-bold">Làm mới</button>
            </div>
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
              {tiers.map((tier) => (
                <div key={tier.id} className="rounded-xl bg-stone-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black">{tier.name}</p>
                      <p className="text-xs text-stone-500">{tier.code} · {tier.minPoints} điểm · giảm {tier.discountPercent}%</p>
                    </div>
                    <button type="button" onClick={() => editTier(tier)} className="rounded-lg border border-stone-200 px-2 py-1 text-xs font-bold">Sửa</button>
                  </div>
                </div>
              ))}
            </div>
          </form>

          <form onSubmit={saveVoucher} className="rounded-2xl border border-stone-200 p-4">
            <h3 className="font-bold text-stone-950">{voucherEditingId ? 'Sửa voucher' : 'Thêm voucher'}</h3>
            <div className="mt-4 grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <input required value={voucherForm.code} onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value })} placeholder="Mã voucher" className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-amber-500" />
                <input required value={voucherForm.name} onChange={(e) => setVoucherForm({ ...voucherForm, name: e.target.value })} placeholder="Tên voucher" className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={voucherForm.discountType} onChange={(e) => setVoucherForm({ ...voucherForm, discountType: e.target.value as 'AMOUNT' | 'PERCENT' })} className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-amber-500">
                  <option value="AMOUNT">Giảm tiền</option>
                  <option value="PERCENT">Giảm %</option>
                </select>
                <input type="number" min={0} value={voucherForm.discountValue} onChange={(e) => setVoucherForm({ ...voucherForm, discountValue: Number(e.target.value || 0) })} placeholder="Giá trị giảm" className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" min={0} value={voucherForm.minOrderAmount} onChange={(e) => setVoucherForm({ ...voucherForm, minOrderAmount: Number(e.target.value || 0) })} placeholder="Đơn tối thiểu" className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-amber-500" />
                <input type="number" min={0} value={voucherForm.maxDiscount} onChange={(e) => setVoucherForm({ ...voucherForm, maxDiscount: Number(e.target.value || 0) })} placeholder="Giảm tối đa" className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-amber-500" />
                <input type="number" min={0} value={voucherForm.pointsCost} onChange={(e) => setVoucherForm({ ...voucherForm, pointsCost: Number(e.target.value || 0) })} placeholder="Điểm đổi" className="rounded-xl border border-stone-200 px-3 py-2 outline-none focus:border-amber-500" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white hover:bg-amber-700">Lưu voucher</button>
              <button type="button" onClick={() => { setVoucherEditingId(null); setVoucherForm(emptyVoucherForm); }} className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-bold">Làm mới</button>
            </div>
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
              {vouchers.map((voucher) => (
                <div key={voucher.id} className="rounded-xl bg-stone-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black">{voucher.code} · {voucher.name}</p>
                      <p className="text-xs text-stone-500">
                        {voucher.discountType === 'PERCENT' ? `${voucher.discountValue}%` : money(voucher.discountValue)}
                        {voucher.pointsCost ? ` · đổi ${voucher.pointsCost} điểm` : ''}
                      </p>
                    </div>
                    <button type="button" onClick={() => editVoucher(voucher)} className="rounded-lg border border-stone-200 px-2 py-1 text-xs font-bold">Sửa</button>
                  </div>
                </div>
              ))}
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
