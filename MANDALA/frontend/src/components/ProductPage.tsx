import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { guestStorage } from '../utils/guestStorage';

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface ProductPageProps {
  product: Product;
}

const ProductPage = ({ product }: ProductPageProps) => {
  const [selectedColor, setSelectedColor] = useState('Black');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedColor(e.target.value);
  };

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      if (user) {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${user.id}/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: product._id,
            quantity: 1,
            color: selectedColor,
          }),
        });

        if (!response.ok) throw new Error('Failed to add item to cart');
    } else {
        // For guest users, add to localStorage
        guestStorage.addToGuestCart({
          productId: product._id,
          quantity: 1,
        color: selectedColor,
      });
    }
    
    setShowSuccess(true);
    setTimeout(() => {
      window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-12 mt-12">
      <div className="flex flex-wrap justify-center mb-12">
        <div className="w-full lg:w-2/3 xl:w-3/4 mb-4 lg:mb-0">
          <img
            src={product.image}
            alt={product.name}
            className="max-w-2xl w-full h-auto object-contain mb-4"
          />
        </div>
        <div className="w-full lg:w-1/3 xl:w-1/4">
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-lg font-medium mb-4">${product.price.toFixed(2)}</p>
          <p className="text-lg font-medium mb-4">Category: {product.category}</p>

          {/* Color customization */}
          <div className="mb-6">
            <label htmlFor="color" className="block mb-2 text-md font-medium text-gray-700">
              Choose a color:
            </label>
            <select
              id="color"
              value={selectedColor}
              onChange={handleColorChange}
              className="block w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="Black">Black</option>
              <option value="Blue">Blue</option>
              <option value="Red">Red</option>
              <option value="Purple">Purple</option>
              <option value="Custom">Custom (please specify at checkout)</option>
            </select>
          </div>

          <button 
            onClick={handleAddToCart}
            disabled={loading}
            className="bg-gray-900 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded w-full disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add to Cart'}
          </button>

          {showSuccess && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <p>Item added to cart successfully!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
