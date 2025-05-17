import { useState, useEffect } from "react";
import {
  PaymentElement,
  AddressElement,
  useCheckout,
} from '@stripe/react-stripe-js';
import { useUser } from '@clerk/clerk-react';

const StripeCheckoutForm = () => {
  const { user } = useUser();
  const checkout = useCheckout();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    if (userEmail) {
      setEmail(userEmail);
      checkout.updateEmail(userEmail).then((result) => {
        if (result.type === 'error') {
          setError(result.error.message);
        }
      });
    }
  }, [user, checkout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await checkout.confirm();
    if (result.type === 'error') {
      setError(result.error.message);
    }

    setIsLoading(false);
  };

  const handleShippingAddressChange = async (event: any) => {
    if (event.complete) {
      // Use the shipping address as the billing address
      await checkout.updateBillingAddress(event.value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => {
              checkout.updateEmail(email).then((result) => {
                if (result.type === 'error') {
                  setError(result.error.message);
                }
              });
            }}
            placeholder="you@example.com"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </label>
        {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h3>
        <AddressElement 
          options={{ mode: 'shipping' }}
          onChange={handleShippingAddressChange}
        />
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment</h3>
        <PaymentElement 
          options={{ 
            layout: 'accordion',
            fields: {
              billingDetails: {
                name: 'never'
              }
            }
          }} 
        />
      </div>

      <button
        disabled={isLoading}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 relative disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        ) : (
          `Pay $${(checkout.total.total / 100).toFixed(2)} now`
        )}
      </button>
    </form>
  );
};

export default StripeCheckoutForm;