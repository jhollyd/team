import { Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import Products from "./pages/gallery";
import Checkout from './pages/Checkout';
import CheckoutCompletePage from "./pages/CheckoutCompletePage";
import Account from "./pages/Account";
import ProductPages from "./pages/productPages";
import AdminDashboard from './components/AdminDashboard';
import ProductManagement from './components/ProductManagement';
import UserManagement from './components/UserManagement';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="gallery" element={<Products />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/checkout_complete" element={<CheckoutCompletePage />} />
      <Route path="/account" element={<Account />} />
      <Route path="/products/:id" element={<ProductPages />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/products" element={<ProductManagement />} />
      <Route path="/admin/users" element={<UserManagement />} />
    </Routes>
  );
};

export default AppRoutes; 