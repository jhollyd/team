import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CheckoutProvider } from '@stripe/react-stripe-js';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StripeCheckoutForm from '../components/StripeCheckoutForm';
import { guestStorage } from '../utils/guestStorage';

// Load Stripe outside of component rendering to avoid recreating the Stripe object
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY, {
  betas: ['custom_checkout_beta_5'],
});

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
}

interface CartItem {
  productId: Product;
  quantity: number;
  color: string;
}

interface GroupedCartItem {
  productId: {
    _id: string;
    name: string;
    price: number;
    image: string;
  };
  totalQuantity: number;
  variants: {
    color: string;
    quantity: number;
  }[];
}

const Checkout = () => {
  const { user } = useUser();
  const [paymentStatus, setPaymentStatus] = useState('loading');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [groupedItems, setGroupedItems] = useState<GroupedCartItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        let data: CartItem[] = [];

        if (user) {
          // First get the user's MongoDB ID
          const userResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/clerk/${user.id}`);
          if (!userResponse.ok) throw new Error('Failed to fetch user data');
          const userData = await userResponse.json();
          
          // Then fetch the cart using MongoDB ID
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${userData._id}/cart`);
          if (!response.ok) throw new Error('Failed to fetch cart');
          data = await response.json();
        } else {
          // For guest users, get from localStorage and fetch product details
          const guestCart = guestStorage.getGuestCart();
          const cartData = await Promise.all(
            guestCart.map(async (item) => {
              try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/products/${item.productId}`);
                if (!response.ok) throw new Error('Failed to fetch product details');
                const product: Product = await response.json();
                return {
                  productId: product,
                  quantity: item.quantity,
                  color: item.color,
                } as CartItem;
              } catch (error) {
                console.error('Error fetching product details:', error);
                return null;
              }
            })
          );
          data = cartData.filter((item): item is CartItem => item !== null);
        }

        setCartItems(data);
    
        // Group items by product ID
        const grouped = data.reduce((acc: { [key: string]: GroupedCartItem }, item: CartItem) => {
          const productId = item.productId._id;
          if (!acc[productId]) {
            acc[productId] = {
              productId: item.productId,
              totalQuantity: item.quantity,
              variants: [{ color: item.color, quantity: item.quantity }]
            };
          } else {
            acc[productId].totalQuantity += item.quantity;
            const existingVariant = acc[productId].variants.find(v => v.color === item.color);
            if (existingVariant) {
              existingVariant.quantity += item.quantity;
            } else {
              acc[productId].variants.push({ color: item.color, quantity: item.quantity });
            }
          }
          return acc;
        }, {});

        setGroupedItems(Object.values(grouped));
    
        // Calculate total
        const cartTotal = data.reduce((sum: number, item: CartItem) => 
          sum + (item.productId.price * item.quantity), 0);
        setTotal(cartTotal);

        // Create checkout session if there are items in the cart
        if (data.length > 0) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
          fetch(`${apiUrl}/api/payment/create-checkout-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              items: data.map((item: CartItem) => ({
                product_id: item.productId._id,
                name: item.productId.name,
                amount: Math.round(item.productId.price * 100),
                quantity: item.quantity,
                color: item.color,
                image: item.productId.image
              })),
              customerEmail: user?.primaryEmailAddress?.emailAddress
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
            setPaymentStatus('ready');
          })
          .catch(err => {
            console.error('Error creating checkout session:', err);
            setPaymentStatus('error');
          });
        } else {
          setPaymentStatus('empty');
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        setPaymentStatus('error');
      }
    };

    fetchCart();
  }, [user]);

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
                    <div className="flex gap-4">
                      <img
                        src={item.productId.image}
                        alt={item.productId.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{item.productId.name}</h4>
                            <p className="text-sm text-gray-600">Total Quantity: {item.totalQuantity}</p>
                            {item.variants.map((variant, vIndex) => (
                              <p key={vIndex} className="text-sm text-gray-600">
                                {variant.color}: {variant.quantity}
                              </p>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600">
                            ${(item.productId.price * item.totalQuantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
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