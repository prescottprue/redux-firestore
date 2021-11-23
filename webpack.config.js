const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const libraryName = 'redux-firestore';
const isProduction = process.env.NODE_ENV === 'production';

const config = {
  mode: process.env.NODE_ENV || 'production',
  entry: {
    main: path.join(__dirname, 'src/index.js'),
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: libraryName + (isProduction ? '.min.js' : '.js'),
    library: 'ReduxFirestore',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  externals: [],
  optimization: {
    minimize: isProduction,
    minimizer: isProduction ? [new TerserPlugin()] : [],
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/transform-runtime'],
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [],
};

module.exports = config;
