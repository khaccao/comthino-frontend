import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Sparkles } from 'lucide-react';
import { MenuCategory, MenuItem } from '../types';

interface MenuBookProps {
  categories: MenuCategory[];
}

export default function MenuBook({ categories }: MenuBookProps) {
  const [currentPage, setCurrentPage] = useState(0); // 0 = Cover, 1 = Page 1 & 2, etc.

  // Flatten book pages.
  // Page 0: Cover (Front)
  // Page 1: Table of contents (Left) & Category 1 (Right)
  // Page 2: Category 2 (Left) & Category 3 (Right)
  // Page 3: Category 4 (Left) & Category 5 (Right)
  // Page 4: Category N-1 (Left) & Category N (Right)
  // Page 5: Back Cover
  // Let's create pages. Each page contains either cover, TOC, category, or backcover.
  const pages: any[] = [];
  
  // Page 0: Front Cover
  pages.push({ type: 'cover-front', title: 'Thực Đơn Cơm Quê', subtitle: 'Cơm Thị Nở' });
  
  // Page 1: Introduction / Table of contents
  pages.push({ type: 'toc', title: 'Mâm Cơm Bắc Bộ xưa' });

  // Add categories
  categories.forEach((cat) => {
    pages.push({ type: 'category', data: cat });
  });

  // Make pages count even to complete the layout
  if (pages.length % 2 !== 0) {
    pages.push({ type: 'blank', title: 'Chúc ngon miệng!' });
  }

  // Page Last: Back Cover
  pages.push({ type: 'cover-back', title: 'Cơm Thị Nở', phone: '0987654321' });

  const totalSpreads = Math.ceil(pages.length / 2);

  const nextPage = () => {
    if (currentPage < totalSpreads - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const jumpToCategory = (catId: string) => {
    const catIndex = pages.findIndex(p => p.type === 'category' && p.data.id === catId);
    if (catIndex !== -1) {
      // Determine which spread this page belongs to
      const spreadIndex = Math.floor((catIndex + 1) / 2); // since page 0 (Cover) is spread 0, page 1 & 2 is spread 1, etc.
      setCurrentPage(spreadIndex);
    }
  };

  const formatPrice = (price: any) => {
    const num = Number(price);
    return num.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  return (
    <div className="w-full">
      {/* Category Quick Navigation Tabs (For both desktop & mobile) */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10 max-w-4xl mx-auto px-4">
        <button
          onClick={() => setCurrentPage(0)}
          className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold tracking-wider transition uppercase ${
            currentPage === 0
              ? 'bg-quecan-brown text-white shadow-warm'
              : 'bg-white hover:bg-quecan-beige/40 text-quecan-brown border border-quecan-brown/20'
          }`}
        >
          Bìa thực đơn
        </button>
        {categories.map((cat) => {
          // Find if this category is currently shown in the active spread
          const catIndex = pages.findIndex(p => p.type === 'category' && p.data.id === cat.id);
          const spreadIndex = Math.floor((catIndex + 1) / 2);
          const isActive = currentPage === spreadIndex;

          return (
            <button
              key={cat.id}
              onClick={() => jumpToCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold tracking-wider transition uppercase ${
                isActive
                  ? 'bg-quecan-orange text-white shadow-warm'
                  : 'bg-white hover:bg-quecan-beige/40 text-quecan-brown border border-quecan-brown/20'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 3D BOOK VIEW - DISPLAY ON DESKTOP/TABLET (lg:flex) */}
      {/* ======================================================== */}
      <div className="hidden lg:block relative py-12 px-6">
        <div className="menu-book-container relative">
          <div className="book-spine z-30"></div>
          
          <div className="menu-book w-full h-full relative">
            {/* Loop through each spread (pair of pages) */}
            {Array.from({ length: totalSpreads }).map((_, spreadIndex) => {
              const leftPageIndex = spreadIndex * 2;
              const rightPageIndex = leftPageIndex + 1;
              const leftPage = pages[leftPageIndex];
              const rightPage = pages[rightPageIndex];

              // Check stacking z-index & positioning
              const isPassed = spreadIndex < currentPage;
              const isActive = spreadIndex === currentPage;

              return (
                <div
                  key={spreadIndex}
                  className={`absolute inset-0 w-full h-full transition-transform duration-700 ease-in-out transform-style:preserve-3d ${
                    isActive ? 'z-20 opacity-100' : 'z-10 pointer-events-none opacity-0'
                  }`}
                  style={{
                    display: isActive ? 'block' : 'none',
                  }}
                >
                  {/* Left Page of current spread */}
                  <div className="book-page left-side w-1/2 h-full absolute left-0 bg-[#FBF0DB] p-8 flex flex-col justify-between border-r-0 rounded-l-2xl shadow-2xl">
                    <div className="flex-1 overflow-y-auto pr-2">
                      {leftPage && renderPageContent(leftPage, formatPrice)}
                    </div>
                    <div className="mt-4 pt-3 border-t border-quecan-brown/10 text-center text-xs text-quecan-brown/50 font-serif">
                      Cơm Thị Nở • Trang {leftPageIndex}
                    </div>
                  </div>

                  {/* Right Page of current spread */}
                  <div className="book-page right-side w-1/2 h-full absolute left-1/2 bg-[#FBF0DB] p-8 flex flex-col justify-between border-l-0 rounded-r-2xl shadow-2xl">
                    <div className="flex-1 overflow-y-auto pl-2">
                      {rightPage && renderPageContent(rightPage, formatPrice)}
                    </div>
                    <div className="mt-4 pt-3 border-t border-quecan-brown/10 text-center text-xs text-quecan-brown/50 font-serif">
                      Trang {rightPageIndex} • Cơm Thị Nở
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Previous Button */}
          {currentPage > 0 && (
            <button
              onClick={prevPage}
              className="absolute left-[-50px] top-1/2 transform -translate-y-1/2 w-12 h-12 bg-quecan-brown hover:bg-quecan-orange text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 z-30"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next Button */}
          {currentPage < totalSpreads - 1 && (
            <button
              onClick={nextPage}
              className="absolute right-[-50px] top-1/2 transform -translate-y-1/2 w-12 h-12 bg-quecan-brown hover:bg-quecan-orange text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 z-30"
              aria-label="Next page"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE SCROLL LIST VIEW - DISPLAY ON MOBILE/TABLET (<lg) */}
      {/* ======================================================== */}
      <div className="lg:hidden px-4 space-y-12">
        {categories.map((cat) => (
          <div key={cat.id} className="space-y-6 scroll-mt-24">
            <div className="text-center relative">
              <h3 className="font-serif font-bold text-2xl text-quecan-brown inline-block relative after:absolute after:bottom-[-6px] after:left-1/4 after:right-1/4 after:h-0.5 after:bg-quecan-orange">
                {cat.name}
              </h3>
              {cat.description && (
                <p className="text-xs text-quecan-brown/60 mt-2 italic max-w-md mx-auto">
                  {cat.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {cat.menuItems?.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 shadow-warm flex space-x-4 border border-quecan-beige/30"
                >
                  <img
                    src={item.imageUrl.startsWith('http') || item.imageUrl.startsWith('/') ? item.imageUrl : `/uploads/${item.imageUrl}`}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-xl shrink-0 border border-quecan-beige"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop';
                    }}
                  />
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-quecan-brown text-base">{item.name}</h4>
                      <p className="text-xs text-quecan-brown/70 mt-1 line-clamp-2">
                        {item.shortDescription || item.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-quecan-beige">
                      <div className="flex flex-col">
                        {item.salePrice ? (
                          <>
                            <span className="text-stone-400 line-through text-xs">{formatPrice(item.price)}</span>
                            <span className="text-quecan-orange font-bold text-sm">{formatPrice(item.salePrice)}</span>
                          </>
                        ) : (
                          <span className="text-quecan-brown font-bold text-sm">{formatPrice(item.price)}</span>
                        )}
                      </div>
                      {item.isFeatured && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                          Nổi bật
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Inner helper renderer for page contents
function renderPageContent(page: any, formatPrice: (price: any) => string) {
  switch (page.type) {
    case 'cover-front':
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 border-4 border-double border-quecan-golden rounded-xl bg-gradient-to-br from-[#4A250F] to-[#2B1608] text-white">
          <BookOpen className="w-16 h-16 text-quecan-golden mb-6" />
          <h2 className="font-serif font-bold text-3xl md:text-4xl text-quecan-golden tracking-wider leading-tight mb-2">
            {page.title}
          </h2>
          <div className="w-16 h-0.5 bg-quecan-golden my-4"></div>
          <p className="font-serif italic text-lg text-quecan-beige tracking-wide">
            {page.subtitle}
          </p>
          <p className="text-xs text-quecan-cream/60 mt-12 tracking-widest uppercase">
            Hương vị đồng quê • Gặp lại Thị Nở
          </p>
        </div>
      );

    case 'toc':
      return (
        <div className="p-4 space-y-6">
          <div className="text-center">
            <h3 className="font-serif font-bold text-2xl text-quecan-brown">Mâm Cơm Quê</h3>
            <p className="text-xs text-quecan-orange font-medium uppercase tracking-widest mt-1">Cơm Thị Nở</p>
          </div>
          <div className="space-y-4 pt-4 text-sm text-quecan-brown/80 leading-relaxed border-t border-quecan-brown/20 font-serif italic text-center">
            <p>
              "Hạt gạo làng ta có vị phù sa của sông Kinh Thầy..."
            </p>
            <p>
              Mỗi món ăn tại Cơm Thị Nở đều được nấu nướng tỉ mỉ bằng tình yêu quê hương đất nước. Hãy bắt đầu lật từng trang thực đơn bên phải để thưởng thức các món ăn mộc mạc đậm đà.
            </p>
          </div>
          <div className="bg-[#f2dec1] p-4 rounded-xl border border-quecan-brown/10 text-center">
            <Sparkles className="w-6 h-6 text-quecan-golden mx-auto mb-2" />
            <p className="text-xs font-semibold text-quecan-brown uppercase tracking-wider">
              Khuyên dùng từ đầu bếp
            </p>
            <p className="text-[11px] text-quecan-brown/70 mt-1">
              Cá trắm đen kho riềng nhừ xương ăn cùng niêu cơm cháy nóng hổi giòn rụm.
            </p>
          </div>
        </div>
      );

    case 'category':
      const category: MenuCategory = page.data;
      return (
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="text-center pb-4 border-b border-dashed border-quecan-brown/20">
              <h3 className="font-serif font-bold text-xl md:text-2xl text-quecan-brown uppercase tracking-wider">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-[11px] text-quecan-brown/60 italic mt-1 leading-snug">
                  {category.description}
                </p>
              )}
            </div>

            {/* List Menu Items in category */}
            <div className="mt-4 space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {category.menuItems && category.menuItems.length > 0 ? (
                category.menuItems.map((item) => (
                  <div key={item.id} className="group flex items-start space-x-3 pb-3 border-b border-quecan-brown/5 last:border-0">
                    <img
                      src={item.imageUrl.startsWith('http') || item.imageUrl.startsWith('/') ? item.imageUrl : `/uploads/${item.imageUrl}`}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg border border-quecan-brown/10 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=150&auto=format&fit=crop';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between">
                        <h4 className="font-bold text-quecan-brown text-sm truncate group-hover:text-quecan-orange transition">
                          {item.name}
                        </h4>
                        <div className="text-right shrink-0 ml-2">
                          {item.salePrice ? (
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-stone-400 line-through">{formatPrice(item.price)}</span>
                              <span className="text-xs font-bold text-quecan-orange">{formatPrice(item.salePrice)}</span>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-quecan-brown">{formatPrice(item.price)}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-quecan-brown/70 line-clamp-2 mt-0.5 leading-snug">
                        {item.shortDescription || item.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-400 text-center py-8">
                  Chưa có món ăn nào trong danh mục này.
                </p>
              )}
            </div>
          </div>
        </div>
      );

    case 'blank':
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 italic font-serif text-quecan-brown/60">
          <BookOpen className="w-10 h-10 text-quecan-brown/30 mb-4" />
          <p className="text-lg">{page.title}</p>
        </div>
      );

    case 'cover-back':
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 border-4 border-double border-quecan-golden rounded-xl bg-gradient-to-br from-[#4A250F] to-[#2B1608] text-white">
          <h2 className="font-serif font-bold text-2xl text-quecan-golden tracking-wider mb-2">
            {page.title}
          </h2>
          <p className="text-xs text-quecan-beige/70">
            Xin chân thành cảm ơn quý khách!
          </p>
          <div className="w-8 h-px bg-quecan-golden/50 my-6"></div>
          <p className="text-xs text-quecan-cream/60 leading-relaxed max-w-xs">
            Địa chỉ: KĐT Văn Quán, Hà Đông, Hà Nội <br />
            Đặt bàn trực tiếp qua hotline:
          </p>
          <p className="text-lg font-bold text-quecan-golden mt-2 font-serif">
            {page.phone}
          </p>
        </div>
      );

    default:
      return null;
  }
}
