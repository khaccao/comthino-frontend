import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Bold,
  Eye,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Save,
  Send,
  Table2,
} from 'lucide-react';
import { adminApi } from '../../services/api';

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImageUrl: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  canonicalUrl: '',
  ogTitle: '',
  ogDescription: '',
  ogImageUrl: '',
  schemaType: 'WebPage',
  isPublished: true,
  displayOrder: 0,
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

export default function SeoPageEditor() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (id) {
      adminApi.getSeoPage(id)
        .then((res) => {
          if (!mounted) return;
          if (res?.success) {
            const page = res.data;
            const next = {
              title: page.title,
              slug: page.slug,
              excerpt: page.excerpt || '',
              content: page.content || '',
              coverImageUrl: page.coverImageUrl || '',
              seoTitle: page.seoTitle || '',
              seoDescription: page.seoDescription || '',
              seoKeywords: page.seoKeywords || '',
              canonicalUrl: page.canonicalUrl || '',
              ogTitle: page.ogTitle || '',
              ogDescription: page.ogDescription || '',
              ogImageUrl: page.ogImageUrl || '',
              schemaType: page.schemaType || 'WebPage',
              isPublished: Boolean(page.isPublished),
              displayOrder: page.displayOrder || 0,
            };
            setFormData(next);
            setTimeout(() => {
              if (editorRef.current) editorRef.current.innerHTML = next.content;
            }, 0);
          }
        })
        .finally(() => mounted && setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  const warnings = useMemo(() => {
    const title = formData.seoTitle || formData.title;
    const description = formData.seoDescription || formData.excerpt;
    const content = formData.content || '';
    const keyword = (formData.seoKeywords || '').split(',')[0]?.trim().toLowerCase();
    const list: string[] = [];

    if (title.length < 50 || title.length > 60) list.push('SEO title nên nằm trong khoảng 50-60 ký tự.');
    if (description.length < 140 || description.length > 160) list.push('SEO description nên nằm trong khoảng 140-160 ký tự.');
    if (formData.slug.length > 75) list.push('Slug đang hơi dài, nên rút gọn để URL đẹp hơn.');
    if (!/<h2|<h3/i.test(content)) list.push('Nội dung nên có ít nhất một H2 hoặc H3.');
    if (!formData.coverImageUrl) list.push('Nên có ảnh bìa (Cover Image).');
    if (/<img(?![^>]*alt=)/i.test(content)) list.push('Ảnh trong bài nên có thuộc tính alt.');
    if (keyword && !`${title} ${description} ${formData.slug}`.toLowerCase().includes(keyword)) {
      list.push('Từ khóa chính nên xuất hiện trong title, description hoặc slug.');
    }
    return list;
  }, [formData]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    let nextValue: any = value;
    if (type === 'checkbox') {
      nextValue = (event.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      nextValue = Number(value);
    }
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setFormData((prev) => ({ ...prev, content: editorRef.current?.innerHTML || '' }));
      editorRef.current.focus();
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setFormData((prev) => ({ ...prev, content: editorRef.current?.innerHTML || '' }));
    }
  };

  const handleEditorPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleSave = async () => {
    setErrorMsg('');
    if (!formData.title || !formData.slug) {
      setErrorMsg('Vui lòng nhập đầy đủ tiêu đề và slug.');
      window.scrollTo(0, 0);
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...formData };
      let res;
      if (isEditing) {
        res = await adminApi.updateSeoPage(id as string, payload);
      } else {
        res = await adminApi.createSeoPage(payload);
      }

      if (res.success) {
        navigate('/admin/seo-pages');
      } else {
        setErrorMsg(res.message || 'Có lỗi xảy ra.');
        window.scrollTo(0, 0);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra.');
      window.scrollTo(0, 0);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-stone-500">Đang tải nội dung...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800">
          {isEditing ? 'Sửa Landing Page' : 'Tạo Landing Page'}
        </h1>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2 text-stone-600 hover:text-stone-900 bg-white border border-stone-200 hover:bg-stone-50 px-4 py-2 rounded-md transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">{showPreview ? 'Đóng xem trước' : 'Xem trước'}</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{isSaving ? 'Đang lưu...' : 'Lưu trang'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-amber-800 mb-2">Gợi ý tối ưu SEO:</h3>
          <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Tiêu đề (H1) *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    title: e.target.value,
                    slug: prev.slug || makeSlug(e.target.value),
                  }));
                }}
                className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-lg py-2 px-3"
                placeholder="Nhập tiêu đề..."
                required
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-stone-700 mb-1">Slug *</label>
                <div className="flex items-center">
                  <span className="text-stone-500 bg-stone-50 border border-r-0 border-stone-300 rounded-l-md px-3 py-2 text-sm">
                    /
                  </span>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="flex-1 border-stone-300 rounded-r-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3"
                    required
                  />
                </div>
              </div>
              <div className="w-32">
                 <label className="block text-sm font-medium text-stone-700 mb-1">Schema Type</label>
                 <select
                  name="schemaType"
                  value={formData.schemaType}
                  onChange={handleChange}
                  className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3"
                >
                  <option value="WebPage">WebPage</option>
                  <option value="Article">Article</option>
                  <option value="LocalBusiness">LocalBusiness</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="FAQPage">FAQPage</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Mô tả ngắn (Excerpt)</label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                rows={3}
                className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3"
              />
            </div>
          </div>

          {/* Editor */}
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 flex flex-col">
            <div className="px-4 py-2 border-b border-stone-200 bg-stone-50 flex flex-wrap gap-1 sticky top-0 z-10">
              <button onClick={() => execCmd('bold')} title="In đậm" className="p-2 text-stone-600 hover:bg-stone-200 rounded">
                <Bold className="w-4 h-4" />
              </button>
              <button onClick={() => execCmd('italic')} title="In nghiêng" className="p-2 text-stone-600 hover:bg-stone-200 rounded">
                <Italic className="w-4 h-4" />
              </button>
              <div className="w-px bg-stone-300 mx-1"></div>
              <button onClick={() => execCmd('formatBlock', 'H2')} title="Heading 2" className="p-2 text-stone-600 hover:bg-stone-200 rounded">
                <Heading2 className="w-4 h-4" />
              </button>
              <button onClick={() => execCmd('formatBlock', 'H3')} title="Heading 3" className="p-2 text-stone-600 hover:bg-stone-200 rounded">
                <Heading3 className="w-4 h-4" />
              </button>
              <div className="w-px bg-stone-300 mx-1"></div>
              <button onClick={() => execCmd('insertUnorderedList')} title="List" className="p-2 text-stone-600 hover:bg-stone-200 rounded">
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => execCmd('insertOrderedList')} title="Ordered List" className="p-2 text-stone-600 hover:bg-stone-200 rounded">
                <ListOrdered className="w-4 h-4" />
              </button>
              <button onClick={() => execCmd('formatBlock', 'BLOCKQUOTE')} title="Quote" className="p-2 text-stone-600 hover:bg-stone-200 rounded">
                <Quote className="w-4 h-4" />
              </button>
              <div className="w-px bg-stone-300 mx-1"></div>
              <button
                onClick={() => {
                  const url = window.prompt('Nhập đường dẫn liên kết:');
                  if (url) execCmd('createLink', url);
                }}
                title="Link"
                className="p-2 text-stone-600 hover:bg-stone-200 rounded"
              >
                <Link2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const url = window.prompt('Nhập đường dẫn hình ảnh:');
                  if (url) execCmd('insertImage', url);
                }}
                title="Image"
                className="p-2 text-stone-600 hover:bg-stone-200 rounded"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 relative">
              {showPreview ? (
                <div
                  className="prose max-w-none min-h-[400px]"
                  dangerouslySetInnerHTML={{ __html: formData.content }}
                />
              ) : (
                <div
                  ref={editorRef}
                  className="prose max-w-none min-h-[400px] outline-none"
                  contentEditable
                  onInput={handleEditorInput}
                  onPaste={handleEditorPaste}
                />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 space-y-4">
            <h2 className="font-semibold text-stone-800 border-b border-stone-100 pb-2">Xuất bản</h2>
            
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="isPublished"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
                className="h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
              />
              <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
                Hiển thị (Published)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Thứ tự hiển thị</label>
              <input
                type="number"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleChange}
                className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Ảnh bìa (Cover URL)</label>
              <input
                type="text"
                name="coverImageUrl"
                value={formData.coverImageUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3"
              />
              {formData.coverImageUrl && (
                <img
                  src={formData.coverImageUrl}
                  alt="Cover"
                  className="mt-2 w-full h-32 object-cover rounded border border-stone-200"
                />
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 space-y-4">
            <h2 className="font-semibold text-stone-800 border-b border-stone-100 pb-2">Thẻ Meta SEO</h2>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                SEO Title <span className="text-stone-400 font-normal">({formData.seoTitle.length} ký tự)</span>
              </label>
              <input
                type="text"
                name="seoTitle"
                value={formData.seoTitle}
                onChange={handleChange}
                placeholder="Mặc định lấy tiêu đề..."
                className={`w-full border rounded-md shadow-sm focus:ring-amber-500 text-sm py-2 px-3 ${
                  formData.seoTitle.length > 60 ? 'border-amber-500 focus:border-amber-500' : 'border-stone-300 focus:border-amber-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                SEO Description <span className="text-stone-400 font-normal">({formData.seoDescription.length} ký tự)</span>
              </label>
              <textarea
                name="seoDescription"
                value={formData.seoDescription}
                onChange={handleChange}
                rows={3}
                placeholder="Mặc định lấy mô tả ngắn..."
                className={`w-full border rounded-md shadow-sm focus:ring-amber-500 text-sm py-2 px-3 ${
                  formData.seoDescription.length > 160 ? 'border-amber-500 focus:border-amber-500' : 'border-stone-300 focus:border-amber-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">SEO Keywords</label>
              <input
                type="text"
                name="seoKeywords"
                value={formData.seoKeywords}
                onChange={handleChange}
                placeholder="Từ khóa 1, Từ khóa 2..."
                className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Canonical URL</label>
              <input
                type="text"
                name="canonicalUrl"
                value={formData.canonicalUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 space-y-4">
            <h2 className="font-semibold text-stone-800 border-b border-stone-100 pb-2">Social (Open Graph)</h2>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">OG Title</label>
              <input
                type="text"
                name="ogTitle"
                value={formData.ogTitle}
                onChange={handleChange}
                className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">OG Description</label>
              <textarea
                name="ogDescription"
                value={formData.ogDescription}
                onChange={handleChange}
                rows={2}
                className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">OG Image URL</label>
              <input
                type="text"
                name="ogImageUrl"
                value={formData.ogImageUrl}
                onChange={handleChange}
                className="w-full border-stone-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm py-2 px-3"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
