import { clipboard, nativeImage, NativeImage } from "electron"
import * as path from 'path'
import { CommonListItem, PublicPlugin } from "shared/types/plugin";

let opencv: any;

const detectWithOpencv = (() => {
  let wr = null
  return (image: NativeImage) => {
    const data = image.toBitmap();
    const size = image.getSize();
    
    const imgdata = {
      ...size,
      data
    }

    if (!wr) {
      wr = new opencv.wechat_qrcode_WeChatQRCode("wechat_qrcode/detect.prototxt", "wechat_qrcode/detect.caffemodel", "wechat_qrcode/sr.prototxt", "wechat_qrcode/sr.caffemodel")
    }

    const results = wr.detectAndDecode(opencv.matFromImageData(imgdata))
    if (results.size() < 1) {
      throw new Error('未识别到二维码')
    }
    let i = 0
    let arr = []
    while(i < results.size()) {
      arr.push(results.get(i++))
    }
    results.delete()
    console.log(arr)
    return arr
  }
})()

// @ts-ignore
window.filePath = path.resolve(__dirname, 'lib/wechat_qrcode_files.data')

const createClipboardItem = (text: string) => {
  const item: CommonListItem = {
    key: `plugin:qrcode:clibpoard:${text}`,
    title: `二维码内容: ${text}`,
    subtitle: '来自剪切板,点击复制',
    icon: 'https://img.icons8.com/officel/16/4a90e2/clipboard.png',
    text,
    onEnter(item, index, list) {
      clipboard.writeText(item.text)
    }
  }
  return item
}

export default (app: any): PublicPlugin => {
  // @ts-ignore
  window.requestIdleCallback(async () => {
    opencv = await require('../../../plugins/qrcode/lib/ready_opencv.js')
  })

  window.addEventListener('publicApp.mainWindow.show', () => {
    const image: NativeImage = clipboard.readImage()
    if (image.isEmpty()) return
    const texts = detectWithOpencv(image)
    if (!texts?.length) return
    const list = texts.map(text => createClipboardItem(text))
    app.setList(list)
  })
  return {
    title: '二维码',
    subtitle: '解析生成二维码',
    icon: 'https://img.icons8.com/pastel-glyph/64/4a90e2/qr-code--v1.png',
    async onInput (keyword: string) {

      const [first, ...rest] = keyword.split(' ')
      const match = ['qr', 'qrcode', 'ewm', '二维码'].includes(first)
      const param = rest.join(' ')

      if (!match) return app.setList([])

      const list: CommonListItem[] = []
      list.push({
        key: 'plugin:qrcode:generate',
        title: '生成二维码',
        subtitle: param ? `二维码内容: ${param}` : '',
        extraInfo: {
          query: keyword
        },
        icon: 'https://img.icons8.com/pastel-glyph/64/4a90e2/qr-code--v1.png',
        onEnter: (item) => {
          clipboard.writeImage(nativeImage.createFromDataURL(item.qrcodeUrl))
          const notification = new Notification('二维码已写入剪切板')
        }
      })
      app.setList(list)
    },
    async getResultPreview(item, index, list) {
      if(item.key === 'plugin:qrcode:generate') {
        const QRCode = require('qrcode')
        const [_, ...rest] = item.extraInfo.query.split(' ')
        const param = rest.join(' ')
        if (!param) return;
        // 生成二维码
        const res: { html: string, url: string } = await new Promise(resolve => QRCode.toDataURL(param).then((url: string) => {
          const html = `
            <div class="flex flex-col justify-center items-center w-full h-full">
              <img src="${url}" class="w-full" />
              <div class="text-single-line mt-2" style="max-width:100%" title=${JSON.stringify(param)}>${param}</div>
            </div>
          `
          resolve({ html, url })
        }))
        return res.html
      }
    }
  }
}