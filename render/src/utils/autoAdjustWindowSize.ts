const resizeObserver = new window.ResizeObserver((entries: any) => {
  const { width, height } = entries.pop().contentRect;
  setTimeout(() => {
    window.ipcRenderer.invoke('ResizeWindow', { width, height })
  }, 200)
})

const controller = {
  start: () => resizeObserver.observe(document.documentElement),
  stop: () => resizeObserver.disconnect()
}

export default controller;
