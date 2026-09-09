import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { SensorProvider } from './context/SensorContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SensorProvider>
      <App />
    </SensorProvider>
  </StrictMode>
);
