import pinyin from 'tiny-pinyin'


const pinyinMatch = (hanzi: string, keyword: string) => {
  const pyword = pinyin.convertToPinyin(hanzi, '-', true)
  // @ts-ignore
  return pyword.replaceAll('-', '').includes(keyword) // 全拼音匹配
    || pyword.split('-').map(a => a[0]).filter(b => b).join('').includes(keyword)
}

const match = (candidate: string[] | string, keyword: string) => {
  if (!keyword) return false;
  const arr = Array.isArray(candidate) ? candidate : [candidate]
  const k = keyword.toLocaleLowerCase()
  return arr.some(element => element.toLocaleLowerCase().includes(k) || pinyinMatch(element, k))
}

export {
  pinyinMatch,
  match,
}