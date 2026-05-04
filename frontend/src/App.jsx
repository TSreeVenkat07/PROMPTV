import React from 'react';
import { ToastProvider } from './components/Toast';
import Home from './pages/Home';
import './index.css';

export default function App() {
  return (
    <ToastProvider>
      <Home />
    </ToastProvider>
  );
}
