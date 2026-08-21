import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import AdminRouteGuard from './components/AdminRouteGuard';
import { getFirstAllowedAdminPath } from './utils/adminPermissions';
import { useAuthStore } from './utils/authStore';

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
import PosRunner from './pages/admin/PosRunner';
import Users from './pages/admin/Users';
import Roles from './pages/admin/Roles';
import RolePermissionsMatrix from './pages/admin/RolePermissionsMatrix';
import AuditLogs from './pages/admin/AuditLogs';
import PaymentRequests from './pages/admin/PaymentRequests';
import PaymentVouchers from './pages/admin/PaymentVouchers';
import PaymentDashboard from './pages/admin/PaymentDashboard';
import Suppliers from './pages/admin/Suppliers';
import SupplierDebts from './pages/admin/SupplierDebts';
import CashAccounts from './pages/admin/CashAccounts';
import PaymentApprovals from './pages/admin/PaymentApprovals';
import CashReports from './pages/admin/CashReports';
import Payroll from './pages/admin/Payroll';
import KitchenInventory from './pages/admin/KitchenInventory';
import Customers from './pages/admin/Customers';
import Branches from './pages/admin/Branches';
import FaceRegistration from './pages/admin/FaceRegistration';
import FaceAttendance from './pages/admin/FaceAttendance';

