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


const detectClipboard = async () => {
  const image: NativeImage = clipboard.readImage()
  if (image.isEmpty()) return
  const texts = await detectWithOpencv(image)
  if (!texts?.length) return
  const list = texts.map(text => createClipboardItem(text))
  window.pluginService?.setList(list)
}

detectClipboard()

const detectCommand: IPluginCommandListView = {
  // search: window.publicApp.utils.debounce(async (keyword, setList) => {
  //   const list = await detectClipboard()
  //   return setList(list)
  // }),
  enter(item: any) {
    console.log('detect qrcode enter', item)
    clipboard.writeText(item.text)
    window.publicApp.showToast({ title: '已复制到粘贴板' })
  }
}

export default detectCommand
