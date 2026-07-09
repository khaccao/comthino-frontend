import React, { useEffect, useState } from 'react';
import { BarChart3, RefreshCw, TrendingDown, WalletCards } from 'lucide-react';
import { paymentApi } from '../../services/api';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

export default function CashReports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      setData(await paymentApi.getDashboard());
    } catch (error) {
      alert('Không tải được báo cáo thu chi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const maxGroup = Math.max(...(data?.byCategoryGroup || []).map((item: any) => item.value || 0), 1);

  if (loading) {
    return <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center text-stone-500">Đang tải báo cáo...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Báo cáo tài chính</p>
          <h1 className="mt-2 text-3xl font-bold text-stone-950">Báo cáo thu chi</h1>
          <p className="mt-1 text-sm text-stone-500">Tổng hợp phiếu chi đã ghi sổ, công nợ và số dư tài khoản.</p>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <TrendingDown className="h-6 w-6 text-red-600" />
          <p className="mt-4 text-sm font-bold uppercase tracking-wide text-stone-400">Chi hôm nay</p>
          <p className="mt-2 text-3xl font-black text-stone-950">{formatCurrency(data?.todayTotal)}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <BarChart3 className="h-6 w-6 text-amber-700" />
          <p className="mt-4 text-sm font-bold uppercase tracking-wide text-stone-400">Chi tháng này</p>
          <p className="mt-2 text-3xl font-black text-stone-950">{formatCurrency(data?.monthTotal)}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <WalletCards className="h-6 w-6 text-emerald-700" />
          <p className="mt-4 text-sm font-bold uppercase tracking-wide text-stone-400">Công nợ NCC</p>
          <p className="mt-2 text-3xl font-black text-stone-950">{formatCurrency(data?.totalSupplierDebt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-stone-950">Chi theo nhóm trong tháng</h2>
          <div className="mt-5 space-y-4">
            {(data?.byCategoryGroup || []).length === 0 && (
              <div className="rounded-xl bg-stone-50 p-8 text-center text-stone-500">Chưa có dữ liệu chi trong tháng.</div>
            )}
            {(data?.byCategoryGroup || []).map((item: any) => (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-bold text-stone-700">{item.name}</span>
                  <span className="font-black text-stone-950">{formatCurrency(item.value)}</span>
                </div>
                <div className="h-3 rounded-full bg-stone-100">
                  <div className="h-3 rounded-full bg-amber-600" style={{ width: `${Math.max(4, (item.value / maxGroup) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-stone-950">Số dư tài khoản</h2>
          <div className="mt-5 space-y-3">
            {(data?.cashAccounts || []).map((account: any) => (
              <div key={account.id || account.code} className="flex items-center justify-between rounded-xl border border-stone-100 p-4">
                <div>
                  <div className="font-bold text-stone-950">{account.name}</div>
                  <div className="text-xs font-semibold text-stone-400">{account.code}</div>
                </div>
                <div className="text-right font-black text-emerald-700">{formatCurrency(account.balance)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
