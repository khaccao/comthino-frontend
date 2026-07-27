import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const dataPath = path.join(rootDir, 'src', 'data', 'staticSeoPages.ts');
const indexPath = path.join(distDir, 'index.html');
const siteUrl = 'https://comthino.com';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value = '') {
  return escapeHtml(value).replace(/\n/g, ' ');
}

function setTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
}

function setMeta(html, selector, value) {
  const escaped = escapeAttr(value);
  const attr = selector.startsWith('property=') ? 'property' : 'name';
  const key = selector.replace(/^(property|name)=/, '');
  const pattern = new RegExp(`<meta\\s+${attr}=["']${key}["'][^>]*>`, 'i');
  const tag = `<meta ${attr}="${key}" content="${escaped}" />`;

  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function setCanonical(html, href) {
  const tag = `<link rel="canonical" href="${escapeAttr(href)}" />`;
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, tag);
  }
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function renderStaticContent(page, restaurantInfo) {
  const sections = page.sections
    .map((section) => {
      const paragraphs = section.body.map((body) => `<p>${escapeHtml(body)}</p>`).join('');
      const bullets = section.bullets?.length
        ? `<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : '';
      return `<section><h2>${escapeHtml(section.heading)}</h2>${paragraphs}${bullets}</section>`;
    })
    .join('');

  const faqs = page.faqs?.length
    ? `<section><h2>Câu hỏi thường gặp</h2>${page.faqs
        .map((faq) => `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`)
        .join('')}</section>`
    : '';

  const related = page.related?.length
    ? `<nav aria-label="Trang liên quan"><h2>Trang liên quan</h2><ul>${page.related
        .map((item) => `<li><a href="${escapeAttr(item.href)}">${escapeHtml(item.label)}</a></li>`)
        .join('')}</ul></nav>`
    : '';

  return `
    <main class="seo-snapshot">
      <article>
        <p>${escapeHtml(page.heroLabel)}</p>
        <h1>${escapeHtml(page.title)}</h1>
        <p>${escapeHtml(page.intro)}</p>
        ${sections}
        ${faqs}
        <aside>
          <h2>Đặt cơm nhanh</h2>
          <p>Địa chỉ: ${escapeHtml(restaurantInfo.address)}</p>
          <p>Hotline: <a href="tel:${escapeAttr(restaurantInfo.tel)}">${escapeHtml(restaurantInfo.phone)}</a></p>
          <p>Giờ phục vụ: ${escapeHtml(restaurantInfo.hours)}</p>
        </aside>
        ${related}
      </article>
    </main>
  `;
}

function injectJsonLd(html, page, restaurantInfo) {
  const url = `${siteUrl}${page.path}`;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': page.category === 'dish' ? 'Article' : page.category === 'trust' ? 'AboutPage' : 'WebPage',
      name: page.title,
      headline: page.seoTitle,
      description: page.description,
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
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: page.title, item: url },
      ],
    },
  ];

  if (page.faqs?.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }

  const tags = jsonLd
    .map((item) => `    <script type="application/ld+json">${JSON.stringify(item)}</script>`)
    .join('\n');

  return html.replace('</head>', `${tags}\n  </head>`);
}

async function loadStaticData() {
  const source = fs.readFileSync(dataPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const encoded = Buffer.from(transpiled, 'utf8').toString('base64');
  return import(`data:text/javascript;base64,${encoded}`);
}

async function main() {
  if (!fs.existsSync(indexPath)) {
    throw new Error('dist/index.html not found. Run vite build first.');
  }

  const { staticSeoPages, restaurantInfo } = await loadStaticData();
  const template = fs.readFileSync(indexPath, 'utf8');

  for (const page of staticSeoPages) {
    const routeDir = path.join(distDir, page.path.replace(/^\/+/, ''));
    fs.mkdirSync(routeDir, { recursive: true });

    const url = `${siteUrl}${page.path}`;
    let html = template;
    html = setTitle(html, page.seoTitle);
    html = setCanonical(html, url);
    html = setMeta(html, 'name=title', page.seoTitle);
    html = setMeta(html, 'name=description', page.description);
    html = setMeta(html, 'name=keywords', page.keywords);
    html = setMeta(html, 'property=og:type', 'website');
    html = setMeta(html, 'property=og:url', url);
    html = setMeta(html, 'property=og:title', page.seoTitle);
    html = setMeta(html, 'property=og:description', page.description);
    html = setMeta(html, 'name=twitter:title', page.seoTitle);
    html = setMeta(html, 'name=twitter:description', page.description);
    html = injectJsonLd(html, page, restaurantInfo);
    html = html.replace('<div id="root"></div>', `<div id="root">${renderStaticContent(page, restaurantInfo)}</div>`);

    fs.writeFileSync(path.join(routeDir, 'index.html'), html, 'utf8');
  }

  console.log(`Pre-rendered ${staticSeoPages.length} SEO routes.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
