var path = require('path')
var ExtractTextPlugin = require("extract-text-webpack-plugin")
const pkg = require(path.join(__dirname, '../package.json'))
const config = require('../config')

module.exports = {
  entry: {
    app: path.resolve(__dirname, '../src/app/index.js')
  },
  output: {
    path: config.build.assetsRoot,
    filename: `${pkg.name}.js`
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          { 
            loader: 'style-loader/useable',
            options: {
              insertInto: () => document.querySelector("freelog-onepiece-wwzh").shadowRoot,
            }
          },
          'css-loader'
        ],
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          'less-loader'
        ],
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        use: [ {
          loader: 'html-loader',
          options: {
            minimize: true,
            collapseWhitespace: false
          }
        }],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json']
  },
  plugins: [
  ]
}
