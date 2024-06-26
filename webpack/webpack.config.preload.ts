import * as path from 'path';
import * as webpack from 'webpack';

const config: webpack.Configuration = {
  mode: 'development',
  entry: {
    preload: './app/preload.ts',
    'preload.plugin': './app/preload.plugin.ts',
  },
  target: 'electron-preload',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].js',
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
      // node 原生模块
      {
        test: /\.node$/,
        loader: 'node-loader',
        options: {
          name(resourcePath, resourceQuery) {
            // `resourcePath` - `/absolute/path/to/file.js`
            // `resourceQuery` - `?foo=bar`

            if (process.env.NODE_ENV === "development") {
              return "native_modules/[path][name].[ext]";
            }

            return "native_modules/[contenthash].[ext]";
          },
        }
      },
    ],
  }
};

export default config;