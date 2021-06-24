
export default (codePath: string, api: string) => {
  const iframe: HTMLIFrameElement = document.createElement('iframe');
  iframe.setAttribute('url', 'about:blank')
  iframe.style.display = 'none'
  document.body.appendChild(iframe);
  const sandboxGlobal = iframe.contentWindow!;
  const scopeProxy = new Proxy(sandboxGlobal, {
    get(target, prop) {
      console.log(target, prop, prop in target, 'ffff')
      return target[prop]
      if (prop in target) {
        // @ts-ignore
        return target[prop]
      }
      return undefined
    },
    set(target, name, value){
      if(Object.keys(target).includes(name as string)){
        // @ts-ignore
        target[name] = value;
        return true;
      }
      return false;
    },
  })

  function sandBoxingEval(pluginPath: string, api: any) {
    // @ts-ignore
    with (scopeProxy) {
      eval(api)
      console.log(require, window)
      const plugin = require(pluginPath).default || require(pluginPath)
      // @ts-ignore
      return plugin(scopeProxy.app)
    }
  }

  console.log(sandboxGlobal)

  return sandBoxingEval(codePath, api);
}