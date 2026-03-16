const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// 创建图标
function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 背景 - 蓝色渐变
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#1890ff');
  gradient.addColorStop(1, '#096dd9');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // 圆角
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // 文档图标
  ctx.fillStyle = '#ffffff';
  const padding = size * 0.2;
  const docWidth = size - padding * 2;
  const docHeight = size - padding * 2;
  
  // 文档主体
  ctx.beginPath();
  ctx.roundRect(padding, padding, docWidth, docHeight, size * 0.05);
  ctx.fill();

  // 文档线条
  ctx.fillStyle = '#1890ff';
  const lineHeight = size * 0.08;
  const lineWidth = docWidth * 0.6;
  const lineX = padding + (docWidth - lineWidth) / 2;
  
  // 三条线
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(lineX, padding + size * 0.25 + i * lineHeight * 1.5, lineWidth, lineHeight);
  }

  return canvas;
}

// 保存不同尺寸的图标
const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];

sizes.forEach(size => {
  const canvas = createIcon(size);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, `icon-${size}.png`), buffer);
  console.log(`Created icon-${size}.png`);
});

console.log('All icons created!');
