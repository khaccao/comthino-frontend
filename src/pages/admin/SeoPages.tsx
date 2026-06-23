import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { Plus, Edit2, Trash2, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SeoPages() {
  const [pages, setPages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getSeoPages();
      if (res.success) setPages(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa Landing Page này?')) return;
    try {
      const res = await adminApi.deleteSeoPage(id);
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
        <h1 className="text-2xl font-bold text-stone-800">Landing Pages (SEO)</h1>
        <Link
          to="/admin/seo-pages/new"
          className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo trang mới</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
              <tr>
                <th className="px-6 py-3 font-medium">Tiêu đề</th>
                <th className="px-6 py-3 font-medium">Đường dẫn (Slug)</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
                <th className="px-6 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {pages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-stone-500">
                    Chưa có landing page nào.
                  </td>
                </tr>
              ) : (
                pages.map((page) => (
                  <tr key={page.id} className="hover:bg-stone-50">
                    <td className="px-6 py-4 font-medium text-stone-800">{page.title}</td>
                    <td className="px-6 py-4 text-stone-500">/{page.slug}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${page.isPublished ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'}`}>
                        {page.isPublished ? 'Hiển thị' : 'Đang ẩn'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                      <a
                        href={`/${page.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-stone-400 hover:text-amber-600 rounded hover:bg-stone-100 transition-colors"
                        title="Xem trang"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                      <Link
                        to={`/admin/seo-pages/${page.id}/edit`}
                        className="p-1.5 text-stone-400 hover:text-amber-600 rounded hover:bg-stone-100 transition-colors inline-block"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(page.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded hover:bg-stone-100 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
