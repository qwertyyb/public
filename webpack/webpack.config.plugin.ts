import * as fs from 'fs'
import * as path from 'path';
import * as webpack from 'webpack';

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
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
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
          test: /\.css$/i,
          use: ['style-loader', 'css-loader']
        },
      ],
    }
  }
};

export default (env, argv) => {
  return Promise.all([indexConfig(env, argv), preloadConfig(env, argv)])
}