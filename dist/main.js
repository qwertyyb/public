"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const plugin_1 = __importDefault(require("./plugin"));
function createWindow() {
    electron_1.ipcMain.handle('ResizeWindow', (event, arg) => {
        win.setSize(arg.width, arg.height);
    });
    electron_1.ipcMain.on('getApplicationIcon', async (event, args) => {
        console.log('getApplicationIcon', args);
        const icon = await electron_1.app.getFileIcon(args.path);
        event.reply(`getApplicationIcon-${args.path}`, icon.toDataURL());
    });
    const win = new electron_1.BrowserWindow({
        // width: 720,
        height: 60,
        useContentSize: true,
        frame: false,
        minWidth: 720,
        webPreferences: {
            // webSecurity: false,
            nodeIntegration: true,
            devTools: true,
            preload: path.join(__dirname, './main/preload.js'),
            contextIsolation: false
        }
    });
    win.loadURL('http://localhost:8020');
    win.webContents.openDevTools();
}
const registerShortcut = () => {
    electron_1.globalShortcut.register('CommandOrControl+Space', () => {
        electron_1.app.focus({
            steal: true
        });
    });
};
electron_1.app.whenReady().then(() => {
    createWindow();
    registerShortcut();
    plugin_1.default();
    electron_1.app.setAccessibilitySupportEnabled(true);
    electron_1.protocol.registerFileProtocol('localfile', (request, callback) => {
        const pathname = decodeURIComponent(request.url.replace('localfile:///', ''));
        callback(pathname);
    });
});
electron_1.app.on('will-quit', () => {
    // 注销所有快捷键
    electron_1.globalShortcut.unregisterAll();
});
