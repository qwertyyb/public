"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const macosAppPaths = [
    '/System/Applications',
    '/Applications',
];
const getMacosApps = async (paths) => {
    const dirApps = await Promise.all(paths.map(async (path) => {
        const dir = await fs.promises.opendir(path);
        return fs.readdirSync(path); // @todo 遍历目录
    }));
    return dirApps.flat();
};
class AppLauncher {
    constructor() {
        this.code = 'launcher';
        this.data = {
            list: ['']
        };
    }
    async onCreate() {
        this.data.list = await getMacosApps(macosAppPaths);
    }
    async onActive(setList) {
        setList(this.data.list);
    }
    async onSearch(keyword = '', setList) {
        setList(this.data.list.filter(name => name.includes(keyword)));
    }
}
exports.default = new AppLauncher();
