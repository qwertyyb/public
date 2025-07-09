import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createMainWebpackConfig = (mode: 'production' | 'development'): webpack.Configuration => ({
  mode,
  optimization: {
    usedExports: true,
  },
  entry: './packages/main/src/index.ts',
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
        test: /\.(png|jpe?g|svg)$/i,
        type: 'asset/resource',
      },
    ],
  }
});

let watch: webpack.Watching | null = null

const stopWebpack = async () => {
  if (watch) {
    watch.close(() => {
      console.log("closed");
    });
    watch = null;
  }
};

export const runMainWebpack = (mode: 'production' | 'development', onChange?: () => void) => {
  stopWebpack()
  const compiler = webpack.webpack(createMainWebpackConfig(mode))
  let lastHash: string | undefined = ''
  return new Promise<void>((resolve, reject) => {
    if (mode === 'production') {
      compiler.run((err, result) => {
        if (err) {
          reject(err);
          return;
        }
        console.log(result?.toString());
        resolve();
      });
      return;
    } else {
      watch = compiler.watch({}, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        if (result?.hash !== lastHash) {
          lastHash = result?.hash
          onChange?.()
        }
        console.log(result?.toString());
        resolve();
      });
    }
  });
}

let electronProcess: ChildProcess | null = null

export const stopElectron = () => {
  if (!electronProcess) return;
  electronProcess.kill();
  electronProcess = null
};


process.on("exit", () => {
  stopElectron();
});

export const startElectron = async () => {
  stopElectron()
  electronProcess = spawn('pnpm', ['run', 'electron'], { stdio: ['ignore', 'inherit', 'inherit']})
  electronProcess.on('error', (err) => {
    stopElectron()
  })
  await new Promise(resolve => setTimeout(resolve, 1000))
}

const start = () => {
  runMainWebpack('development', () => {
    startElectron()
  })
}

// start()