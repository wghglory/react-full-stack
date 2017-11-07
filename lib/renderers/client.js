import React from 'react';
import ReactDOM from 'react-dom';

// import App from '../components/App'; // relative path is better for client side
import App from 'components/App'; // absolute path, but for webpack, edit resolve in webpack config

// import StateApi from '../state-api/index';  // relative path
import StateApi from 'state-api'; // absolute path

const store = new StateApi(window.initialData);

ReactDOM.hydrate(<App store={store} />, document.getElementById('root'));
