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
import { BlogCategory } from '../../types';

const emptyForm = {
  categoryId: '',
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  thumbnailUrl: '',
  coverImageUrl: '',
  authorName: 'Cơm Thị Nở',
  status: 'DRAFT',
  publishedAt: '',
  tags: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  canonicalUrl: '',
  ogTitle: '',
  ogDescription: '',
  ogImageUrl: '',
  schemaType: 'BlogPosting',
  isFeatured: false,
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

function toDatetimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function BlogPostEditor() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      adminApi.getBlogCategories(),
      id ? adminApi.getBlogPost(id) : Promise.resolve(null),
    ])
      .then(([catRes, postRes]) => {
        if (!mounted) return;
        if (catRes.success) {
          setCategories(catRes.data);
          if (!id && catRes.data[0]) {
            setFormData((prev) => ({ ...prev, categoryId: catRes.data[0].id }));
          }
        }

        if (postRes?.success) {
          const post = postRes.data;
          const next = {
            categoryId: post.categoryId,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || '',
            content: post.content || '',
            thumbnailUrl: post.thumbnailUrl || '',
            coverImageUrl: post.coverImageUrl || '',
            authorName: post.authorName || 'Cơm Thị Nở',
            status: post.status || 'DRAFT',
            publishedAt: toDatetimeLocal(post.publishedAt),
            tags: post.tags || '',
            seoTitle: post.seoTitle || '',
            seoDescription: post.seoDescription || '',
            seoKeywords: post.seoKeywords || '',
            canonicalUrl: post.canonicalUrl || '',
            ogTitle: post.ogTitle || '',
            ogDescription: post.ogDescription || '',
            ogImageUrl: post.ogImageUrl || '',
            schemaType: post.schemaType || 'BlogPosting',
            isFeatured: Boolean(post.isFeatured),
            displayOrder: post.displayOrder || 0,
          };
          setFormData(next);
          setTimeout(() => {
            if (editorRef.current) editorRef.current.innerHTML = next.content;
          }, 0);
        }
      })
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, [id]);

  const warnings = useMemo(() => {
    const title = formData.seoTitle || formData.title;
    const description = formData.seoDescription || formData.excerpt;
    const content = formData.content || '';
    const keyword = (formData.seoKeywords || formData.tags || '').split(',')[0]?.trim().toLowerCase();
    const list: string[] = [];

    if (title.length < 50 || title.length > 60) list.push('SEO title nên nằm trong khoảng 50-60 ký tự.');
    if (description.length < 140 || description.length > 160) list.push('SEO description nên nằm trong khoảng 140-160 ký tự.');
    if (formData.slug.length > 75) list.push('Slug đang hơi dài, nên rút gọn để URL đẹp hơn.');
    if (!/<h2|<h3/i.test(content)) list.push('Nội dung nên có ít nhất một H2 hoặc H3.');
    if (!formData.thumbnailUrl) list.push('Bài viết nên có ảnh đại diện.');
    if (/<img(?![^>]*alt=)/i.test(content)) list.push('Ảnh trong bài nên có thuộc tính alt.');
    if (keyword && !`${title} ${description} ${formData.slug}`.toLowerCase().includes(keyword)) {
      list.push('Từ khóa chính nên xuất hiện trong title, description hoặc slug.');
    }
    return list;
  }, [formData]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    const checked = (event.target as HTMLInputElement).checked;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const title = event.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: isEditing ? prev.slug : makeSlug(title),
      seoTitle: prev.seoTitle || title,
      ogTitle: prev.ogTitle || title,
    }));
  };

  const syncContent = () => {
    const html = editorRef.current?.innerHTML || '';
    setFormData((prev) => ({ ...prev, content: html }));
  };

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncContent();
  };

  const insertLink = () => {
    const url = window.prompt('Nhập URL liên kết');
    if (url) runCommand('createLink', url);
  };

  const insertImage = () => {
    const url = window.prompt('Nhập URL ảnh');
    if (!url) return;
    runCommand('insertHTML', `<img src="${url}" alt="${formData.title || 'Ảnh bài viết'}" />`);
  };

  const insertQuote = () => {
    runCommand('insertHTML', '<blockquote>Nhập trích dẫn tại đây...</blockquote>');
  };

  const insertTable = () => {
    runCommand('insertHTML', '<table><tbody><tr><th>Tiêu chí</th><th>Thông tin</th></tr><tr><td>Nội dung</td><td>Giá trị</td></tr></tbody></table>');
  };

  const uploadImage = async (field: 'thumbnailUrl' | 'coverImageUrl' | 'ogImageUrl', file?: File) => {
    if (!file) return;
    const form = new FormData();
    form.append('image', file);
    const res = await adminApi.uploadImage(form);
    if (res.success) setFormData((prev) => ({ ...prev, [field]: res.url }));
  };

  const save = async (nextStatus: 'DRAFT' | 'PUBLISHED') => {
    setIsSaving(true);
    setErrorMsg('');
    const content = editorRef.current?.innerHTML || formData.content;

    try {
      const payload = {
        ...formData,
        status: nextStatus,
        content,
        displayOrder: Number(formData.displayOrder),
        publishedAt: nextStatus === 'PUBLISHED'
          ? formData.publishedAt || new Date().toISOString()
          : formData.publishedAt || null,
      };

      const res = id
        ? await adminApi.updateBlogPost(id, payload)
        : await adminApi.createBlogPost(payload);

      if (res.success) {
        if (nextStatus === 'PUBLISHED') {
          await adminApi.publishBlogPost(res.data.id);
        }
        navigate('/admin/blog/posts');
      } else {
        setErrorMsg(res.message || 'Lưu bài viết thất bại.');
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || 'Không kết nối được máy chủ.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-600" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{isEditing ? 'Sửa bài viết' : 'Viết bài mới'}</h1>
          <p className="mt-1 text-sm text-stone-500">Nội dung, ảnh, SEO và trạng thái xuất bản đều quản trị tại đây.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/blog/posts" className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700">Quay lại</Link>
          <button type="button" onClick={() => setShowPreview(true)} className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700">
            <Eye className="h-4 w-4" /> Xem trước
          </button>
        </div>
      </div>

      {errorMsg && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{errorMsg}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-warm">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">Tiêu đề *</label>
                <input required value={formData.title} onChange={handleTitleChange} className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">Slug</label>
                <input name="slug" value={formData.slug} onChange={handleChange} className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">Danh mục *</label>
                <select required name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-amber-500">
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">Mô tả ngắn</label>
                <textarea name="excerpt" rows={3} value={formData.excerpt} onChange={handleChange} className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-amber-500" />
              </div>
              <ImageField label="Ảnh đại diện" value={formData.thumbnailUrl} onChange={(value) => setFormData((prev) => ({ ...prev, thumbnailUrl: value }))} onUpload={(file) => uploadImage('thumbnailUrl', file)} />
              <ImageField label="Ảnh cover" value={formData.coverImageUrl} onChange={(value) => setFormData((prev) => ({ ...prev, coverImageUrl: value }))} onUpload={(file) => uploadImage('coverImageUrl', file)} />
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">Tác giả</label>
                <input name="authorName" value={formData.authorName} onChange={handleChange} className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">Ngày đăng</label>
                <input type="datetime-local" name="publishedAt" value={formData.publishedAt} onChange={handleChange} className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">Tags</label>
                <input name="tags" value={formData.tags} onChange={handleChange} placeholder="com van phong, ha dong" className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">Thứ tự</label>
                  <input type="number" name="displayOrder" value={formData.displayOrder} onChange={handleChange} className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-amber-500" />
                </div>
                <label className="flex items-end gap-2 pb-2 text-sm font-semibold text-stone-700">
                  <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} className="h-4 w-4 rounded border-stone-300 text-amber-600" />
                  Bài nổi bật
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-stone-200 bg-white shadow-warm">
            <div className="flex flex-wrap gap-1 border-b bg-stone-50 p-3">
              <ToolButton title="H2" onClick={() => runCommand('formatBlock', 'H2')} icon={<Heading2 className="h-4 w-4" />} />
              <ToolButton title="H3" onClick={() => runCommand('formatBlock', 'H3')} icon={<Heading3 className="h-4 w-4" />} />
              <ToolButton title="Đậm" onClick={() => runCommand('bold')} icon={<Bold className="h-4 w-4" />} />
              <ToolButton title="Nghiêng" onClick={() => runCommand('italic')} icon={<Italic className="h-4 w-4" />} />
              <ToolButton title="Bullet list" onClick={() => runCommand('insertUnorderedList')} icon={<List className="h-4 w-4" />} />
              <ToolButton title="Number list" onClick={() => runCommand('insertOrderedList')} icon={<ListOrdered className="h-4 w-4" />} />
              <ToolButton title="Link" onClick={insertLink} icon={<Link2 className="h-4 w-4" />} />
              <ToolButton title="Ảnh" onClick={insertImage} icon={<ImageIcon className="h-4 w-4" />} />
              <ToolButton title="Quote" onClick={insertQuote} icon={<Quote className="h-4 w-4" />} />
              <ToolButton title="Table" onClick={insertTable} icon={<Table2 className="h-4 w-4" />} />
            </div>
            <div
              ref={editorRef}
              contentEditable
              onInput={syncContent}
              className="blog-editor blog-content min-h-[420px] w-full overflow-x-auto p-5 outline-none md:p-7"
              suppressContentEditableWarning
            />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-warm">
            <h2 className="text-lg font-bold text-stone-900">SEO</h2>
            <div className="mt-4 space-y-4">
              <Input label="SEO Title" name="seoTitle" value={formData.seoTitle} onChange={handleChange} />
              <Textarea label="SEO Description" name="seoDescription" value={formData.seoDescription} onChange={handleChange} rows={3} />
              <Input label="SEO Keywords" name="seoKeywords" value={formData.seoKeywords} onChange={handleChange} />
              <Input label="Canonical URL" name="canonicalUrl" value={formData.canonicalUrl} onChange={handleChange} />
              <Input label="OG Title" name="ogTitle" value={formData.ogTitle} onChange={handleChange} />
              <Textarea label="OG Description" name="ogDescription" value={formData.ogDescription} onChange={handleChange} rows={3} />
              <ImageField label="OG Image" value={formData.ogImageUrl} onChange={(value) => setFormData((prev) => ({ ...prev, ogImageUrl: value }))} onUpload={(file) => uploadImage('ogImageUrl', file)} />
            </div>
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-warm">
            <h2 className="text-lg font-bold text-stone-900">Google preview</h2>
            <div className="mt-4 rounded-lg border border-stone-200 p-4">
              <p className="truncate text-sm text-emerald-700">https://comthino.com/tin-tuc/{formData.slug || 'slug-bai-viet'}</p>
              <p className="mt-1 text-lg leading-snug text-blue-700">{formData.seoTitle || formData.title || 'Tiêu đề bài viết'}</p>
              <p className="mt-1 line-clamp-3 text-sm text-stone-600">{formData.seoDescription || formData.excerpt || 'Mô tả ngắn của bài viết sẽ hiển thị tại đây.'}</p>
            </div>
            {warnings.length > 0 && (
              <ul className="mt-4 space-y-2 text-xs text-amber-800">
                {warnings.map((warning) => <li key={warning} className="rounded bg-amber-50 p-2">{warning}</li>)}
              </ul>
            )}
          </section>

          <div className="sticky bottom-4 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-warm-lg">
            <button type="button" disabled={isSaving} onClick={() => save('DRAFT')} className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 disabled:opacity-50">
              <Save className="h-4 w-4" /> Lưu nháp
            </button>
            <button type="button" disabled={isSaving} onClick={() => save('PUBLISHED')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              <Send className="h-4 w-4" /> Đăng bài
            </button>
          </div>
        </aside>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
              <h2 className="text-lg font-bold text-stone-900">Xem trước bài viết</h2>
              <button onClick={() => setShowPreview(false)} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-bold">Đóng</button>
            </div>
            <div className="p-6 md:p-8">
              <h1 className="font-serif text-3xl font-bold text-quecan-brown">{formData.title || 'Tiêu đề bài viết'}</h1>
              {formData.excerpt && <p className="mt-3 text-stone-600">{formData.excerpt}</p>}
              {(formData.coverImageUrl || formData.thumbnailUrl) && <img src={formData.coverImageUrl || formData.thumbnailUrl} alt={formData.title} className="mt-6 max-h-96 w-full rounded-xl object-cover" />}
              <div className="blog-content mt-6" dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || formData.content }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolButton({ title, icon, onClick }: { title: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" title={title} onMouseDown={(event) => event.preventDefault()} onClick={onClick} className="inline-flex h-9 w-9 items-center justify-center rounded border border-stone-200 bg-white text-stone-600 hover:border-amber-500 hover:text-amber-600">
      {icon}
    </button>
  );
}

function Input({ label, ...props }: { label: string; name: string; value: string; onChange: React.ChangeEventHandler<HTMLInputElement> }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">{label}</label>
      <input {...props} className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-amber-500" />
    </div>
  );
}

function Textarea({ label, ...props }: { label: string; name: string; value: string; rows: number; onChange: React.ChangeEventHandler<HTMLTextAreaElement> }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">{label}</label>
      <textarea {...props} className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-amber-500" />
    </div>
  );
}

function ImageField({ label, value, onChange, onUpload }: { label: string; value: string; onChange: (value: string) => void; onUpload: (file?: File) => void }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">{label}</label>
      <div className="space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
        {value && <img src={value} alt={label} className="h-24 w-full rounded-md object-cover" />}
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="URL ảnh hoặc upload file" className="w-full rounded border border-stone-200 bg-white px-3 py-2 text-xs outline-none focus:border-amber-500" />
        <input type="file" accept="image/*" onChange={(event) => onUpload(event.target.files?.[0])} className="block w-full text-xs text-stone-500 file:mr-3 file:rounded file:border-0 file:bg-amber-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-amber-800" />
      </div>
    </div>
  );
}
