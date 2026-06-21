import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Calendar, Users, MessageSquare, Heart, Star, Send, X, ZoomIn } from 'lucide-react';
import { publicApi } from '../services/api';
import { SiteSettings, Banner, HomeSection, MenuCategory, MenuItem, Promotion, GalleryImage, Testimonial, BlogPost } from '../types';
import MenuBook from '../components/MenuBook';

export default function HomePage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [menuBookData, setMenuBookData] = useState<MenuCategory[]>([]);
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [featuredBlogPosts, setFeaturedBlogPosts] = useState<BlogPost[]>([]);

  // Banner slideshow state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Lightbox gallery state
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

  // Form states
  const [contactForm, setContactForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load all public site data concurrently
    publicApi.getSiteSettings().then(res => res.success && setSettings(res.data)).catch(console.error);
    publicApi.getBanners().then(res => res.success && setBanners(res.data)).catch(console.error);
    publicApi.getHomeSections().then(res => res.success && setSections(res.data)).catch(console.error);
    publicApi.getMenuBook().then(res => res.success && setMenuBookData(res.data)).catch(console.error);
    publicApi.getPromotions().then(res => res.success && setPromotions(res.data)).catch(console.error);
    publicApi.getGallery().then(res => res.success && setGallery(res.data)).catch(console.error);
    publicApi.getTestimonials().then(res => res.success && setTestimonials(res.data)).catch(console.error);
    publicApi.getFeaturedBlogPosts().then(res => res.success && setFeaturedBlogPosts(res.data)).catch(console.error);

    // Fetch featured items
    publicApi.getMenuItems().then(res => {
      if (res.success) {
        const featured = res.data.filter((item: MenuItem) => item.isFeatured);
        setFeaturedItems(featured);
      }
    }).catch(console.error);
  }, []);

  // Banner slide duration timer
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners]);

  // Form submission handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus({ type: null, message: '' });

    // Client-side validations
    if (!contactForm.fullName || !contactForm.phone || !contactForm.message) {
      setFormStatus({ type: 'error', message: 'Vui lòng điền đầy đủ các thông tin bắt buộc (*).' });
      setIsSubmitting(false);
      return;
    }

    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(contactForm.phone)) {
      setFormStatus({ type: 'error', message: 'Số điện thoại không đúng định dạng Việt Nam (10 số, đầu 03/05/07/08/09).' });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await publicApi.postContact(contactForm);
      if (res.success) {
        setFormStatus({ type: 'success', message: res.message });
        setContactForm({ fullName: '', phone: '', email: '', message: '' });
      } else {
        setFormStatus({ type: 'error', message: res.message || 'Gửi tin nhắn thất bại. Vui lòng thử lại sau.' });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại sau.';
      setFormStatus({ type: 'error', message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: any) => {
    const num = Number(price);
    return num.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  const renderImg = (url: string) => {
    return url.startsWith('http') || url.startsWith('/') ? url : `/uploads/${url}`;
  };

  // Scroll reveal helpers
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <div className="space-y-0 overflow-hidden">
      {/* 2. HERO BANNER SECTION (Slider) */}
      <section className="relative w-full h-[550px] md:h-[650px] bg-quecan-dark overflow-hidden flex items-center">
        {banners.length > 0 ? (
          <div className="absolute inset-0 w-full h-full">
            <AnimatePresence mode="wait">
              {banners.map((banner, index) => {
                if (index !== currentBannerIndex) return null;
                return (
                  <motion.div
                    key={banner.id}
                    className="absolute inset-0 w-full h-full"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                  >
                    {/* Background Image overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent z-10"></div>
                    <img
                      src={renderImg(banner.imageUrl)}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Banner Content */}
                    <div className="absolute inset-0 z-20 max-w-7xl mx-auto px-4 md:px-6 flex flex-col justify-center h-full text-white">
                      <div className="max-w-2xl space-y-4 md:space-y-6">
                        {banner.subtitle && (
                          <motion.span
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-quecan-orange text-white text-xs md:text-sm font-bold uppercase tracking-widest px-3 py-1.5 rounded-full inline-block"
                          >
                            {banner.subtitle}
                          </motion.span>
                        )}
                        <motion.h1
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="font-serif font-bold text-3xl md:text-5xl lg:text-6xl text-quecan-cream tracking-wide leading-tight"
                        >
                          {banner.title}
                        </motion.h1>
                        {banner.description && (
                          <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="text-sm md:text-base text-quecan-beige/80 leading-relaxed font-light"
                          >
                            {banner.description}
                          </motion.p>
                        )}
                        {(banner.buttonText && banner.buttonLink) && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                            className="pt-2"
                          >
                            <a
                              href={banner.buttonLink}
                              className="bg-quecan-golden hover:bg-quecan-golden/90 text-quecan-dark font-bold py-3 px-8 rounded-full shadow-warm transition inline-flex items-center space-x-2 text-sm uppercase tracking-wider"
                            >
                              <span>{banner.buttonText}</span>
                            </a>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {/* Slider Dots */}
            {banners.length > 1 && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBannerIndex(idx)}
                    className={`w-3 h-3 rounded-full transition ${
                      idx === currentBannerIndex ? 'bg-quecan-golden scale-125' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-white w-full z-10 px-4">
            <h1 className="font-serif text-3xl md:text-5xl text-quecan-golden font-bold">Cơm Thị Nở</h1>
            <p className="mt-2 text-sm md:text-base">Đang tải biểu ngữ quảng cáo...</p>
          </div>
        )}
      </section>

      {/* 3. SECTION GIỚI THIỆU (Story & Space) */}
      <section id="gioi-thieu" className="py-20 bg-quecan-cream relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-24">
          {sections.map((section, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.div
                key={section.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
                variants={fadeInUp}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${isEven ? '' : 'lg:flex-row-reverse'}`}
              >
                {/* Image side */}
                <div className={`relative ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                  {section.imageUrl && (
                    <div className="rounded-2xl overflow-hidden shadow-warm-lg border border-quecan-beige/35">
                      <img
                        src={renderImg(section.imageUrl)}
                        alt={section.title}
                        className="w-full h-[350px] md:h-[400px] object-cover hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  )}
                  {/* Decorative tag */}
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-quecan-orange/10 rounded-full -z-10"></div>
                </div>

                {/* Text side */}
                <div className={`space-y-4 md:space-y-6 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                  {section.subtitle && (
                    <span className="text-xs uppercase font-bold tracking-widest text-quecan-orange block">
                      {section.subtitle}
                    </span>
                  )}
                  <h2 className="font-serif font-bold text-3xl md:text-4xl text-quecan-brown">
                    {section.title}
                  </h2>
                  <div className="w-12 h-0.5 bg-quecan-golden"></div>
                  <p className="text-sm md:text-base text-quecan-dark/80 leading-relaxed font-light whitespace-pre-line">
                    {section.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. MENU DẠNG QUYỂN SÁCH */}
      <section id="menu-sach" className="py-20 bg-gradient-to-b from-quecan-cream to-quecan-beige/20 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-quecan-orange block">Lật giở từng trang</span>
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-quecan-brown">Thực Đơn Nhạt Nhòa</h2>
            <div className="w-16 h-0.5 bg-quecan-golden mx-auto my-2"></div>
            <p className="text-xs md:text-sm text-quecan-brown/70 leading-relaxed">
              Mời quý khách thưởng thức mâm cơm mang nét mộc mạc, đậm vị xưa của vùng châu thổ Bắc Bộ được bố cục dạng Quyển sách lật độc đáo.
            </p>
          </div>

          {menuBookData.length > 0 ? (
            <MenuBook categories={menuBookData} />
          ) : (
            <div className="text-center text-stone-400 py-12">
              <p>Đang chuẩn bị thực đơn, vui lòng quay lại sau...</p>
            </div>
          )}
        </div>
      </section>

      {/* 5. MÓN NỔI BẬT */}
      <section id="mon-noi-bat" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-quecan-orange block">Tinh túy ẩm thực</span>
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-quecan-brown">Đại Diện Nổi Bật</h2>
            <div className="w-16 h-0.5 bg-quecan-golden mx-auto my-2"></div>
            <p className="text-xs md:text-sm text-quecan-brown/70">
              Những món ngon trứ danh làm nên thương hiệu Cơm Thị Nở được yêu thích đặc biệt bởi thực khách gần xa.
            </p>
          </div>

          {featuredItems.length > 0 ? (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {featuredItems.map((item) => (
                <motion.div
                  key={item.id}
                  variants={fadeInUp}
                  className="group bg-quecan-cream/20 rounded-2xl overflow-hidden border border-quecan-beige/30 shadow-warm hover:shadow-warm-lg hover:border-quecan-orange/20 transition-all duration-300"
                >
                  {/* Card Image */}
                  <div className="h-56 overflow-hidden relative">
                    <img
                      src={renderImg(item.imageUrl)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop';
                      }}
                    />
                    <span className="absolute top-4 left-4 bg-quecan-orange text-white text-[10px] uppercase font-bold tracking-wider py-1 px-3 rounded-full flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-white" />
                      <span>Thực Khách Chọn</span>
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 space-y-4">
                    <h3 className="font-serif font-bold text-xl text-quecan-brown group-hover:text-quecan-orange transition">
                      {item.name}
                    </h3>
                    <p className="text-xs md:text-sm text-quecan-brown/70 leading-relaxed line-clamp-2">
                      {item.shortDescription || item.description}
                    </p>
                    
                    {item.ingredients && (
                      <div className="text-[11px] text-stone-500 italic bg-stone-100 p-2 rounded-lg truncate">
                        Thành phần: {item.ingredients}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-quecan-brown/10">
                      <div className="flex flex-col">
                        {item.salePrice ? (
                          <>
                            <span className="text-[11px] text-stone-400 line-through">{formatPrice(item.price)}</span>
                            <span className="text-lg font-bold text-quecan-orange">{formatPrice(item.salePrice)}</span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-quecan-brown">{formatPrice(item.price)}</span>
                        )}
                      </div>
                      
                      {settings?.phone && (
                        <a
                          href={`tel:${settings.phone}`}
                          className="bg-quecan-brown hover:bg-quecan-orange text-white font-bold py-2 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors shadow"
                        >
                          Liên hệ đặt
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <p className="text-center text-stone-400 py-8">Chưa cấu hình món ăn nổi bật.</p>
          )}
        </div>
      </section>

      {/* 6. KHUYẾN MÃI BANNER */}
      {featuredBlogPosts.length > 0 && (
        <section id="tin-tuc" className="py-20 bg-quecan-cream">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10">
              <div className="max-w-xl space-y-3">
                <span className="text-xs uppercase font-bold tracking-widest text-quecan-orange block">Tin tức & món ngon</span>
                <h2 className="font-serif font-bold text-3xl md:text-4xl text-quecan-brown">Câu Chuyện Từ Gian Bếp</h2>
                <div className="w-16 h-0.5 bg-quecan-golden"></div>
                <p className="text-xs md:text-sm text-quecan-brown/70 leading-relaxed">
                  Bài viết mới về thực đơn, cơm văn phòng, món ngon Bắc Bộ và ưu đãi được quản trị trực tiếp từ admin.
                </p>
              </div>
              <a href="/tin-tuc" className="inline-flex items-center justify-center rounded-full bg-quecan-brown px-5 py-2.5 text-sm font-bold text-white shadow-warm hover:bg-quecan-orange transition">
                Xem tất cả
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredBlogPosts.slice(0, 3).map((post) => (
                <article key={post.id} className="group overflow-hidden rounded-2xl bg-white border border-quecan-beige/35 shadow-warm hover:shadow-warm-lg transition">
                  <a href={`/tin-tuc/${post.slug}`} className="block h-52 overflow-hidden bg-stone-100">
                    <img
                      src={renderImg(post.thumbnailUrl || post.coverImageUrl || post.ogImageUrl || '/images/favicon.png')}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </a>
                  <div className="p-6">
                    {post.category && (
                      <a href={`/tin-tuc/danh-muc/${post.category.slug}`} className="text-[11px] uppercase tracking-wider font-bold text-quecan-orange">
                        {post.category.name}
                      </a>
                    )}
                    <h3 className="mt-2 font-serif font-bold text-xl leading-snug text-quecan-brown group-hover:text-quecan-orange transition">
                      <a href={`/tin-tuc/${post.slug}`}>{post.title}</a>
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-quecan-brown/70 line-clamp-3">{post.excerpt}</p>
                    <p className="mt-4 text-xs font-semibold text-stone-500">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : ''}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {promotions.length > 0 && (
        <section id="khuyen-mai" className="py-20 bg-gradient-to-r from-quecan-orange to-quecan-brown text-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Promo information */}
              <div className="space-y-6">
                <span className="bg-quecan-golden text-quecan-dark text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full inline-block shadow">
                  {promotions[0].discountText || 'Khuyến Mãi Lớn'}
                </span>
                <h2 className="font-serif font-bold text-3xl md:text-5xl text-quecan-cream tracking-wide">
                  {promotions[0].title}
                </h2>
                <p className="text-sm md:text-base text-quecan-beige/90 leading-relaxed font-light">
                  {promotions[0].description}
                </p>
                <div className="flex items-center space-x-2 text-xs text-quecan-cream/60 italic">
                  <span>Thời hạn:</span>
                  <span>
                    {new Date(promotions[0].startDate).toLocaleDateString('vi-VN')}
                  </span>
                  <span>đến</span>
                  <span>
                    {new Date(promotions[0].endDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                {promotions[0].buttonText && promotions[0].buttonLink && (
                  <div className="pt-2">
                    <a
                      href={promotions[0].buttonLink}
                      className="bg-white hover:bg-quecan-cream text-quecan-brown font-bold py-3.5 px-8 rounded-full shadow-lg transition inline-block uppercase tracking-wider text-sm"
                    >
                      {promotions[0].buttonText}
                    </a>
                  </div>
                )}
              </div>

              {/* Promo image */}
              <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-quecan-golden/20">
                <img
                  src={renderImg(promotions[0].imageUrl)}
                  alt={promotions[0].title}
                  className="w-full h-[300px] md:h-[350px] object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. KHÔNG GIAN QUÁN / GALLERY */}
      <section id="thu-vien" className="py-20 bg-quecan-cream">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-quecan-orange block">Kỷ niệm lưu giữ</span>
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-quecan-brown">Thư Viện Không Gian</h2>
            <div className="w-16 h-0.5 bg-quecan-golden mx-auto my-2"></div>
            <p className="text-xs md:text-sm text-quecan-brown/70">
              Ghi lại những khoảnh khắc bình dị, mộc mạc tại gian bếp, phòng ăn ấm áp của nhà hàng chúng tôi.
            </p>
          </div>

          {gallery.length > 0 ? (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {gallery.map((img) => (
                <motion.div
                  key={img.id}
                  variants={fadeInUp}
                  onClick={() => setActiveLightboxImg(renderImg(img.imageUrl))}
                  className="group relative h-48 md:h-56 rounded-xl overflow-hidden cursor-zoom-in border border-quecan-beige/30 shadow hover:shadow-warm-lg transition duration-300"
                >
                  <img
                    src={renderImg(img.imageUrl)}
                    alt={img.title || 'Gallery Cơm Thị Nở'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                    <div className="text-white text-center p-2">
                      <ZoomIn className="w-8 h-8 mx-auto mb-1" />
                      {img.title && <p className="text-xs font-serif font-medium truncate max-w-[150px]">{img.title}</p>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <p className="text-center text-stone-400 py-8">Chưa cập nhật ảnh thư viện.</p>
          )}
        </div>
      </section>

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {activeLightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setActiveLightboxImg(null)}
          >
            <button
              onClick={() => setActiveLightboxImg(null)}
              className="absolute top-6 right-6 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10"
            >
              <X className="w-8 h-8" />
            </button>
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={activeLightboxImg}
              alt="Enlarged gallery view"
              className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
              <span className="text-xs uppercase font-bold tracking-widest text-quecan-orange block">Cảm nhận thật</span>
              <h2 className="font-serif font-bold text-3xl md:text-4xl text-quecan-brown">Thực Khách Nói Gì</h2>
              <div className="w-16 h-0.5 bg-quecan-golden mx-auto my-2"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-quecan-cream/10 p-8 rounded-2xl border border-quecan-beige/30 shadow-warm flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex space-x-1">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-quecan-golden text-quecan-golden" />
                      ))}
                    </div>
                    <p className="text-sm md:text-base text-quecan-brown/80 leading-relaxed font-light italic">
                      "{t.content}"
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 pt-6 border-t border-dashed border-quecan-beige/50 mt-6">
                    {t.avatarUrl ? (
                      <img
                        src={t.avatarUrl}
                        alt={t.customerName}
                        className="w-10 h-10 rounded-full object-cover border border-quecan-golden"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-quecan-orange/20 text-quecan-orange rounded-full flex items-center justify-center font-bold text-sm">
                        {t.customerName[0]}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-quecan-brown">{t.customerName}</h4>
                      <p className="text-[10px] text-stone-400">Khách hàng thân thiết</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. ĐẶT CƠM ĐOÀN / CƠM CÔNG TY */}
      <section id="dat-com" className="py-20 bg-quecan-cream relative">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="bg-gradient-to-br from-[#4A250F] to-[#2B1608] text-white rounded-3xl p-8 md:p-12 shadow-warm-lg border-2 border-quecan-golden/20">
            <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
              <Calendar className="w-12 h-12 text-quecan-golden mx-auto mb-2" />
              <h2 className="font-serif font-bold text-2xl md:text-3xl text-quecan-cream">Đặt Tiệc Đoàn / Cơm Niêu Công Ty</h2>
              <p className="text-xs md:text-sm text-quecan-beige/70 leading-relaxed">
                Chúng tôi cung cấp ưu đãi giá tốt, chuẩn bị bàn chu đáo và hỗ trợ giao tận nơi với số lượng lớn. Vui lòng để lại lời nhắn, chúng tôi sẽ gọi lại ngay.
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {formStatus.type && (
                <div
                  className={`p-4 rounded-lg text-sm border font-medium ${
                    formStatus.type === 'success'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border-rose-200'
                  }`}
                >
                  {formStatus.message}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-quecan-beige mb-2">
                    Họ và tên quý khách <span className="text-quecan-orange">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={contactForm.fullName}
                    onChange={handleInputChange}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-black/30 border border-quecan-brown/50 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-quecan-orange"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-quecan-beige mb-2">
                    Số điện thoại <span className="text-quecan-orange">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={contactForm.phone}
                    onChange={handleInputChange}
                    placeholder="0987654321"
                    className="w-full bg-black/30 border border-quecan-brown/50 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-quecan-orange"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-quecan-beige mb-2">
                  Địa chỉ email (Không bắt buộc)
                </label>
                <input
                  type="email"
                  name="email"
                  value={contactForm.email}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  className="w-full bg-black/30 border border-quecan-brown/50 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-quecan-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-quecan-beige mb-2">
                  Chi tiết yêu cầu đặt cơm / Liên hệ <span className="text-quecan-orange">*</span>
                </label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  value={contactForm.message}
                  onChange={handleInputChange}
                  placeholder="Tôi muốn đặt mâm cơm 6 người vào trưa mai lúc 11h30..."
                  className="w-full bg-black/30 border border-quecan-brown/50 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-quecan-orange"
                />
              </div>

              <div className="text-center pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-quecan-orange hover:bg-quecan-orange/95 text-white font-bold py-3.5 px-10 rounded-full shadow-lg transition-colors inline-flex items-center space-x-2 text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu liên hệ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 9. ĐỊA CHỈ & LIÊN HỆ */}
      <section className="bg-white grid grid-cols-1 lg:grid-cols-2">
        {/* Contact info details */}
        <div className="p-12 md:p-20 flex flex-col justify-center space-y-8 bg-quecan-cream/10">
          <div className="space-y-4">
            <span className="text-xs uppercase font-bold tracking-widest text-quecan-orange block">Tìm chúng tôi</span>
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-quecan-brown">
              Đến Cơm Thị Nở
            </h2>
            <div className="w-12 h-0.5 bg-quecan-golden"></div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <MapPin className="w-6 h-6 text-quecan-orange shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-quecan-brown">Địa chỉ cửa hàng</h4>
                <p className="text-sm text-quecan-brown/80 mt-1 leading-relaxed">
                  {settings?.address || 'A16TT18 Nguyễn Khuyến, KĐT Văn Quán, Hà Đông, Hà Nội'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Phone className="w-6 h-6 text-quecan-orange shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-quecan-brown">Đường dây nóng</h4>
                <p className="text-sm text-quecan-brown/80 mt-1">
                  Đặt mâm cơm: <a href={`tel:${settings?.phone}`} className="text-quecan-orange font-semibold hover:underline">{settings?.phone}</a>
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <Calendar className="w-6 h-6 text-quecan-orange shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-quecan-brown">Đặt tiệc đoàn / hợp tác</h4>
                <p className="text-sm text-quecan-brown/80 mt-1">
                  Email: <a href={`mailto:${settings?.email}`} className="hover:underline">{settings?.email || 'lienhe@comthino.vn'}</a>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            {settings?.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full text-xs uppercase tracking-wide transition shadow"
              >
                Nhắn Facebook
              </a>
            )}
            {settings?.zaloUrl && (
              <a
                href={settings.zaloUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-6 rounded-full text-xs uppercase tracking-wide transition shadow"
              >
                Nhắn Zalo
              </a>
            )}
          </div>
        </div>

        {/* Embedded Map */}
        <div className="w-full h-[400px] lg:h-auto min-h-[400px]">
          {settings?.googleMapUrl ? (
            <iframe
              src={settings.googleMapUrl}
              title="Google Map Cơm Thị Nở"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          ) : (
            <div className="w-full h-full bg-stone-200 flex items-center justify-center text-stone-400">
              Chưa tích hợp bản đồ.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
