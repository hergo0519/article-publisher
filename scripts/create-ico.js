const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ICO 文件头
function createIcoHeader(numImages) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(numImages, 4); // Count
  return header;
}

// ICO 目录项
function createIcoDirectoryEntry(width, height, size, offset) {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(width === 256 ? 0 : width, 0); // Width
  entry.writeUInt8(height === 256 ? 0 : height, 1); // Height
  entry.writeUInt8(0, 2); // Color palette
  entry.writeUInt8(0, 3); // Reserved
  entry.writeUInt16LE(1, 4); // Color planes
  entry.writeUInt16LE(32, 6); // Bits per pixel
  entry.writeUInt32LE(size, 8); // Size of image data
  entry.writeUInt32LE(offset, 12); // Offset to image data
  return entry;
}

// 创建 ICO 文件
async function createIco() {
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = [];
  
  const svgBuffer = fs.readFileSync(path.join(__dirname, '..', 'assets', 'icon.svg'));
  
  for (const size of sizes) {
    const pngBuffer = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();
    pngBuffers.push({ size, buffer: pngBuffer });
  }
  
  // 计算偏移量
  let offset = 6 + (16 * pngBuffers.length); // Header + Directory
  const entries = [];
  
  for (const { size, buffer } of pngBuffers) {
    entries.push(createIcoDirectoryEntry(size, size, buffer.length, offset));
    offset += buffer.length;
  }
  
  // 组合 ICO 文件
  const icoBuffer = Buffer.concat([
    createIcoHeader(pngBuffers.length),
    ...entries,
    ...pngBuffers.map(p => p.buffer)
  ]);
  
  fs.writeFileSync(path.join(__dirname, '..', 'assets', 'icon.ico'), icoBuffer);
  console.log('Created icon.ico');
}

createIco().catch(console.error);
