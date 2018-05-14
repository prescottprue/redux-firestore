const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

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
    minimizer: isProduction
      ? [
          new UglifyJsPlugin({
            cache: true,
            parallel: true,
            uglifyOptions: {
              compress: true,
              ecma: 6,
              mangle: true,
            },
            sourceMap: true,
          }),
        ]
      : [],
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [],
};

module.exports = config;
