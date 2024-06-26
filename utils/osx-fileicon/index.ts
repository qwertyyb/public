const { getIconForFile } = require("./build/Release/getIconForFile.node");
const pinyin = require('./build/Release/pinyin.node');

export const getFileIcon = (filePath: string, size = 32): Promise<Buffer> => new Promise(resolve => {
  getIconForFile(filePath, size, resolve)
})

export const hanziToPinyin = (hanzi: string) => pinyin.hanziToPinyin(hanzi)
