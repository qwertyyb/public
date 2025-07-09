import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pluginsPath = path.join(__dirname, '../plugins')

const createWebpackConfigs: (mode: 'development' | 'production', pluginName: string) => Promise<webpack.Configuration[]> = async (mode, pluginName) => {
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
    watch: false,
    mode,
    context,
    optimization: {
      usedExports: true,
    },
    entry: preloads,
    target: "electron-preload",
    output: {
      path: path.join(context, "./dist"),
      filename: "[name].js",
      libraryTarget: "commonjs",
    },
    node: {
      __dirname: false,
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js", 'vue'],
    },
    externals: {
      vue: 'Vue',
      'element-plus': 'ElementPlus'
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          use: "vue-loader",
        },
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
          sideEffects: false,
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        // node 原生模块
        {
          test: /\.node$/,
          loader: "node-loader",
          options: {
            name() {
              // `resourcePath` - `/absolute/path/to/file.js`
              // `resourceQuery` - `?foo=bar`

              if (process.env.NODE_ENV === "development") {
                return "native_modules/[path][name].[ext]";
              }

              return "native_modules/[contenthash].[ext]";
            },
          },
        },
        {
          test: /\.(png|jpg|jpeg|svg)$/i,
          type: "asset/resource",
        },
      ],
    },
    plugins: [
      new webpack.EnvironmentPlugin({
        'PUBLIC_PLUGIN_NAME': pluginName
      })
    ]
  };

  return [config]
};

let watch: ReturnType<webpack.MultiCompiler["watch"]> | null = null

const stopWebpack = async () => {
  if (watch) {
    watch.close(() => {
      console.log('closed')
    })
    watch = null
  }
}

const getNames = async () => {
  return (await fs.promises.readdir(pluginsPath, { encoding: 'utf-8' })).filter(name => {
    if (name.startsWith('.')) return false
    const stat = fs.statSync(path.join(pluginsPath, name))
    if (!stat.isDirectory()) return false
    return fs.existsSync(path.join(pluginsPath, name, 'package.json'))
  })
}

const runWebpack = async (mode: 'development' | 'production', names: string[]) => {
  await stopWebpack()
  const configs = (await Promise.all(names.map(name => createWebpackConfigs(mode, name)))).flat()
  console.log('entries', configs.map(config => ({ entry: config.entry, outputPath: config.output?.path })))

  const compiler = webpack.webpack(configs)
  if (mode === 'production') {
    return new Promise<void>((resolve, reject) => {
      compiler.run((err, result) => {
        if (err) {
          reject(err)
          return;
        }
        console.log(result?.toString())
      })
    })
  } else {
    return new Promise<void>((resolve, reject) => {
      watch = compiler.watch({}, (err, result) => {
        if (err) {
          reject(err)
          return;
        }
        console.log(result?.toString())
        resolve()
      })

      return watch
    })
  }
}

export const runPluginsWebpack = async (mode: 'production' | 'development', names?: string[]) => {
    const plugins = names ?? await getNames()
    console.log(plugins)
    await runWebpack(mode, plugins)
}
