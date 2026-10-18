import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './theme';
import Root from './Root.jsx';
import './index.css';
import './App.css';
import './dark.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
