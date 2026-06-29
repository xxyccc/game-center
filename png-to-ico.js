// 把 PNG 转成 Windows ICO 图标
const fs = require('fs');
const path = require('path');

const pngPath = path.join(__dirname, 'shared-assets', 'images', 'icon.png');
const icoPath = path.join(__dirname, 'shared-assets', 'images', 'icon.ico');

const pngData = fs.readFileSync(pngPath);

// ICO 文件格式：嵌入 PNG 数据
// Header: 6 bytes
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);    // reserved
header.writeUInt16LE(1, 2);    // type: ICO = 1
header.writeUInt16LE(1, 4);    // count: 1 image

// Directory entry: 16 bytes
const dir = Buffer.alloc(16);
dir.writeUInt8(0, 0);          // width (0 = 256px, since 256 = 0 in uint8)
dir.writeUInt8(0, 1);          // height (0 = 256px)
dir.writeUInt8(0, 2);          // color palette (0 = no palette)
dir.writeUInt8(0, 3);          // reserved
dir.writeUInt16LE(1, 4);       // color planes
dir.writeUInt16LE(32, 6);      // bits per pixel
dir.writeUInt32LE(pngData.length, 8);  // image size
dir.writeUInt32LE(22, 12);     // offset to image data (6 + 16 = 22)

// Write ICO
const icoData = Buffer.concat([header, dir, pngData]);
fs.writeFileSync(icoPath, icoData);

console.log('icon.ico created! Size:', icoData.length, 'bytes');
