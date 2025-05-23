const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/users');

// Calculate the order amount function for Stripe
const calculateOrderAmount = (items) => {
  return items.reduce((total, item) => {
    return total + (item.productId.price * item.quantity);
  }, 0) * 100; // Convert to cents for Stripe
};

// Create checkout session
exports.createCheckoutSession = async (req, res) => {
  try {
    const { items, customerEmail } = req.body;
    
    if (!items || !items.length) {
      return res.status(400).json({ message: 'No items in cart' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      ui_mode: 'custom',
      customer_email: customerEmail,
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Product ID: ${item.product_id} | Name: ${item.name} | Color: ${item.color}`,
            metadata: {
              product_id: item.product_id,
              color: item.color
            }
          },
          unit_amount: item.amount, // Already in cents
        },
        quantity: item.quantity,
      })),
      automatic_tax: {
        enabled: true,
      },
      return_url: `${process.env.FRONTEND_URL}/checkout_complete`,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
    });

    res.json({ 
      sessionId: session.id,
      clientSecret: session.client_secret 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: error.message });
  }
};

// Check payment status
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      // Clear the user's cart after successful payment
      const user = await User.findOne({ clerkId: session.customer_email });
      if (user) {
        user.cart = [];
        await user.save();
      }
    }

    res.json({ status: session.payment_status });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ message: error.message });
  }
}; 