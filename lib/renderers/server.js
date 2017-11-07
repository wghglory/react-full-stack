import React from 'react';
import ReactDOMServer from 'react-dom/server';
import axios from 'axios';
// import App from '../components/App';  // relative path
import App from 'components/App'; // absolute path by NODE_PATH
import config from '../config';

// import StateApi from '../state-api';  // relative path
import StateApi from 'state-api'; // absolute path

const serverRender = async () => {
  const res = await axios.get(`http://${config.host}:${config.port}/data`);
  const store = new StateApi(res.data);

  return {
    initialMarkup: ReactDOMServer.renderToString(<App store={store} />),
    initialData: res.data
  };
};

export default serverRender;
