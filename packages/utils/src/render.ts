export const withCache = <F extends (...args: any[]) => any>(fn: F) => {
  let results = new Map<string, any>()
  return (...args: Parameters<F>): ReturnType<F> => {
    const key = JSON.stringify(args)
    const value = results.get(key)
    if (value) return value;
    const result = fn(...args)
    results.set(key, result)
    return result
  }
}

type TPayload = {
  type: 'invoke',
  method: string,
  callback: string,
  args: any[]
} | {
  type: 'callback',
  callback: string,
  error?: Error,
  returnValue?: Error,
}

type Callback = (payload: TPayload) => void

export const createBridge = (
  send: Callback,
  on: (callback: Callback) => void,
) => {
  const callbacks = new Map<string, { resolve: (result: any) => void, reject: (err: Error) => void }>();
  const functions = new Map<string, (...args: any[]) => any>()

  on(async (data: TPayload) => {
    if (data.type === 'invoke') {
      const { method, args, callback } = data;
      const func = functions.get(method)
      if (func) {
        return send({
          type: 'callback',
          callback,
          returnValue: await func(...args)
        })
      }
      return send({
        type: 'callback',
        callback,
        error: new Error(`method ${method} is not exits`)
      })
    } else if (data.type === 'callback') {
      const { callback, returnValue, error } = data
      const cb = callbacks.get(callback);
      if (error) {
        cb?.reject(error)
      } else {
        cb?.resolve(returnValue);
      }
      callbacks.delete(callback);
    }
  })

  return {
    invoke <R>(method: string, ...args: unknown[]) {
      return new Promise<R>((resolve, reject) => {
        const callback = `callback_${Math.random()}`;
        callbacks.set(callback, { resolve, reject });
        try {
          send({
            type: 'invoke',
            callback,
            method,
            args
          })
        } catch (err) {
          reject(err)
          callbacks.delete(callback)
          throw err
        }
      })
    },
    handle(channel: string, callback: (...args: any[]) => any) {
      functions.set(channel, callback)
    },
    unhandle(channel: string) {
      functions.delete(channel)
    },
  }
}

export function isFocusable(element: Element) {
  // 1. 检查是否是有效 DOM 元素
  if (!(element instanceof HTMLElement)) return false;

  // 2. 检查可见性
  const isVisible = () => {
    if (element.offsetParent === null) return false; // display: none
    const style = window.getComputedStyle(element);
    return style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 &&
           element.offsetHeight > 0;
  };

  // 3. 检查禁用状态
  const isDisabled = () => {
    if ((element as any).disabled) return true;
    
    // 检查是否在禁用的 fieldset 中
    let parent = element.parentElement;
    while (parent) {
      if (parent.tagName === 'FIELDSET' && (element as any).disabled) {
        return !parent.contains(element.closest('legend'));
      }
      parent = parent.parentElement;
    }
    return false;
  };

  // 4. 检查可聚焦性
  const isIntrinsicallyFocusable = () => {
    const focusableTags = [
      'A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 
      'IFRAME', 'AREA', 'SUMMARY', 'DETAILS'
    ];
    
    // 原生可聚焦元素
    if (focusableTags.includes(element.tagName)) {
      // 特殊处理：<a> 必须有 href
      if (element.tagName === 'A' && !(element as any).href) return false;
      return true;
    }
    
    // contenteditable 元素
    if (element.contentEditable === 'true' || element.contentEditable === 'plaintext-only') return true;
    
    // 有 tabindex 属性（包括负值）
    if (element.hasAttribute('tabindex')) return true;
    
    return false;
  };

  return isVisible() && !isDisabled() && isIntrinsicallyFocusable();
}