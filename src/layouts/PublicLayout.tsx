import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, Clock, MapPin, Facebook } from 'lucide-react';
import { publicApi } from '../services/api';
import { SiteSettings, NavigationItem } from '../types';

export default function PublicLayout() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [navItems, setNavItems] = useState<NavigationItem[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Fetch site configurations
    publicApi.getSiteSettings()
      .then((res) => {
        if (res.success) setSettings(res.data);
      })
      .catch((err) => console.error('Error fetching settings:', err));

    publicApi.getNavigation()
      .then((res) => {
        if (res.success) setNavItems(res.data);
      })
      .catch((err) => console.error('Error fetching nav items:', err));

    // Handle scroll sticky header
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsHeaderSticky(true);
      } else {
        setIsHeaderSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update HTML dynamic title & meta tags from SiteSettings for SEO
  useEffect(() => {
    if (settings) {
      const title = settings.seoTitle || settings.siteName || 'Cơm Thị Nở';
      document.title = title;
      
      // Helper function to update meta tags
      const updateMetaTag = (selector: string, attribute: string, value: string) => {
        let tag = document.querySelector(selector);
        if (!tag) {
          tag = document.createElement('meta');
          if (selector.includes('property=')) {
            tag.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
          } else if (selector.includes('name=')) {
            tag.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
          }
          document.head.appendChild(tag);
        }
        tag.setAttribute(attribute, value);
      };

      updateMetaTag('meta[name="description"]', 'content', settings.seoDescription || '');
      updateMetaTag('meta[name="keywords"]', 'content', settings.seoKeywords || '');
      
      // Update Open Graph
      updateMetaTag('meta[property="og:title"]', 'content', title);
      updateMetaTag('meta[property="og:description"]', 'content', settings.seoDescription || '');
      if (settings.logoUrl) {
         updateMetaTag('meta[property="og:image"]', 'content', settings.logoUrl.startsWith('http') ? settings.logoUrl : `${window.location.origin}/uploads/${settings.logoUrl}`);
      }
      
      // Update Twitter
      updateMetaTag('meta[property="twitter:title"]', 'content', title);
      updateMetaTag('meta[property="twitter:description"]', 'content', settings.seoDescription || '');
      if (settings.logoUrl) {
         updateMetaTag('meta[property="twitter:image"]', 'content', settings.logoUrl.startsWith('http') ? settings.logoUrl : `${window.location.origin}/uploads/${settings.logoUrl}`);
      }
    }
  }, [settings]);

  // Handle smooth scroll anchor links
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    if (url.startsWith('#')) {
      e.preventDefault();
      const targetId = url.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const offset = 80; // height of sticky header
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = targetElement.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
      setIsMobileMenuOpen(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-quecan-cream selection:bg-quecan-orange selection:text-white">
      {/* Top bar info */}
      <div className="bg-quecan-dark text-quecan-cream py-2 px-4 hidden md:block text-sm border-b border-quecan-brown/30">
        <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <span className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-quecan-golden" />
              <span>Giờ mở cửa: {settings?.openingHours || '09:00 - 22:00'}</span>
            </span>
            <span className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-quecan-golden" />
              <span>{settings?.address || 'A16TT18 Nguyễn Khuyến, Hà Đông, Hà Nội'}</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {settings?.phone && (
              <a href={`tel:${settings.phone}`} className="flex items-center space-x-1 hover:text-quecan-golden transition">
                <Phone className="w-4 h-4 text-quecan-golden" />
                <span>Hotline: {settings.phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Header Navigation */}
      <header
        className={`w-full z-40 transition-all duration-300 ${
          isHeaderSticky
            ? 'sticky top-0 bg-quecan-dark text-quecan-cream shadow-warm-lg py-3'
            : 'bg-quecan-cream text-quecan-brown py-4'
        }`}
      >
        <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 flex justify-between items-center gap-4">
          {/* Logo & Name */}
          <Link to="/" className="flex items-center space-x-2 md:space-x-3 shrink-0 group">
            <img
              src={settings?.logoUrl ? (settings.logoUrl.startsWith('http') || settings.logoUrl.startsWith('/') ? settings.logoUrl : `/uploads/${settings.logoUrl}`) : '/images/favicon.png'}
              alt={settings?.siteName || 'Cơm Thị Nở'}
              className="w-10 h-10 md:w-12 md:h-12 object-cover rounded-full border-2 border-quecan-golden shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/favicon.png';
              }}
            />
            <div className="shrink-0 whitespace-nowrap">
              <span className={`font-serif font-bold text-lg md:text-2xl tracking-wide block ${isHeaderSticky ? 'text-quecan-cream' : 'text-quecan-brown'}`}>
                {settings?.siteName || 'Cơm Thị Nở'}
              </span>
              {settings?.slogan && (
                <span className="text-[10px] uppercase tracking-widest block text-quecan-golden font-medium">
                  {settings.slogan}
                </span>
              )}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center space-x-3 2xl:space-x-6">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.url}
                onClick={(e) => handleNavClick(e, item.url)}
                className={`font-medium transition hover:text-quecan-orange text-sm uppercase tracking-wider relative py-1 whitespace-nowrap after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-quecan-orange after:transition-all hover:after:w-full ${
                  isHeaderSticky ? 'text-quecan-cream' : 'text-quecan-dark'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Action button */}
          <div className="hidden sm:flex items-center space-x-4 shrink-0">
            {settings?.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="flex items-center space-x-2 bg-quecan-orange hover:bg-quecan-orange/90 text-white font-semibold py-2.5 px-4 xl:px-5 rounded-full shadow-warm transition text-sm whitespace-nowrap animate-pulse shrink-0"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>Gọi Đặt Mâm: {settings.phone}</span>
              </a>
            )}
          </div>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden p-2 rounded-md hover:bg-quecan-brown/10 focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-quecan-orange" />
            ) : (
              <Menu className={`w-6 h-6 ${isHeaderSticky ? 'text-quecan-cream' : 'text-quecan-brown'}`} />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden flex">
          {/* Backdrop overlay */}
          <div className="fixed inset-0 bg-black/60 transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />

          {/* Sidebar Drawer */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-quecan-cream text-quecan-dark border-r border-quecan-beige/30 p-6 z-50">
            <div className="flex justify-between items-center mb-8">
              <span className="font-serif font-bold text-xl text-quecan-brown">
                {settings?.siteName || 'Cơm Thị Nở'}
              </span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-md hover:bg-quecan-brown/10">
                <X className="w-6 h-6 text-quecan-orange" />
              </button>
            </div>

            <nav className="flex flex-col space-y-4 mb-8">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  onClick={(e) => handleNavClick(e, item.url)}
                  className="font-medium text-lg text-quecan-dark hover:text-quecan-orange transition border-b border-quecan-beige/40 pb-2"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="mt-auto space-y-4">
              {settings?.phone && (
                <a
                  href={`tel:${settings.phone}`}
                  className="flex items-center justify-center space-x-2 bg-quecan-orange text-white font-bold py-3 px-4 rounded-full w-full shadow-warm transition text-center"
                >
                  <Phone className="w-5 h-5" />
                  <span>Gọi {settings.phone}</span>
                </a>
              )}
              {settings?.openingHours && (
                <div className="text-xs text-center text-quecan-brown/60">
                  Phục vụ hàng ngày: {settings.openingHours}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-quecan-dark text-quecan-cream border-t-4 border-quecan-golden pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Logo Column */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-2xl tracking-wide text-quecan-golden">
              {settings?.siteName || 'Cơm Thị Nở'}
            </h3>
            <p className="text-sm text-quecan-cream/70 leading-relaxed italic">
              "Ăn bát cơm quê, nhớ về nguồn cội. Cơm niêu, cá kho, gạch cua ngọt lòng, ấm áp phong vị gia đình xưa cũ Bắc Bộ."
            </p>
            <div className="flex space-x-4 pt-2">
              {settings?.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 bg-quecan-brown hover:bg-quecan-orange rounded-full flex items-center justify-center text-white transition shadow"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings?.zaloUrl && (
                <a
                  href={settings.zaloUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 bg-quecan-brown hover:bg-quecan-orange rounded-full flex items-center justify-center font-bold text-sm text-white transition shadow"
                >
                  Zalo
                </a>
              )}
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="font-serif font-bold text-lg text-quecan-golden mb-6 relative after:absolute after:bottom-[-8px] after:left-0 after:w-12 after:h-0.5 after:bg-quecan-orange">
              Điều hướng nhanh
            </h4>
            <ul className="space-y-3 text-sm text-quecan-cream/80">
              {navItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.url}
                    onClick={(e) => handleNavClick(e, item.url)}
                    className="hover:text-quecan-golden transition flex items-center"
                  >
                    <span className="mr-2 text-quecan-orange">✦</span>
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/admin/login" className="hover:text-quecan-golden transition flex items-center">
                  <span className="mr-2 text-quecan-orange">✦</span>
                  Đăng nhập Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Opening Hours Column */}
          <div>
            <h4 className="font-serif font-bold text-lg text-quecan-golden mb-6 relative after:absolute after:bottom-[-8px] after:left-0 after:w-12 after:h-0.5 after:bg-quecan-orange">
              Giờ mở cửa
            </h4>
            <div className="space-y-4 text-sm text-quecan-cream/80 leading-relaxed">
              <p>
                Cửa hàng phục vụ tất cả các ngày trong tuần, kể cả ngày lễ Tết.
              </p>
              <div className="bg-quecan-brown/40 p-4 rounded border border-quecan-brown/20 space-y-2">
                <p className="flex justify-between font-medium">
                  <span>Thứ Hai - Chủ Nhật:</span>
                  <span className="text-quecan-golden">{settings?.openingHours || '09:00 - 22:00'}</span>
                </p>
                <p className="text-xs text-quecan-cream/60">
                  * Nhận đặt cơm công ty trước 10h sáng hàng ngày để giao đúng giờ.
                </p>
              </div>
            </div>
          </div>

          {/* Address & Contact Column */}
          <div>
            <h4 className="font-serif font-bold text-lg text-quecan-golden mb-6 relative after:absolute after:bottom-[-8px] after:left-0 after:w-12 after:h-0.5 after:bg-quecan-orange">
              Thông tin liên hệ
            </h4>
            <ul className="space-y-4 text-sm text-quecan-cream/80">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-quecan-orange shrink-0 mt-0.5" />
                <span>{settings?.address || 'A16TT18 Nguyễn Khuyến, KĐT Văn Quán, Hà Đông, Hà Nội'}</span>
              </li>
              {settings?.phone && (
                <li className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-quecan-orange shrink-0" />
                  <a href={`tel:${settings.phone}`} className="hover:text-quecan-golden transition">
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings?.email && (
                <li className="flex items-center space-x-3">
                  <span className="text-quecan-orange shrink-0 font-bold">@</span>
                  <a href={`mailto:${settings.email}`} className="hover:text-quecan-golden transition">
                    {settings.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Lower Footer */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 border-t border-quecan-brown/30 flex flex-col sm:flex-row justify-between items-center text-xs text-quecan-cream/60">
          <p>© {currentYear} {settings?.siteName || 'Cơm Thị Nở'}. Tất cả quyền được bảo lưu.</p>
          <p className="mt-2 sm:mt-0">
            Phong cách cơm quê Bắc Bộ - Đậm đà bản sắc Việt
          </p>
        </div>
      </footer>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 items-center">
        {/* Facebook/Messenger */}
        {settings?.facebookUrl && (
          <a
            href={settings.facebookUrl}
            target="_blank"
            rel="noreferrer"
            className="w-12 h-12 bg-[#0866FF] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform hover:shadow-xl"
            title="Facebook / Messenger"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.36 0 7.52c0 2.37 1.2 4.48 3.1 5.86-.14.93-.5 2.15-.5 2.15s1.26-.05 2.5-.54a8.2 8.2 0 0 0 2.9.53c4.42 0 8-3.36 8-7.52S12.42 0 8 0zm2.74 9.68-2.22-2.36-4.22 2.36 4.64-4.94 2.22 2.36 4.22-2.36-4.64 4.94z"/>
            </svg>
          </a>
        )}
        
        {/* Zalo */}
        {settings?.phone && (
          <a
            href={settings.zaloUrl || `https://zalo.me/${settings.phone.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="w-12 h-12 bg-[#0068FF] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg hover:scale-110 transition-transform hover:shadow-xl"
            title="Zalo Chat"
          >
            Zalo
          </a>
        )}

        {/* Phone / Hotline */}
        {settings?.phone && (
          <a
            href={`tel:${settings.phone}`}
            className="w-14 h-14 bg-quecan-orange rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform hover:shadow-xl animate-bounce"
            title="Gọi Điện Thoại"
          >
            <Phone className="w-6 h-6 shrink-0" />
          </a>
        )}
      </div>
    </div>
  );
}
