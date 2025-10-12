import React from 'https://esm.sh/react@18';
import { createRoot } from 'https://esm.sh/react-dom@18/client';
import App from './App.js';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(React.createElement(App));
