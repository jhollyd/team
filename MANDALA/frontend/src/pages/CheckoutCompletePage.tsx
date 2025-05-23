import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { guestStorage } from '../utils/guestStorage';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface CartItem {
  productId: string | { _id: string };
  color: string;
}

const CheckoutCompletePage = () => {
  const location = useLocation();
  const { user } = useUser();
  const { paymentIntentId } = location.state || {};
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Fetch cart items first
  useEffect(() => {
    const fetchCart = async () => {
      if (user) {
        try {
          // First get the user's MongoDB ID
          const userResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/clerk/${user.id}`);
          if (!userResponse.ok) throw new Error('Failed to fetch user data');
          const userData = await userResponse.json();
          
          // Then fetch the cart using MongoDB ID
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${userData._id}/cart`);
          if (!response.ok) throw new Error('Failed to fetch cart');
          const data = await response.json();
          setCartItems(data);
        } catch (error) {
          console.error('Error fetching cart:', error);
        }
      } else {
        const guestCart = guestStorage.getGuestCart();
        setCartItems(guestCart);
      }
    };

    fetchCart();
  }, [user]);

  // Handle cart clearing
  useEffect(() => {
    const clearCart = async () => {
      try {
        if (user) {
          // First get the user's MongoDB ID
          const userResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/clerk/${user.id}`);
          if (!userResponse.ok) throw new Error('Failed to fetch user data');
          const userData = await userResponse.json();

          // Clear the cart using MongoDB ID
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${userData._id}/cart/clear`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) throw new Error('Failed to clear cart');
        } else {
          // For guest users, clear localStorage
          guestStorage.clearGuestCart();
        }
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    };

    if (cartItems.length > 0) {
      clearCart();
    }
  }, [user, cartItems]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="mb-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Thank You for Your Order!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your payment has been processed successfully.
              {paymentIntentId && (
                <span className="block mt-2 text-sm text-gray-500">
                  Order ID: {paymentIntentId}
                </span>
              )}
            </p>
            <div className="space-y-4">
              <p className="text-gray-600">
                We'll send you an email confirmation with your order details.
              </p>
              <p className="text-gray-600">
                Your items will be shipped to the address you provided.
              </p>
            </div>
            <div className="mt-8">
              <a
                href="/gallery"
                className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Continue Shopping
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutCompletePage;