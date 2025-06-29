import { IPluginCommandConfig, IPluginCommandListView, IResultItem } from "@public/shared"
import { detectWithOpencv } from "./lib/qrcode"
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


const detectClipboard = (): Promise<string[]> | string[] => {
  const image: NativeImage = clipboard.readImage()
  if (image.isEmpty()) return []
  const data = image.toBitmap();
  const size = image.getSize();
  
  const imgData: ImageData = {
    ...size,
    // @ts-ignore
    data
  }
  return detectWithOpencv(imgData)
}

const detectScreen = async (): Promise<string[]> => {
  await window.publicApp.mainWindow.hide()
  console.log('hello')
  const media = await navigator.mediaDevices.getDisplayMedia({ audio: false, video: true })
  console.log('world')
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
  return detectWithOpencv(imgData)
}

const detect = async () => {
  const texts = (await Promise.all([detectClipboard(), detectScreen()])).flat()
  console.log('detect', texts)
  if (!texts?.length) {
    window.publicApp.showHUD('未检测到二维码')
    return;
  }
  const list = texts.map(text => createClipboardItem(text))
  await window.publicApp.mainWindow.show()
  return list
}

detect()

const detectCommand: IPluginCommandListView = {
  async enter(query, setList) {
    setList(await detect() || [])
  },
  action(item: any) {
    console.log('detect qrcode enter', item)
    clipboard.writeText(item.text)
    window.publicApp.showToast({ title: '已复制到粘贴板' })
  }
}

window.publicAppCommand = detectCommand
