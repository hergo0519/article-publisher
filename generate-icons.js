const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgBuffer = fs.readFileSync(path.join(__dirname, 'assets', 'icon.svg'));

const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];

async function generateIcons() {
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, 'assets', `icon-${size}.png`));
    console.log(`Created icon-${size}.png`);
  }
  
  // 创建默认 icon.png
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile(path.join(__dirname, 'assets', 'icon.png'));
  console.log('Created icon.png');
}

generateIcons().catch(console.error);
