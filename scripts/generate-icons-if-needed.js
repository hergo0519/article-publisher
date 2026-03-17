const fs = require('fs');
const path = require('path');

// 检查图标文件是否都已存在
const assetsDir = path.join(__dirname, '..', 'assets');
const requiredFiles = ['icon.ico', 'icon.icns', 'icon.png'];

const missingFiles = requiredFiles.filter(file => {
  const filePath = path.join(assetsDir, file);
  return !fs.existsSync(filePath);
});

if (missingFiles.length === 0) {
  console.log('All icon files exist, skipping generation.');
  process.exit(0);
}

// 在 CI 环境中，如果图标缺失，直接报错而不是尝试生成
// 因为生成图标需要 sharp 依赖，会增加 CI 复杂度
if (process.env.CI) {
  console.error('Error: Icon files are missing in CI environment.');
  console.error(`Missing: ${missingFiles.join(', ')}`);
  console.error('Please ensure all icon files are committed to the repository.');
  process.exit(1);
}

console.log(`Missing icon files: ${missingFiles.join(', ')}`);
console.log('Generating icons...');

// 运行图标生成脚本
const { execSync } = require('child_process');

// 生成 ICO
try {
  execSync('node scripts/create-ico.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
} catch (e) {
  console.error('Failed to create ICO:', e.message);
  process.exit(1);
}

// 生成 ICNS
try {
  execSync('node scripts/create-icns.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
} catch (e) {
  console.error('Failed to create ICNS:', e.message);
  process.exit(1);
}

console.log('Icons generated successfully!');
