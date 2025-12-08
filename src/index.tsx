import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("%c[KERNEL] :: POWER ON", "color: #34d399; font-weight: bold; font-size: 14px;");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("%c[KERNEL] :: CRITICAL FAILURE :: ROOT_MISSING", "color: red; font-weight: bold;");
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);