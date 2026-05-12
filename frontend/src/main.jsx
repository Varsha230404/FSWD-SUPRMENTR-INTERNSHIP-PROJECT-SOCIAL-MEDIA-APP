import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#171717',
              border: '1px solid #e5e5e5',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.12), 0 4px 10px -6px rgba(0,0,0,0.08)',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 500,
              padding: '10px 14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
