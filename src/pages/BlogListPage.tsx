import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Search } from 'lucide-react';
import { publicApi } from '../services/api';
import { BlogCategory, BlogPost, PaginatedResponse } from '../types';
import { absoluteAssetUrl, canonicalUrl, removeJsonLd, upsertLink, upsertMeta } from '../utils/seo';

function formatDate(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('vi-VN');
}

function imageUrl(post: BlogPost) {
  return absoluteAssetUrl(post.thumbnailUrl || post.coverImageUrl || post.ogImageUrl);
}

function BlogCard({ post, large = false }: { post: BlogPost; large?: boolean }) {
  return (
    <article className={`group overflow-hidden rounded-xl border border-quecan-beige/40 bg-white shadow-warm transition hover:-translate-y-1 hover:shadow-warm-lg ${large ? 'lg:grid lg:grid-cols-[1.1fr_0.9fr]' : ''}`}>
      <Link to={`/tin-tuc/${post.slug}`} className={`block overflow-hidden bg-stone-100 ${large ? 'h-72 lg:h-full' : 'h-56'}`}>
        <img
          src={imageUrl(post)}
          alt={post.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="flex h-full flex-col p-5 md:p-6">
        {post.category && (
          <Link
            to={`/tin-tuc/danh-muc/${post.category.slug}`}
            className="mb-3 w-fit rounded-full bg-quecan-orange/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-quecan-orange"
          >
            {post.category.name}
          </Link>
        )}
        <h2 className={`${large ? 'text-2xl md:text-3xl' : 'text-xl'} font-serif font-bold leading-snug text-quecan-brown`}>
          <Link to={`/tin-tuc/${post.slug}`} className="transition hover:text-quecan-orange">
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-quecan-brown/70">
          {post.excerpt}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-5 text-xs font-medium text-stone-500">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-quecan-orange" />
            {formatDate(post.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-quecan-orange" />
            {post.readingTime} phút đọc
          </span>
        </div>
      </div>
    </article>
  );
}

export default function BlogListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [featured, setFeatured] = useState<BlogPost[]>([]);
  const [posts, setPosts] = useState<PaginatedResponse<BlogPost> | null>(null);
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [isLoading, setIsLoading] = useState(true);

  const page = Number(searchParams.get('page') || 1);
  const query = searchParams.get('q') || '';

  useEffect(() => {
    const title = 'Tin tức Cơm Thị Nở - Món ngon, thực đơn và ưu đãi';
    const description = 'Tin tức Cơm Thị Nở: thực đơn hôm nay, món ngon Bắc Bộ, kinh nghiệm đặt cơm văn phòng và ưu đãi mới.';
    const url = canonicalUrl('/tin-tuc');

    document.title = title;
    upsertLink('link[rel="canonical"]', { href: url });
    upsertMeta('meta[name="description"]', { content: description });
    upsertMeta('meta[property="og:type"]', { content: 'website' });
    upsertMeta('meta[property="og:url"]', { content: url });
    upsertMeta('meta[property="og:title"]', { content: title });
    upsertMeta('meta[property="og:description"]', { content: description });
    upsertMeta('meta[name="twitter:card"]', { content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { content: title });
    upsertMeta('meta[name="twitter:description"]', { content: description });
    removeJsonLd('blog-post-jsonld');
    removeJsonLd('blog-breadcrumb-jsonld');
  }, []);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    Promise.all([
      publicApi.getBlogCategories(),
      publicApi.getFeaturedBlogPosts(),
      publicApi.getBlogPosts({ page, limit: 9, keyword: query || undefined }),
    ])
      .then(([catRes, featuredRes, postRes]) => {
        if (!mounted) return;
        if (catRes.success) setCategories(catRes.data);
        if (featuredRes.success) setFeatured(featuredRes.data);
        if (postRes.success) setPosts(postRes.data);
      })
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, [page, query]);

  const mainFeatured = useMemo(() => featured[0], [featured]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams();
    if (keyword.trim()) next.set('q', keyword.trim());
    setSearchParams(next);
  };

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-quecan-cream">
      <section className="bg-quecan-dark text-quecan-cream">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-quecan-golden">Tin tức & món ngon</p>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-tight md:text-5xl">Blog Cơm Thị Nở</h1>
            <p className="mt-4 text-sm leading-relaxed text-quecan-cream/75 md:text-base">
              Cập nhật thực đơn, câu chuyện món Bắc, kinh nghiệm đặt cơm văn phòng và ưu đãi mới từ quán.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Link
              to="/tin-tuc"
              className="whitespace-nowrap rounded-full bg-quecan-brown px-4 py-2 text-sm font-semibold text-white"
            >
              Tất cả
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/tin-tuc/danh-muc/${category.slug}`}
                className="whitespace-nowrap rounded-full border border-quecan-brown/20 bg-white px-4 py-2 text-sm font-semibold text-quecan-brown transition hover:border-quecan-orange hover:text-quecan-orange"
              >
                {category.name}
              </Link>
            ))}
          </div>

          <form onSubmit={submitSearch} className="flex w-full gap-2 sm:max-w-sm">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm bài viết..."
                className="w-full rounded-full border border-quecan-brown/15 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-quecan-orange"
              />
            </div>
            <button type="submit" className="rounded-full bg-quecan-orange px-5 py-2 text-sm font-bold text-white shadow-warm">
              Tìm
            </button>
          </form>
        </div>

        {mainFeatured && !query && page === 1 && (
          <div className="mb-10">
            <BlogCard post={mainFeatured} large />
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-stone-500">Đang tải tin tức...</div>
        ) : posts && posts.items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.items.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {posts.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={posts.page <= 1}
                  onClick={() => changePage(posts.page - 1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-quecan-brown/20 bg-white text-quecan-brown disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-quecan-brown">
                  Trang {posts.page} / {posts.totalPages}
                </span>
                <button
                  type="button"
                  disabled={posts.page >= posts.totalPages}
                  onClick={() => changePage(posts.page + 1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-quecan-brown/20 bg-white text-quecan-brown disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-quecan-brown/20 bg-white p-10 text-center text-stone-500">
            Chưa có bài viết phù hợp.
          </div>
        )}
      </section>
    </div>
  );
}
