import readline from 'node:readline/promises'
import { runMainWebpack, startElectron } from "./main";
import { runPluginsWebpack } from "./plugin";
import { waitReady, startRender } from './render';
import { runPreloadWebpack } from './preload';

const readCommand = async () => {
  const rl = readline.createInterface(process.stdin, process.stdout);
  while (true) {
    const answer = await rl.question("请输入指令: ");
    console.log("开始执行指令: ", answer);

    const [command, plugin] = answer.split(" ");
    if (command === "rs") {
      console.log('正在重启主进程...')
      await startElectron();
    }
    console.log("指令执行完成");
  }
};

const dev = async () => {
  await Promise.all([
    startRender('development'),
    runPluginsWebpack('development'),
    runMainWebpack('development', () => waitReady().then(startElectron)),
    runPreloadWebpack('development', () => waitReady().then(startElectron))
  ]);

  readCommand()
};

const build = async () => {
  await Promise.all([
    startRender('production'),
    runPluginsWebpack('production', ['snippets']),
    runMainWebpack('production'),
    runPreloadWebpack('production')
  ]);
}

const start = () => {
  process.argv.includes('build') ? build() : dev();
}

start();
