import React, { useEffect, useState } from 'react';
import { paymentApi } from '../../services/api';
import PermissionGuard from '../../components/PermissionGuard';
import { useAuthStore } from '../../utils/authStore';
import { Plus, CheckCircle, Trash2, X, FileText } from 'lucide-react';

const todayInputValue = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export default function PaymentVouchers() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    paymentDate: todayInputValue(),
    requestId: '',
    receiverName: '',
    reason: '',
    amount: '',
    paymentMethodId: '',
    cashAccountId: '',
    expenseCategoryId: '',
    attachmentUrl: '',
    notes: ''
  });

  const { canPostAccounting, canDelete } = useAuthStore();
  const MENU_CODE = 'PAYMENT_VOUCHER';

  const loadData = async () => {
    try {
      setLoading(true);
      const [vouData, reqData, catData, metData, accData] = await Promise.all([
        paymentApi.getVouchers(),
        paymentApi.getRequests(),
        paymentApi.getExpenseCategories(),
        paymentApi.getPaymentMethods(),
        paymentApi.getCashAccounts()
      ]);
      setVouchers(vouData);
      setRequests(reqData.filter((r: any) => r.status === 'APPROVED')); // Only approved requests
      setCategories(catData.filter((c: any) => c.isActive));
      setMethods(metData.filter((m: any) => m.isActive));
      setAccounts(accData.filter((a: any) => a.isActive));
    } catch (err) {
      alert('Lỗi tải dữ liệu phiếu chi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestChange = (reqId: string) => {
    const req = requests.find(r => r.id === reqId);
    if (req) {
      setFormData({
        ...formData,
        paymentDate: formData.paymentDate,
        requestId: reqId,
        receiverName: req.supplier?.name || req.requester?.fullName || '',
        reason: req.reason,
        amount: req.amount.toString(),
        expenseCategoryId: req.categoryId
      });
    } else {
      setFormData({ ...formData, requestId: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        paymentDate: formData.paymentDate,
        amount: Number(formData.amount.replace(/[^0-9]/g, '')),
        requestId: formData.requestId || undefined,
      };
      await paymentApi.createVoucher(payload);
      setIsModalOpen(false);
      loadData();
      setFormData({
        paymentDate: todayInputValue(), requestId: '', receiverName: '', reason: '', amount: '',
        paymentMethodId: '', cashAccountId: '', expenseCategoryId: '', attachmentUrl: '', notes: ''
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi tạo phiếu chi');
    }
  };

  const handlePost = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn ghi sổ phiếu chi này? Hành động này sẽ trừ tiền trong tài khoản và không thể hoàn tác.')) {
      try {
        await paymentApi.postVoucher(id);
        loadData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Lỗi ghi sổ');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Xóa phiếu chi này?')) {
      try {
        await paymentApi.deleteVoucher(id);
        loadData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Lỗi xóa phiếu chi');
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Phiếu chi</h1>
        </div>
        <PermissionGuard menuCode={MENU_CODE} permissionCode="CREATE">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg"
          >
            <Plus className="w-4 h-4 mr-2" /> Tạo phiếu chi
          </button>
        </PermissionGuard>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-sm font-medium text-stone-600">
              <th className="p-4">Mã / Ngày</th>
              <th className="p-4">Người nhận</th>
              <th className="p-4">Lý do</th>
              <th className="p-4">PT & Tài khoản</th>
              <th className="p-4 text-right">Số tiền</th>
              <th className="p-4 text-center">Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 text-sm text-stone-700">
            {vouchers.map(vou => (
              <tr key={vou.id} className="hover:bg-stone-50">
                <td className="p-4">
                  <div className="font-medium text-amber-700">{vou.code}</div>
                  <div className="text-xs text-stone-500">{formatDate(vou.paymentDate || vou.voucherDate)}</div>
                </td>
                <td className="p-4 font-medium">{vou.receiverName}</td>
                <td className="p-4 text-stone-500 max-w-[200px] truncate" title={vou.reason}>{vou.reason}</td>
                <td className="p-4">
                  <div>{vou.paymentMethod?.name}</div>
                  <div className="text-xs text-stone-500">{vou.cashAccount?.name}</div>
                </td>
                <td className="p-4 text-right font-bold text-red-600">
                  {formatCurrency(vou.amount)}
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    vou.status === 'POSTED' ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-800'
                  }`}>
                    {vou.status === 'POSTED' ? 'Đã ghi sổ' : 'Chưa ghi sổ'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    {vou.attachmentUrl && (
                      <a href={vou.attachmentUrl} target="_blank" rel="noreferrer" className="p-1.5 text-stone-500 hover:bg-stone-200 rounded" title="Đính kèm">
                        <FileText className="w-4 h-4" />
                      </a>
                    )}
                    {vou.status === 'UNPOSTED' && canPostAccounting(MENU_CODE) && (
                      <button onClick={() => handlePost(vou.id)} className="p-1.5 text-green-600 hover:bg-stone-200 rounded" title="Ghi sổ kế toán">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {vou.status === 'UNPOSTED' && canDelete(MENU_CODE) && (
                      <button onClick={() => handleDelete(vou.id)} className="p-1.5 text-red-600 hover:bg-stone-200 rounded" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-200 flex justify-between shrink-0">
              <h2 className="text-xl font-bold">Tạo phiếu chi</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="vouForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Từ Đề nghị chi đã duyệt (Không bắt buộc)</label>
                  <select value={formData.requestId} onChange={e => handleRequestChange(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">-- Tạo tự do --</option>
                    {requests.map(r => <option key={r.id} value={r.id}>{r.code} - {formatCurrency(r.amount)} - {r.reason}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Ngày chi *</label>
                    <input type="date" required value={formData.paymentDate} onChange={e => setFormData({...formData, paymentDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Số tiền (VNĐ) *</label>
                    <input type="text" required value={formData.amount} onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({...formData, amount: val ? Number(val).toLocaleString('en-US') : ''});
                    }} className="w-full px-3 py-2 border rounded-lg text-right font-bold text-red-600" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Người nhận tiền *</label>
                    <input type="text" required value={formData.receiverName} onChange={e => setFormData({...formData, receiverName: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Link đính kèm</label>
                    <input type="url" value={formData.attachmentUrl} onChange={e => setFormData({...formData, attachmentUrl: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="URL hóa đơn/chứng từ" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Lý do chi *</label>
                  <textarea required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows={2}></textarea>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Phương thức *</label>
                    <select required value={formData.paymentMethodId} onChange={e => setFormData({...formData, paymentMethodId: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                      <option value="">-- Chọn --</option>
                      {methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Tài khoản chi *</label>
                    <select required value={formData.cashAccountId} onChange={e => setFormData({...formData, cashAccountId: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                      <option value="">-- Chọn --</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.currentBalance)})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Khoản chi *</label>
                    <select required value={formData.expenseCategoryId} onChange={e => setFormData({...formData, expenseCategoryId: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                      <option value="">-- Chọn --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Ghi chú thêm</label>
                  <input type="text" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-stone-50 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-stone-200 rounded-lg">Hủy</button>
              <button type="submit" form="vouForm" className="px-4 py-2 bg-amber-600 text-white rounded-lg">Lưu phiếu chi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
