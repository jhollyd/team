// Download env data
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import bodyParser from 'body-parser';
import Stripe from 'stripe';

const app = express();
const port = 5000;

// Settings CORS, for POST requests from frontend
app.use(cors());

// parsing body of json request
app.use(bodyParser.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia; custom_checkout_beta=v1',
});


// Calculate the order amount function for Stripe
const calculateOrderAmount = (items) => {
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  let total = 0;
  items.forEach((item) => {
    total += item.amount * item.quantity; // Multiply amount by quantity
  });
  return total;
};

// Stripe checkout session endpoint
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, customerEmail } = req.body;

    // Create a Checkout Session
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
      return_url: `${req.headers.origin}/checkout_complete`,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
    });

    res.send({
      clientSecret: session.client_secret,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).send({ error: 'Failed to create checkout session' });
  }
});

// Endpoint to check payment status
app.get("/check-payment-status/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Retrieve the payment intent using your secret key
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    
    // Send back only what's needed (status and ID)
    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    res.status(500).send({ error: "Failed to check payment status" });
  }
});

// Settings for Nodemailer (SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail', // could be used diffent servicee
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post('/send-email', async (req, res) => {
  const { name, email, phone, message } = req.body;

  // Email settings. Data taken from .env
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECIPIENT_EMAIL,
    subject: `Message from ${name}`,
    text: `
      Name: ${name}
      Email: ${email}
      Phone: ${phone}
      Message: ${message}
    `,
  };

  try {
    // Sending email
    await transporter.sendMail(mailOptions);
    res.status(200).send('Email sent successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error sending email');
  }
});

// Running server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
