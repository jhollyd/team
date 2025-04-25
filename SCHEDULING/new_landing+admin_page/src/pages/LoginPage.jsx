import React, { useEffect } from 'react';
import '../styles/adminLogin.css';

// Define the callback function globally so Google can access it
window.handleCredentialResponse = (response) => {
  const credential = response.credential;
  fetch('https://student-scheduling-log-in-240e02feea96.herokuapp.com/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: credential }),
  })
    .then((res) => {
      if (!res.ok) throw new Error('Server returned error');
      return res.json();
    })
    .then((data) => {
      console.log('Backend Response:', data);
      if (data.success) {
        localStorage.setItem('authToken', credential);
        window.location.href = '/admin/schedules';
      } else {
        alert('The authentication failed');
      }
    })
    .catch((err) => console.log('Error:', err));
};

// Placeholder for manual sign-in (if needed)
const signIn = () => {
  alert('Manual sign-in not implemented');
};

export default function LoginPage() {
  useEffect(() => {
    // Create and load the Google script dynamically
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: 'YOUR_CLIENT_ID_HERE', // Replace with your actual Google Client ID
        callback: window.handleCredentialResponse,
      });
      // Render the button programmatically
      window.google.accounts.id.renderButton(
        document.querySelector('.g_id_signin'),
        { type: 'standard' } // Customize button options as needed
      );
    };
    document.body.appendChild(script);

    // Cleanup: Remove the script when the component unmounts
    return () => {
      document.body.removeChild(script);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <div id="login_Box">
      <h1>LOGIN</h1>
      <label htmlFor="username">Username: </label>
      <input type="text" id="username" placeholder="type your username" />
      <label htmlFor="password">Password: </label>
      <input type="password" id="password" placeholder="type your password" />
      <button id="confirmButton" onClick={signIn}>
        Sign in
      </button>
      <div className="g_id_signin"></div>
    </div>
  );
}