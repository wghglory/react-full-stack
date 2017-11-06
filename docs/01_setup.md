# Setup project

## yarn

```bash
yarn add eslint eslint-plugin-react babel-eslint --dev   # will automatically save package to devDependencies
yarn eslint --init
yarn add express ejs pm2

# below push server side modern javascript to production server, depending on production flow
yarn add babel-cli babel-preset-react babel-preset-env babel-preset-stage-2 babel-polyfill
yarn add react react-dom webpack babel-loader

# use yarn script instead npm run script
yarn dev
```

## package.json

```json
"babel": {
  "presets": ["react", "env", "stage-2"]
},
"scripts": {
  "start": "yarn devServer && yarn webpack",
  "predevServer": "pm2 stop lib/server.js",
  "devServer": "pm2 start lib/server.js --watch --interpreter babel-node && pm2 logs",
  "devServer:nodemon": "nodemon --exec babel-node lib/server.js",
  "webpack": "webpack -wd"
},
"devDependencies": {
  "babel-eslint": "^8.0.1",
  "eslint": "^4.10.0",
  "eslint-plugin-react": "^7.4.0"
},
"dependencies": {
  "babel-cli": "^6.26.0",
  "babel-loader": "^7.1.2",
  "babel-polyfill": "^6.26.0",
  "babel-preset-env": "^1.6.1",
  "babel-preset-react": "^6.24.1",
  "babel-preset-stage-2": "^6.24.1",
  "ejs": "^2.5.7",
  "express": "^4.16.2",
  "pm2": "^2.7.2",
  "react": "^16.0.0",
  "react-dom": "^16.0.0",
  "webpack": "^3.8.1"
}
```

## lib/server.js

In order to use `import` es6 feature in node, install `babel-cli`

> `yarn dev` will use babel-node: "pm2 start lib/server.js --watch --interpreter babel-node && pm2 logs"

```javascript
import express from 'express';
import config from './config';

const app = express();

app.use(express.static('public'));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index', { answer: 11 });
});

app.listen(config.port, function() {
  console.info(`Running on ${config.port}`);
});
```

## webpack

```bash
webpack -wd  # watch, development mode
time yarn webpack
```

```javascript
const path = require('path');

const config = {
  entry: ['babel-polyfill', './lib/components/Index.js'],  // babel-polyfill for async/await
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  }
};

module.exports = config;
```