const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 读取 SVG
const svgBuffer = fs.readFileSync(path.join(__dirname, 'assets', 'icon.svg'));

async function generateIco() {
  // 创建不同尺寸的 PNG
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = [];
  
  for (const size of sizes) {
    const pngBuffer = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();
    pngBuffers.push({ size, buffer: pngBuffer });
  }
  
  // 由于 Windows 需要 .ico 格式，我们先用 PNG 代替
  // electron-builder 也支持直接使用 PNG
  console.log('Icons generated successfully');
}

generateIco().catch(console.error);
