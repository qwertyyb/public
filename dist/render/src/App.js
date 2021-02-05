"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const InputBar_1 = __importDefault(require("./components/InputBar"));
const ListItem_1 = __importDefault(require("./components/ListItem"));
require("./App.scss");
class App extends react_1.default.Component {
    constructor(props) {
        super(props);
        this.onItemClick = (item) => {
            console.log(item);
            item.action(item);
        };
        const plugins = [
            {
                key: '1',
                code: 'lock',
                title: '锁屏',
                subtitle: '锁定屏幕',
                image: 'https://via.placeholder.com/50?text=lock',
                action: () => {
                    const { exec } = require('child_process');
                    const lock = (cb, customCommands) => {
                        const lockCommands = customCommands || {
                            darwin: `open -a ScreenSaverEngine`,
                            win32: 'rundll32.exe user32.dll, LockWorkStation',
                            linux: '(hash gnome-screensaver-command 2>/dev/null && gnome-screensaver-command -l) || (hash dm-tool 2>/dev/null && dm-tool lock)'
                        };
                        if (Object.keys(lockCommands).indexOf(process.platform) === -1) {
                            throw new Error(`lockscreen doesn't support your platform (${process.platform})`);
                        }
                        else {
                            exec(lockCommands[process.platform], (err, stdout) => {
                                console.log('callback', err, stdout);
                            });
                        }
                    };
                    lock();
                }
            }
        ];
        this.state = {
            plugins
        };
    }
    render() {
        return (<div className="App">
        <InputBar_1.default></InputBar_1.default>
        <div className="item-list">
          {this.state.plugins.map(item => (<ListItem_1.default image={item.image} key={item.key} title={item.title} subtitle={item.subtitle} onClick={() => this.onItemClick(item)}></ListItem_1.default>))}
        </div>
      </div>);
    }
}
exports.default = App;
