import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { SiteSettings as SettingsType } from '../../types';
import { Save, AlertCircle } from 'lucide-react';

export default function SiteSettings() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; content: string }>({
    type: null,
    content: ''
  });

  useEffect(() => {
    adminApi.getSiteSettings()
      .then((res) => {
        if (res.success) setSettings(res.data);
      })
      .catch((err) => console.error('Error fetching settings:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    setMessage({ type: null, content: '' });

    try {
      const res = await adminApi.updateSiteSettings(settings);
      if (res.success) {
        setMessage({ type: 'success', content: res.message || 'Lưu cấu hình thành công!' });
        setSettings(res.data);
      } else {
        setMessage({ type: 'error', content: res.message || 'Lưu cấu hình thất bại.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', content: 'Có lỗi xảy ra khi kết nối máy chủ.' });
    } finally {
      setIsSaving(false);
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
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 font-sans">Thông Tin Website</h1>
        <p className="text-sm text-stone-500 mt-1">
          Cấu hình thông tin liên hệ, màu sắc chủ đạo, ảnh đại diện và SEO toàn trang.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {message.type && (
          <div
            className={`p-4 rounded-xl border text-sm font-semibold flex items-center space-x-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{message.content}</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-warm border border-stone-200/60 p-6 space-y-6">
          <h2 className="text-base font-bold text-stone-800 border-b pb-2">Thông tin chung</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Tên cửa hàng / website
              </label>
              <input
                type="text"
                name="siteName"
                value={settings?.siteName || ''}
                onChange={handleChange}
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Slogan quán
              </label>
              <input
                type="text"
                name="slogan"
                value={settings?.slogan || ''}
                onChange={handleChange}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Số điện thoại liên hệ
              </label>
              <input
                type="text"
                name="phone"
                value={settings?.phone || ''}
                onChange={handleChange}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Email nhận liên hệ
              </label>
              <input
                type="email"
                name="email"
                value={settings?.email || ''}
                onChange={handleChange}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Địa chỉ cửa hàng
              </label>
              <input
                type="text"
                name="address"
                value={settings?.address || ''}
                onChange={handleChange}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Giờ mở cửa
              </label>
              <input
                type="text"
                name="openingHours"
                value={settings?.openingHours || ''}
                onChange={handleChange}
                placeholder="09:00 - 22:00 (Hằng ngày)"
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Đường dẫn Facebook Fanpage
              </label>
              <input
                type="text"
                name="facebookUrl"
                value={settings?.facebookUrl || ''}
                onChange={handleChange}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Số Zalo liên hệ trực tiếp
              </label>
              <input
                type="text"
                name="zaloUrl"
                value={settings?.zaloUrl || ''}
                onChange={handleChange}
                placeholder="Ví dụ: https://zalo.me/0987654321"
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Link nhúng bản đồ Google Maps (iframe src)
              </label>
              <textarea
                name="googleMapUrl"
                value={settings?.googleMapUrl || ''}
                onChange={handleChange}
                rows={3}
                placeholder="Chỉ copy phần https://www.google.com/maps/embed?..."
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-warm border border-stone-200/60 p-6 space-y-6">
          <h2 className="text-base font-bold text-stone-800 border-b pb-2">Giao diện (Mã màu)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Màu chủ đạo (Primary)
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  name="primaryColor"
                  value={settings?.primaryColor || '#4A250F'}
                  onChange={handleChange}
                  className="w-10 h-10 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="primaryColor"
                  value={settings?.primaryColor || '#4A250F'}
                  onChange={handleChange}
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-sm uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Màu phụ (Secondary)
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  name="secondaryColor"
                  value={settings?.secondaryColor || '#C96A24'}
                  onChange={handleChange}
                  className="w-10 h-10 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="secondaryColor"
                  value={settings?.secondaryColor || '#C96A24'}
                  onChange={handleChange}
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-sm uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Màu nhấn (Accent)
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  name="accentColor"
                  value={settings?.accentColor || '#D99A2B'}
                  onChange={handleChange}
                  className="w-10 h-10 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="accentColor"
                  value={settings?.accentColor || '#D99A2B'}
                  onChange={handleChange}
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-sm uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-warm border border-stone-200/60 p-6 space-y-6">
          <h2 className="text-base font-bold text-stone-800 border-b pb-2">Cấu hình SEO</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                SEO Title
              </label>
              <input
                type="text"
                name="seoTitle"
                value={settings?.seoTitle || ''}
                onChange={handleChange}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                SEO Keywords (Phân tách bằng dấu phẩy)
              </label>
              <input
                type="text"
                name="seoKeywords"
                value={settings?.seoKeywords || ''}
                onChange={handleChange}
                placeholder="cơm quê, cơm văn phòng, cơm ngon hà nội"
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                SEO Description
              </label>
              <textarea
                name="seoDescription"
                value={settings?.seoDescription || ''}
                onChange={handleChange}
                rows={3}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg flex items-center space-x-2 text-sm uppercase tracking-wider disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
