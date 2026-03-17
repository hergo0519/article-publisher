const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ICNS 文件格式常量
const ICNS_HEADER_SIZE = 8;
const ICNS_ICON_TYPE_MAP = {
  16: 'icp4',   // 16x16
  32: 'icp5',   // 32x32
  48: 'icp6',   // 48x48
  128: 'ic07',  // 128x128
  256: 'ic08',  // 256x256
  512: 'ic09',  // 512x512
  1024: 'ic10'  // 1024x1024 (Retina)
};

// 创建 ICNS 文件头
function createIcnsHeader(fileSize) {
  const header = Buffer.alloc(ICNS_HEADER_SIZE);
  header.write('icns', 0, 4, 'ascii'); // Magic number
  header.writeUInt32BE(fileSize, 4);   // File size
  return header;
}

// 创建 ICNS 图标条目
function createIcnsEntry(type, pngBuffer) {
  const entry = Buffer.alloc(ICNS_HEADER_SIZE + pngBuffer.length);
  entry.write(type, 0, 4, 'ascii');    // Icon type
  entry.writeUInt32BE(entry.length, 4); // Entry size
  pngBuffer.copy(entry, 8);             // PNG data
  return entry;
}

// 创建 ICNS 文件
async function createIcns() {
  const sizes = [16, 32, 48, 128, 256, 512, 1024];
  const entries = [];
  
  const svgBuffer = fs.readFileSync(path.join(__dirname, '..', 'assets', 'icon.svg'));
  
  for (const size of sizes) {
    const pngBuffer = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();
    
    const type = ICNS_ICON_TYPE_MAP[size];
    if (type) {
      entries.push(createIcnsEntry(type, pngBuffer));
      console.log(`Created ${type} (${size}x${size}) entry`);
    }
  }
  
  // 计算总文件大小
  const totalSize = ICNS_HEADER_SIZE + entries.reduce((sum, entry) => sum + entry.length, 0);
  
  // 组合 ICNS 文件
  const icnsBuffer = Buffer.concat([
    createIcnsHeader(totalSize),
    ...entries
  ]);
  
  fs.writeFileSync(path.join(__dirname, '..', 'assets', 'icon.icns'), icnsBuffer);
  console.log('Created icon.icns successfully!');
}

createIcns().catch(console.error);
