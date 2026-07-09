import React, { useEffect, useState } from 'react';
import { paymentApi } from '../../services/api';
import PermissionGuard from '../../components/PermissionGuard';
import { Truck, Edit, Trash2, Plus, X } from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    taxCode: '',
    address: '',
    currentDebt: '',
    paymentTerms: '',
    isActive: true
  });

  const MENU_CODE = 'SUPPLIER_CATEGORY';

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await paymentApi.getSuppliers();
      setSuppliers(data);
    } catch (err: any) {
      alert('Lỗi tải danh sách nhà cung cấp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (sup?: any) => {
    if (sup) {
      setEditingSupplier(sup);
      setFormData({
        name: sup.name,
        phone: sup.phone || '',
        taxCode: sup.taxCode || '',
        address: sup.address || '',
        currentDebt: sup.currentDebt?.toString() || '0',
        paymentTerms: sup.paymentTerms || '',
        isActive: sup.isActive
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '', phone: '', taxCode: '', address: '', currentDebt: '0', paymentTerms: '', isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        currentDebt: Number(formData.currentDebt.replace(/[^0-9]/g, '')) || 0
      };
      
      if (editingSupplier) {
        await paymentApi.updateSupplier(editingSupplier.id, payload);
      } else {
        await paymentApi.createSupplier(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi lưu nhà cung cấp');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Xóa nhà cung cấp này? Các dữ liệu liên quan sẽ không thể phục hồi.')) {
      try {
        await paymentApi.deleteSupplier(id);
        loadData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Lỗi xóa nhà cung cấp');
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
          <h1 className="text-2xl font-bold text-stone-800">Nhà cung cấp</h1>
        </div>
        <PermissionGuard menuCode={MENU_CODE} permissionCode="CREATE">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg"
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm NCC
          </button>
        </PermissionGuard>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-sm font-medium text-stone-600">
              <th className="p-4">Tên NCC</th>
              <th className="p-4">Liên hệ / MST</th>
              <th className="p-4">Hạn thanh toán</th>
              <th className="p-4 text-right">Công nợ hiện tại</th>
              <th className="p-4 text-center">Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 text-sm text-stone-700">
            {suppliers.map(sup => (
              <tr key={sup.id} className="hover:bg-stone-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                      <Truck className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-stone-900">{sup.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div>{sup.phone || '-'}</div>
                  <div className="text-xs text-stone-500">MST: {sup.taxCode || '-'}</div>
                </td>
                <td className="p-4 text-stone-500">{sup.paymentTerms || '-'}</td>
                <td className="p-4 text-right font-bold text-red-600">
                  {formatCurrency(sup.currentDebt)}
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    sup.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {sup.isActive ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <PermissionGuard menuCode={MENU_CODE} permissionCode="EDIT">
                      <button onClick={() => handleOpenModal(sup)} className="p-1.5 text-blue-600 rounded hover:bg-stone-200">
                        <Edit className="w-4 h-4" />
                      </button>
                    </PermissionGuard>
                    <PermissionGuard menuCode={MENU_CODE} permissionCode="DELETE">
                      <button onClick={() => handleDelete(sup.id)} className="p-1.5 text-red-600 rounded hover:bg-stone-200">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </PermissionGuard>
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
              <h2 className="text-xl font-bold">{editingSupplier ? 'Sửa NCC' : 'Thêm NCC'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="supForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Tên nhà cung cấp *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Số điện thoại</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Mã số thuế</label>
                    <input type="text" value={formData.taxCode} onChange={e => setFormData({...formData, taxCode: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Địa chỉ</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Hạn thanh toán</label>
                    <input type="text" placeholder="VD: 7 ngày, 15 ngày..." value={formData.paymentTerms} onChange={e => setFormData({...formData, paymentTerms: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Công nợ hiện tại</label>
                    <input type="text" value={formData.currentDebt} onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({...formData, currentDebt: val ? Number(val).toLocaleString('en-US') : '0'});
                    }} className="w-full px-3 py-2 border rounded-lg text-right text-red-600 font-bold" />
                  </div>
                </div>
                <label className="flex items-center mt-4">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-amber-600 rounded" />
                  <span className="ml-2 text-sm">Hoạt động</span>
                </label>
              </form>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-stone-50">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-stone-200 rounded-lg">Hủy</button>
              <button type="submit" form="supForm" className="px-4 py-2 bg-amber-600 text-white rounded-lg">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}