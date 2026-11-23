import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './engine/scrollcraft.css';
import './engine/scrollcraft.js';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
