import { Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import Products from "./pages/gallery";
import Checkout from './pages/Checkout';
import CheckoutCompletePage from "./pages/CheckoutCompletePage";
import Account from "./pages/Account";
import ProductPages from "./pages/productPages";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="gallery" element={<Products />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/checkout_complete" element={<CheckoutCompletePage />} />
      <Route path="/account" element={<Account />} />
      <Route path="/products/:id" element={<ProductPages />} />
    </Routes>
  );
};

export default AppRoutes; 