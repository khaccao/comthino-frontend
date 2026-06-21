import React, { useEffect, useState } from 'react';
import { Edit2, Plus, Save, Trash2, X } from 'lucide-react';
import { adminApi } from '../../services/api';
import { BlogCategory } from '../../types';

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  displayOrder: 0,
  isActive: true,
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function BlogCategories() {
  const [items, setItems] = useState<BlogCategory[]>([]);
  const [current, setCurrent] = useState<BlogCategory | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getBlogCategories();
      if (res.success) setItems(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setCurrent(null);
    setFormData(emptyForm);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEdit = (category: BlogCategory) => {
    setCurrent(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    setFormData((prev) => ({ ...prev, name, slug: current ? prev.slug : makeSlug(name) }));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    const checked = (event.target as HTMLInputElement).checked;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');

    try {
      const payload = {
        ...formData,
        displayOrder: Number(formData.displayOrder),
      };
      const res = current
        ? await adminApi.updateBlogCategory(current.id, payload)
        : await adminApi.createBlogCategory(payload);

      if (res.success) {
        setIsModalOpen(false);
        loadData();
      } else {
        setErrorMsg(res.message || 'Lưu danh mục thất bại.');
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Không kết nối được máy chủ.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa danh mục này? Các bài viết trong danh mục cũng sẽ bị xóa.')) return;
    const res = await adminApi.deleteBlogCategory(id);
    if (res.success) loadData();
    else alert(res.message || 'Xóa danh mục thất bại.');
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-600" /></div>;
  }

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Danh mục tin</h1>
          <p className="mt-1 text-sm text-stone-500">Quản lý nhóm bài viết hiển thị ngoài trang Tin tức.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-amber-500">
          <Plus className="h-4 w-4" />
          Thêm danh mục
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200/60 bg-white shadow-warm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-stone-600">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-700">
                <th className="px-6 py-4 font-bold">Tên danh mục</th>
                <th className="px-6 py-4 font-bold">Slug</th>
                <th className="px-6 py-4 font-bold text-center">Thứ tự</th>
                <th className="px-6 py-4 font-bold text-center">Bài viết</th>
                <th className="px-6 py-4 font-bold text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right font-bold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((item) => (
                <tr key={item.id} className="transition hover:bg-stone-50/60">
                  <td className="px-6 py-4">
                    <p className="font-bold text-stone-800">{item.name}</p>
                    <p className="mt-1 max-w-xs truncate text-xs text-stone-400">{item.description || '-'}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-stone-500">{item.slug}</td>
                  <td className="px-6 py-4 text-center font-semibold">{item.displayOrder}</td>
                  <td className="px-6 py-4 text-center">{item._count?.posts || 0}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${item.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'}`}>
                      {item.isActive ? 'Hiển thị' : 'Đang ẩn'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button onClick={() => openEdit(item)} className="inline-flex rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-amber-600" title="Sửa">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="inline-flex rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-rose-600" title="Xóa">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b bg-stone-50 p-5">
              <h2 className="text-lg font-bold text-stone-800">{current ? 'Cập nhật danh mục' : 'Thêm danh mục tin'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded p-1.5 text-stone-500 hover:bg-stone-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {errorMsg && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">{errorMsg}</div>}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">Tên danh mục *</label>
                <input required value={formData.name} onChange={handleNameChange} className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">Slug</label>
                <input name="slug" value={formData.slug} onChange={handleChange} className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">Mô tả</label>
                <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">Thứ tự</label>
                  <input type="number" name="displayOrder" value={formData.displayOrder} onChange={handleChange} className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-amber-500" />
                </div>
                <label className="flex items-end gap-2 pb-2 text-sm font-semibold text-stone-700">
                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 rounded border-stone-300 text-amber-600" />
                  Hiển thị
                </label>
              </div>
              <div className="flex justify-end gap-3 border-t pt-5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-bold text-stone-700 hover:bg-stone-100">Hủy</button>
                <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-500">
                  <Save className="h-4 w-4" />
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
