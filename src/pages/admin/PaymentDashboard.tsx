import React, { useEffect, useState } from 'react';
import { paymentApi } from '../../services/api';
import { CreditCard, ArrowDownCircle, Banknote, Building2, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PaymentDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await paymentApi.getDashboard();
        setData(res);
      } catch (err: any) {
        setError('Lỗi tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Tổng quan Chi tiền</h1>
        <p className="text-sm text-stone-500 mt-1">Theo dõi dòng tiền chi ra và công nợ nhà cung cấp</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-stone-500 text-sm font-medium">Tổng chi hôm nay</h3>
          <p className="text-2xl font-bold text-stone-900 mt-1">{formatCurrency(data?.totalPaidToday)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-stone-500 text-sm font-medium">Tổng chi tháng này</h3>
          <p className="text-2xl font-bold text-stone-900 mt-1">{formatCurrency(data?.totalPaidThisMonth)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-stone-500 text-sm font-medium">Tổng công nợ NCC</h3>
          <p className="text-2xl font-bold text-stone-900 mt-1">{formatCurrency(data?.totalDebt)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-stone-500 text-sm font-medium">Đề nghị chờ duyệt</h3>
          <p className="text-2xl font-bold text-stone-900 mt-1">{data?.pendingRequestsCount || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <h2 className="text-lg font-bold text-stone-800 mb-4">Số dư tài khoản</h2>
          <div className="space-y-4">
            {data?.accountsBalance?.map((acc: any) => (
              <div key={acc.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg border border-stone-100">
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-stone-400" />
                  <div>
                    <div className="font-medium text-stone-900">{acc.name}</div>
                    <div className="text-xs text-stone-500">{acc.type}</div>
                  </div>
                </div>
                <div className="font-bold text-stone-900">{formatCurrency(acc.currentBalance)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <h2 className="text-lg font-bold text-stone-800 mb-4">Chi theo nhóm (Tháng này)</h2>
          <div className="space-y-4">
            {data?.expenseByGroup?.map((group: any) => {
              const max = Math.max(...(data.expenseByGroup.map((g: any) => g._sum.amount || 0) || [1]));
              const val = group._sum.amount || 0;
              const pct = max > 0 ? (val / max) * 100 : 0;
              return (
                <div key={group.categoryId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-stone-700">{group.category?.name || 'Khác'}</span>
                    <span className="font-bold text-stone-900">{formatCurrency(val)}</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
            {(!data?.expenseByGroup || data.expenseByGroup.length === 0) && (
              <div className="text-center text-stone-500 py-4">Chưa có dữ liệu chi trong tháng</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}