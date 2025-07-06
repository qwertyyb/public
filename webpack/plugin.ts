import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';
import * as webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pluginsPath = path.join(__dirname, '../plugins')

const isProd = process.env.NODE_ENV === 'production'

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
    watch: false,
    mode: isProd ? "production" : "development",
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
      extensions: [".tsx", ".ts", ".js"],
    },
    module: {
      rules: [
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

const runWebpack = async (names: string[]) => {
  await stopWebpack()
  const configs = (await Promise.all(names.map(createWebpackConfigs))).flat()
  console.log('entries', configs.map(config => ({ entry: config.entry, outputPath: config.output?.path })))

  const compiler = webpack.webpack(configs)
  if (isProd) {
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

export const runAllPluginsWebpack = async (names?: string[]) => {
    const plugins = names ?? await getNames()
    console.log(plugins)
    await runWebpack(plugins)
}

const readCommand = async () => {
  const rl = readline.createInterface(process.stdin, process.stdout)
  rl.addListener('SIGINT', () => {
    process.exit(0)
  })
  while(true) {
    const answer = await new Promise<string>(resolve => rl.question('请输入指令: ', resolve))
    console.log('执行指令: ', answer, answer.length)

    const [command, plugin] = answer.split(' ')
    if (command === 'stop') {
      await stopWebpack()
    } else if (command === 'all') {
      await runWebpack(await getNames())
    } else if (!plugin && command) {
      await runWebpack([command])
    }
    console.log('指令执行完成')
  }
}

const start = async (name: string, env: Record<string, string>) => {
  console.log('start with plugin', name)

  let names = [name]
  if (name === 'all') {
    names = await getNames()
  }
  console.log(names)
  await runWebpack(names)

  if (isProd) return;
  return readCommand()
}

// const name = process.argv[2]

// start(name || 'all', process.env as Record<string, string>)