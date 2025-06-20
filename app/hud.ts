// 引入electron模块
const { app, BrowserWindow } = require('electron')
const path = require('path')

// 创建Toast窗口的函数
function createToast(message: string, duration = 2000) {
  // 创建一个无边框、透明背景的窗口
  let toastWindow = new BrowserWindow({
    width: 300,
    height: 60,
    x: 0, // 位置在显示窗口时计算
    y: 0,
    show: false,
    alwaysOnTop: true, // 确保显示在最上层
    frame: false, // 无边框
    transparent: true, // 透明背景
    resizable: false,
    focusable: false,
    hasShadow: false,
    skipTaskbar: true, // 不在任务栏显示
    
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
    }
  })
  toastWindow.setIgnoreMouseEvents(true)

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
          padding: 16px 24px;
          border-radius: 8px;
          font-size: 16px;
          text-align: center;
          animation: fadein 0.5s;
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

  // 计算位置（屏幕底部中央）
  const primaryDisplay = require('electron').screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  const windowSize = toastWindow.getSize()
  const x = Math.round((width - windowSize[0]) / 2)
  const y = Math.round(height * 0.9 - windowSize[1]) // 距离底部10%的位置
  toastWindow.setPosition(x, y, true)
  toastWindow.once('ready-to-show', () => {
    toastWindow.showInactive()
  })

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


export const showHUD = (title: string, options = { duration: 3000 }) => {
  createToast(title, options.duration) 
}