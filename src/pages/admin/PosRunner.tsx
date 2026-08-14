import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, RefreshCw, Search, Utensils } from 'lucide-react';
import { adminApi } from '../../services/api';

type RunnerItem = {
  Id: string;
  Name: string;
  Quantity: number;
  Note?: string | null;
  Status?: string;
};

type RunnerOrder = {
  Id: string;
  RunnerNo: number;
  OrderNo: string;
  TableName: string;
  Status: string;
  Note?: string | null;
  CreatedAt?: string;
  UpdatedAt?: string;
  KitchenPrintedAt?: string | null;
  ItemCount: number;
  TotalQuantity: number;
  ChangedItemCount: number;
  items: RunnerItem[];
};

const statusText = (status?: string) => {
  if (status === 'ORDERED') return 'Đã gửi bếp';
  return 'Đang gọi món';
};

const itemStatusText = (status?: string) => {
  if (status === 'CHANGED') return 'Mới sửa';
  if (status === 'NEW') return 'Mới thêm';
  if (status === 'SENT') return 'Đã gửi';
  return status || '';
};

const formatTime = (value?: string) => {
  if (!value) return '-';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
  if (match) return `${match[4]}:${match[5]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

export default function PosRunner() {
  const [orders, setOrders] = useState<RunnerOrder[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [serverTime, setServerTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const loadData = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError('');
      const res = await adminApi.getPosRunnerOrders();
      const nextOrders: RunnerOrder[] = res.data?.orders || [];
      setOrders(nextOrders);
      setServerTime(res.data?.serverTime || '');
      setSelectedId((current) => {
        if (current && nextOrders.some((item) => item.Id === current)) return current;
        return nextOrders[0]?.Id || '';
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tải được màn chạy bàn.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = window.setInterval(() => loadData(true), 20000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredOrders = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter((order) =>
      [order.TableName, order.OrderNo, order.Note, ...order.items.map((item) => `${item.Name} ${item.Note || ''}`)]
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    );
  }, [orders, query]);

  const selectedOrder = filteredOrders.find((item) => item.Id === selectedId) || filteredOrders[0] || null;

  return (
    <div className="min-h-[calc(100vh-120px)] space-y-4 pb-24 lg:pb-6">
      <section className="sticky top-0 z-20 -mx-3 border-b border-stone-200 bg-stone-50/95 px-3 py-3 backdrop-blur lg:static lg:mx-0 lg:rounded-3xl lg:border lg:bg-white lg:p-5 lg:shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">POS chạy bàn</p>
            <h1 className="mt-1 text-2xl font-black text-stone-950 sm:text-3xl">Bàn đang phục vụ</h1>
            <p className="mt-1 text-xs font-bold text-stone-500">Cập nhật {serverTime || '-'}</p>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 text-sm font-black text-white shadow-lg shadow-stone-300/50 active:scale-95 disabled:opacity-60"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            Tải lại
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Metric label="Bàn" value={orders.length} />
          <Metric label="Món" value={orders.reduce((sum, item) => sum + Number(item.ItemCount || 0), 0)} />
          <Metric label="Cần chú ý" value={orders.reduce((sum, item) => sum + Number(item.ChangedItemCount || 0), 0)} tone="amber" />
        </div>

        <label className="mt-4 flex min-h-12 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3">
          <Search className="h-5 w-5 text-stone-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm bàn, mã đơn, món, ghi chú..."
            className="h-11 min-w-0 flex-1 bg-transparent text-base font-bold text-stone-900 outline-none placeholder:text-stone-400"
          />
        </label>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center font-black text-stone-500">Đang tải...</div>
      ) : !filteredOrders.length ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <p className="mt-3 text-xl font-black text-stone-950">Chưa có bàn nào đang order.</p>
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.Id}
                order={order}
                selected={selectedOrder?.Id === order.Id}
                onSelect={() => setSelectedId(order.Id)}
              />
            ))}
          </div>

          <aside className="hidden xl:block">
            {selectedOrder && (
              <div className="sticky top-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                <OrderDetail order={selectedOrder} />
              </div>
            )}
          </aside>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value, tone = 'stone' }: { label: string; value: number; tone?: 'stone' | 'amber' }) {
  return (
    <div className={`rounded-2xl border p-3 ${tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-stone-200 bg-white'}`}>
      <p className="text-[10px] font-black uppercase tracking-wide text-stone-500">{label}</p>
      <p className={`mt-1 text-2xl font-black ${tone === 'amber' ? 'text-amber-700' : 'text-stone-950'}`}>{value}</p>
    </div>
  );
}

function OrderCard({ order, selected, onSelect }: { order: RunnerOrder; selected: boolean; onSelect: () => void }) {
  return (
    <article className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${selected ? 'border-amber-400 ring-2 ring-amber-100' : 'border-stone-200'}`}>
      <button onClick={onSelect} className="w-full p-4 text-left active:bg-stone-50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black text-white">#{order.RunnerNo}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${order.Status === 'ORDERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {statusText(order.Status)}
              </span>
              {order.ChangedItemCount > 0 && (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">Có món mới/sửa</span>
              )}
            </div>
            <h2 className="mt-3 text-4xl font-black leading-none text-stone-950">{order.TableName}</h2>
            <p className="mt-2 truncate text-sm font-bold text-stone-500">{order.OrderNo}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-emerald-700">{order.ItemCount}</p>
            <p className="text-xs font-bold uppercase text-stone-400">món</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-stone-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1">
            <Clock3 className="h-3.5 w-3.5" />
            {formatTime(order.CreatedAt)}
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1">Tổng SL {Number(order.TotalQuantity || 0).toLocaleString('vi-VN')}</span>
          {order.Note && <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">Có ghi chú order</span>}
        </div>
      </button>
      <div className="border-t border-stone-100 xl:hidden">
        <OrderDetail order={order} compact />
      </div>
    </article>
  );
}

function OrderDetail({ order, compact = false }: { order: RunnerOrder; compact?: boolean }) {
  return (
    <div className={compact ? 'p-4' : ''}>
      {!compact && (
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Chi tiết bàn</p>
          <h2 className="mt-1 text-4xl font-black text-stone-950">{order.TableName}</h2>
          <p className="mt-1 text-sm font-bold text-stone-500">{order.OrderNo} · {statusText(order.Status)}</p>
        </div>
      )}

      {order.Note && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">Ghi chú order</p>
          <p className="mt-1 text-base font-black text-stone-950">{order.Note}</p>
        </div>
      )}

      <div className="space-y-2">
        {order.items.map((item) => (
          <div key={item.Id} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-950 text-xl font-black text-white">
                {Number(item.Quantity || 0).toLocaleString('vi-VN')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-black leading-snug text-stone-950">{item.Name}</h3>
                  {item.Status && (
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${item.Status === 'CHANGED' || item.Status === 'NEW' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {itemStatusText(item.Status)}
                    </span>
                  )}
                </div>
                {item.Note && (
                  <div className="mt-2 rounded-xl bg-amber-100 px-3 py-2 text-sm font-black text-amber-900">
                    Ghi chú: {item.Note}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-black text-emerald-800">
        <Utensils className="h-4 w-4" />
        {order.ItemCount} món · tổng {Number(order.TotalQuantity || 0).toLocaleString('vi-VN')} suất
      </div>
    </div>
  );
}
