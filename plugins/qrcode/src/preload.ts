import { IPluginCommandConfig, IPluginCommandListView } from "@public/shared"
import { detectWithOpencv } from "./qrcode"
import { clipboard, NativeImage } from "electron"

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


// const detectClipboard = async () => {
//   const image: NativeImage = clipboard.readImage()
//   if (image.isEmpty()) return
//   const data = image.toBitmap();
//   const size = image.getSize();
  
//   const imgData: ImageData = {
//     ...size,
//     // @ts-ignore
//     data
//   }
//   const texts = await detectWithOpencv(imgData)
//   if (!texts?.length) return
//   const list = texts.map(text => createClipboardItem(text))
//   window.pluginService?.setList(list)
// }

const detectScreen = async () => {
  await window.publicApp.mainWindow.hide()
  const media = await navigator.mediaDevices.getDisplayMedia({ audio: false, video: true })
  const video = document.createElement('video')
  video.srcObject = media
  video.play()
  await new Promise(resolve => video.ontimeupdate = resolve)
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(video, 0, 0)
  media.getTracks().forEach(track => track.stop())
  const imgData = ctx.getImageData(0, 0, video.videoWidth, video.videoHeight)
  const texts = await detectWithOpencv(imgData)
  if (!texts?.length) return
  const list = texts.map(text => createClipboardItem(text))
  window.pluginService?.setList(list)
  await window.publicApp.mainWindow.show()
}

// detectClipboard()
detectScreen()

const detectCommand: IPluginCommandListView = {
  enter(item: any) {
    console.log('detect qrcode enter', item)
    clipboard.writeText(item.text)
    window.publicApp.showToast({ title: '已复制到粘贴板' })
  }
}

export default detectCommand
