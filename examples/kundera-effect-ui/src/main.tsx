import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RegistryProvider } from '@effect-atom/atom-react';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RegistryProvider>
      <App />
    </RegistryProvider>
  </StrictMode>,
);
