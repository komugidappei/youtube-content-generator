import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import SimpleApp from './SimpleApp';

// GitHub Pagesではバックエンドが使用できないため、SimpleAppを使用
const isGitHubPages = window.location.hostname === 'komugidappei.github.io';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {isGitHubPages ? <SimpleApp /> : <App />}
  </React.StrictMode>
);