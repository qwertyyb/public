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
  return async (image: NativeImage) => {
    const data = image.toBitmap();
    const size = image.getSize();
    
    const imgdata = {
      ...size,
      data
    }

    let opencv: any
    if (!wr) {
      opencv = await loadOpencv()
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