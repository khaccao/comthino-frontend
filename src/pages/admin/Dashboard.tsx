import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Clock,
  CreditCard,
  DollarSign,
  Mail,
  ReceiptText,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import { adminApi } from '../../services/api';

interface DashboardStats {
  totalItems: number;
  totalCategories: number;
  activePromotions: number;
  newMessages: number;
  visibleItems: number;
  hiddenItems: number;
  recentLogs: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string;
    createdAt: string;
  }>;
  business?: {
    date: string;
    revenueToday: number;
    revenueMonth: number;
    expenseToday: number;
    expenseMonth: number;
    profitToday: number;
    profitMonth: number;
    profitMarginToday: number;
    paidOrdersToday: number;
    openOrdersToday: number;
    averageBillToday: number;
    discountToday: number;
    pendingRequestsCount: number;
    approvedRequestsCount: number;
    unpostedVouchersCount: number;
    supplierDebt: number;
    posError?: string | null;
    recentOrders: Array<{ orderNo: string; status: string; totalAmount: number; paidAt?: string; createdAt?: string }>;
    recentRequests: Array<{ id: string; code: string; amount: number; status: string; reason: string; createdAt: string; category?: { name: string } }>;
    recentVouchers: Array<{ id: string; code: string; amount: number; status: string; reason: string; createdAt: string; category?: { name: string } }>;
    daily: Array<{ date: string; revenue: number; expense: number; profit: number; orders: number }>;
  };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
};

