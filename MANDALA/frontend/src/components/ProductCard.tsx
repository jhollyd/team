import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { guestStorage } from '../utils/guestStorage';

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
  tags: string[];
  isActive: boolean;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { user } = useUser();
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (user) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${user.id}/wishlist`);
          if (!response.ok) throw new Error('Failed to fetch wishlist');
          const wishlist = await response.json();
          setInWishlist(wishlist.some((item: Product) => item._id === product._id));
        } catch (error) {
          console.error('Error checking wishlist status:', error);
        }
      } else {
        // For guest users, check localStorage
        const guestWishlist = guestStorage.getGuestWishlist();
        setInWishlist(guestWishlist.some(item => item.productId === product._id));
      }
    };

    checkWishlistStatus();
  }, [user, product._id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      if (user) {
        const method = inWishlist ? 'DELETE' : 'POST';
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${user.id}/wishlist`, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId: product._id }),
        });

        if (!response.ok) throw new Error('Failed to update wishlist');
      } else {
        // For guest users, update localStorage
        if (inWishlist) {
          guestStorage.removeFromGuestWishlist(product._id);
        } else {
          guestStorage.addToGuestWishlist(product._id);
        }
      }
      setInWishlist(!inWishlist);
    } catch (error) {
      console.error('Error updating wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link to={`/products/${product._id}`} state={{ product }}>
      <div className="border rounded-lg shadow hover:shadow-md transition overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-60 object-cover"
        />
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {product.name}
          </h2>
          <div className="flex flex-wrap gap-1 mt-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-blue-600 font-bold">${product.price.toFixed(2)}</p>
            <button 
              className="text-red-600 py-2 px-4 disabled:opacity-50"
              onClick={toggleWishlist}
              disabled={loading}
            >
              <Heart fill={inWishlist ? 'red' : 'none'} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;