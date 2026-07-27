import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.html');
const DEFAULT_GOOGLE_SITE_VERIFICATION = 'tEm4Sih2yUKc-5s3lLyFxeD-IEn9jPC0iakBwuqzRZI';
const DEFAULT_FACEBOOK_APP_ID = '1515195859877827';

function escapeAttr(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, ' ');
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function verificationToken(value) {
  return clean(value).replace(/^google-site-verification=/i, '').trim();
}

function addHead(html, block) {
  if (!block.trim()) return html;
  return html.replace('</head>', `${block}\n  </head>`);
}

function addBodyStart(html, block) {
  if (!block.trim()) return html;
  return html.replace(/<body([^>]*)>/i, `<body$1>\n${block}`);
}

function metaTag(nameOrProperty, key, value) {
  if (!value) return '';
  return `    <meta ${nameOrProperty}="${key}" content="${escapeAttr(value)}" />`;
}

function googleTagManagerHead(id) {
  if (!id) return '';
  return `    <script>
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${escapeAttr(id)}');
    </script>`;
}

function googleTagManagerBody(id) {
  if (!id) return '';
  return `    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${escapeAttr(id)}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
}

function googleAnalytics(id) {
  if (!id) return '';
  return `    <script async src="https://www.googletagmanager.com/gtag/js?id=${escapeAttr(id)}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${escapeAttr(id)}');
    </script>`;
}

function metaPixelHead(id) {
  if (!id) return '';
  return `    <script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${escapeAttr(id)}');
      fbq('track', 'PageView');
    </script>`;
}

function metaPixelBody(id) {
  if (!id) return '';
  return `    <noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${escapeAttr(id)}&ev=PageView&noscript=1" /></noscript>`;
}

function main() {
  if (!fs.existsSync(indexPath)) {
    throw new Error('dist/index.html not found. Run vite build first.');
  }

  const googleVerification = verificationToken(process.env.VITE_GOOGLE_SITE_VERIFICATION || DEFAULT_GOOGLE_SITE_VERIFICATION);
  const googleTagManagerId = clean(process.env.VITE_GOOGLE_TAG_MANAGER_ID);
  const googleAnalyticsId = clean(process.env.VITE_GOOGLE_ANALYTICS_ID);
  const facebookAppId = clean(process.env.VITE_FACEBOOK_APP_ID || DEFAULT_FACEBOOK_APP_ID);
  const metaPixelId = clean(process.env.VITE_META_PIXEL_ID);

  let html = fs.readFileSync(indexPath, 'utf8');
  const headBlocks = [
    metaTag('name', 'google-site-verification', googleVerification),
    metaTag('property', 'fb:app_id', facebookAppId),
    googleTagManagerHead(googleTagManagerId),
    googleTagManagerId ? '' : googleAnalytics(googleAnalyticsId),
    metaPixelHead(metaPixelId),
  ].filter(Boolean);

  const bodyBlocks = [
    googleTagManagerBody(googleTagManagerId),
    metaPixelBody(metaPixelId),
  ].filter(Boolean);

  html = addHead(html, headBlocks.join('\n'));
  html = addBodyStart(html, bodyBlocks.join('\n'));

  fs.writeFileSync(indexPath, html, 'utf8');

  const enabled = [
    googleVerification && 'Google Search Console verification',
    googleTagManagerId && 'Google Tag Manager',
    !googleTagManagerId && googleAnalyticsId && 'Google Analytics',
    facebookAppId && 'Facebook App ID',
    metaPixelId && 'Meta Pixel',
  ].filter(Boolean);

  console.log(`Platform meta injection: ${enabled.length ? enabled.join(', ') : 'no env values set'}.`);
}

main();
