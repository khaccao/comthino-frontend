import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public pages
import HomePage from './pages/HomePage';

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC WEBPAGE ROUTES */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
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
        </Route>

        {/* CATCH ALL FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
