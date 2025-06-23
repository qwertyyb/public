/**
 * Electron webview 标签的类型声明
 * 参考: https://www.electronjs.org/docs/latest/api/webview-tag
 */

import { WebPreferences } from 'electron';
import { IWebviewEventMap } from './webview-events';

export * from './webview-events';

export interface IWebviewTagAttributes {
  /**
   * 是否允许在 webview 中使用 HTML5 全屏 API
   */
  allowpopups?: boolean;

  /**
   * 是否启用自动调整大小
   */
  autosize?: boolean;

  /**
   * 一个指定用户代理覆盖字符串的字符串
   */
  useragent?: string;

  /**
   * 是否启用 Node 集成
   */
  nodeintegration?: boolean;

  /**
   * 是否在 iframe 中启用 Node 集成
   */
  nodeintegrationinsubframes?: boolean;

  /**
   * 插件是否启用
   */
  plugins?: boolean;

  /**
   * 预加载脚本的路径
   */
  preload?: string;

  /**
   * webview 中页面的 HTTP 引用头
   */
  httpreferrer?: string;

  /**
   * 设置 webview 的会话
   */
  partition?: string;

  /**
   * 是否允许 webview 内容访问父页面的请求
   */
  allowtransparency?: boolean;

  /**
   * 定义 webview 可以导航到的 URL
   */
  src?: string;

  /**
   * 是否禁用同源策略
   */
  disablewebsecurity?: boolean;

  /**
   * 是否启用 web 安全
   */
  webpreferences?: string;

  /**
   * 是否启用开发者工具
   */
  enableblinkfeatures?: string;

  /**
   * 是否禁用开发者工具
   */
  disableblinkfeatures?: string;
}

export interface IWebviewElement extends HTMLElement {
  /**
   * webview 元素的属性
   */
  allowpopups?: boolean;
  autosize?: boolean;
  useragent?: string;
  nodeintegration?: boolean;
  nodeintegrationinsubframes?: boolean;
  plugins?: boolean;
  preload?: string;
  httpreferrer?: string;
  partition?: string;
  allowtransparency?: boolean;
  src?: string;
  disablewebsecurity?: boolean;
  webpreferences?: string;
  enableblinkfeatures?: string;
  disableblinkfeatures?: string;

  /**
   * 当前 webview 中显示的页面的标题
   */
  readonly title: string;

  /**
   * 当前 webview 中显示的页面的 URL
   */
  readonly src: string;

  /**
   * 当前 webview 中显示的页面的 URL
   */
  readonly URL: string;

  /**
   * 当前 webview 中显示的页面是否仍在加载资源
   */
  readonly loading: boolean;

  /**
   * 当前 webview 中显示的页面是否可以回退
   */
  readonly canGoBack: boolean;

  /**
   * 当前 webview 中显示的页面是否可以前进
   */
  readonly canGoForward: boolean;

  /**
   * 当前 webview 中显示的页面是否可以回退或前进
   */
  readonly canGoToOffset: boolean;

  /**
   * 加载 URL 到 webview 中，URL 必须包含协议前缀，例如 'http://' 或 'file://'
   */
  loadURL(url: string, options?: {
    httpReferrer?: string;
    userAgent?: string;
    extraHeaders?: string;
    postData?: Array<{
      type: string;
      bytes: Buffer;
    }>;
  }): Promise<void>;

  /**
   * 导航到指定的绝对索引
   */
  goToIndex(index: number): void;

  /**
   * 导航到指定的偏移量
   */
  goToOffset(offset: number): void;

  /**
   * 重新加载当前页面
   */
  reload(): void;

  /**
   * 重新加载当前页面并忽略缓存
   */
  reloadIgnoringCache(): void;

  /**
   * 停止加载
   */
  stop(): void;

  /**
   * 回退到上一页
   */
  goBack(): void;

  /**
   * 前进到下一页
   */
  goForward(): void;

  /**
   * 清除导航历史
   */
  clearHistory(): void;

  /**
   * 执行复制命令
   */
  copy(): void;

  /**
   * 执行剪切命令
   */
  cut(): void;

  /**
   * 执行粘贴命令
   */
  paste(): void;

  /**
   * 执行粘贴并匹配样式命令
   */
  pasteAndMatchStyle(): void;

  /**
   * 执行删除命令
   */
  delete(): void;

  /**
   * 执行全选命令
   */
  selectAll(): void;

  /**
   * 执行撤销命令
   */
  undo(): void;

  /**
   * 执行重做命令
   */
  redo(): void;

  /**
   * 替换 misspelled 单词为给定的单词
   */
  replaceMisspelling(word: string): void;

  /**
   * 插入 CSS 到当前网页
   */
  insertCSS(css: string): Promise<string>;

  /**
   * 执行 JavaScript 代码
   */
  executeJavaScript(code: string, userGesture?: boolean): Promise<any>;

  /**
   * 打开开发者工具
   */
  openDevTools(): void;

  /**
   * 关闭开发者工具
   */
  closeDevTools(): void;

  /**
   * 开发者工具是否打开
   */
  isDevToolsOpened(): boolean;

  /**
   * 开发者工具是否聚焦
   */
  isDevToolsFocused(): boolean;

  /**
   * 设置缩放系数
   */
  setZoomFactor(factor: number): void;

  /**
   * 获取缩放系数
   */
  getZoomFactor(): number;

  /**
   * 设置缩放等级
   */
  setZoomLevel(level: number): void;

  /**
   * 获取缩放等级
   */
  getZoomLevel(): number;

