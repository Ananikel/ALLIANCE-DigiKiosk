
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider, I18nProvider, DataProvider } from './contexts';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>
);
