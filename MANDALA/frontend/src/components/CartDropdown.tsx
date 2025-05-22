import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { guestStorage } from '../utils/guestStorage';

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface CartItem {
  productId: Product;
  quantity: number;
  color: string;
}

const CartDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchCart = async () => {
      if (user) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${user.id}/cart`);
          if (!response.ok) throw new Error('Failed to fetch cart');
          const data = await response.json();
          setCartItems(data);
        } catch (error) {
          console.error('Error fetching cart:', error);
        }
      } else {
        // For guest users, get cart from localStorage
        const guestCart = guestStorage.getGuestCart();
        // Fetch product details for each item
        const itemsWithDetails = await Promise.all(
          guestCart.map(async (item) => {
            try {
              const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/products/${item.productId}`);
              if (!response.ok) throw new Error('Failed to fetch product details');
              const product = await response.json();
              return {
                productId: product,
                quantity: item.quantity,
                color: item.color,
              };
            } catch (error) {
              console.error('Error fetching product details:', error);
              return null;
            }
          })
        );
        setCartItems(itemsWithDetails.filter((item): item is CartItem => item !== null));
      }
    };

    fetchCart();
  }, [user]);

  const updateCart = async (newCart: CartItem[]) => {
    setLoading(true);
    try {
      if (user) {
        // For logged-in users, update in database
        for (const item of newCart) {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${user.id}/cart`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId: item.productId._id,
              quantity: item.quantity,
              color: item.color,
            }),
          });

          if (!response.ok) throw new Error('Failed to update cart');
        }
      } else {
        // For guest users, update in localStorage
        const guestCart = newCart.map(item => ({
          productId: item.productId._id,
          quantity: item.quantity,
          color: item.color,
        }));
        guestStorage.setGuestCart(guestCart);
      }

      setCartItems(newCart);
      
      if (location.pathname === '/checkout') {
        navigate('/checkout', { replace: true });
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId: string, color: string) => {
    setLoading(true);
    try {
      if (user) {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${user.id}/cart`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId, color }),
        });

        if (!response.ok) throw new Error('Failed to remove item');
      } else {
        guestStorage.removeFromGuestCart(productId, color);
      }
      
      const newCart = cartItems.filter(
        item => !(item.productId._id === productId && item.color === color)
      );
      setCartItems(newCart);

      if (location.pathname === '/checkout') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      if (user) {
        // For logged-in users, remove each item from database
        for (const item of cartItems) {
          if (!item.productId) continue;
          
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${user.id}/cart`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId: item.productId._id,
              color: item.color,
            }),
          });

          if (!response.ok) throw new Error('Failed to clear cart');
        }
      } else {
        // For guest users, clear localStorage
        guestStorage.clearGuestCart();
      }

      setCartItems([]);

      if (location.pathname === '/checkout') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, color: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setLoading(true);
    try {
      if (user) {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${user.id}/cart`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            quantity: newQuantity,
            color,
          }),
        });

        if (!response.ok) throw new Error('Failed to update quantity');
      } else {
        guestStorage.updateGuestCartItem(productId, color, newQuantity);
      }

      const newCart = cartItems.map(item =>
        item.productId._id === productId && item.color === color
          ? { ...item, quantity: newQuantity }
          : item
      );
      setCartItems(newCart);

      if (location.pathname === '/checkout') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  const total = cartItems.reduce((sum, item) => {
    if (!item.productId) return sum;
    return sum + (item.productId.price * item.quantity);
  }, 0);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 hover:text-blue-200 transition-colors ${
          isScrolled ? 'text-black' : 'text-white'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>{totalItems}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Shopping Cart</h3>
              {cartItems.length > 0 && (
                <button
                  onClick={clearCart}
                  disabled={loading}
                  className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Your cart is empty</p>
            ) : (
              <>
                <div className="max-h-96 overflow-y-auto">
                  {cartItems.map((item) => (
                    item.productId && (
                      <div key={`${item.productId._id}-${item.color}`} className="flex items-center justify-between py-3 border-b">
                      <div className="flex-1">
                          <h4 className="font-medium">{item.productId.name}</h4>
                        <p className="text-sm text-gray-600">Color: {item.color}</p>
                          <p className="text-sm text-gray-600">${item.productId.price.toFixed(2)}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                            onClick={() => updateQuantity(item.productId._id, item.color, item.quantity - 1)}
                            disabled={loading}
                            className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                            onClick={() => updateQuantity(item.productId._id, item.color, item.quantity + 1)}
                            disabled={loading}
                            className="px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                        >
                          +
                        </button>
                        <button
                            onClick={() => removeItem(item.productId._id, item.color)}
                            disabled={loading}
                            className="ml-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    )
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between mb-4">
                    <span className="font-semibold">Total:</span>
                    <span className="font-semibold">${total.toFixed(2)}</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/checkout');
                    }}
                    disabled={loading}
                    className="w-full bg-gray-900 text-white py-2 px-4 rounded hover:bg-gray-700 disabled:opacity-50"
                  >
                    Go to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartDropdown; 