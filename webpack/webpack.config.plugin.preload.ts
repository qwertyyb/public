import * as fs from 'fs'
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pluginsPath = path.join(__dirname, '../plugins')

const config: (env: Record<string, string>, argv: Record<string, any>) => Promise<webpack.Configuration> = async (env, argv) => {
  const plugin = env.PLUGIN
  let plugins: string[] = []
  if (plugin) {
    plugins = [plugin]
  } else {
    plugins = fs.readdirSync(pluginsPath, { encoding: 'utf-8' }).filter(name => {
      const ignore = name.startsWith('.')
      if (ignore) return false;

      const hasPreload = fs.existsSync(path.join(pluginsPath, name, './src/preload.ts'))
      return hasPreload
    })
  }

  return {
    context: pluginsPath,
    mode: 'development',
    entry: plugins.reduce((acc, name) => ({ ...acc, [name]: './' + path.join(name, './src/preload.ts') }), {}),
    target: 'electron-preload',
    output: {
      path: pluginsPath,
      filename: '[name]/dist/preload.js',
      libraryTarget: 'commonjs',
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
              { search: `require('node-gyp-build')(__dirname)`, replace: 'require("./build/Release/leveldown.node")' },
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
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
          generator: {
            outputPath: (pathData: webpack.PathData, assetInfo: webpack.AssetInfo) => {
              return pathData.runtime + '/dist/'
            }
          },
        },
      ],
    }
  }
};

export default config;