  /**
   * 设置用户代理
   */
  setUserAgent(userAgent: string): void;

  /**
   * 获取用户代理
   */
  getUserAgent(): string;

  /**
   * 向页面发送输入事件
   */
  sendInputEvent(event: any): void;

  /**
   * 向主页面发送异步消息
   */
  send(channel: string, ...args: any[]): void;

  /**
   * 向主页面发送同步消息
   */
  sendToHost(channel: string, ...args: any[]): void;

  /**
   * 打印 webview 的网页内容
   */
  print(options?: {
    silent?: boolean;
    printBackground?: boolean;
    deviceName?: string;
  }): void;

  /**
   * 将网页内容打印为 PDF
   */
  printToPDF(options: {
    marginsType?: number;
    pageSize?: string;
    printBackground?: boolean;
    printSelectionOnly?: boolean;
    landscape?: boolean;
  }): Promise<Buffer>;

  /**
   * 捕获页面的快照
   */
  capturePage(rect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): Promise<Buffer>;

  /**
   * 获取 webContents ID
   */
  getWebContentsId(): number;
}

/**
 * Webview 标签的主接口
 */
export interface IWebview extends IWebviewElement {
  addEventListener<K extends keyof IWebviewEventMap>(
    type: K,
    listener: (ev: IWebviewEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof IWebviewEventMap>(
    type: K,
    listener: (ev: IWebviewEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

/**
 * Webview 标签的属性接口
 */
export interface IWebviewProps extends IWebviewTagAttributes {
  /**
   * webview 的引用
   */
  ref?: React.RefObject<IWebview>;
  
  /**
   * 子元素
   */
  children?: React.ReactNode;
  
  /**
   * 类名
   */
  className?: string;
  
  /**
   * 样式
   */
  style?: React.CSSProperties;
  
  /**
   * 当 webview 加载完成时触发
   */
  onDidFinishLoad?: (event: Event) => void;
  
  /**
   * 当 webview 加载失败时触发
   */
  onDidFailLoad?: (event: IDidFailLoadEvent) => void;
  
  /**
   * 当 webview DOM 准备好时触发
   */
  onDomReady?: (event: Event) => void;
  
  /**
   * 当 webview 开始加载时触发
   */
  onDidStartLoading?: (event: Event) => void;
  
  /**
   * 当 webview 停止加载时触发
   */
  onDidStopLoading?: (event: Event) => void;
  
  /**
   * 当 webview 收到 IPC 消息时触发
   */
  onIpcMessage?: (event: IIpcMessageEvent) => void;
  
  /**
   * 当 webview 崩溃时触发
   */
  onCrashed?: (event: Event) => void;
  
  /**
   * 当 webview 插件崩溃时触发
   */
  onPluginCrashed?: (event: IPluginCrashedEvent) => void;
  
  /**
   * 当 webview 被销毁时触发
   */
  onDestroyed?: (event: Event) => void;
  
  /**
   * 当 webview 将要导航到新 URL 时触发
   */
  onWillNavigate?: (event: IWillNavigateEvent) => void;
  
  /**
   * 当 webview 导航到新 URL 时触发
   */
  onDidNavigate?: (event: IDidNavigateEvent) => void;
  
  /**
   * 当 webview 在页面内导航时触发
   */
  onDidNavigateInPage?: (event: IDidNavigateInPageEvent) => void;
  
  /**
   * 当 webview 关闭时触发
   */
  onClose?: (event: Event) => void;
  
  /**
   * 当 webview 尝试打开新窗口时触发
   */
  onNewWindow?: (event: INewWindowEvent) => void;
  
  /**
   * 当 webview 页面标题更新时触发
   */
  onPageTitleUpdated?: (event: IPageTitleUpdatedEvent) => void;
  
  /**
   * 当 webview 页面图标更新时触发
   */
  onPageFaviconUpdated?: (event: IPageFaviconUpdatedEvent) => void;
  
  /**
   * 当 webview 获得焦点时触发
   */
  onFocus?: (event: Event) => void;
  
  /**
   * 当 webview 失去焦点时触发
   */
  onBlur?: (event: Event) => void;
  
  /**
   * 当 webview 进入全屏时触发
   */
  onEnterHtmlFullScreen?: (event: Event) => void;
  
  /**
   * 当 webview 离开全屏时触发
   */
  onLeaveHtmlFullScreen?: (event: Event) => void;
  
  /**
   * 当 webview 控制台有消息时触发
   */
  onConsoleMessage?: (event: IConsoleMessageEvent) => void;
  
  /**
   * 当 webview 在页面中找到内容时触发
   */
  onFoundInPage?: (event: IFoundInPageEvent) => void;
  
  /**
   * 当 webview 加载提交时触发
   */
  onLoadCommit?: (event: ILoadCommitEvent) => void;
  
  /**
   * 当 webview 获取到响应详情时触发
   */
  onDidGetResponseDetails?: (event: IDidGetResponseDetailsEvent) => void;
  
  /**
   * 当 webview 获取到重定向请求时触发
   */
  onDidGetRedirectRequest?: (event: IDidGetRedirectRequestEvent) => void;
  
  /**
   * 当 webview 渲染进程消失时触发
   */
  onRenderProcessGone?: (event: IRenderProcessGoneEvent) => void;
  
  /**
   * 当 webview 无响应时触发
   */
  onUnresponsive?: (event: Event) => void;
  
  /**
   * 当 webview 恢复响应时触发
   */
  onResponsive?: (event: Event) => void;
}