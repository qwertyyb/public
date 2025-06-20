import * as path from 'path';
import * as webpack from 'webpack';

const config: webpack.Configuration = {
  mode: 'development',
  entry: './app/index.ts',
  target: 'electron-main',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'index.js',
  },
  watchOptions: {
    ignored: /node_modules/,
  },
  node: {
    __dirname: false,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        loader: 'string-replace-loader',
        options: {
          multiple: [
             { search: 'require("bindings")("libnut")', replace: 'require("./build/Release/libnut.node")' },
             { search: `require('bindings')('permissions.node')`, replace: `require('./build/Release/permissions.node')` },
             {
               search: `require('bindings')('better_sqlite3.node')`,
               replace: `require('../build/Release/better_sqlite3.node')`
             },
             {
               search: `require('node-gyp-build')((0, path_1.join)(__dirname, '..'))`,
               replace: `require('../build/Release/uiohook_napi.node')`
             }
          ]
        }
      },
      // node 原生模块
      {
        test: /\.node$/,
        loader: 'node-loader',
        options: {
          name() {
            // `resourcePath` - `/absolute/path/to/file.js`
            // `resourceQuery` - `?foo=bar`

            if (process.env.NODE_ENV === "development") {
              return "native_modules/[path][name].[ext]";
            }

            return "native_modules/[contenthash].[ext]";
          },
        }
      },
      {
        test: /\.(png)$/i,
        type: 'asset/resource',
      },
    ],
  }
};

export default config;