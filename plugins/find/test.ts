const fs = require('fs');
const path = require('path');
const getDefaultApp = require('./build/Release/getDefaultApp');

const filePath = '/Users/qwertyyb/mine/public/plugins/find/index.ts'; // 替换为你要查询的文件路径
const defaultApp = getDefaultApp.getDefaultApp(filePath);

if (defaultApp) {
  console.log(`Default application: ${defaultApp}`);

  const iconBuffer = getDefaultApp.getDefaultAppIcon(filePath);
  if (iconBuffer) {
    const iconPath = path.join(__dirname, 'defaultAppIcon.icns');
    fs.writeFileSync(iconPath, iconBuffer);
    console.log(`Icon saved to: ${iconPath}`);
  } else {
    console.log('No icon found for the default application.');
  }
} else {
  console.log('No default application found.');
}