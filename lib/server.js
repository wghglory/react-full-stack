import 'babel-polyfill'; // Async functions producing an error "ReferenceError: regeneratorRuntime is not defined

import express from 'express';
import config from './config';
// import serverRender from './renderers/server';  // relative path
import serverRender from 'renderers/server'; // absolute path by NODE_PATH

import { data } from './testData';

const app = express();

app.use(express.static('public'));

app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
  const initialContent = await serverRender();
  res.render('index', { ...initialContent });
});

app.get('/data', (req, res) => {
  res.send(data);
});

app.listen(config.port, function() {
  console.info(`Running on ${config.port}`);
});
