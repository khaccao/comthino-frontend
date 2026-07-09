import React, { useEffect, useMemo, useState } from 'react';
import { Check, Clock, FileText, RefreshCw, Search, X } from 'lucide-react';
import { paymentApi } from '../../services/api';
import { useAuthStore } from '../../utils/authStore';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const statusLabel = (status: string) => {
  if (status === 'APPROVED') return 'Đã duyệt';
  if (status === 'REJECTED') return 'Từ chối';
  if (status === 'PAID') return 'Đã chi';
  return 'Chờ duyệt';
};

export default function PaymentApprovals() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const { canApprove } = useAuthStore();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await paymentApi.getRequests();
      setRequests(data);
    } catch (error) {
      alert('Không tải được danh sách đề nghị chi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingRequests = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return requests
      .filter((item) => item.status === 'PENDING')
      .filter((item) => {
        if (!keyword) return true;
        return [
          item.code,
          item.reason,
          item.department,
          item.requester?.fullName,
          item.supplier?.name,
          item.category?.name,
        ].some((value) => String(value || '').toLowerCase().includes(keyword));
      });
  }, [requests, query]);

  const handleApprove = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const actionText = status === 'APPROVED' ? 'duyệt' : 'từ chối';
    if (!window.confirm(`Bạn có chắc muốn ${actionText} đề nghị chi này?`)) return;
    try {
      setBusyId(id);
      await paymentApi.approveRequest(id, status);
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không xử lý được đề nghị chi.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Quản lý dòng tiền</p>
          <h1 className="mt-2 text-3xl font-bold text-stone-950">Duyệt đề nghị chi</h1>
          <p className="mt-1 text-sm text-stone-500">Kiểm tra khoản chi trước khi chuyển sang lập phiếu chi.</p>
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

      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-stone-500">Đang chờ duyệt</div>
            <div className="text-2xl font-black text-stone-950">{pendingRequests.length}</div>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm mã, lý do, người đề nghị..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-stone-500">Đang tải dữ liệu...</div>
        ) : pendingRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="mx-auto h-10 w-10 text-stone-300" />
            <p className="mt-3 font-semibold text-stone-700">Không có đề nghị nào đang chờ duyệt.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Đề nghị</th>
                  <th className="px-4 py-3">Người đề nghị</th>
                  <th className="px-4 py-3">Khoản chi</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {pendingRequests.map((item) => (
                  <tr key={item.id} className="align-top hover:bg-stone-50/70">
                    <td className="px-4 py-4">
                      <div className="font-bold text-amber-700">{item.code}</div>
                      <div className="mt-1 max-w-xs text-stone-700">{item.reason}</div>
                      {item.attachmentUrl && (
                        <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                          <FileText className="h-3.5 w-3.5" />
                          Đính kèm
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-stone-900">{item.requester?.fullName || '-'}</div>
                      <div className="text-xs text-stone-500">{item.department || '-'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-stone-800">{item.category?.name || '-'}</div>
                      <div className="text-xs text-stone-500">{item.supplier?.name || 'Không có nhà cung cấp'}</div>
                    </td>
                    <td className="px-4 py-4 text-right text-base font-black text-red-600">{formatCurrency(item.amount)}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={!canApprove('PAYMENT_REQUEST_APPROVAL') || busyId === item.id}
                          onClick={() => handleApprove(item.id, 'APPROVED')}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                          Duyệt
                        </button>
                        <button
                          type="button"
                          disabled={!canApprove('PAYMENT_REQUEST_APPROVAL') || busyId === item.id}
                          onClick={() => handleApprove(item.id, 'REJECTED')}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
