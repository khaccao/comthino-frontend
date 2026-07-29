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
const homeSeoTitle = 'Cơm Thị Nở | Quán Cơm Văn Phòng Hà Đông Chuẩn Bắc Bộ';
const homeSeoDescription =
  'Cơm Thị Nở - quán cơm ngon Văn Quán Hà Đông, phục vụ cơm văn phòng, cơm gia đình, cơm mang về và đặt tiệc chuẩn vị Bắc Bộ mỗi ngày tại Nguyễn Khuyến.';

const homeFaqs = [
  {
    question: 'Cơm Thị Nở ở đâu tại Hà Đông?',
    answer: 'Quán ở A16TT18 Nguyễn Khuyến, KĐT Văn Quán, Hà Đông, Hà Nội, thuận tiện cho khách quanh Văn Quán, Phúc La, Mỗ Lao, Trần Phú và Chiến Thắng.',
  },
  {
    question: 'Quán có nhận cơm văn phòng Hà Đông không?',
    answer: 'Có. Khách văn phòng nên đặt trước buổi sáng để quán tư vấn món, chốt số lượng và chuẩn bị đúng khung giờ nghỉ trưa.',
  },
  {
    question: 'Có cơm mang về hoặc đặt cơm theo nhóm không?',
    answer: 'Có. Cơm Thị Nở nhận cơm mang về, đặt theo suất, đặt theo mâm gia đình và đơn nhóm công ty quanh khu vực Hà Đông.',
  },
  {
    question: 'Món nổi bật của quán là gì?',
    answer: 'Các món được khách gọi nhiều gồm cá kho riềng, thịt rang cháy cạnh, sườn xào chua ngọt, canh cua cà pháo, rau theo mùa và cơm niêu nóng.',
  },
];

