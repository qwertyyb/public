import module from 'module'

const require = module.createRequire(import.meta.url)

const addon = require("./build/Release/addon.node");

console.log('addon', addon)

export const getFileIcon = (filePath: string, size = 32): Promise<Buffer> => addon.getIconForFile(filePath, size)

export const hanziToPinyin = (hanzi: string) => addon.hanziToPinyin(hanzi) as string

export const lookupWord = (word: string) => addon.lookupWord(word)

export const lookupWordHTML = (word: string) => addon.lookupWordHTML(word) as {
  dictionary: string,
  isUserDictionary: boolean
  entries: {
    headword: string,
    html: string,
    text: string
  }[]
}[]

console.log(1, lookupWordHTML('hello'))

// console.log(2)

// console.log(3, lookupWordHTML('hell'))
