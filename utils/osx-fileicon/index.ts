const getIconForFile = require('./build/Release/getIconForFile.node')

export const getFileIcon = (filePath: string, size = 32): Promise<Buffer> => new Promise(resolve => {
  getIconForFile(filePath, size, resolve)
})
