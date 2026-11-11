import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/source-serif-4/600.css';
import './styles.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './auth.jsx';
import { MetaProvider } from './meta.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <MetaProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MetaProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
