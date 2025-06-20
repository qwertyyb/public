import { NativeImage } from "electron";
import * as path from 'path'

// @ts-ignore
window.filePath = path.resolve(__dirname, 'lib/wechat_qrcode_files.data')

let opencv: any

const loadOpencv = () => {
  if (opencv) {
    return opencv
  }
  opencv = __non_webpack_require__('../lib/ready_opencv.js')
  return opencv
}

export const detectWithOpencv = (() => {
  let wr: any = null
  return async (imgData: ImageData) => {

    let opencv: any
    if (!wr) {
      opencv = await loadOpencv()
      wr = new opencv.wechat_qrcode_WeChatQRCode("wechat_qrcode/detect.prototxt", "wechat_qrcode/detect.caffemodel", "wechat_qrcode/sr.prototxt", "wechat_qrcode/sr.caffemodel")
    }

    console.log(wr)
    const results = wr.detectAndDecode(opencv.matFromImageData(imgData))
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