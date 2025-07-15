import type { BaseWindow } from "electron"
import { BrowserWindow } from "electron"
import log from 'electron-log/main'

// 创建Toast窗口的函数
function createToast(message: string, duration = 2000, options: { mainWindow: BaseWindow }) {
  // 创建一个无边框、透明背景的窗口
  let toastWindow = new BrowserWindow({
    width: 300,
    height: 44,
    x: 0, // 位置在显示窗口时计算
    y: 0,
    show: true,
    center: true,
    alwaysOnTop: true, // 确保显示在最上层
    frame: false, // 无边框
    transparent: true, // 透明背景
    resizable: false,
    focusable: false,
    hasShadow: false,
    skipTaskbar: true, // 不在任务栏显示
    useContentSize: true,
    
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      enablePreferredSizeMode: true,
    }
  })
  toastWindow.setIgnoreMouseEvents(true)
  toastWindow.webContents.on('preferred-size-changed', (event, size) => {
    const rect = options.mainWindow.getBounds()
    const x = Math.round((rect.width - size.width) / 2) + rect.x
    const y = rect.y - size.height - 16
    toastWindow.setBounds({ x, y, ...size })
  })

  // 加载HTML内容（我们直接使用HTML字符串）
  toastWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        .toast {
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 16px;
          text-align: center;
          animation: fadein 0.5s;
          white-space: nowrap;
        }
        @keyframes fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fadeout {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      </style>
    </head>
    <body>
      <div class="toast">${message}</div>
    </body>
    </html>
  `)}`)

  // 定时关闭
  setTimeout(() => {
    // 先执行渐隐动画，再关闭窗口
    toastWindow.webContents.executeJavaScript(`
      document.querySelector('.toast').style.animation = 'fadeout 0.5s forwards';
      setTimeout(() => {
        // 动画结束后关闭窗口
        window.close();
      }, 500);
    `)
  }, duration - 500); // 提前500毫秒开始渐隐
}


export const showHUD = (title: string, options = { duration: 3000 }, args: { mainWindow: BaseWindow }) => {
  log.info('showHUD', title, JSON.stringify(options))
  createToast(title, options.duration, { mainWindow: args.mainWindow }) 
}