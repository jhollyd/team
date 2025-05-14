// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';

// Import the combined global styles
import './index.css';

// Optional: If you used Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';

import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
