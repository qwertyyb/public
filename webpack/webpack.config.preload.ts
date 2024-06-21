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
    path: path.resolve(__dirname, '../dist/app'),
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
    ],
  }
};

export default config;