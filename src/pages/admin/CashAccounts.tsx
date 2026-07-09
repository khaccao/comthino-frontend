import React, { useEffect, useState } from 'react';
import { Banknote, RefreshCw, WalletCards } from 'lucide-react';
import { paymentApi } from '../../services/api';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

export default function CashAccounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await paymentApi.getCashAccounts();
      setAccounts(data);
    } catch (error) {
      alert('Không tải được danh sách tài khoản tiền.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalBalance = accounts.reduce((sum, item) => sum + Number(item.currentBalance || item.balance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Theo dõi quỹ</p>
          <h1 className="mt-2 text-3xl font-bold text-stone-950">Tài khoản tiền</h1>
          <p className="mt-1 text-sm text-stone-500">Số dư được cập nhật khi phiếu chi được ghi sổ.</p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
        >
          <RefreshCw className="h-4 w-4" />
          Tải lại
        </button>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
            <WalletCards className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Tổng số dư hiện tại</p>
            <p className="mt-1 text-3xl font-black text-stone-950">{formatCurrency(totalBalance)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-stone-200 bg-white p-10 text-center text-stone-500">Đang tải dữ liệu...</div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-stone-200 bg-white p-10 text-center text-stone-500">Chưa có tài khoản tiền.</div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <Banknote className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">{account.code}</span>
              </div>
              <h2 className="text-lg font-black text-stone-950">{account.name}</h2>
              <p className="mt-3 text-2xl font-black text-emerald-700">
                {formatCurrency(account.currentBalance || account.balance)}
              </p>
              <p className="mt-2 text-sm text-stone-500">{account.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
