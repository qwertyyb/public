import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pluginsPath = path.join(__dirname, '../plugins')

const createWebpackConfigs: (pluginName: string) => Promise<webpack.Configuration[]> = async (pluginName) => {
  const context = path.join(pluginsPath, pluginName)
  const preloads = fs.readdirSync(path.join(context, 'src'), { encoding: 'utf-8' }).filter(name => {
    return name.endsWith('preload.ts')
  }).reduce<Record<string, string>>((acc, name) => {
    const arr = name.split('.')
    arr.pop()
    const entryName = arr.join('.')
    return { ...acc, [entryName]: path.join(context, 'src', name) }
  }, {})

  if (!Object.keys(preloads).length) {
    return []
  }

  const config: webpack.Configuration = {
    mode: 'development',
    context,
    optimization: {
      usedExports: true,
    },
    entry: preloads,
    target: 'electron-preload',
    output: {
      path: path.join(context, './dist'),
      filename: '[name].js',
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

  return [config]
};



const start = async (env: Record<string, string>, argv: Record<string, any>) => {
  console.log(env,env.PLUGIN)

  let names: string[] = [env.PLUGIN]
  if (!env.PLUGIN) {
    names = (await fs.promises.readdir(pluginsPath, { encoding: 'utf-8' })).filter(async name => {
      if (name.startsWith('.')) return false
      const stat = await fs.promises.stat(path.join(pluginsPath, name))
      if (!stat.isDirectory()) return false
      return fs.existsSync(path.join(pluginsPath, name, 'package.json'))
    })
  }
  console.log('plugins', names.join(','))

  const configs = (await Promise.all(names.map(createWebpackConfigs))).flat()
  console.log('entries', configs.map(config => ({ entry: config.entry, outputPath: config.output?.path })))

  const compiler = webpack.webpack(configs)
  const watch = compiler.watch({}, (err, result) => {
    if (err) throw err
    console.log(result?.toString())
  })

  return watch
}

start(process.env as Record<string, string>, process.argv)