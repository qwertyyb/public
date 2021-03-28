const resizeObserver = new window.ResizeObserver((entries: any) => {
  const { width, height } = entries.pop().contentRect;
  setTimeout(() => {
    // @ts-ignore
    window.ipcRenderer.send('ResizeWindow', { width, height })
  }, 10)
})

const controller = {
  start: () => resizeObserver.observe(document.documentElement),
  stop: () => resizeObserver.disconnect()
}

export default controller;
