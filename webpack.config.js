// 这里 dev 和 prod 共享。只是 build prod 时候 webpack -p 去 minify。实际还是要分离成 2 个文件。
const path = require('path');
const webpack = require('webpack');

const config = {
  resolve: {
    modules: [path.resolve('./lib'), path.resolve('./node_modules')]
  },
  // entry: ['babel-polyfill', './lib/renderers/client.js'],
  entry: {
    vendor: [
      'babel-polyfill',
      'react',
      'react-dom',
      'prop-types',
      'axios',
      'lodash.debounce',
      'lodash.pickby'
    ],
    app: ['./lib/renderers/client.js']
  },
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['react', 'env', 'stage-2']
          }
        }
      }
    ]
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor'
    })
  ]
};

module.exports = config;
