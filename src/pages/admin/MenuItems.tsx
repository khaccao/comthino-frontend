import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { MenuItem, MenuCategory } from '../../types';
import { Plus, Edit2, Trash2, X, Star, Save, Image as ImageIcon } from 'lucide-react';

export default function MenuItems() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEditingItem, setCurrentEditingItem] = useState<MenuItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    categoryId: '',
    imageUrl: '',
    price: '',
    salePrice: '',
    shortDescription: '',
    description: '',
    ingredients: '',
    isFeatured: false,
    isAvailable: true,
    displayOrder: 0,
  });

  // Media Manager helper state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetching categories and menu items
  const loadData = async () => {
    setIsLoading(true);
    try {
      const catRes = await adminApi.getMenuCategories();
      const itemRes = await adminApi.getMenuItems();
      if (catRes.success) setCategories(catRes.data);
      if (itemRes.success) setItems(itemRes.data);
    } catch (e) {
      console.error('Error loading menu item data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setCurrentEditingItem(null);
    setSelectedFile(null);
    setUploadPreview(null);
    setFormData({
      name: '',
      slug: '',
      categoryId: categories[0]?.id || '',
      imageUrl: '',
      price: '',
      salePrice: '',
      shortDescription: '',
      description: '',
      ingredients: '',
      isFeatured: false,
      isAvailable: true,
      displayOrder: 0,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setCurrentEditingItem(item);
    setSelectedFile(null);
    setUploadPreview(item.imageUrl.startsWith('http') || item.imageUrl.startsWith('/') ? item.imageUrl : `/uploads/${item.imageUrl}`);
    setFormData({
      name: item.name,
      slug: item.slug,
      categoryId: item.categoryId,
      imageUrl: item.imageUrl,
      price: String(item.price),
      salePrice: item.salePrice ? String(item.salePrice) : '',
      shortDescription: item.shortDescription || '',
      description: item.description || '',
      ingredients: item.ingredients || '',
      isFeatured: item.isFeatured,
      isAvailable: item.isAvailable,
      displayOrder: item.displayOrder,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Convert name to friendly slug automatically
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData({
      ...formData,
      name,
      slug,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setUploading(true);

    let imageUrl = formData.imageUrl;

    try {
      // 1. If file is selected, upload image first
      if (selectedFile) {
        const fileForm = new FormData();
        fileForm.append('image', selectedFile);
        const uploadRes = await adminApi.uploadImage(fileForm);
        if (uploadRes.success) {
          imageUrl = uploadRes.url;
        } else {
          setErrorMsg('Lỗi upload ảnh lên server.');
          setUploading(false);
          return;
        }
      }

      if (!imageUrl) {
        setErrorMsg('Vui lòng upload ảnh món ăn hoặc điền URL ảnh.');
        setUploading(false);
        return;
      }

      const postData = {
        ...formData,
        imageUrl,
        price: Number(formData.price),
        salePrice: formData.salePrice ? Number(formData.salePrice) : null,
        displayOrder: Number(formData.displayOrder),
      };

      // 2. Submit menu item
      let res;
      if (currentEditingItem) {
        res = await adminApi.updateMenuItem(currentEditingItem.id, postData);
      } else {
        res = await adminApi.createMenuItem(postData);
      }

      if (res.success) {
        setSuccessMsg(currentEditingItem ? 'Cập nhật món ăn thành công!' : 'Tạo món ăn thành công!');
        setIsModalOpen(false);
        loadData();
      } else {
        setErrorMsg(res.message || 'Lưu thất bại.');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Lỗi kết nối máy chủ.';
      setErrorMsg(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa món ăn này không?')) return;
    try {
      const res = await adminApi.deleteMenuItem(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.message || 'Xóa món ăn thất bại.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatPrice = (price: any) => {
    return Number(price).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Quản Lý Món Ăn</h1>
          <p className="text-sm text-stone-500 mt-1">Danh sách thực đơn, giá cả, và cấu hình hiển thị.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-lg flex items-center space-x-2 text-sm shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm món mới</span>
        </button>
      </div>

      {/* Grid of Dishes */}
      <div className="bg-white rounded-xl shadow-warm border border-stone-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600 border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-700 uppercase text-xs tracking-wider border-b border-stone-200">
                <th className="py-4 px-6 font-bold">Hình ảnh</th>
                <th className="py-4 px-6 font-bold">Tên món / Slug</th>
                <th className="py-4 px-6 font-bold">Danh mục</th>
                <th className="py-4 px-6 font-bold">Giá gốc / Khuyến mãi</th>
                <th className="py-4 px-6 font-bold text-center">Nổi bật</th>
                <th className="py-4 px-6 font-bold text-center">Trạng thái</th>
                <th className="py-4 px-6 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <img
                      src={item.imageUrl.startsWith('http') || item.imageUrl.startsWith('/') ? item.imageUrl : `/uploads/${item.imageUrl}`}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg border border-stone-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=100&auto=format&fit=crop';
                      }}
                    />
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-stone-800 text-sm">{item.name}</p>
                    <p className="text-stone-400 text-xs mt-0.5">{item.slug}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="bg-stone-100 text-stone-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      {item.category?.name || 'Chưa phân loại'}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-medium">
                    {item.salePrice ? (
                      <div className="text-xs">
                        <p className="text-stone-400 line-through">{formatPrice(item.price)}</p>
                        <p className="text-orange-600 font-bold">{formatPrice(item.salePrice)}</p>
                      </div>
                    ) : (
                      <p className="text-stone-700 font-bold">{formatPrice(item.price)}</p>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {item.isFeatured ? (
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500 mx-auto" />
                    ) : (
                      <span className="text-stone-300 font-bold">-</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                        item.isAvailable
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.isAvailable ? 'Còn món' : 'Hết món'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 hover:bg-stone-100 text-stone-500 hover:text-amber-600 rounded transition-colors inline-block"
                      title="Sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 hover:bg-stone-100 text-stone-500 hover:text-rose-600 rounded transition-colors inline-block"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-stone-400">
                    Chưa có món ăn nào được tạo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in border border-stone-200">
            {/* Modal Header */}
            <div className="p-6 border-b flex justify-between items-center bg-stone-50">
              <h2 className="text-lg font-bold text-stone-800">
                {currentEditingItem ? 'Cập Nhật Món Ăn' : 'Thêm Món Ăn Mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded hover:bg-stone-200 text-stone-500 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {errorMsg && (
                <div className="bg-red-50 text-red-800 border border-red-200 p-3 rounded-lg text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Tên món ăn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="Ví dụ: Cá trắm đen kho riềng"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Slug (Auto-generated)
                  </label>
                  <input
                    type="text"
                    required
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Category Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Danh mục thực đơn <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="categoryId"
                    required
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleInputChange}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Giá bán gốc (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="55000"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Sale Price */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Giá khuyến mãi (Nếu có)
                  </label>
                  <input
                    type="number"
                    name="salePrice"
                    value={formData.salePrice}
                    onChange={handleInputChange}
                    placeholder="49000"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Upload Image Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Ảnh món ăn
                </label>
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 bg-stone-50 p-4 rounded-xl border">
                  {uploadPreview ? (
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-lg border border-stone-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-stone-200 text-stone-400 flex items-center justify-center border border-dashed border-stone-300">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                    />
                    <p className="text-[11px] text-stone-400 mt-2">
                      Chọn file ảnh PNG, JPEG, GIF, WEBP dưới 5MB.
                    </p>
                    <div className="mt-2">
                      <span className="text-xs text-stone-400">Hoặc nhập URL trực tiếp:</span>
                      <input
                        type="text"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Short description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Mô tả ngắn (Hiển thị ở trang list)
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Suất cơm kèm sườn rim cốt dừa béo ngậy."
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Long Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Mô tả chi tiết món ăn
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Cách chế biến đặc biệt, nguồn gốc nguyên liệu..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Thành phần chính
                </label>
                <input
                  type="text"
                  name="ingredients"
                  value={formData.ingredients}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Sườn non, nước cốt dừa, gạo tám thơm"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Checks */}
              <div className="flex space-x-8 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-stone-700 select-none">Món ăn nổi bật</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-stone-700 select-none">Đang bán (Còn món)</span>
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="pt-6 border-t flex justify-end space-x-3 bg-stone-50 p-6 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold py-2.5 px-5 rounded-lg text-sm transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-6 rounded-lg text-sm shadow flex items-center space-x-2 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{uploading ? 'Đang lưu...' : 'Lưu món ăn'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
