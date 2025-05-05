import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductPage from '../components/ProductPage';
import { useLocation } from 'react-router-dom';

const ProductPages = () => {
    const location = useLocation();
    const product = location.state.product;

    return (
        <div>
        <Navbar />
        <div style={{ paddingTop: '64px' }}>
            <ProductPage product={product} />
        </div>
        <Footer />
        </div>
    );
};

export default ProductPages;