/**
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

// Render the main App component into the root element.
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// For the app to work offline and load faster, can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers:
// https://create-react-app.dev/docs/making-a-progressive-web-app/
serviceWorkerRegistration.unregister();

// To start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: 
// https://create-react-app.dev/docs/measuring-performance/

reportWebVitals();
