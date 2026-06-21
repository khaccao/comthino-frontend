import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public pages
import HomePage from './pages/HomePage';
import BlogListPage from './pages/BlogListPage';
import BlogCategoryPage from './pages/BlogCategoryPage';
import BlogDetailPage from './pages/BlogDetailPage';

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
        </Route>

        {/* CATCH ALL FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
