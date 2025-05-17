import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CheckoutProvider } from '@stripe/react-stripe-js';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StripeCheckoutForm from '../components/StripeCheckoutForm';

// Load Stripe outside of component rendering to avoid recreating the Stripe object
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY, {
  betas: ['custom_checkout_beta_5'],
});

interface CartItem {
  id: number;
  name: string;
  price: number;
  color: string;
  quantity: number;
}

interface GroupedCartItem extends CartItem {
  totalQuantity: number;
  variants: { color: string; quantity: number }[];
}

const Checkout = () => {
  const [paymentStatus, setPaymentStatus] = useState('loading');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [groupedItems, setGroupedItems] = useState<GroupedCartItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Load cart items from localStorage
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(savedCart);
    
    // Group items by ID
    const grouped = savedCart.reduce((acc: { [key: number]: GroupedCartItem }, item: CartItem) => {
      if (!acc[item.id]) {
        acc[item.id] = {
          ...item,
          totalQuantity: item.quantity,
          variants: [{ color: item.color, quantity: item.quantity }]
        };
      } else {
        acc[item.id].totalQuantity += item.quantity;
        const existingVariant = acc[item.id].variants.find(v => v.color === item.color);
        if (existingVariant) {
          existingVariant.quantity += item.quantity;
        } else {
          acc[item.id].variants.push({ color: item.color, quantity: item.quantity });
        }
      }
      return acc;
    }, {});

    setGroupedItems(Object.values(grouped));
    
    // Calculate total
    const cartTotal = savedCart.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
    setTotal(cartTotal);

    // Create checkout session if there are items in the cart
    if (savedCart.length > 0) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      fetch(`${apiUrl}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: savedCart.map((item: CartItem) => ({
            product_id: item.id,
            name: item.name,
            amount: Math.round(item.price * 100),
            quantity: item.quantity,
            color: item.color
          }))
        }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Server responded with status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (!data.clientSecret) {
            throw new Error('No client secret received from server');
          }
          setClientSecret(data.clientSecret);
        })
        .catch(err => {
          console.error('Error creating checkout session:', err);
          setPaymentStatus('error');
        });
    } else {
      setPaymentStatus('empty');
    }
  }, []);

  if (paymentStatus === 'empty') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
              <p className="text-lg text-gray-600 mb-8">
                Looks like you haven't added any items to your cart yet.
              </p>
              <Link
                to="/gallery"
                className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Payment Section */}
            <div className="space-y-6">
              {paymentStatus === 'error' ? (
                <div className="p-4 border border-red-300 bg-red-50 rounded text-red-700">
                  <p>Unable to connect to the payment service. Please try again later.</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              ) : clientSecret ? (
                <CheckoutProvider
                  stripe={stripePromise}
                  options={{ clientSecret }}
                >
                  <StripeCheckoutForm />
                </CheckoutProvider>
              ) : (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
              )}
            </div>
            
            {/* Order Summary */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-4">
                {groupedItems.map((item, index) => (
                  <div key={index} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">Total Quantity: {item.totalQuantity}</p>
                        {item.variants.map((variant, vIndex) => (
                          <p key={vIndex} className="text-sm text-gray-600">
                            {variant.color}: {variant.quantity}
                          </p>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">
                        ${(item.price * item.totalQuantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="border-b pb-4">
                  <p className="text-gray-600">Subtotal: ${total.toFixed(2)}</p>
                  <p className="text-gray-600">Shipping: $0.00</p>
                  <p className="text-gray-600">Tax: Will be calculated based on your location</p>
                </div>
                <div className="font-bold text-lg">
                  Total: ${total.toFixed(2)} (plus tax)
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;