const addon = require("./build/Release/addon.node");

console.log('addon', addon)

export const getFileIcon = (filePath: string, size = 32): Promise<Buffer> => addon.getIconForFile(filePath, size)

export const hanziToPinyin = (hanzi: string) => addon.hanziToPinyin(hanzi) as string

export const lookupWord = (word: string) => addon.lookupWord(word)

export const lookupWordHTML = (word: string) => addon.lookupWordHTML(word)
