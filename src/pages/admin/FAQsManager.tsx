import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';

export default function FAQsManager() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFAQ, setCurrentFAQ] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    displayOrder: 0,
  });
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getFAQs();
      if (res.success) setFaqs(res.data);
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
    setCurrentFAQ(null);
    setFormData({ question: '', answer: '', displayOrder: 0 });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (faq: any) => {
    setCurrentFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      displayOrder: faq.displayOrder || 0,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? Number(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      let res;
      if (currentFAQ) {
        res = await adminApi.updateFAQ(currentFAQ.id, formData);
      } else {
        res = await adminApi.createFAQ(formData);
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
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    try {
      const res = await adminApi.deleteFAQ(id);
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
        <h1 className="text-2xl font-bold text-stone-800">Quản lý FAQs</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm câu hỏi</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-stone-200 divide-y divide-stone-100">
        {faqs.length === 0 ? (
          <div className="p-8 text-center text-stone-500">Chưa có câu hỏi nào.</div>
        ) : (
          faqs.map((faq) => (
            <div key={faq.id} className="p-4 hover:bg-stone-50 flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-stone-800">{faq.question}</p>
                <p className="text-sm text-stone-500 mt-1 line-clamp-2">{faq.answer}</p>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={() => openEditModal(faq)}
                  className="p-1.5 text-stone-400 hover:text-amber-600 rounded hover:bg-stone-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(faq.id)}
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded hover:bg-stone-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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
                {currentFAQ ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}
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
                <label className="block text-sm font-medium text-stone-700 mb-1">Câu hỏi *</label>
                <input
                  type="text"
                  name="question"
                  value={formData.question}
                  onChange={handleInputChange}
                  required
                  className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Câu trả lời *</label>
                <textarea
                  name="answer"
                  value={formData.answer}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Thứ tự</label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleInputChange}
                  className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3"
                />
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
