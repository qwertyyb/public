import * as path from 'path'

export const getConfig = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      rendererEntry: 'http://localhost:3000/',
      pluginBasePath: path.join(__dirname, '../plugins')
    }
  }
  return {
    rendererEntry: 'file://' + path.join(__dirname, '../render2/dist/index.html'),
    pluginBasePath: path.join(__dirname, '../plugins')
  }
}