"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const launcher_1 = __importDefault(require("../plugins/launcher"));
const lockscreen_1 = __importDefault(require("../plugins/lockscreen"));
const index_1 = __importDefault(require("../plugins/calculator/index"));
const plugins = [
    lockscreen_1.default,
    launcher_1.default,
    index_1.default
];
window.service = {
    getPlugins() {
        return plugins;
    }
};
window.PluginManager = {
    getPlugins() {
        return plugins;
    },
    handleInput(keyword, setResult) {
        const setPluginResult = (plugin) => (list) => setResult(plugin, list);
        plugins.forEach(plugin => plugin.onInput(keyword, setPluginResult(plugin)));
    },
    handleEnter(plugin, args) {
        args.item.onEnter?.(args.item, args.index, args.list);
    }
};
window.ipcRenderer = electron_1.ipcRenderer;
