import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { Plus, Edit2, Trash2, X, Save, Star } from 'lucide-react';

export default function ReviewsManager() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    content: '',
    rating: 5,
    avatar: '',
    isPublished: true,
  });
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getReviews();
      if (res.success) setReviews(res.data);
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
    setCurrentReview(null);
    setFormData({ customerName: '', content: '', rating: 5, avatar: '', isPublished: true });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (r: any) => {
    setCurrentReview(r);
    setFormData({
      customerName: r.customerName,
      content: r.content,
      rating: r.rating,
      avatar: r.avatar || '',
      isPublished: r.isPublished,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      let res;
      if (currentReview) {
        res = await adminApi.updateReview(currentReview.id, { ...formData, rating: Number(formData.rating) });
      } else {
        res = await adminApi.createReview({ ...formData, rating: Number(formData.rating) });
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
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    try {
      const res = await adminApi.deleteReview(id);
      if (res.success) loadData();
    } catch (e) {
      console.error(e);
      alert('Xóa thất bại');
    }
  };

  if (isLoading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-stone-800">Đánh giá khách hàng (Reviews)</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm đánh giá</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reviews.length === 0 ? (
          <div className="col-span-full p-8 text-center text-stone-500 bg-white rounded-lg border border-stone-200">Chưa có đánh giá nào.</div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm border border-stone-200 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {review.avatar && (
                    <img src={review.avatar} alt={review.customerName} className="w-10 h-10 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="font-semibold text-stone-800">{review.customerName}</p>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-200 fill-stone-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => openEditModal(review)} className="p-1.5 text-stone-400 hover:text-amber-600 rounded hover:bg-stone-100 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(review.id)} className="p-1.5 text-stone-400 hover:text-red-600 rounded hover:bg-stone-100 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-stone-600 line-clamp-3">{review.content}</p>
              <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${review.isPublished ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                {review.isPublished ? 'Đang hiện' : 'Đang ẩn'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b border-stone-200">
              <h2 className="text-lg font-bold text-stone-800">
                {currentReview ? 'Sửa đánh giá' : 'Thêm đánh giá mới'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700">{errorMsg}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Tên khách hàng *</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  required
                  className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nội dung đánh giá *</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Số sao (1-5)</label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  min={1}
                  max={5}
                  className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Avatar URL</label>
                <input
                  type="text"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublished"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
                  Hiển thị trên website
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
