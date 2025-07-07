import { ChildProcess, spawn } from "child_process"

const CMD = 'pnpm run start:render'
const URL = 'http://localhost:4000'
const WAIT_DELAY = 1000 // ms
const WAIT_TIMEOUT = 1000 // ms

let renderProcess: ChildProcess | null = null

export const stopRender = () => {
  if (renderProcess) {
    renderProcess.kill()
    renderProcess = null
  }
}

export const waitReady = async (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    fetch(URL).then(r => {
      if (r.ok) return resolve()
      reject(new Error(`${r.statusText}${r.status}`))
    }).catch(reject)
    setTimeout(() => reject(new Error('timeout')), WAIT_TIMEOUT)
  }).catch(err => {
    return new Promise<void>(resolve => setTimeout(() => resolve(waitReady()), WAIT_DELAY))
  })
}

process.on("exit", () => {
  stopRender();
});

process.on("SIGINT", () => {
  stopRender();
});

export const startRender = () => {
  const [cmd, ...args] = CMD.split(' ')
  renderProcess = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] })
  renderProcess.on('error', (err) => {
    stopRender()
  })
}
