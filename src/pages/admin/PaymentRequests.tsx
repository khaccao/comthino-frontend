import React, { useEffect, useState } from 'react';
import { paymentApi } from '../../services/api';
import PermissionGuard from '../../components/PermissionGuard';
import { useAuthStore } from '../../utils/authStore';
import { Plus, Check, X, FileText, Download } from 'lucide-react';

export default function PaymentRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    department: '',
    categoryId: '',
    supplierId: '',
    amount: '',
    reason: '',
    attachmentUrl: ''
  });

  const { canApprove } = useAuthStore();
  const MENU_CODE = 'PAYMENT_REQUEST';
  const APPROVE_MENU = 'PAYMENT_REQUEST_APPROVAL';

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqData, catData, supData] = await Promise.all([
        paymentApi.getRequests(),
        paymentApi.getExpenseCategories(),
        paymentApi.getSuppliers()
      ]);
      setRequests(reqData);
      setCategories(catData.filter((c: any) => c.isActive));
      setSuppliers(supData.filter((s: any) => s.isActive));
    } catch (err) {
      console.error(err);
      alert('Lỗi tải dữ liệu đề nghị chi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount.replace(/[^0-9]/g, '')),
        supplierId: formData.supplierId || undefined
      };
      await paymentApi.createRequest(payload);
      setIsModalOpen(false);
      loadData();
      setFormData({
        department: '', categoryId: '', supplierId: '', amount: '', reason: '', attachmentUrl: ''
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi tạo đề nghị chi');
    }
  };

  const handleApprove = async (id: string, status: string) => {
    if (window.confirm(`Bạn có chắc muốn ${status === 'APPROVED' ? 'duyệt' : 'từ chối'} đề nghị này?`)) {
      try {
        await paymentApi.approveRequest(id, status);
        loadData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Lỗi thực hiện thao tác');
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Đề nghị chi</h1>
        </div>
        <PermissionGuard menuCode={MENU_CODE} permissionCode="CREATE">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg"
          >
            <Plus className="w-4 h-4 mr-2" /> Tạo đề nghị chi
          </button>
        </PermissionGuard>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-sm font-medium text-stone-600">
              <th className="p-4">Mã / Ngày</th>
              <th className="p-4">Người đề nghị</th>
              <th className="p-4">Khoản chi</th>
              <th className="p-4">Nhà cung cấp</th>
              <th className="p-4 text-right">Số tiền</th>
              <th className="p-4 text-center">Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 text-sm text-stone-700">
            {requests.map(req => (
              <tr key={req.id} className="hover:bg-stone-50">
                <td className="p-4">
                  <div className="font-medium text-amber-700">{req.code}</div>
                  <div className="text-xs text-stone-500">{new Date(req.requestDate).toLocaleDateString('vi-VN')}</div>
                </td>
                <td className="p-4">
                  <div>{req.requester?.fullName}</div>
                  <div className="text-xs text-stone-500">{req.department}</div>
                </td>
                <td className="p-4">{req.category?.name}</td>
                <td className="p-4">{req.supplier?.name || '-'}</td>
                <td className="p-4 text-right font-bold text-red-600">
                  {formatCurrency(req.amount)}
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    req.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                    req.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                    req.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {req.status === 'PENDING' ? 'Chờ duyệt' :
                     req.status === 'APPROVED' ? 'Đã duyệt' :
                     req.status === 'PAID' ? 'Đã chi' : 'Từ chối'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    {req.attachmentUrl && (
                      <a href={req.attachmentUrl} target="_blank" rel="noreferrer" className="p-1.5 text-stone-500 hover:bg-stone-200 rounded" title="Đính kèm">
                        <FileText className="w-4 h-4" />
                      </a>
                    )}
                    {req.status === 'PENDING' && canApprove(APPROVE_MENU) && (
                      <>
                        <button onClick={() => handleApprove(req.id, 'APPROVED')} className="p-1.5 text-green-600 hover:bg-stone-200 rounded" title="Duyệt">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleApprove(req.id, 'REJECTED')} className="p-1.5 text-red-600 hover:bg-stone-200 rounded" title="Từ chối">
                          <X className="w-4 h-4" />
                        </button>
                      </>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col">
            <div className="px-6 py-4 border-b border-stone-200 flex justify-between">
              <h2 className="text-xl font-bold">Tạo đề nghị chi</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <form id="reqForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Bộ phận *</label>
                    <input type="text" required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Số tiền (VNĐ) *</label>
                    <input type="text" required value={formData.amount} onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({...formData, amount: val ? Number(val).toLocaleString('en-US') : ''});
                    }} className="w-full px-3 py-2 border rounded-lg text-right font-bold text-red-600" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Khoản chi *</label>
                  <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">-- Chọn khoản chi --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Nhà cung cấp (Không bắt buộc)</label>
                  <select value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">-- Chọn NCC --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Lý do chi *</label>
                  <textarea required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows={3}></textarea>
                </div>
                <div>
                  <label className="block text-sm mb-1">Link đính kèm (URL hóa đơn, CT...)</label>
                  <input type="url" value={formData.attachmentUrl} onChange={e => setFormData({...formData, attachmentUrl: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-stone-50">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-stone-200 rounded-lg">Hủy</button>
              <button type="submit" form="reqForm" className="px-4 py-2 bg-amber-600 text-white rounded-lg">Tạo đề nghị</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}