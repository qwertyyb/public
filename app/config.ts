import * as path from 'path'

const commonConfig = {
  inputBarHeight: 48,
  itemHeight: 54,
  windowWidth: 780,
  windowHeight: 48 + 54 * 9,
}

export const getConfig = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      ...commonConfig,
      isDev: true,
      rendererEntry: 'http://localhost:4000/',
      pluginBasePath: path.join(__dirname, '../plugins')
    }
  }
  return {
    ...commonConfig,
    isDev: false,
    rendererEntry: 'file://' + path.join(__dirname, '../render/dist/index.html'),
    pluginBasePath: path.join(__dirname, '../plugins')
  }
}
