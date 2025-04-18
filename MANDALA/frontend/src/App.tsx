import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './pages/home';
import Products from "./pages/gallery";
import Checkout from './pages/Checkout';
import CheckoutCompletePage from "./pages/CheckoutCompletePage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="gallery" element={<Products />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout_complete" element={<CheckoutCompletePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
