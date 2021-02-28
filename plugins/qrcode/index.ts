import { clipboard, nativeImage, NativeImage } from "electron"
import * as path from 'path'
import { CommonListItem, PublicPlugin } from "shared/types/plugin";

declare var ZXing: any;
let zxing: any;

const detectWithZXingWasm = (image: NativeImage) => {
  const png = image.toPNG()
  const buffer = zxing._malloc(png.length)
  zxing.HEAPU8.set(png, buffer);
  const result = zxing.readBarcodeFromPng(buffer, png.length, true, 'QR_CODE');
  zxing._free(buffer.byteOffset);

  if (!result || result.error) {
    throw new Error(result && result.error || '二维码检测出错')
  }
  if (!result.text) {
    throw new Error('未识别到二维码内容')
  }
  return result.text
}

export default (app: any): PublicPlugin => {
  app.getMainWindow().on('show', () => {
    const image: NativeImage = clipboard.readImage()
    if (image.isEmpty()) return
    const text = detectWithZXingWasm(image)
    if (!text) return
    const item: CommonListItem = {
      key: 'plugin:qrcode:clibpoard',
      title: `二维码内容: ${text}`,
      subtitle: '来自剪切板,点击复制',
      icon: 'https://img.icons8.com/officel/16/4a90e2/clipboard.png',
    }
    app.setList([item])
  })
  window.addEventListener('load', () => {
    const script = document.createElement('script')
    script.src = 'localfile://' + path.join(__dirname, 'zxing_reader.js')
    script.onload = () => {
      zxing = ZXing()
    }
    document.body.append(script)
  })  
  return {
    title: '二维码',
    subtitle: '解析生成二维码',
    icon: 'https://img.icons8.com/pastel-glyph/64/4a90e2/qr-code--v1.png',
    async onInput (keyword: string, setList) {

      const [first, ...rest] = keyword.split(' ')
      const val = ['qr', 'qrcode', 'ewm', '二维码'].includes(first) && rest.join(' ').trim() || ''

      if (!val) return setList([])

      const list: CommonListItem[] = []
      const QRCode = require('qrcode')
      // 生成二维码
      const { html, url } = await new Promise(resolve => QRCode.toDataURL(val).then((url: string) => {
        const html = `
          <div class="flex flex-col justify-center items-center w-full h-full">
            <img src="${url}" class="w-full" />
            <div class="text-single-line mt-2">${val}</div>
          </div>s
        `
        resolve({ html, url })
      }))
      list.push({
        key: 'plugin:qrcode:generate',
        title: '生成二维码',
        subtitle: `二维码内容: ${val}`,
        preview: html,
        icon: 'https://img.icons8.com/pastel-glyph/64/4a90e2/qr-code--v1.png',
        qrcodeUrl: url,
        onEnter: (item) => {
          clipboard.writeImage(nativeImage.createFromDataURL(item.qrcodeUrl))
          const notification = new Notification('二维码已写入剪切板')
        }
      })
      setList(list)
    },
  }
}