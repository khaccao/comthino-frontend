import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { publicApi } from '../services/api';
import { BlogCategory, BlogPost, PaginatedResponse } from '../types';
import { absoluteAssetUrl, canonicalUrl, removeJsonLd, upsertLink, upsertMeta } from '../utils/seo';

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : '';
}

function BlogCard({ post }: { post: BlogPost }) {
  const src = absoluteAssetUrl(post.thumbnailUrl || post.coverImageUrl || post.ogImageUrl);
  return (
    <article className="group overflow-hidden rounded-xl border border-quecan-beige/40 bg-white shadow-warm transition hover:-translate-y-1 hover:shadow-warm-lg">
      <Link to={`/tin-tuc/${post.slug}`} className="block h-56 overflow-hidden bg-stone-100">
        <img src={src} alt={post.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </Link>
      <div className="p-5 md:p-6">
        <h2 className="font-serif text-xl font-bold leading-snug text-quecan-brown">
          <Link to={`/tin-tuc/${post.slug}`} className="transition hover:text-quecan-orange">
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-quecan-brown/70">{post.excerpt}</p>
        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-medium text-stone-500">
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

export default function BlogCategoryPage() {
  const { slug = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState<BlogCategory | null>(null);
  const [posts, setPosts] = useState<PaginatedResponse<BlogPost> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const page = Number(searchParams.get('page') || 1);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    publicApi.getBlogPostsByCategory(slug, { page, limit: 9 })
      .then((res) => {
        if (!mounted || !res.success) return;
        setCategory(res.data.category);
        setPosts({
          items: res.data.items,
          total: res.data.total,
          page: res.data.page,
          limit: res.data.limit,
          totalPages: res.data.totalPages,
        });

        const title = `${res.data.category.name} - Tin tức Cơm Thị Nở`;
        const description = res.data.category.description || `Các bài viết thuộc danh mục ${res.data.category.name} của Cơm Thị Nở.`;
        const url = canonicalUrl(`/tin-tuc/danh-muc/${slug}`);

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
      })
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, [slug, page]);

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-quecan-cream">
      <section className="bg-quecan-dark text-quecan-cream">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-18">
          <Link to="/tin-tuc" className="text-sm font-semibold text-quecan-golden hover:text-white">
            Tin tức
          </Link>
          <h1 className="mt-4 font-serif text-4xl font-bold md:text-5xl">{category?.name || 'Danh mục tin'}</h1>
          {category?.description && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-quecan-cream/75">{category.description}</p>}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        {isLoading ? (
          <div className="py-16 text-center text-stone-500">Đang tải bài viết...</div>
        ) : posts && posts.items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.items.map((post) => <BlogCard key={post.id} post={post} />)}
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
                <span className="text-sm font-semibold text-quecan-brown">Trang {posts.page} / {posts.totalPages}</span>
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
            Danh mục này chưa có bài viết đã đăng.
          </div>
        )}
      </section>
    </div>
  );
}
