import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { Banner } from '../../types';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<Banner | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    buttonText: '',
    buttonLink: '',
    displayOrder: 0,
    isActive: true,
  });

  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getBanners();
      if (res.success) setBanners(res.data);
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
    setCurrentBanner(null);
    setFormData({ title: '', subtitle: '', description: '', imageUrl: '', buttonText: '', buttonLink: '', displayOrder: 0, isActive: true });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setCurrentBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      imageUrl: banner.imageUrl,
      buttonText: banner.buttonText || '',
      buttonLink: banner.buttonLink || '',
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
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

    if (!formData.title || !formData.imageUrl) {
      setErrorMsg('Vui lòng nhập tiêu đề và đường dẫn ảnh.');
      return;
    }

    try {
      const postData = {
        ...formData,
        displayOrder: Number(formData.displayOrder),
      };

      let res;
      if (currentBanner) {
        res = await adminApi.updateBanner(currentBanner.id, postData);
      } else {
        res = await adminApi.createBanner(postData);
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa banner này?')) return;
    try {
      const res = await adminApi.deleteBanner(id);
      if (res.success) {
        loadData();
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
          <h1 className="text-2xl font-bold text-stone-900">Quản Lý Banner Trang Chủ</h1>
          <p className="text-sm text-stone-500 mt-1">Các banner ảnh lớn trình chiếu ở đầu trang chủ.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-lg flex items-center space-x-2 text-sm shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm banner</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-warm border overflow-hidden">
        <table className="w-full text-left text-sm text-stone-600 border-collapse">
          <thead>
            <tr className="bg-stone-50 text-stone-700 uppercase text-xs tracking-wider border-b border-stone-200">
              <th className="py-4 px-6 font-bold">Hình ảnh</th>
              <th className="py-4 px-6 font-bold">Tiêu đề / Phụ đề</th>
              <th className="py-4 px-6 font-bold text-center">Thứ tự hiển thị</th>
              <th className="py-4 px-6 font-bold text-center">Trạng thái</th>
              <th className="py-4 px-6 font-bold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {banners.map((b) => (
              <tr key={b.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="py-4 px-6">
                  <img
                    src={b.imageUrl.startsWith('http') || b.imageUrl.startsWith('/') ? b.imageUrl : `/uploads/${b.imageUrl}`}
                    alt={b.title}
                    className="w-20 h-10 object-cover rounded border"
                  />
                </td>
                <td className="py-4 px-6">
                  <p className="font-bold text-stone-800 text-sm">{b.title}</p>
                  <p className="text-stone-400 text-xs mt-0.5">{b.subtitle || '-'}</p>
                </td>
                <td className="py-4 px-6 text-center font-semibold">{b.displayOrder}</td>
                <td className="py-4 px-6 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                    b.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-800'
                  }`}>
                    {b.isActive ? 'Hiển thị' : 'Ẩn'}
                  </span>
                </td>
                <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                  <button onClick={() => openEditModal(b)} className="p-1.5 hover:bg-stone-100 text-stone-500 hover:text-amber-600 rounded transition">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="p-1.5 hover:bg-stone-100 text-stone-400 hover:text-rose-600 rounded transition">
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
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-fade-in border overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-stone-50">
              <h2 className="text-lg font-bold text-stone-800">
                {currentBanner ? 'Cập Nhật Banner' : 'Thêm Banner Mới'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded hover:bg-stone-200 text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMsg && <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-xs font-semibold">{errorMsg}</div>}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Tiêu đề chính *</label>
                <input type="text" required name="title" value={formData.title} onChange={handleInputChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Phụ đề (Subtitle)</label>
                <input type="text" name="subtitle" value={formData.subtitle} onChange={handleInputChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Mô tả ngắn</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Đường dẫn ảnh *</label>
                <input type="text" required name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="URL ảnh hoặc path" className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">CTA Nút bấm (Text)</label>
                  <input type="text" name="buttonText" value={formData.buttonText} onChange={handleInputChange} placeholder="Khám phá ngay" className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">CTA Link liên kết</label>
                  <input type="text" name="buttonLink" value={formData.buttonLink} onChange={handleInputChange} placeholder="#menu-sach" className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Thứ tự hiển thị</label>
                  <input type="number" name="displayOrder" value={formData.displayOrder} onChange={handleInputChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-stone-300 rounded cursor-pointer" />
                    <span className="text-sm font-semibold text-stone-700">Hiển thị</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold py-2 px-4 rounded-lg text-xs">Hủy</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-lg text-xs shadow flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Lưu banner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
