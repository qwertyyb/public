import * as fs from 'fs'
import * as path from 'path';
import * as webpack from 'webpack';

const pluginsPath = path.join(__dirname, '../plugins')

const config: (env: Record<string, string>, argv: Record<string, any>) => Promise<webpack.Configuration> = async (env, argv) => {
  const plugin = env.PLUGIN
  let plugins: string[] = []
  if (plugin) {
    plugins = [plugin]
  } else {
    plugins = fs.readdirSync(pluginsPath, { encoding: 'utf-8' }).filter(name => !name.startsWith('.'))
  }

  return {
    context: pluginsPath,
    mode: 'development',
    entry: plugins.reduce((acc, name) => ({ ...acc, [name]: './' + path.join(name, './src/index.ts') }), {}),
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
      ],
    }
  }
};

export default config;