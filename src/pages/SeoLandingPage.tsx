import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { publicApi } from '../services/api';
import { absoluteAssetUrl, canonicalUrl, upsertJsonLd, upsertLink, upsertMeta } from '../utils/seo';
import { Phone, MapPin, Clock, ChevronRight } from 'lucide-react';

function stripHtml(input = '') {
  return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function SeoLandingPage() {
  const { slug = '' } = useParams();
  const [page, setPage] = useState<any | null>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setNotFound(false);
    setPage(null);

    Promise.all([
      publicApi.getSeoPageBySlug(slug),
      publicApi.getFAQs(),
      publicApi.getReviews(),
    ])
      .then(([pageRes, faqsRes, reviewsRes]) => {
        if (!mounted) return;

        if (!pageRes.success || !pageRes.data) {
          setNotFound(true);
          return;
        }

        const item = pageRes.data;
        setPage(item);

        if (faqsRes.success) setFaqs(faqsRes.data || []);
        if (reviewsRes.success) setReviews(reviewsRes.data || []);

        const title = item.seoTitle || item.title;
        const description = item.seoDescription || item.excerpt || stripHtml(item.content).slice(0, 155);
        const url = item.canonicalUrl || canonicalUrl(`/${item.slug}`);
        const image = absoluteAssetUrl(item.ogImageUrl || item.coverImageUrl);

        document.title = title;
        upsertLink('link[rel="canonical"]', { href: url });
        upsertMeta('meta[name="title"]', { content: title });
        upsertMeta('meta[name="description"]', { content: description });
        upsertMeta('meta[name="keywords"]', { content: item.seoKeywords || '' });
        upsertMeta('meta[property="og:type"]', { content: 'website' });
        upsertMeta('meta[property="og:url"]', { content: url });
        upsertMeta('meta[property="og:title"]', { content: item.ogTitle || title });
        upsertMeta('meta[property="og:description"]', { content: item.ogDescription || description });
        upsertMeta('meta[property="og:image"]', { content: image });
        upsertMeta('meta[name="twitter:card"]', { content: 'summary_large_image' });
        upsertMeta('meta[name="twitter:title"]', { content: item.ogTitle || title });
        upsertMeta('meta[name="twitter:description"]', { content: item.ogDescription || description });
        upsertMeta('meta[name="twitter:image"]', { content: image });

        // Local Business + Restaurant JSON-LD
        upsertJsonLd('seo-page-jsonld', {
          '@context': 'https://schema.org',
          '@type': item.schemaType === 'Restaurant' ? 'Restaurant' : item.schemaType || 'WebPage',
          name: 'Cơm Thị Nở',
          headline: title,
          description,
          image,
          url,
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'A16TT18 Nguyễn Khuyến, KĐT Văn Quán',
            addressLocality: 'Hà Đông',
            addressRegion: 'Hà Nội',
            postalCode: '100000',
            addressCountry: 'VN',
          },
          telephone: '+84987654321',
          openingHours: 'Mo-Su 09:00-22:00',
          servesCuisine: 'Cơm Quê Bắc Bộ',
          priceRange: '$$',
          geo: {
            '@type': 'GeoCoordinates',
            latitude: '20.979028',
            longitude: '105.775888',
          },
        });

        // Breadcrumb
        upsertJsonLd('seo-breadcrumb-jsonld', {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: canonicalUrl('/') },
            { '@type': 'ListItem', position: 2, name: item.title, item: url },
          ],
        });

        // FAQ JSON-LD if there are faqs
        if (faqsRes.success && faqsRes.data?.length) {
          upsertJsonLd('seo-faq-jsonld', {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqsRes.data.map((faq: any) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          });
        }
      })
      .catch(() => {
        if (mounted) setNotFound(true);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound || !page) {
    return <Navigate to="/" replace />;
  }

  return (
    <article className="max-w-5xl mx-auto px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-1 text-sm text-stone-500 mb-6" aria-label="breadcrumb">
        <Link to="/" className="hover:text-amber-700 transition-colors">Trang chủ</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-stone-700 font-medium truncate">{page.title}</span>
      </nav>

      {/* Hero */}
      {page.coverImageUrl && (
        <div className="rounded-xl overflow-hidden mb-8 shadow-lg aspect-video">
          <img
            src={absoluteAssetUrl(page.coverImageUrl)}
            alt={page.title}
            title={page.title}
            className="w-full h-full object-cover"
            loading="lazy"
            width="1200"
            height="675"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div
            className="prose prose-stone max-w-none
              prose-headings:font-serif prose-headings:text-stone-800
              prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
              prose-a:text-amber-700 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-lg prose-img:shadow-md
              prose-p:text-stone-700 prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Contact Card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4 sticky top-24">
            <h3 className="font-bold text-stone-800 text-lg">Liên hệ đặt bàn</h3>
            <div className="space-y-3 text-sm text-stone-700">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <span>A16TT18 Nguyễn Khuyến, KĐT Văn Quán, Hà Đông, Hà Nội</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>09:00 – 22:00 (Hằng ngày)</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                <a href="tel:0987654321" className="font-bold text-amber-700 hover:underline">
                  0987.654.321
                </a>
              </div>
            </div>
            <a
              href="tel:0987654321"
              className="block w-full text-center bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Gọi ngay
            </a>
            <Link
              to="/#dat-com"
              className="block w-full text-center bg-white hover:bg-stone-50 text-stone-800 font-semibold py-2.5 rounded-lg border border-stone-200 transition-colors"
            >
              Đặt cơm online
            </Link>
          </div>

          {/* Internal links */}
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <h3 className="font-bold text-stone-800 mb-3">Các dịch vụ khác</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/com-van-phong-ha-dong" className="text-amber-700 hover:underline">Cơm văn phòng Hà Đông</Link></li>
              <li><Link to="/com-que-ha-dong" className="text-amber-700 hover:underline">Cơm quê Hà Đông</Link></li>
              <li><Link to="/com-nieu-ha-dong" className="text-amber-700 hover:underline">Cơm niêu Hà Đông</Link></li>
              <li><Link to="/com-gia-dinh-ha-dong" className="text-amber-700 hover:underline">Cơm gia đình Hà Đông</Link></li>
              <li><Link to="/com-doan-ha-dong" className="text-amber-700 hover:underline">Đặt cơm đoàn Hà Đông</Link></li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Customer Reviews */}
      {reviews.length > 0 && (
        <section className="mt-12 border-t border-stone-100 pt-10">
          <h2 className="text-2xl font-bold text-stone-800 mb-6">Khách hàng nói gì về chúng tôi?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="bg-stone-50 border border-stone-200 rounded-xl p-5">
                <div className="flex items-center space-x-3 mb-3">
                  {review.avatar && (
                    <img src={review.avatar} alt={review.customerName} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                  )}
                  <div>
                    <p className="font-semibold text-stone-800 text-sm">{review.customerName}</p>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-sm ${i < review.rating ? 'text-amber-400' : 'text-stone-300'}`}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-stone-600 text-sm italic">"{review.content}"</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQs */}
      {faqs.length > 0 && (
        <section className="mt-12 border-t border-stone-100 pt-10">
          <h2 className="text-2xl font-bold text-stone-800 mb-6">Câu hỏi thường gặp</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.id} className="group bg-stone-50 border border-stone-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 font-medium text-stone-800 hover:bg-stone-100 transition-colors">
                  {faq.question}
                  <ChevronRight className="w-4 h-4 text-amber-600 group-open:rotate-90 transition-transform shrink-0 ml-2" />
                </summary>
                <div className="px-5 pb-4 text-stone-600 text-sm leading-relaxed border-t border-stone-100">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
