import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Eye, FilePlus2, Search, Send, Trash2, Undo2 } from 'lucide-react';
import { adminApi } from '../../services/api';
import { BlogCategory, BlogPost, PaginatedResponse } from '../../types';
import { absoluteAssetUrl } from '../../utils/seo';

const statusLabels: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã đăng',
  ARCHIVED: 'Lưu trữ',
};

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : '-';
}

function statusClass(status: string) {
  if (status === 'PUBLISHED') return 'bg-emerald-100 text-emerald-800';
  if (status === 'ARCHIVED') return 'bg-stone-100 text-stone-700';
  return 'bg-amber-100 text-amber-800';
}

export default function BlogPosts() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [posts, setPosts] = useState<PaginatedResponse<BlogPost> | null>(null);
  const [filters, setFilters] = useState({ keyword: '', categoryId: '', status: '', page: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async (nextFilters = filters) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [catRes, postRes] = await Promise.all([
        adminApi.getBlogCategories(),
        adminApi.getBlogPosts({
          page: nextFilters.page,
          limit: 10,
          keyword: nextFilters.keyword || undefined,
          categoryId: nextFilters.categoryId || undefined,
          status: nextFilters.status || undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
      ]);
      if (catRes.success) setCategories(catRes.data);
      if (postRes.success) setPosts(postRes.data);
      else setErrorMsg(postRes.message || 'Không tải được bài viết.');
    } catch (error: any) {
      setPosts(null);
      setErrorMsg(error.response?.data?.message || 'Không tải được bài viết.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.categoryId, filters.status]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const nextFilters = { ...filters, page: 1 };
    setFilters(nextFilters);
    loadData(nextFilters);
  };

  const publish = async (id: string) => {
    const res = await adminApi.publishBlogPost(id);
    if (res.success) loadData();
  };

  const unpublish = async (id: string) => {
    const res = await adminApi.unpublishBlogPost(id);
    if (res.success) loadData();
  };

  const deletePost = async (id: string) => {
    if (!window.confirm('Xóa bài viết này?')) return;
    const res = await adminApi.deleteBlogPost(id);
    if (res.success) loadData();
    else alert(res.message || 'Xóa bài viết thất bại.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Danh sách bài viết</h1>
          <p className="mt-1 text-sm text-stone-500">Quản lý tin tức, SEO và trạng thái xuất bản.</p>
        </div>
        <Link to="/admin/blog/posts/new" className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-amber-500">
          <FilePlus2 className="h-4 w-4" />
          Viết bài mới
        </Link>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-warm">
        <form onSubmit={submitSearch} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_160px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={filters.keyword}
              onChange={(event) => setFilters((prev) => ({ ...prev, keyword: event.target.value }))}
              placeholder="Tìm theo tiêu đề, mô tả, tag..."
              className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-500"
            />
          </div>
          <select
            value={filters.categoryId}
            onChange={(event) => setFilters((prev) => ({ ...prev, categoryId: event.target.value, page: 1 }))}
            className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-amber-500"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }))}
            className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-amber-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Nháp</option>
            <option value="PUBLISHED">Đã đăng</option>
            <option value="ARCHIVED">Lưu trữ</option>
          </select>
          <button type="submit" className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white">Lọc</button>
        </form>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {errorMsg}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-stone-200/60 bg-white shadow-warm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-stone-600">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-700">
                <th className="px-6 py-4 font-bold">Ảnh</th>
                <th className="px-6 py-4 font-bold">Tiêu đề</th>
                <th className="px-6 py-4 font-bold">Danh mục</th>
                <th className="px-6 py-4 font-bold text-center">Trạng thái</th>
                <th className="px-6 py-4 font-bold">Ngày đăng</th>
                <th className="px-6 py-4 font-bold text-center">Lượt xem</th>
                <th className="px-6 py-4 text-right font-bold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-stone-400">Đang tải...</td></tr>
              ) : posts && posts.items.length > 0 ? posts.items.map((post) => (
                <tr key={post.id} className="transition hover:bg-stone-50/60">
                  <td className="px-6 py-4">
                    <img src={absoluteAssetUrl(post.thumbnailUrl || post.coverImageUrl)} alt={post.title} className="h-12 w-16 rounded-lg object-cover border border-stone-200" />
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-stone-800">{post.title}</p>
                    <p className="mt-1 max-w-xs truncate text-xs text-stone-400">{post.slug}</p>
                  </td>
                  <td className="px-6 py-4">{post.category?.name || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${statusClass(post.status)}`}>{statusLabels[post.status] || post.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(post.publishedAt)}</td>
                  <td className="px-6 py-4 text-center font-semibold">{post.viewCount}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {post.status === 'PUBLISHED' && (
                      <a href={`/tin-tuc/${post.slug}`} target="_blank" rel="noreferrer" className="inline-flex rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-blue-600" title="Xem trước">
                        <Eye className="h-4 w-4" />
                      </a>
                    )}
                    <Link to={`/admin/blog/posts/${post.id}/edit`} className="inline-flex rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-amber-600" title="Sửa">
                      <Edit2 className="h-4 w-4" />
                    </Link>
                    {post.status === 'PUBLISHED' ? (
                      <button onClick={() => unpublish(post.id)} className="inline-flex rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900" title="Gỡ bài">
                        <Undo2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <button onClick={() => publish(post.id)} className="inline-flex rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-emerald-600" title="Đăng bài">
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => deletePost(post.id)} className="inline-flex rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-rose-600" title="Xóa">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-stone-400">Chưa có bài viết.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {posts && posts.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={filters.page <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40">
            Trước
          </button>
          <span className="text-sm font-semibold text-stone-600">Trang {posts.page} / {posts.totalPages}</span>
          <button disabled={filters.page >= posts.totalPages} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40">
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
