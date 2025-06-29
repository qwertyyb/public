export const msToLocaleString = (ms: number) => {
  return new Date(ms).toLocaleString('zh-CN')
}
export const sToLocaleString = (s: number) => {
  return msToLocaleString(s * 1000)
}

export const msToDuration = (ms: number) => {
  const left = ms % 1000
  const s = (ms - left) / 1000
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  let str = ''
  if (d > 0) {
    str += `${d}天`
  }
  if (h - d * 24 > 0) {
    str += `${h - d * 24}小时`
  }
  if (m - h * 60 > 0) {
    str += `${m - h * 60}分钟`
  }
  if (s - m * 60 > 60) {
    str += `${s - m * 60}秒`
  }
  if (left > 0) {
    str += `${left}毫秒`
  }
  return str
}
export const sToMs = (s: number) => {
  return `${s * 1000}毫秒`
}
export const mToS = (m: number) => {
  return `${m * 60}秒`
}
export const hToM = (h: number) => {
  return `${h * 60}分钟`
}
export const dToH = (d: number) => {
  return `${d * 24}小时`
}
