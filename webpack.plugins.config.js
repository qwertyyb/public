const path = require('path')
const fs = require('fs/promises')
const ofs = require('fs')
const CopyWebpackPlugin = require('copy-webpack-plugin');

const getPluginsEntry = async () => {
  const pluginsPath = path.join(__dirname, './src/plugins')
  const pluginNames = await fs.readdir(pluginsPath)
  let plugins = await Promise.all(pluginNames
    .filter(name => !name.startsWith('.'))
    .map(async name => {
      const entrys = (await fs.readdir(path.join(pluginsPath, name)))
        .filter(name => name.endsWith('.ts'))
      const pluginEntrys = entrys.reduce((obj, entry) => {
        return {
          ...obj,
          [`${name}/${entry.replace(/\.ts$/, '')}`]: path.join(pluginsPath, name, entry)
        }
      }, {})
      return pluginEntrys
    }, {}))
  plugins = plugins.filter(pluginPath => !!pluginPath).reduce((obj, item) => {
    return { ...obj, ...item }
  })
  return plugins
}

module.exports = async () => {
  const [plugins] = await Promise.all([
    getPluginsEntry()
  ])
  return {
    mode: 'development',
    target: 'electron-renderer',
    watch: true,
    entry: plugins,
    output: {
      library: {
        type: 'commonjs2'
      },
      path: path.join(__dirname, 'pre-dist/plugins'),
      filename: '[name].js'
    },
    externals: {
      sqlite3: 'commonjs sqlite3'
    },
    resolve: {
      extensions: ['.js', '.json', '.wasm', '.ts']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader'
        },
        {
          test: /\.node$/,
          use: 'node-loader'
        },
      ]
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "**/public/**",
            context: "./src/plugins"
          },
          {
            from: "**/plugin.json",
            context: './src/plugins'
          }
        ]
      })
    ]
  }
}