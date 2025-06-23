/**
 * Electron webview 事件的类型声明
 */

import { WebPreferences } from 'electron';

// 为 Electron webview 事件定义自定义事件类型
export interface INewWindowEvent extends Event {
  url: string;
  frameName: string;
  disposition: string;
  options: WebPreferences;
}

export interface IWillNavigateEvent extends Event {
  url: string;
}

export interface IDidStartNavigationEvent extends Event {
  url: string;
  isInPlace: boolean;
  isMainFrame: boolean;
  frameProcessId: number;
  frameRoutingId: number;
}

export interface IDidNavigateEvent extends Event {
  url: string;
}

export interface IDidNavigateInPageEvent extends Event {
  url: string;
  isMainFrame: boolean;
  frameProcessId: number;
  frameRoutingId: number;
}

export interface IPageTitleUpdatedEvent extends Event {
  title: string;
  explicitSet: boolean;
}

export interface IPageFaviconUpdatedEvent extends Event {
  favicons: string[];
}

export interface IPluginCrashedEvent extends Event {
  name: string;
  version: string;
}

export interface IConsoleMessageEvent extends Event {
  level: number;
  message: string;
  line: number;
  sourceId: string;
}

export interface IFoundInPageEvent extends Event {
  requestId: number;
  activeMatchOrdinal: number;
  matches: number;
  selectionArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  finalUpdate: boolean;
}

export interface ILoadCommitEvent extends Event {
  url: string;
  isMainFrame: boolean;
}

export interface IDidFailLoadEvent extends Event {
  errorCode: number;
  errorDescription: string;
  validatedURL: string;
  isMainFrame: boolean;
  frameProcessId: number;
  frameRoutingId: number;
}

export interface IDidFrameFinishLoadEvent extends Event {
  isMainFrame: boolean;
  frameProcessId: number;
  frameRoutingId: number;
}

export interface IDidGetResponseDetailsEvent extends Event {
  status: boolean;
  newURL: string;
  originalURL: string;
  httpResponseCode: number;
  requestMethod: string;
  referrer: string;
  headers: Record<string, string>;
  resourceType: string;
}

export interface IDidGetRedirectRequestEvent extends Event {
  oldURL: string;
  newURL: string;
  isMainFrame: boolean;
  httpResponseCode: number;
  requestMethod: string;
  referrer: string;
  headers: Record<string, string>;
}

export interface IRenderProcessGoneEvent extends Event {
  reason: 'clean-exit' | 'abnormal-exit' | 'killed' | 'crashed' | 'oom' | 'launch-failed' | 'integrity-failure';
}

export interface IIpcMessageEvent extends Event {
  channel: string;
  args: any[];
}

export interface IIpcMessageHostEvent extends Event {
  channel: string;
  args: any[];
}

export interface IUpdateTargetUrlEvent extends Event {
  url: string;
}

export interface IContextMenuEvent extends Event {
  params: {
    x: number;
    y: number;
    linkURL: string;
    linkText: string;
    pageURL: string;
    frameURL: string;
    srcURL: string;
    mediaType: string;
    mediaFlags: {
      inError: boolean;
      isPaused: boolean;
      isMuted: boolean;
      hasAudio: boolean;
      isLooping: boolean;
      isControlsVisible: boolean;
      canToggleControls: boolean;
      canRotate: boolean;
    };
    hasImageContents: boolean;
    isEditable: boolean;
    selectionText: string;
    titleText: string;
    misspelledWord: string;
    frameCharset: string;
    inputFieldType: string;
    menuSourceType: number;
    mediaFlags: number;
    editFlags: number;
  };
}

export interface IWebviewEventMap {
  /**
   * 当 guest 页面尝试打开新窗口时触发
   */
  'new-window': INewWindowEvent;

  /**
   * 当 webview 导航到新 URL 时触发
   */
  'will-navigate': IWillNavigateEvent;

  /**
   * 当 webview 开始导航时触发
   */
  'did-start-navigation': IDidStartNavigationEvent;

  /**
   * 当导航完成时触发
   */
  'did-navigate': IDidNavigateEvent;

  /**
   * 当同一文档内导航发生时触发
   */
  'did-navigate-in-page': IDidNavigateInPageEvent;

  /**
   * 当 webview 的页面请求关闭时触发
   */
  'close': Event;

  /**
   * 当 webview 开始加载时触发
   */
  'did-start-loading': Event;

  /**
   * 当 webview 停止加载时触发
   */
  'did-stop-loading': Event;

  /**
   * 当文档加载完成时触发
   */
  'dom-ready': Event;

  /**
   * 当页面标题设置时触发
   */
  'page-title-updated': IPageTitleUpdatedEvent;

  /**
   * 当页面图标更新时触发
   */
  'page-favicon-updated': IPageFaviconUpdatedEvent;

  /**
   * 当输入框获得焦点时触发
   */
  'focus': Event;

  /**
   * 当 webview 失去焦点时触发
   */
  'blur': Event;

  /**
   * 当页面请求全屏时触发
   */
  'enter-html-full-screen': Event;

  /**
   * 当页面离开全屏时触发
   */
  'leave-html-full-screen': Event;

  /**
   * 当渲染进程崩溃时触发
   */
  'crashed': Event;

  /**
   * 当插件进程崩溃时触发
   */
  'plugin-crashed': IPluginCrashedEvent;

  /**
   * 当 webview 销毁时触发
   */
  'destroyed': Event;

  /**
   * 当 devtools 打开时触发
   */
  'devtools-opened': Event;

  /**
   * 当 devtools 关闭时触发
   */
  'devtools-closed': Event;

  /**
   * 当 devtools 聚焦时触发
   */
  'devtools-focused': Event;

  /**
   * 当 webview 收到 console.log 等调用时触发
   */
  'console-message': IConsoleMessageEvent;

  /**
   * 当找到结果时触发
   */
  'found-in-page': IFoundInPageEvent;

  /**
   * 当 webview 加载 URL 或导航时触发
   */
  'load-commit': ILoadCommitEvent;

  /**
   * 当 webview 完成加载时触发
   */
  'did-finish-load': Event;

  /**
   * 当加载失败时触发
   */
  'did-fail-load': IDidFailLoadEvent;

  /**
   * 当 webview 加载资源时触发
   */
  'did-frame-finish-load': IDidFrameFinishLoadEvent;

  /**
   * 当 webview 接收到响应头时触发
   */
  'did-get-response-details': IDidGetResponseDetailsEvent;

  /**
   * 当 webview 接收到重定向时触发
   */
  'did-get-redirect-request': IDidGetRedirectRequestEvent;

  /**
   * 当 webview 的渲染进程被挂起时触发
   */
  'render-process-gone': IRenderProcessGoneEvent;

  /**
   * 当 webview 的渲染进程未响应时触发
   */
  'unresponsive': Event;

  /**
   * 当 webview 的渲染进程恢复响应时触发
   */
  'responsive': Event;

  /**
   * 当 webview 收到 IPC 消息时触发
   */
  'ipc-message': IIpcMessageEvent;

  /**
   * 当 webview 收到主进程的 IPC 消息时触发
   */
  'ipc-message-host': IIpcMessageHostEvent;

  /**
   * 当 webview 更新目标 URL 时触发
   */
  'update-target-url': IUpdateTargetUrlEvent;

  /**
   * 当鼠标移动到链接上或键盘将焦点移动到链接上时触发
   */
  'context-menu': IContextMenuEvent;
}