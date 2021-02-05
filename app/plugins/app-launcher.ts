const fs = require('fs')

const macosAppPaths = [
  '/System/Applications', // 系统应用
  '/Applications',  // 安装的应用
]

const getMacosApps = async (paths: String[]) => {
  const dirApps = await Promise.all(paths.map(async (path) => {
      const dir = await fs.promises.opendir(path);
      return fs.readdirSync(path);    // @todo 遍历目录
  }));
  return dirApps.flat()
};

class AppLauncher {
  code = 'launcher'
  data = {
    list: ['']
  }
  async onCreate () {
      this.data.list = await getMacosApps(macosAppPaths)
  }
  async onActive (setList: Function) {
      setList(this.data.list)
  }
  async onSearch (keyword = '', setList: Function) {
      setList(this.data.list.filter(name => name.includes(keyword)))
  }
}
export default new AppLauncher()