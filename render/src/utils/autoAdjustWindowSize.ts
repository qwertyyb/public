const resizeObserver = new window.ResizeObserver((entries: any) => {
  const { width, height } = entries.pop().contentRect;
  window.ipcRenderer.invoke('ResizeWindow', { width, height })
})

const controller = {
  start: () => resizeObserver.observe(document.documentElement),
  stop: () => resizeObserver.disconnect()
}

export default controller;
