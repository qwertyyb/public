import * as path from 'path'

export const getConfig = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      isDev: true,
      rendererEntry: 'http://localhost:4000/',
      pluginBasePath: path.join(__dirname, '../plugins')
    }
  }
  return {
    isDev: false,
    rendererEntry: 'file://' + path.join(__dirname, '../render/dist/index.html'),
    pluginBasePath: path.join(__dirname, '../plugins')
  }
}
