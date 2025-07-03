import * as path from 'path';
import { fileURLToPath } from 'url';
import * as webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createPreloadWebpackConfig = (): webpack.Configuration => ({
  mode: 'development',
  // optimization: {
  //   usedExports: true,
  // },
  entry: {
    'preload.main': './packages/preload/src/main.ts',
    'preload.plugin': './packages/preload/src/plugin.ts',
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
      {
        test: /\.js$/,
        loader: 'string-replace-loader',
        options: {
          multiple: [
             { search: `require('node-gyp-build')(__dirname)`, replace: 'require("./build/Release/leveldown.node")' },
          ]
        }
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
      },
    ],
  }
});

let watch: webpack.Watching | null = null

const stopPreloadWebpack = async () => {
  if (watch) {
    watch.close(() => {
      console.log("closed");
    });
    watch = null;
  }
};

export const runPreloadWebpack = (onChange?: () => void) => {
  stopPreloadWebpack()
  const compiler = webpack.webpack(createPreloadWebpackConfig())
  let lastHash: string | undefined = ''
  return new Promise<void>((resolve, reject) => {
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
  });
}

process.on('exit', () => {
  stopPreloadWebpack()
})
