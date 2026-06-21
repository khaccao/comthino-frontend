import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { GalleryImage } from '../../types';
import { Plus, Edit2, Trash2, X, Save, Image as ImageIcon } from 'lucide-react';

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImg, setCurrentImg] = useState<GalleryImage | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    altText: '',
    displayOrder: 0,
    isActive: true,
  });

  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getGalleryImages();
      if (res.success) setImages(res.data);
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
    setCurrentImg(null);
    setFormData({ title: '', imageUrl: '', altText: '', displayOrder: 0, isActive: true });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (img: GalleryImage) => {
    setCurrentImg(img);
    setFormData({
      title: img.title || '',
      imageUrl: img.imageUrl,
      altText: img.altText || '',
      displayOrder: img.displayOrder,
      isActive: img.isActive,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!formData.imageUrl) {
      setErrorMsg('Vui lòng nhập đường dẫn ảnh.');
      return;
    }

    try {
      const postData = {
        ...formData,
        displayOrder: Number(formData.displayOrder),
      };

      let res;
      if (currentImg) {
        res = await adminApi.updateGalleryImage(currentImg.id, postData);
      } else {
        res = await adminApi.createGalleryImage(postData);
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi thư viện?')) return;
    try {
      const res = await adminApi.deleteGalleryImage(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.message || 'Xóa ảnh thất bại.');
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
          <h1 className="text-2xl font-bold text-stone-900">Thư Viện Không Gian Quán</h1>
          <p className="text-sm text-stone-500 mt-1">Cập nhật hình ảnh món ăn, ngóc ngách của quán để hiển thị ở trang chủ.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-lg flex items-center space-x-2 text-sm shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm ảnh mới</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {images.map((img) => (
          <div key={img.id} className="bg-white rounded-xl overflow-hidden border shadow-warm flex flex-col group">
            <div className="h-40 bg-stone-100 relative">
              <img
                src={img.imageUrl.startsWith('http') || img.imageUrl.startsWith('/') ? img.imageUrl : `/uploads/${img.imageUrl}`}
                alt={img.altText || 'Gallery Cơm Thị Nở'}
                className="w-full h-full object-cover"
              />
              <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                img.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-800'
              }`}>
                {img.isActive ? 'Hiện' : 'Ẩn'}
              </span>
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-stone-700 truncate">{img.title || 'Không có tiêu đề'}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">Thứ tự: {img.displayOrder}</p>
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t mt-2">
                <button onClick={() => openEditModal(img)} className="p-1 hover:bg-stone-100 text-stone-500 hover:text-amber-600 rounded transition">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(img.id)} className="p-1 hover:bg-stone-100 text-stone-400 hover:text-rose-600 rounded transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-fade-in border border-stone-200 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-stone-50">
              <h2 className="text-lg font-bold text-stone-800">
                {currentImg ? 'Cập Nhật Ảnh Thư Viện' : 'Thêm Ảnh Mới Vào Thư Viện'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded hover:bg-stone-200 text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-xs font-semibold">{errorMsg}</div>}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Tiêu đề ảnh (Chú thích)</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Đường dẫn ảnh * (URL hoặc path)</label>
                <input type="text" required name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="/uploads/ảnh.png" className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">SEO Alt Text (Mô tả ảnh cho Google)</label>
                <input type="text" name="altText" value={formData.altText} onChange={handleInputChange} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Thứ tự sắp xếp</label>
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
                  <span>Thêm ảnh</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
