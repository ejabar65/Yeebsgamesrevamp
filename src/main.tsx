import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW registration failed: ', err);
    });
  });
}

async function init() {
  try {
    const res = await fetch('/api/supabase-config');
    if (res.ok) {
      const data = await res.json();
      if (data.isConfigured) {
        (window as any).SUPABASE_URL = data.supabaseUrl;
        (window as any).SUPABASE_ANON_KEY = data.supabaseKey;
        console.log('[Supabase Config] Successfully loaded runtime config from server');
      }
    }
  } catch (err) {
    console.error('[Supabase Config] Failed to fetch server config', err);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

init();
