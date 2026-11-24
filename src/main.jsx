import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './theme';
import './install';
import Root from './Root.jsx';
import Legal from './Legal.jsx';
import './index.css';
import './App.css';
import './dark.css';

const path = window.location.pathname.replace(/\/+$/, '');
const legalPage = path === '/privacy' ? 'privacy' : path === '/terms' ? 'terms' : null;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {legalPage ? <Legal page={legalPage} /> : <Root />}
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
