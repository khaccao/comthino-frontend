const SITE_URL = 'https://comthino.com';
const DEFAULT_IMAGE = `${SITE_URL}/images/favicon.png`;

export function canonicalUrl(pathname = '/') {
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  return `${SITE_URL}${cleanPath}`;
}

export function absoluteAssetUrl(value?: string | null) {
  if (!value) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(value)) return value;

  if (value.startsWith('/uploads/') || value.startsWith('/images/') || value.startsWith('/assets/')) {
    return `${SITE_URL}${value}`;
  }

  if (value.startsWith('/')) {
    return `${SITE_URL}${value}`;
  }

  return `${SITE_URL}/uploads/${value}`;
}

export function upsertMeta(selector: string, attrs: Record<string, string>) {
  let tag = document.querySelector(selector) as HTMLMetaElement | null;

  if (!tag) {
    tag = document.createElement('meta');
    const property = selector.match(/property="([^"]+)"/)?.[1];
    const name = selector.match(/name="([^"]+)"/)?.[1];

    if (property) tag.setAttribute('property', property);
    if (name) tag.setAttribute('name', name);

    document.head.appendChild(tag);
  }

  Object.entries(attrs).forEach(([key, value]) => tag?.setAttribute(key, value));
}

export function upsertLink(selector: string, attrs: Record<string, string>) {
  let tag = document.querySelector(selector) as HTMLLinkElement | null;

  if (!tag) {
    tag = document.createElement('link');
    const rel = selector.match(/rel="([^"]+)"/)?.[1];
    if (rel) tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }

  Object.entries(attrs).forEach(([key, value]) => tag?.setAttribute(key, value));
}

export function upsertJsonLd(id: string, data: Record<string, any>) {
  let tag = document.getElementById(id) as HTMLScriptElement | null;

  if (!tag) {
    tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.id = id;
    document.head.appendChild(tag);
  }

  tag.textContent = JSON.stringify(data);
}

export function removeJsonLd(id: string) {
  const tag = document.getElementById(id);
  if (tag) tag.remove();
}
