import { useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Phone } from 'lucide-react';
import { restaurantInfo, staticSeoPagesByPath } from '../data/staticSeoPages';
import { absoluteAssetUrl, canonicalUrl, upsertJsonLd, upsertLink, upsertMeta } from '../utils/seo';

export default function StaticSeoPage() {
  const location = useLocation();
  const cleanPath = location.pathname.replace(/\/+$/, '') || '/';
  const page = staticSeoPagesByPath[cleanPath];

  useEffect(() => {
    if (!page) return;

    const url = canonicalUrl(page.path);
    const image = absoluteAssetUrl('/images/favicon.png');

    document.title = page.seoTitle;
    upsertLink('link[rel="canonical"]', { href: url });
    upsertMeta('meta[name="title"]', { content: page.seoTitle });
    upsertMeta('meta[name="description"]', { content: page.description });
    upsertMeta('meta[name="keywords"]', { content: page.keywords });
    upsertMeta('meta[property="og:type"]', { content: 'website' });
    upsertMeta('meta[property="og:url"]', { content: url });
    upsertMeta('meta[property="og:title"]', { content: page.seoTitle });
    upsertMeta('meta[property="og:description"]', { content: page.description });
    upsertMeta('meta[property="og:image"]', { content: image });
    upsertMeta('meta[property="og:image:secure_url"]', { content: image });
    upsertMeta('meta[property="og:image:alt"]', { content: page.title });
    upsertMeta('meta[name="twitter:card"]', { content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { content: page.seoTitle });
    upsertMeta('meta[name="twitter:description"]', { content: page.description });
    upsertMeta('meta[name="twitter:image"]', { content: image });

    upsertJsonLd('static-page-jsonld', {
      '@context': 'https://schema.org',
      '@type': page.category === 'dish' ? 'Article' : page.category === 'trust' ? 'AboutPage' : 'WebPage',
      name: page.title,
      headline: page.seoTitle,
      description: page.description,
      image,
      url,
      publisher: {
        '@type': 'Restaurant',
        name: restaurantInfo.name,
        telephone: '+84971170103',
        hasMap: restaurantInfo.mapUrl,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'A16TT18 Nguyễn Khuyến, KĐT Văn Quán',
          addressLocality: 'Hà Đông',
          addressRegion: 'Hà Nội',
          postalCode: '100000',
          addressCountry: 'VN',
        },
      },
    });

    upsertJsonLd('static-breadcrumb-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: canonicalUrl('/') },
        { '@type': 'ListItem', position: 2, name: page.title, item: url },
      ],
    });

    if (page.faqs?.length) {
      upsertJsonLd('static-faq-jsonld', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      });
    }
  }, [page]);

  if (!page) return <Navigate to="/" replace />;

  return (
    <article className="bg-quecan-cream">
      <section className="bg-quecan-dark text-quecan-cream">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-quecan-cream/60">
            <Link to="/" className="hover:text-quecan-golden">Trang chủ</Link>
            <span>/</span>
            <span>{page.heroLabel}</span>
          </nav>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-quecan-golden">{page.heroLabel}</p>
          <h1 className="mt-4 max-w-4xl font-serif text-4xl font-bold leading-tight md:text-5xl">
            {page.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-quecan-cream/78 md:text-lg">
            {page.intro}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-quecan-beige/40 bg-white p-5 shadow-warm md:p-8">
            <div className="blog-content">
              {page.sections.map((section) => (
                <section key={section.heading}>
                  <h2>{section.heading}</h2>
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets && (
                    <ul>
                      {section.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </div>

          {page.faqs && page.faqs.length > 0 && (
            <section className="rounded-xl border border-quecan-beige/40 bg-white p-5 shadow-warm md:p-8">
              <h2 className="font-serif text-2xl font-bold text-quecan-brown">Câu hỏi thường gặp</h2>
              <div className="mt-5 space-y-3">
                {page.faqs.map((faq) => (
                  <details key={faq.question} className="rounded-lg border border-quecan-beige/45 bg-quecan-cream/35 p-4">
                    <summary className="cursor-pointer font-bold text-quecan-brown">{faq.question}</summary>
                    <p className="mt-3 text-sm leading-relaxed text-quecan-brown/75">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-quecan-beige/45 bg-white p-5 shadow-warm lg:sticky lg:top-24">
            <h2 className="font-serif text-xl font-bold text-quecan-brown">Đặt cơm nhanh</h2>
            <div className="mt-4 space-y-3 text-sm text-quecan-brown/78">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-quecan-orange" />
                <span>{restaurantInfo.address}</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-quecan-orange" />
                <span>{restaurantInfo.hours}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-quecan-orange" />
                <a href={`tel:${restaurantInfo.tel}`} className="font-bold text-quecan-orange hover:underline">
                  {restaurantInfo.phone}
                </a>
              </p>
            </div>
            <div className="mt-5 grid gap-2">
              <a
                href={`tel:${restaurantInfo.tel}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-quecan-orange px-4 py-2.5 text-sm font-bold text-white shadow-warm"
              >
                Gọi đặt cơm <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={restaurantInfo.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-quecan-brown/15 bg-white px-4 py-2.5 text-sm font-bold text-quecan-brown"
              >
                Xem Google Maps
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-quecan-beige/45 bg-white p-5 shadow-warm">
            <h2 className="font-serif text-xl font-bold text-quecan-brown">Trang liên quan</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {page.related.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <Link to={item.href} className="font-semibold text-quecan-orange hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </article>
  );
}
