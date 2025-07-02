import readline from 'node:readline/promises'
import { runMainWebpack, startElectron } from "./main";
import { runAllPluginsWebpack } from "./plugin";

const readCommand = async () => {
  const rl = readline.createInterface(process.stdin, process.stdout);
  rl.addListener("SIGINT", () => {
    process.exit(0);
  });
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

const start = async () => {
  await Promise.all([
    runAllPluginsWebpack(), runMainWebpack(() => startElectron())
  ]);

  readCommand()
};

start()
