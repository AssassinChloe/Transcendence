import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './components/App.tsx';
import { AlertProvider } from './components/AlertContext.tsx';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
  );



root.render(
  <AlertProvider>
    <App />
  </AlertProvider>
);