const statusText = (status: string) => {
  if (status === 'PAID') return 'Đã thanh toán';
  if (status === 'POSTED') return 'Đã ghi sổ';
  if (status === 'UNPOSTED') return 'Chưa ghi sổ';
  if (status === 'APPROVED') return 'Đã duyệt';
  if (status === 'PENDING') return 'Chờ duyệt';
  if (status === 'REJECTED') return 'Từ chối';
  return status || '-';
};

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
  to,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ElementType;
  tone: string;
  to?: string;
}) {
  const content = (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-5 flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        {to && <ArrowRight className="h-4 w-4 text-stone-300" />}
      </div>
      <p className="text-xs font-bold uppercase tracking-wide text-stone-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-stone-950">{value}</p>
      <p className="mt-2 text-sm font-medium text-stone-500">{helper}</p>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getDashboard();
      if (res.success) setStats(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tải được dashboard tổng thể.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const business = stats?.business;
  const maxDaily = useMemo(() => {
    const values = business?.daily?.flatMap((item) => [item.revenue, item.expense]) || [1];
    return Math.max(...values, 1);
  }, [business?.daily]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-amber-200 border-b-amber-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-amber-700">Cơm Thị Nở Restaurant</p>
            <h1 className="mt-2 text-3xl font-black text-stone-950">Dashboard tổng thể</h1>
            <p className="mt-2 max-w-3xl text-sm text-stone-500">
              Theo dõi doanh thu POS, chi phí, lợi nhuận, đề nghị chi và tình trạng vận hành của quán trong một màn hình.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-bold text-stone-700 hover:bg-white"
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
        </div>
      </section>

      {business?.posError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          Không đọc được doanh thu POS từ CaoConnection: {business.posError}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Doanh thu hôm nay"
          value={formatCurrency(business?.revenueToday || 0)}
          helper={`${business?.paidOrdersToday || 0} bill đã thanh toán`}
          icon={TrendingUp}
          tone="bg-emerald-50 text-emerald-700"
          to="/admin/pos"
        />
        <MetricCard
          label="Tổng chi hôm nay"
          value={formatCurrency(business?.expenseToday || 0)}
          helper={`${business?.unpostedVouchersCount || 0} phiếu chưa ghi sổ`}
          icon={TrendingDown}
          tone="bg-red-50 text-red-700"
          to="/admin/payments/vouchers"
        />
        <MetricCard
          label="Lợi nhuận hôm nay"
          value={formatCurrency(business?.profitToday || 0)}
          helper={`Biên lợi nhuận ${(business?.profitMarginToday || 0).toFixed(1)}%`}
          icon={DollarSign}
          tone={(business?.profitToday || 0) >= 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}
        />
        <MetricCard
          label="Chờ duyệt chi"
          value={`${business?.pendingRequestsCount || 0}`}
          helper={`${business?.approvedRequestsCount || 0} đề nghị đã duyệt chờ lập phiếu`}
          icon={CreditCard}
          tone="bg-blue-50 text-blue-700"
          to="/admin/payments/approvals"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Doanh thu tháng"
          value={formatCurrency(business?.revenueMonth || 0)}
          helper="Tính theo bill POS đã thanh toán"
          icon={BarChart3}
          tone="bg-teal-50 text-teal-700"
          to="/admin/payments/dashboard"
        />
        <MetricCard
          label="Chi phí tháng"
          value={formatCurrency(business?.expenseMonth || 0)}
          helper="Tính theo phiếu chi đã ghi sổ"
          icon={ReceiptText}
          tone="bg-orange-50 text-orange-700"
          to="/admin/reports/cash"
        />
        <MetricCard
          label="Lợi nhuận tháng"
          value={formatCurrency(business?.profitMonth || 0)}
          helper={`Công nợ NCC ${formatCurrency(business?.supplierDebt || 0)}`}
          icon={DollarSign}
          tone="bg-stone-100 text-stone-800"
        />
        <MetricCard
          label="Tin nhắn mới"
          value={`${stats?.newMessages || 0}`}
          helper={`${stats?.visibleItems || 0}/${stats?.totalItems || 0} món đang hiển thị`}
          icon={Mail}
          tone="bg-purple-50 text-purple-700"
          to="/admin/contact-messages"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-stone-950">Doanh thu, chi phí và lợi nhuận 7 ngày</h2>
              <p className="mt-1 text-sm text-stone-500">Doanh thu lấy từ POS, chi phí lấy từ phiếu chi đã ghi sổ.</p>
            </div>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-[720px] items-end gap-4">
              {(business?.daily || []).map((item) => (
                <div key={item.date} className="flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-56 w-full items-end justify-center gap-2 rounded-2xl bg-stone-50 px-2 pb-3">
                    <div
                      className="w-7 rounded-t-xl bg-emerald-600"
                      style={{ height: `${Math.max(6, (item.revenue / maxDaily) * 190)}px` }}
                      title={`Doanh thu ${formatCurrency(item.revenue)}`}
                    />
                    <div
                      className="w-7 rounded-t-xl bg-red-500"
                      style={{ height: `${Math.max(6, (item.expense / maxDaily) * 190)}px` }}
                      title={`Chi phí ${formatCurrency(item.expense)}`}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-stone-500">{item.date.slice(5).replace('-', '/')}</div>
                    <div className={`text-xs font-black ${item.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {formatCurrency(item.profit)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-stone-500">
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-emerald-600" /> Doanh thu</span>
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-red-500" /> Chi phí</span>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-stone-950">Tình hình vận hành</h2>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-4">
              <span className="font-semibold text-stone-600">Order đang mở</span>
              <span className="text-2xl font-black text-stone-950">{business?.openOrdersToday || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-4">
              <span className="font-semibold text-stone-600">Bill trung bình</span>
              <span className="text-lg font-black text-stone-950">{formatCurrency(business?.averageBillToday || 0)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-4">
              <span className="font-semibold text-stone-600">Giảm giá hôm nay</span>
              <span className="text-lg font-black text-stone-950">{formatCurrency(business?.discountToday || 0)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-stone-50 p-4">
              <span className="font-semibold text-stone-600">Danh mục thực đơn</span>
              <span className="text-lg font-black text-stone-950">{stats?.totalCategories || 0}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-stone-950">Order POS gần đây</h2>
          <div className="mt-4 space-y-3">
            {(business?.recentOrders || []).length === 0 && <p className="py-6 text-center text-sm text-stone-400">Chưa có order hôm nay.</p>}
            {(business?.recentOrders || []).map((item) => (
              <div key={`${item.orderNo}-${item.createdAt}`} className="rounded-xl border border-stone-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-stone-950">{item.orderNo || '-'}</span>
                  <span className="font-black text-emerald-700">{formatCurrency(item.totalAmount)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-stone-500">
                  <span>{statusText(item.status)}</span>
                  <span>{formatDate(item.paidAt || item.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-stone-950">Đề nghị chi gần đây</h2>
          <div className="mt-4 space-y-3">
            {(business?.recentRequests || []).length === 0 && <p className="py-6 text-center text-sm text-stone-400">Chưa có đề nghị chi.</p>}
            {(business?.recentRequests || []).map((item) => (
              <div key={item.id} className="rounded-xl border border-stone-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-amber-700">{item.code}</span>
                  <span className="font-black text-red-600">{formatCurrency(item.amount)}</span>
                </div>
                <p className="mt-1 text-sm text-stone-700">{item.reason}</p>
                <div className="mt-2 text-xs font-semibold text-stone-500">{statusText(item.status)} · {item.category?.name || 'Khoản chi'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-stone-950">Hoạt động hệ thống</h2>
          <div className="mt-4 space-y-4">
            {(stats?.recentLogs || []).length === 0 && <p className="py-6 text-center text-sm text-stone-400">Chưa có nhật ký.</p>}
            {(stats?.recentLogs || []).map((log) => (
              <div key={log.id} className="flex gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-stone-700">
                    <span className="font-bold text-stone-950">{log.action}</span> trên {log.entity}
                  </p>
                  <p className="text-xs text-stone-400">{formatDate(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link to="/admin/pos" className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md">
          <Utensils className="h-6 w-6 text-amber-700" />
          <h3 className="mt-3 font-black text-stone-950">Mở máy POS</h3>
          <p className="mt-1 text-sm text-stone-500">Chọn bàn, gọi món và thanh toán.</p>
        </Link>
        <Link to="/admin/payments/requests" className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md">
          <ReceiptText className="h-6 w-6 text-amber-700" />
          <h3 className="mt-3 font-black text-stone-950">Nhập đề nghị chi</h3>
          <p className="mt-1 text-sm text-stone-500">Ghi nhận chi phí phát sinh trong quán.</p>
        </Link>
        <Link to="/admin/payments/vouchers" className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md">
          <CreditCard className="h-6 w-6 text-amber-700" />
          <h3 className="mt-3 font-black text-stone-950">Lập phiếu chi</h3>
          <p className="mt-1 text-sm text-stone-500">Theo dõi thanh toán và ghi sổ.</p>
        </Link>
      </section>
    </div>
  );
}
