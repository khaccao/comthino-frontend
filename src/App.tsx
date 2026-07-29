import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public pages
import HomePage from './pages/HomePage';
import BlogListPage from './pages/BlogListPage';
import BlogCategoryPage from './pages/BlogCategoryPage';
import BlogDetailPage from './pages/BlogDetailPage';
import SeoLandingPage from './pages/SeoLandingPage';
import StaticSeoPage from './pages/StaticSeoPage';

// Admin pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import SiteSettings from './pages/admin/SiteSettings';
import NavigationItems from './pages/admin/NavigationItems';
import Banners from './pages/admin/Banners';
import HomeSections from './pages/admin/HomeSections';
import MenuCategories from './pages/admin/MenuCategories';
import MenuItems from './pages/admin/MenuItems';
import Promotions from './pages/admin/Promotions';
import Gallery from './pages/admin/Gallery';
import Testimonials from './pages/admin/Testimonials';
import ContactMessages from './pages/admin/ContactMessages';
import MediaManager from './pages/admin/MediaManager';
import BlogCategories from './pages/admin/BlogCategories';
import BlogPosts from './pages/admin/BlogPosts';
import BlogPostEditor from './pages/admin/BlogPostEditor';
import SeoPages from './pages/admin/SeoPages';
import SeoPageEditor from './pages/admin/SeoPageEditor';
import FAQsManager from './pages/admin/FAQsManager';
import ReviewsManager from './pages/admin/ReviewsManager';
import POS from './pages/admin/POS';
import Users from './pages/admin/Users';
import Roles from './pages/admin/Roles';
import RolePermissionsMatrix from './pages/admin/RolePermissionsMatrix';
import AuditLogs from './pages/admin/AuditLogs';
import PaymentRequests from './pages/admin/PaymentRequests';
import PaymentVouchers from './pages/admin/PaymentVouchers';
import PaymentDashboard from './pages/admin/PaymentDashboard';
import Suppliers from './pages/admin/Suppliers';
import CashAccounts from './pages/admin/CashAccounts';
import PaymentApprovals from './pages/admin/PaymentApprovals';
import CashReports from './pages/admin/CashReports';
import Payroll from './pages/admin/Payroll';
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC WEBPAGE ROUTES */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="tin-tuc" element={<BlogListPage />} />
          <Route path="tin-tuc/danh-muc/:slug" element={<BlogCategoryPage />} />
          <Route path="tin-tuc/:slug" element={<BlogDetailPage />} />
          <Route path="thuc-don" element={<StaticSeoPage />} />
          <Route path="mon-an/:slug" element={<StaticSeoPage />} />
          <Route path="com-ngon-ha-dong" element={<StaticSeoPage />} />
          <Route path="com-ngon-van-quan" element={<StaticSeoPage />} />
          <Route path="quan-com-ngon-van-quan" element={<StaticSeoPage />} />
          <Route path="quan-com-ngon-ha-dong" element={<StaticSeoPage />} />
          <Route path="com-van-phong-ha-dong" element={<StaticSeoPage />} />
          <Route path="com-trua-van-phong-ha-dong" element={<StaticSeoPage />} />
          <Route path="com-que-ha-dong" element={<StaticSeoPage />} />
          <Route path="com-van-quan" element={<StaticSeoPage />} />
          <Route path="com-gia-dinh-ha-dong" element={<StaticSeoPage />} />
          <Route path="com-mang-ve-ha-dong" element={<StaticSeoPage />} />
          <Route path="dat-com-van-phong-van-quan" element={<StaticSeoPage />} />
          <Route path="an-gi-o-van-quan-ha-dong" element={<StaticSeoPage />} />
          <Route path="quan-com-gia-dinh-ha-dong" element={<StaticSeoPage />} />
          <Route path="gioi-thieu" element={<StaticSeoPage />} />
          <Route path="lien-he" element={<StaticSeoPage />} />
          <Route path="chinh-sach-dat-com-giao-hang" element={<StaticSeoPage />} />
          <Route path="chinh-sach-doi-huy-don" element={<StaticSeoPage />} />
          <Route path="hoa-don-vat-dat-com-cong-ty" element={<StaticSeoPage />} />
          <Route path="an-toan-thuc-pham-nguyen-lieu" element={<StaticSeoPage />} />
          {/* SEO Landing Pages - catch-all for slugs */}
          <Route path=":slug" element={<SeoLandingPage />} />
        </Route>

        {/* ADMIN LOGIN */}
        <Route path="/admin/login" element={<Login />} />

        {/* ADMIN SYSTEM BACK-OFFICE ROUTES */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="site-settings" element={<SiteSettings />} />
          <Route path="navigation-items" element={<NavigationItems />} />
          <Route path="banners" element={<Banners />} />
          <Route path="home-sections" element={<HomeSections />} />
          <Route path="menu-categories" element={<MenuCategories />} />
          <Route path="menu-items" element={<MenuItems />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="testimonials" element={<Testimonials />} />
          <Route path="contact-messages" element={<ContactMessages />} />
          <Route path="media" element={<MediaManager />} />
          <Route path="blog/categories" element={<BlogCategories />} />
          <Route path="blog/posts" element={<BlogPosts />} />
          <Route path="blog/posts/new" element={<BlogPostEditor />} />
          <Route path="blog/posts/:id/edit" element={<BlogPostEditor />} />
          {/* SEO Routes */}
          <Route path="seo-pages" element={<SeoPages />} />
          <Route path="seo-pages/new" element={<SeoPageEditor />} />
          <Route path="seo-pages/:id/edit" element={<SeoPageEditor />} />
          <Route path="faqs" element={<FAQsManager />} />
          <Route path="reviews" element={<ReviewsManager />} />
          <Route path="pos" element={<POS />} />
          <Route path="users" element={<Users />} />
          <Route path="roles" element={<Roles />} />
          <Route path="permissions" element={<RolePermissionsMatrix />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="payments/requests" element={<PaymentRequests />} />
          <Route path="payments/vouchers" element={<PaymentVouchers />} />
          <Route path="payments/dashboard" element={<PaymentDashboard />} />
          <Route path="payments/approvals" element={<PaymentApprovals />} />
          <Route path="cash/accounts" element={<CashAccounts />} />
          <Route path="reports/cash" element={<CashReports />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="payroll" element={<Payroll />} />
        </Route>

        {/* CATCH ALL FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
