import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { Promotion } from '../../types';
import { Plus, Edit2, Trash2, X, Save, Calendar } from 'lucide-react';

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPromo, setCurrentPromo] = useState<Promotion | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    startDate: '',
    endDate: '',
    discountText: '',
    buttonText: '',
    buttonLink: '',
    isActive: true,
  });

  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getPromotions();
      if (res.success) setPromotions(res.data);
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
    setCurrentPromo(null);
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      startDate: new Date().toISOString().substring(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().substring(0, 10),
      discountText: '',
      buttonText: '',
      buttonLink: '',
      isActive: true,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (promo: Promotion) => {
    setCurrentPromo(promo);
    setFormData({
      title: promo.title,
      description: promo.description || '',
      imageUrl: promo.imageUrl,
      startDate: new Date(promo.startDate).toISOString().substring(0, 10),
      endDate: new Date(promo.endDate).toISOString().substring(0, 10),
      discountText: promo.discountText || '',
      buttonText: promo.buttonText || '',
      buttonLink: promo.buttonLink || '',
      isActive: promo.isActive,
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

    if (!formData.title || !formData.imageUrl || !formData.startDate || !formData.endDate) {
      setErrorMsg('Vui lòng điền các thông tin bắt buộc (*).');
      return;
    }

    try {
      let res;
      if (currentPromo) {
        res = await adminApi.updatePromotion(currentPromo.id, formData);
      } else {
        res = await adminApi.createPromotion(formData);
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa chương trình khuyến mãi này?')) return;
    try {
      const res = await adminApi.deletePromotion(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.message || 'Xóa khuyến mãi thất bại.');
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
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Quản Lý Khuyến Mãi</h1>
          <p className="text-sm text-stone-500 mt-1">Quản lý banner khuyến mãi theo chiến dịch (Tự động ẩn khi hết hạn).</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-lg flex items-center space-x-2 text-sm shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm khuyến mãi</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-warm border border-stone-200/60 overflow-hidden">
        <table className="w-full text-left text-sm text-stone-600 border-collapse">
          <thead>
            <tr className="bg-stone-50 text-stone-700 uppercase text-xs tracking-wider border-b border-stone-200">
              <th className="py-4 px-6 font-bold">Hình ảnh</th>
              <th className="py-4 px-6 font-bold">Tiêu đề khuyến mãi</th>
              <th className="py-4 px-6 font-bold">Mức giảm giá</th>
              <th className="py-4 px-6 font-bold">Thời hạn hiển thị</th>
              <th className="py-4 px-6 font-bold text-center">Trạng thái</th>
              <th className="py-4 px-6 font-bold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {promotions.map((promo) => (
              <tr key={promo.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="py-4 px-6">
                  <img
                    src={promo.imageUrl.startsWith('http') || promo.imageUrl.startsWith('/') ? promo.imageUrl : `/uploads/${promo.imageUrl}`}
                    alt={promo.title}
                    className="w-16 h-10 object-cover rounded border"
                  />
                </td>
                <td className="py-4 px-6">
                  <p className="font-bold text-stone-800 text-sm">{promo.title}</p>
                  <p className="text-stone-400 text-xs mt-0.5 max-w-sm truncate">{promo.description}</p>
                </td>
                <td className="py-4 px-6">
                  <span className="bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold px-2 py-1 rounded">
                    {promo.discountText || 'Khuyến mãi'}
                  </span>
                </td>
                <td className="py-4 px-6 text-xs text-stone-500">
                  <p>Từ: {new Date(promo.startDate).toLocaleDateString('vi-VN')}</p>
                  <p>Đến: {new Date(promo.endDate).toLocaleDateString('vi-VN')}</p>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                    promo.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-800'
                  }`}>
                    {promo.isActive ? 'Hoạt động' : 'Tạm ẩn'}
                  </span>
                </td>
                <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                  <button onClick={() => openEditModal(promo)} className="p-1.5 hover:bg-stone-100 text-stone-500 hover:text-amber-600 rounded transition-colors inline-block">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(promo.id)} className="p-1.5 hover:bg-stone-100 text-stone-500 hover:text-rose-600 rounded transition-colors inline-block">
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
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-fade-in border border-stone-200 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-stone-50">
              <h2 className="text-lg font-bold text-stone-800">
                {currentPromo ? 'Cập Nhật Khuyến Mãi' : 'Thêm Khuyến Mãi Mới'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded hover:bg-stone-200 text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMsg && <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-xs font-semibold">{errorMsg}</div>}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Tiêu đề khuyến mãi *</label>
                <input type="text" required name="title" value={formData.title} onChange={handleInputChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Chi tiết nội dung</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Ngày bắt đầu *</label>
                  <input type="date" required name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Ngày kết thúc *</label>
                  <input type="date" required name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Tag giảm giá (Ví dụ: Ưu đãi 15%)</label>
                  <input type="text" name="discountText" value={formData.discountText} onChange={handleInputChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Đường dẫn ảnh banner *</label>
                  <input type="text" required name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="/uploads/ hoặc URL" className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Chữ trên nút (CTA)</label>
                  <input type="text" name="buttonText" value={formData.buttonText} onChange={handleInputChange} placeholder="Xem thêm" className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Link định tuyến nút</label>
                  <input type="text" name="buttonLink" value={formData.buttonLink} onChange={handleInputChange} placeholder="#dat-com" className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              <div className="flex items-end pb-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-stone-300 rounded cursor-pointer" />
                  <span className="text-sm font-semibold text-stone-700">Kích hoạt hiển thị</span>
                </label>
              </div>

              <div className="pt-4 border-t flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold py-2 px-4 rounded-lg text-xs">Hủy</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-lg text-xs shadow flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Lưu thông tin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
