const path = require('path')

module.exports = {
  mode: 'development',
  target: 'electron-preload',
  watch: true,
  entry: {
    manager: path.join(__dirname, 'src/preload/manager.ts'),
    plugin: path.join(__dirname, 'src/preload/plugin.ts')
  },
  output: {
    path: path.join(__dirname, 'pre-dist/preload'),
  },
  externals: {
    sqlite3: 'commonjs sqlite3'
  },
  resolve: {
    extensions: ['.js', '.json', '.wasm', '.ts']
  },
  module: {
    parser: {
      typescript: {
        // Enable magic comments, disable by default for perf reasons
        commonjsMagicComments: true
      }
    },
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader'
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      }
    ]
  }
}