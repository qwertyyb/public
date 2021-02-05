"use strict";
const lockPlugin = {
    key: '1',
    code: 'lock',
    title: '锁屏',
    subtitle: '锁定屏幕',
    image: 'https://via.placeholder.com/50?text=lock',
    action: () => {
        const { exec } = window.require('child_process');
        const os = window.require('os');
        const lock = (cb, customCommands) => {
            const lockCommands = customCommands || {
                darwin: `open -a ScreenSaverEngine`,
                win32: 'rundll32.exe user32.dll, LockWorkStation',
                linux: '(hash gnome-screensaver-command 2>/dev/null && gnome-screensaver-command -l) || (hash dm-tool 2>/dev/null && dm-tool lock)'
            };
            const platform = os.platform();
            if (Object.keys(lockCommands).indexOf(platform) === -1) {
                throw new Error(`lockscreen doesn't support your platform (${platform})`);
            }
            else {
                exec(lockCommands[platform], (err, stdout) => {
                    console.log('callback', err, stdout);
                });
            }
        };
        lock();
    }
};
const launcherPlugin = {
    key: 'launch',
    code: 'launch',
    title: '启动应用',
    subtitle: '启动应用',
    image: 'https://via.placeholder.com/50?text=launch',
    children: [],
    async created() {
        console.log('created');
        const fs = require('fs');
        const path = require('path');
        const macosAppPaths = [
            '/System/Applications',
            '/Applications',
        ];
        const getMacosApps = async (dirs, level = 2) => {
            const dirApps = await Promise.all(dirs.map(async (dir) => {
                const namelist = fs.readdirSync(dir);
                // 当前目录下的app
                const appNames = namelist.filter(name => name.endsWith('.app'));
                const apps = appNames.map(name => ({
                    name,
                    path: path.join(dir, name)
                }));
                if (level <= 0)
                    return apps;
                const dirList = namelist.filter(name => {
                    const fullPath = path.join(dir, name);
                    if (name.endsWith('.app'))
                        return false;
                    return fs.statSync(fullPath).isDirectory();
                }).map(dirName => path.join(dir, dirName));
                if (!dirList.length) {
                    return apps;
                }
                // 子目录下的app
                const subDirApps = await getMacosApps(dirList, level - 1);
                return apps.concat(...subDirApps);
            }));
            return dirApps.flat();
        };
        const list = await getMacosApps(macosAppPaths);
        this.children = list.map(app => ({
            code: app.name.substring(0, app.name.length - 4),
            subtitle: app.path,
            title: app.name,
            image: `https://via.placeholder.com/50?text=${app.name}`,
            key: app.path,
            action: (app) => {
                const { exec } = require('child_process');
                exec(`open -a "${app.code}"`);
            }
        }));
    }
};
const plugins = [
    lockPlugin,
    launcherPlugin
];
plugins.forEach(item => item.created?.());
window.service = {
    getPlugins() {
        return plugins;
    }
};