function AdminIndexRedirect() {
  const { user } = useAuthStore();
  return <Navigate to={getFirstAllowedAdminPath(user)} replace />;
}

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
          <Route index element={<AdminIndexRedirect />} />
          <Route path="dashboard" element={<AdminRouteGuard menuCode="DASHBOARD"><Dashboard /></AdminRouteGuard>} />
          <Route path="site-settings" element={<AdminRouteGuard menuCode="SYSTEM_CONFIG"><SiteSettings /></AdminRouteGuard>} />
          <Route path="navigation-items" element={<AdminRouteGuard menuCode="SYSTEM_CONFIG"><NavigationItems /></AdminRouteGuard>} />
          <Route path="banners" element={<AdminRouteGuard menuCode="SYSTEM_CONFIG"><Banners /></AdminRouteGuard>} />
          <Route path="home-sections" element={<AdminRouteGuard menuCode="SYSTEM_CONFIG"><HomeSections /></AdminRouteGuard>} />
          <Route path="menu-categories" element={<AdminRouteGuard menuCode="DISH_CATEGORY"><MenuCategories /></AdminRouteGuard>} />
          <Route path="menu-items" element={<AdminRouteGuard menuCode="MENU_MANAGEMENT"><MenuItems /></AdminRouteGuard>} />
          <Route path="promotions" element={<AdminRouteGuard menuCode="SYSTEM_CONFIG"><Promotions /></AdminRouteGuard>} />
          <Route path="gallery" element={<AdminRouteGuard menuCode="SYSTEM_CONFIG"><Gallery /></AdminRouteGuard>} />
          <Route path="testimonials" element={<AdminRouteGuard menuCode="SYSTEM_CONFIG"><Testimonials /></AdminRouteGuard>} />
          <Route path="contact-messages" element={<AdminRouteGuard menuCode="SYSTEM_CONFIG"><ContactMessages /></AdminRouteGuard>} />
          <Route path="media" element={<AdminRouteGuard menuCode="SYSTEM_CONFIG"><MediaManager /></AdminRouteGuard>} />
          <Route path="blog/categories" element={<AdminRouteGuard menuCode="BLOG_CATEGORY"><BlogCategories /></AdminRouteGuard>} />
          <Route path="blog/posts" element={<AdminRouteGuard menuCode="BLOG_POST"><BlogPosts /></AdminRouteGuard>} />
          <Route path="blog/posts/new" element={<AdminRouteGuard menuCode="BLOG_POST" permissionCode="CREATE"><BlogPostEditor /></AdminRouteGuard>} />
          <Route path="blog/posts/:id/edit" element={<AdminRouteGuard menuCode="BLOG_POST" permissionCode="EDIT"><BlogPostEditor /></AdminRouteGuard>} />
          {/* SEO Routes */}
          <Route path="seo-pages" element={<AdminRouteGuard menuCode="SEO_PAGE"><SeoPages /></AdminRouteGuard>} />
          <Route path="seo-pages/new" element={<AdminRouteGuard menuCode="SEO_PAGE" permissionCode="CREATE"><SeoPageEditor /></AdminRouteGuard>} />
          <Route path="seo-pages/:id/edit" element={<AdminRouteGuard menuCode="SEO_PAGE" permissionCode="EDIT"><SeoPageEditor /></AdminRouteGuard>} />
          <Route path="faqs" element={<AdminRouteGuard menuCode="FAQ_MANAGEMENT"><FAQsManager /></AdminRouteGuard>} />
          <Route path="reviews" element={<AdminRouteGuard menuCode="REVIEW_MANAGEMENT"><ReviewsManager /></AdminRouteGuard>} />
          <Route path="pos" element={<AdminRouteGuard menuCode="ORDER_POS"><POS /></AdminRouteGuard>} />
          <Route path="pos/runner" element={<AdminRouteGuard menuCode="POS_RUNNER"><PosRunner /></AdminRouteGuard>} />
          <Route path="users" element={<AdminRouteGuard menuCode="USER_MANAGEMENT"><Users /></AdminRouteGuard>} />
          <Route path="roles" element={<AdminRouteGuard menuCode="ROLE_MANAGEMENT"><Roles /></AdminRouteGuard>} />
          <Route path="permissions" element={<AdminRouteGuard menuCode="PERMISSION_MANAGEMENT"><RolePermissionsMatrix /></AdminRouteGuard>} />
          <Route path="audit-logs" element={<AdminRouteGuard menuCode="AUDIT_LOG"><AuditLogs /></AdminRouteGuard>} />
          <Route path="payments/requests" element={<AdminRouteGuard menuCode="PAYMENT_REQUEST"><PaymentRequests /></AdminRouteGuard>} />
          <Route path="payments/vouchers" element={<AdminRouteGuard menuCode="PAYMENT_VOUCHER"><PaymentVouchers /></AdminRouteGuard>} />
          <Route path="payments/dashboard" element={<AdminRouteGuard menuCode="CASH_BOOK"><PaymentDashboard /></AdminRouteGuard>} />
          <Route path="payments/approvals" element={<AdminRouteGuard menuCode="PAYMENT_REQUEST_APPROVAL"><PaymentApprovals /></AdminRouteGuard>} />
          <Route path="cash/accounts" element={<AdminRouteGuard menuCode="BANK_ACCOUNT"><CashAccounts /></AdminRouteGuard>} />
          <Route path="reports/cash" element={<AdminRouteGuard menuCode="CASH_REPORT"><CashReports /></AdminRouteGuard>} />
          <Route path="suppliers" element={<AdminRouteGuard menuCode="SUPPLIER_CATEGORY"><Suppliers /></AdminRouteGuard>} />
          <Route path="suppliers/debt" element={<AdminRouteGuard menuCode="SUPPLIER_DEBT"><SupplierDebts /></AdminRouteGuard>} />
          <Route path="payroll" element={<AdminRouteGuard menuCode="PAYROLL"><Payroll /></AdminRouteGuard>} />
          <Route path="customers" element={<AdminRouteGuard menuCode="CUSTOMER_MANAGEMENT"><Customers /></AdminRouteGuard>} />
          <Route path="system/branches" element={<AdminRouteGuard menuCode="BRANCH_MANAGEMENT"><Branches /></AdminRouteGuard>} />
          <Route path="face-registration" element={<AdminRouteGuard menuCode="FACE_ATTENDANCE"><FaceRegistration /></AdminRouteGuard>} />
          <Route path="face-attendance" element={<AdminRouteGuard menuCode="FACE_ATTENDANCE" permissionCode="CREATE"><FaceAttendance /></AdminRouteGuard>} />
          <Route path="kitchen-inventory" element={<AdminRouteGuard menuCode="KITCHEN_INVENTORY"><KitchenInventory /></AdminRouteGuard>} />
        </Route>

        {/* CATCH ALL FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
