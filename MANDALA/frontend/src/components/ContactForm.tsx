import React, { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Sending data to server
    try {
      const response = await fetch('http://localhost:3000/api/email/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
  
      if (response.ok) {
        setTimeout(() => {
          setLoading(false);
          setSubmitted(true);
        }, 800);
      } else {
        setLoading(false);
        alert('Error during sending a form');
      }
    } catch (error) {
      setLoading(false);
      alert('Error during sending a form');
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="transform transition-all duration-700 animate-scale-up">
          <svg 
            className="mx-auto h-16 w-16 text-green-500 mb-4"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M5 13l4 4L19 7" 
            />
          </svg>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h3>
          <p className="text-gray-600">
            Your message has been received. We'll get back to you shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left sidebar */}
          <div className="w-full md:w-1/3 space-y-6 animate-fade-in">
            {/* Social Media Links */}
            <div className="space-y-3">
              <a 
                href="#" 
                className="flex items-center gap-3 px-4 py-3 rounded-full bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-gray-800">Facebook</span>
              </a>
              
              <a 
                href="#" 
                className="flex items-center gap-3 px-4 py-3 rounded-full bg-blue-500 text-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>Instagram</span>
              </a>
            </div>

            {/* Opening Hours */}
            <div className="bg-white p-5 rounded-lg shadow-sm hover:-translate-y-1 transition-transform duration-300">
              <h2 className="text-lg font-medium text-gray-700 mb-4">Opening Hours</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mon - Fri</span>
                  <span className="text-gray-600">10:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sat</span>
                  <span className="text-gray-600">11:00 - 16:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="w-full md:w-2/3 bg-white p-6 rounded-lg shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 animate-fade-in-right">
            <h1 className="text-2xl font-bold text-gray-800 mb-2 animate-fade-in-down">Contact Us</h1>
            <div className="w-20 h-1 bg-blue-500 mb-6"></div>
            
            <p className="text-gray-600 mb-6">
              Do you have questions about our products or services? Fill out the form, and we will get back to you as soon as possible.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="animate-fade-in-up delay-100">
                <label htmlFor="name" className="block text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  id="name"
                  required
                  className={`w-full p-2 border rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    focused === 'name' ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                />
              </div>
              
              <div className="animate-fade-in-up delay-200">
                <label htmlFor="email" className="block text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  required
                  className={`w-full p-2 border rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    focused === 'email' ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                />
              </div>
              
              <div className="animate-fade-in-up delay-300">
                <label htmlFor="phone" className="block text-gray-600 mb-1">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  required
                  className={`w-full p-2 border rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    focused === 'phone' ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  value={formData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                  onFocus={() => setFocused('phone')}
                  onBlur={() => setFocused(null)}
                />
              </div>
              
              <div className="animate-fade-in-up delay-400">
                <label htmlFor="message" className="block text-gray-600 mb-1">Message</label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  className={`w-full p-2 border rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    focused === 'message' ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  value={formData.message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, message: e.target.value })}
                  onFocus={() => setFocused('message')}
                  onBlur={() => setFocused(null)}
                />
              </div>
              
              <div className="animate-fade-in-up delay-500">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;