const homeLandingLinks = [
  ['Cơm Văn Quán', '/com-van-quan'],
  ['Cơm Hà Đông', '/com-ngon-ha-dong'],
  ['Cơm văn phòng Hà Đông', '/com-van-phong-ha-dong'],
  ['Cơm trưa văn phòng Hà Đông', '/com-trua-van-phong-ha-dong'],
  ['Cơm gia đình Hà Đông', '/com-gia-dinh-ha-dong'],
  ['Cơm quê Hà Đông', '/com-que-ha-dong'],
  ['Quán cơm ngon Hà Đông', '/quan-com-ngon-ha-dong'],
  ['Cơm mang về Hà Đông', '/com-mang-ve-ha-dong'],
];

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
  const menuSuggestions = `
    <section>
      <h2>Thực đơn nên thử</h2>
      <ul>
        <li><a href="/mon-an/ca-kho-rieng">Cá kho riềng</a> - món kho đậm vị Bắc Bộ, hợp cơm nóng.</li>
        <li><a href="/mon-an/canh-cua-ca-phao">Canh cua cà pháo</a> - món canh dân dã cho mâm cơm gia đình.</li>
        <li><a href="/thuc-don">Thịt rang cháy cạnh</a> - món mặn dễ gọi cho cơm văn phòng.</li>
        <li><a href="/thuc-don">Rau theo mùa</a> - món rau giúp bữa cơm cân bằng.</li>
      </ul>
    </section>
  `;
  const mapBlock = `
    <section>
      <h2>Bản đồ Cơm Thị Nở</h2>
      <p>Địa chỉ: ${escapeHtml(restaurantInfo.address)}. Hotline: <a href="tel:${escapeAttr(restaurantInfo.tel)}">${escapeHtml(restaurantInfo.phone)}</a>.</p>
      <iframe title="Bản đồ Cơm Thị Nở" src="https://www.google.com/maps?q=A16TT18%20Nguyen%20Khuyen%20KDT%20Van%20Quan%20Ha%20Dong%20Ha%20Noi&output=embed" width="100%" height="320" loading="lazy"></iframe>
    </section>
  `;

  return `
    <main class="seo-snapshot">
      <article>
        <p>${escapeHtml(page.heroLabel)}</p>
        <h1>${escapeHtml(page.title)}</h1>
        <p>${escapeHtml(page.intro)}</p>
        ${sections}
        ${menuSuggestions}
        ${faqs}
        <aside>
          <h2>Đặt cơm nhanh</h2>
          <p>Địa chỉ: ${escapeHtml(restaurantInfo.address)}</p>
          <p>Hotline: <a href="tel:${escapeAttr(restaurantInfo.tel)}">${escapeHtml(restaurantInfo.phone)}</a></p>
          <p>Giờ phục vụ: ${escapeHtml(restaurantInfo.hours)}</p>
        </aside>
        ${mapBlock}
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

function renderHomeSnapshot(restaurantInfo) {
  return `
    <main class="seo-snapshot">
      <article>
        <p>Cơm Thị Nở Restaurant</p>
        <h1>Cơm Thị Nở - Quán cơm Văn Quán Hà Đông chuẩn vị Bắc Bộ</h1>
        <p>${escapeHtml(homeSeoDescription)}</p>
        <section>
          <h2>Quán cơm ngon Hà Đông cho bữa trưa văn phòng và mâm cơm gia đình</h2>
          <p>Cơm Thị Nở phục vụ những bữa cơm Bắc Bộ quen vị tại Văn Quán, Hà Đông. Thực đơn của quán hướng đến món ăn dễ dùng hằng ngày: cơm nóng, cá kho, thịt rang, sườn xào, canh cua, rau theo mùa và các món kèm dân dã.</p>
          <p>Khách tìm Cơm Văn Quán, Cơm Hà Đông, Cơm Bắc Bộ, Cơm văn phòng Hà Đông hay Cơm gia đình Hà Đông đều có thể chọn ăn tại quán, gọi mang về hoặc đặt trước theo nhóm.</p>
        </section>
        <section>
          <h2>Vì sao chọn Cơm Thị Nở?</h2>
          <p>Quán tập trung vào bữa cơm nóng, vị vừa miệng, có đủ mặn, canh, rau và cơm. Với khách văn phòng, quán ưu tiên sự gọn gàng, đúng giờ và dễ chia suất. Với khách gia đình, mâm cơm được tư vấn theo số người, khẩu vị và ngân sách.</p>
          <ul>
            <li>Cơm văn phòng Hà Đông: đặt theo suất hoặc theo nhóm công ty.</li>
            <li>Cơm gia đình Hà Đông: mâm cơm Bắc Bộ cho bữa trưa, bữa tối và gặp mặt cuối tuần.</li>
            <li>Cơm mang về Hà Đông: gọi trước để quán chuẩn bị cơm nóng, đóng gói gọn.</li>
            <li>Tiệc gia đình: tư vấn mâm cơm theo số người, ngân sách và khẩu vị.</li>
          </ul>
        </section>
        <section>
          <h2>Món ăn nổi bật</h2>
          <p>Cá kho riềng, thịt rang cháy cạnh, sườn xào chua ngọt, gà rang, canh cua cà pháo, rau xào theo mùa và cơm niêu là nhóm món được khách gọi nhiều tại Cơm Thị Nở.</p>
        </section>
        <section>
          <h2>Khu vực phục vụ</h2>
          <p>Quán phục vụ khách quanh ${escapeHtml(restaurantInfo.address)}, Phúc La, Mỗ Lao, Trần Phú, Chiến Thắng và các khu văn phòng lân cận Hà Đông.</p>
          <nav aria-label="Landing page SEO địa phương"><ul>${homeLandingLinks
            .map(([label, href]) => `<li><a href="${escapeAttr(href)}">${escapeHtml(label)}</a></li>`)
            .join('')}</ul></nav>
        </section>
        <section>
          <h2>Câu hỏi thường gặp</h2>
          ${homeFaqs
            .map((faq) => `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`)
            .join('')}
        </section>
        <section>
          <h2>Bản đồ và liên hệ</h2>
          <p>Hotline: <a href="tel:${escapeAttr(restaurantInfo.tel)}">${escapeHtml(restaurantInfo.phone)}</a>. Giờ phục vụ: ${escapeHtml(restaurantInfo.hours)}.</p>
          <iframe title="Bản đồ Cơm Thị Nở" src="https://www.google.com/maps?q=A16TT18%20Nguyen%20Khuyen%20KDT%20Van%20Quan%20Ha%20Dong%20Ha%20Noi&output=embed" width="100%" height="320" loading="lazy"></iframe>
        </section>
      </article>
    </main>
  `;
}

function injectHomeJsonLd(html, restaurantInfo) {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': ['Restaurant', 'LocalBusiness'],
      name: restaurantInfo.name,
      url: `${siteUrl}/`,
      telephone: '+84971170103',
      priceRange: '$$',
      description: homeSeoDescription,
      servesCuisine: ['Cơm Việt Nam', 'Cơm Bắc Bộ', 'Cơm quê Bắc Bộ', 'Cơm văn phòng', 'Cơm gia đình'],
      areaServed: ['Văn Quán', 'Hà Đông', 'Nguyễn Khuyến', 'Phúc La', 'Mỗ Lao', 'Trần Phú', 'Hà Nội'],
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'A16TT18 Nguyễn Khuyến, KĐT Văn Quán',
        addressLocality: 'Hà Đông',
        addressRegion: 'Hà Nội',
        postalCode: '100000',
        addressCountry: 'VN',
      },
      hasMap: restaurantInfo.mapUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: homeFaqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${siteUrl}/` }],
    },
  ];
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

  let homeHtml = fs.readFileSync(indexPath, 'utf8');
  homeHtml = setTitle(homeHtml, homeSeoTitle);
  homeHtml = setCanonical(homeHtml, `${siteUrl}/`);
  homeHtml = setMeta(homeHtml, 'name=title', homeSeoTitle);
  homeHtml = setMeta(homeHtml, 'name=description', homeSeoDescription);
  homeHtml = setMeta(
    homeHtml,
    'name=keywords',
    'Cơm Văn Quán, Cơm Hà Đông, Cơm Bắc Bộ, Cơm văn phòng Hà Đông, Quán cơm ngon Hà Đông, Cơm gia đình Hà Đông, Cơm mang về Hà Đông, Cơm Thị Nở'
  );
  homeHtml = setMeta(homeHtml, 'property=og:title', homeSeoTitle);
  homeHtml = setMeta(homeHtml, 'property=og:description', homeSeoDescription);
  homeHtml = setMeta(homeHtml, 'name=twitter:title', homeSeoTitle);
  homeHtml = setMeta(homeHtml, 'name=twitter:description', homeSeoDescription);
  homeHtml = injectHomeJsonLd(homeHtml, restaurantInfo);
  homeHtml = homeHtml.replace('<div id="root"></div>', `<div id="root">${renderHomeSnapshot(restaurantInfo)}</div>`);
  fs.writeFileSync(indexPath, homeHtml, 'utf8');

  console.log(`Pre-rendered ${staticSeoPages.length} SEO routes.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
