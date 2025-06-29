import { clipboard, NativeImage } from "electron"
import { IPlugin, IPluginCommandConfig, ICommandTriggerMatchData } from '@public/shared'
import * as path from 'path'
import { getChromeCurrentUrl, getSafariCurrentUrl } from "@public/utils";
import QRCode from 'qrcode'

let opencv: any;

const detectWithOpencv = (() => {
  let wr: any = null
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

    console.log(wr, opencv)

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
  const item: IPluginCommandConfig = {
    name: 'detect',
    title: `二维码内容: ${text}`,
    subtitle: '来自剪切板,点击复制',
    icon: 'https://img.icons8.com/officel/16/4a90e2/clipboard.png',
    text,
    matches: [
      { type: 'text', keywords: [''] }
    ]
  }
  return item
}

const qrcodePlugin: IPlugin = (utils) => {
  window.requestIdleCallback(async () => {
    opencv = await __non_webpack_require__('../lib/ready_opencv.js')
  })

  window.addEventListener('publicApp.mainWindow.show', () => {
    const image: NativeImage = clipboard.readImage()
    if (image.isEmpty()) return
    const texts = detectWithOpencv(image)
    if (!texts?.length) return
    const list = texts.map(text => createClipboardItem(text))
    utils.showCommands(list)
  })
  return {
    async onSelect(command, match) {
      console.log(command, match)
      let text = match.from === 'match' && match.match.type === 'trigger' ? (match as ICommandTriggerMatchData).matchData.query : match.keyword
      if (command.name === 'generate-for-current-url') {
        text = await getChromeCurrentUrl() || await getSafariCurrentUrl() || '未获取到当前页面地址'
      }
      if(command.name === 'generate' || command.name === 'generate-for-current-url') {
        if (!text) return;
        // 生成二维码
        const res: { html: string, url: string } = await new Promise(resolve => QRCode.toDataURL(text).then((url: string) => {
          const html = `
            <div class="flex flex-col justify-center items-center w-full h-full">
              <img src="${url}" class="w-full" />
              <div class="text-single-line mt-2" style="max-width:100%" title=${JSON.stringify(text)}>${text}</div>
            </div>
          `
          resolve({ html, url })
        }))
        return res.html
      }
    },
    onEnter: (command) => {
      console.log(command)
      if (command.name === 'detect' && command.text) {
        clipboard.writeText(command.text)
      }
    },
  }
}

export default qrcodePlugin
