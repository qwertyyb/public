import * as fs from 'fs'
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pluginsPath = path.join(__dirname, '../plugins')

const preloadConfig: (env: Record<string, string>, argv: Record<string, any>) => Promise<webpack.Configuration> = async (env, argv) => {
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
    mode: 'development',
    context: pluginsPath,
    optimization: {
      usedExports: true,
    },
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
          sideEffects: false
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
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
        }
      ],
    }
  }
};

const indexConfig: (env: Record<string, string>, argv: Record<string, any>) => Promise<webpack.Configuration> = async (env, argv) => {
  const plugin = env.PLUGIN
  let plugins: string[] = []
  if (plugin) {
    plugins = [plugin]
  } else {
    plugins = fs.readdirSync(pluginsPath, { encoding: 'utf-8' }).filter(name => !name.startsWith('.'))
  }

  const entries = plugins.reduce((acc, name) => {
    const exits = fs.existsSync(path.join(pluginsPath, name, './src/index.ts'))
    if (!exits) return { ...acc }
    return { ...acc, [name]: './' + path.join(name, './src/index.ts') }
  }, {})

  console.log(entries)

  return {
    context: pluginsPath,
    mode: 'development',
    entry: entries,
    target: 'electron-preload',
    output: {
      path: pluginsPath,
      filename: '[name]/dist/index.js',
      libraryTarget: 'commonjs',
      publicPath: pluginsPath,
    },
    node: {
      __dirname: false,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    optimization: {
      usedExports: true,
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
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
        }
      ],
    }
  }
};

export default (env: Record<string, string>, argv: Record<string, any>) => {
  return Promise.all([indexConfig(env, argv), preloadConfig(env, argv)])
}