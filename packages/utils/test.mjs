import module from "module";

const require = module.createRequire(import.meta.url);

const addon = require("./build/Debug/addon.node");

console.log("addon", addon);

console.log(1, addon.lookupWordHTML("hello"));

// console.log(2)

// console.log(3, lookupWordHTML('hell'))
