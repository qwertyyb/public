const path = require('path')

module.exports = {
  mode: 'development',
  target: 'electron-main',
  watch: true,
  entry: path.join(__dirname, './src/index.ts'),
  output: {
    path: path.join(__dirname, 'pre-dist'),
  },
  externals: {
    sqlite3: 'commonjs sqlite3'
  },
  resolve: {
    extensions: ['.js', '.json', '.wasm', '.ts'],
    alias: {
      src: path.join(__dirname, './src')
    }
  },
  module: {
    parser: {
      javascript: {
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