import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Clock, Facebook, Phone, Share2 } from 'lucide-react';
import { publicApi } from '../services/api';
import { BlogPost } from '../types';
import { absoluteAssetUrl, canonicalUrl, upsertJsonLd, upsertLink, upsertMeta } from '../utils/seo';

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : '';
}

function stripHtml(input = '') {
  return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function imageUrl(post: BlogPost) {
  return absoluteAssetUrl(post.coverImageUrl || post.thumbnailUrl || post.ogImageUrl);
}

export default function BlogDetailPage() {
  const { slug = '' } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    publicApi.getBlogPost(slug)
      .then((res) => {
        if (!mounted || !res.success) return;
        const item: BlogPost = res.data;
        setPost(item);

        const title = item.seoTitle || item.ogTitle || item.title;
        const description = item.seoDescription || item.ogDescription || item.excerpt || stripHtml(item.content).slice(0, 155);
        const url = item.canonicalUrl || canonicalUrl(`/tin-tuc/${item.slug}`);
        const image = absoluteAssetUrl(item.ogImageUrl || item.coverImageUrl || item.thumbnailUrl);

        document.title = title;
        upsertLink('link[rel="canonical"]', { href: url });
        upsertMeta('meta[name="title"]', { content: title });
        upsertMeta('meta[name="description"]', { content: description });
        upsertMeta('meta[name="keywords"]', { content: item.seoKeywords || item.tags || '' });
        upsertMeta('meta[property="og:type"]', { content: 'article' });
        upsertMeta('meta[property="og:url"]', { content: url });
        upsertMeta('meta[property="og:title"]', { content: item.ogTitle || title });
        upsertMeta('meta[property="og:description"]', { content: item.ogDescription || description });
        upsertMeta('meta[property="og:image"]', { content: image });
        upsertMeta('meta[property="og:image:secure_url"]', { content: image });
        upsertMeta('meta[property="og:image:alt"]', { content: item.title });
        upsertMeta('meta[name="twitter:card"]', { content: 'summary_large_image' });
        upsertMeta('meta[name="twitter:title"]', { content: item.ogTitle || title });
        upsertMeta('meta[name="twitter:description"]', { content: item.ogDescription || description });
        upsertMeta('meta[name="twitter:image"]', { content: image });

        upsertJsonLd('blog-post-jsonld', {
          '@context': 'https://schema.org',
          '@type': item.schemaType || 'BlogPosting',
          headline: title,
          description,
          image,
          datePublished: item.publishedAt,
          dateModified: item.updatedAt,
          author: { '@type': 'Person', name: item.authorName || 'Cơm Thị Nở' },
          publisher: {
            '@type': 'Organization',
            name: 'Cơm Thị Nở',
            logo: { '@type': 'ImageObject', url: absoluteAssetUrl('/images/favicon.png') },
          },
          mainEntityOfPage: url,
        });

        upsertJsonLd('blog-breadcrumb-jsonld', {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: canonicalUrl('/') },
            { '@type': 'ListItem', position: 2, name: 'Tin tức', item: canonicalUrl('/tin-tuc') },
            item.category ? { '@type': 'ListItem', position: 3, name: item.category.name, item: canonicalUrl(`/tin-tuc/danh-muc/${item.category.slug}`) } : null,
            { '@type': 'ListItem', position: item.category ? 4 : 3, name: item.title, item: url },
          ].filter(Boolean),
        });
      })
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, [slug]);

  const shareUrl = useMemo(() => post ? canonicalUrl(`/tin-tuc/${post.slug}`) : '', [post]);
  const tags = useMemo(() => post?.tags?.split(',').map((tag) => tag.trim()).filter(Boolean) || [], [post]);

  if (isLoading) {
    return <div className="bg-quecan-cream py-20 text-center text-stone-500">Đang tải bài viết...</div>;
  }

  if (!post) {
    return (
      <div className="bg-quecan-cream py-20 text-center">
        <p className="text-stone-500">Không tìm thấy bài viết.</p>
        <Link to="/tin-tuc" className="mt-4 inline-flex rounded-full bg-quecan-orange px-5 py-2 text-sm font-bold text-white">
          Quay lại tin tức
        </Link>
      </div>
    );
  }

  return (
    <article className="bg-quecan-cream">
      <section className="bg-quecan-dark text-quecan-cream">
        <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-quecan-cream/65">
            <Link to="/" className="hover:text-quecan-golden">Trang chủ</Link>
            <span>/</span>
            <Link to="/tin-tuc" className="hover:text-quecan-golden">Tin tức</Link>
            {post.category && (
              <>
                <span>/</span>
                <Link to={`/tin-tuc/danh-muc/${post.category.slug}`} className="hover:text-quecan-golden">{post.category.name}</Link>
              </>
            )}
          </nav>

          <h1 className="mt-5 font-serif text-3xl font-bold leading-tight md:text-5xl">{post.title}</h1>
          {post.excerpt && <p className="mt-5 max-w-3xl text-base leading-relaxed text-quecan-cream/78 md:text-lg">{post.excerpt}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-quecan-cream/70">
            <span>{post.authorName || 'Cơm Thị Nở'}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-quecan-golden" />{formatDate(post.publishedAt)}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-quecan-golden" />{post.readingTime} phút đọc</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <img
          src={imageUrl(post)}
          alt={post.title}
          loading="eager"
          className="h-[260px] w-full rounded-xl object-cover shadow-warm md:h-[460px]"
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="min-w-0 rounded-xl border border-quecan-beige/35 bg-white p-5 shadow-warm md:p-8">
            <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.content }} />

            {tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2 border-t border-stone-100 pt-6">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-quecan-orange/10 px-3 py-1 text-xs font-semibold text-quecan-orange">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-quecan-beige/35 bg-white p-5 shadow-warm">
              <p className="mb-3 text-sm font-bold text-quecan-brown">Chia sẻ bài viết</p>
              <div className="flex flex-col gap-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0866FF] px-4 py-2 text-sm font-bold text-white"
                >
                  <Facebook className="h-4 w-4" /> Facebook
                </a>
                <a
                  href={`https://zalo.me/share?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0068FF] px-4 py-2 text-sm font-bold text-white"
                >
                  <Share2 className="h-4 w-4" /> Zalo
                </a>
              </div>
            </div>

            <div className="rounded-xl bg-quecan-brown p-5 text-quecan-cream shadow-warm">
              <p className="font-serif text-xl font-bold">Đặt cơm văn phòng</p>
              <p className="mt-2 text-sm text-quecan-cream/75">Cần thực đơn cho công ty hoặc đặt cơm đoàn? Gọi để được tư vấn nhanh.</p>
              <a href="tel:0987654321" className="mt-4 inline-flex items-center gap-2 rounded-full bg-quecan-orange px-4 py-2 text-sm font-bold text-white">
                <Phone className="h-4 w-4" /> Gọi ngay
              </a>
            </div>
          </aside>
        </div>

        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl font-bold text-quecan-brown">Bài viết liên quan</h2>
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
              {post.relatedPosts.map((item) => (
                <Link key={item.id} to={`/tin-tuc/${item.slug}`} className="group rounded-xl border border-quecan-beige/35 bg-white p-4 shadow-warm transition hover:-translate-y-1 hover:shadow-warm-lg">
                  <img src={absoluteAssetUrl(item.thumbnailUrl || item.coverImageUrl)} alt={item.title} loading="lazy" className="h-36 w-full rounded-lg object-cover" />
                  <p className="mt-3 font-serif text-lg font-bold leading-snug text-quecan-brown group-hover:text-quecan-orange">{item.title}</p>
                  <p className="mt-2 text-xs text-stone-500">{formatDate(item.publishedAt)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
