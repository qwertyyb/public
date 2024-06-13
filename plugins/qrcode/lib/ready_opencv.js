const path = require('path')

// 1. 准备Module
let opencvModule = {
  preRun: [],
  postRun: [] ,
  onRuntimeInitialized: function() {
    console.log("Emscripten runtime is ready, launching QUnit tests...");
    if (window.cv instanceof Promise) {
      window.cv.then((target) => {
         window.cv = target;
      })
    }
  },
  print: (function() {
    return function(text) {
      console.log(text);
    };
  })(),
  printErr: function(text) {
    console.error(text);
  },
  setStatus: function(text) {
    console.log(text);
  },
  totalDependencies: 0
};

opencvModule.setStatus('Downloading...');

// 加载模型文件
opencvModule = require('./wechat_qrcode_files')(opencvModule, 'localfile://' + path.resolve(__dirname, './wechat_qrcode_files.data'))

// 加载opencv wasm
const opencv = require('./opencv')(opencvModule)

module.exports = opencv


