import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { MenuCategory } from '../../types';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';

export default function MenuCategories() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCat, setCurrentCat] = useState<MenuCategory | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    displayOrder: 0,
    isActive: true,
  });

  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getMenuCategories();
      if (res.success) setCategories(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setCurrentCat(null);
    setFormData({ name: '', description: '', displayOrder: 0, isActive: true });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: MenuCategory) => {
    setCurrentCat(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      displayOrder: cat.displayOrder,
      isActive: cat.isActive,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const postData = {
        ...formData,
        displayOrder: Number(formData.displayOrder),
      };

      let res;
      if (currentCat) {
        res = await adminApi.updateMenuCategory(currentCat.id, postData);
      } else {
        res = await adminApi.createMenuCategory(postData);
      }

      if (res.success) {
        setIsModalOpen(false);
        loadData();
      } else {
        setErrorMsg(res.message || 'Lưu thất bại.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Lỗi kết nối máy chủ.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này? Tất cả các món ăn trong danh mục này cũng sẽ bị xóa.')) return;
    try {
      const res = await adminApi.deleteMenuCategory(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.message || 'Xóa danh mục thất bại.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Danh Mục Thực Đơn</h1>
          <p className="text-sm text-stone-500 mt-1">Quản lý phân loại các món ăn (Món kho, xào, canh...).</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-lg flex items-center space-x-2 text-sm shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm danh mục</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-warm border border-stone-200/60 overflow-hidden">
        <table className="w-full text-left text-sm text-stone-600 border-collapse">
          <thead>
            <tr className="bg-stone-50 text-stone-700 uppercase text-xs tracking-wider border-b border-stone-200">
              <th className="py-4 px-6 font-bold">Tên danh mục</th>
              <th className="py-4 px-6 font-bold">Mô tả ngắn</th>
              <th className="py-4 px-6 font-bold text-center">Thứ tự hiển thị</th>
              <th className="py-4 px-6 font-bold text-center">Trạng thái</th>
              <th className="py-4 px-6 font-bold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="py-4 px-6 font-bold text-stone-800">{cat.name}</td>
                <td className="py-4 px-6 text-stone-500 max-w-xs truncate">{cat.description || '-'}</td>
                <td className="py-4 px-6 text-center font-semibold">{cat.displayOrder}</td>
                <td className="py-4 px-6 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                    cat.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-800'
                  }`}>
                    {cat.isActive ? 'Hoạt động' : 'Tạm ẩn'}
                  </span>
                </td>
                <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                  <button onClick={() => openEditModal(cat)} className="p-1.5 hover:bg-stone-100 text-stone-500 hover:text-amber-600 rounded transition-colors inline-block">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 hover:bg-stone-100 text-stone-500 hover:text-rose-600 rounded transition-colors inline-block">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-fade-in border border-stone-200 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-stone-50">
              <h2 className="text-lg font-bold text-stone-800">
                {currentCat ? 'Cập Nhật Danh Mục' : 'Thêm Danh Mục Mới'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded hover:bg-stone-200 text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {errorMsg && <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-xs font-semibold">{errorMsg}</div>}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Tên danh mục *</label>
                <input type="text" required name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Mô tả ngắn</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Thứ tự hiển thị</label>
                  <input type="number" name="displayOrder" value={formData.displayOrder} onChange={handleInputChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-stone-300 rounded cursor-pointer" />
                    <span className="text-sm font-semibold text-stone-700">Kích hoạt</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold py-2 px-4 rounded-lg text-xs">Hủy</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-lg text-xs shadow flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Lưu danh mục</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
