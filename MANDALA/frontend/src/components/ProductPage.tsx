import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface ProductPageProps {
  product: product;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  color: string;
  quantity: number;
}

const ProductPage = ({ product }: ProductPageProps) => {
  const [selectedColor, setSelectedColor] = useState('Black');
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedColor(e.target.value);
  };

  const handleAddToCart = () => {
    // Get existing cart
    const existingCart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if item with same ID and color already exists
    const existingItemIndex = existingCart.findIndex(
      item => item.id === product.id && item.color === selectedColor
    );

    if (existingItemIndex !== -1) {
      // If item exists, increase quantity
      existingCart[existingItemIndex].quantity += 1;
    } else {
      // If item doesn't exist, add new item
      existingCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        color: selectedColor,
        quantity: 1
      });
    }
    
    // Update cart in localStorage
    localStorage.setItem('cart', JSON.stringify(existingCart));
    
    // Show success message and refresh page
    setShowSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 100); // Wait 1 second to show the success message before refreshing
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
            className="bg-gray-900 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded w-full"
          >
            Add to Cart
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
