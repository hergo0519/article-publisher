const fs = require('fs')
const path = require('path')

const assetsDir = path.join(__dirname, 'assets')
const files = ['qr00.png', 'qr01.png']

const output = {}

files.forEach(file => {
  const filePath = path.join(assetsDir, file)
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath)
    output[file] = 'data:image/png;base64,' + data.toString('base64')
    console.log(`Converted ${file}: ${output[file].substring(0, 50)}...`)
  } else {
    console.error(`File not found: ${filePath}`)
  }
})

fs.writeFileSync(
  path.join(__dirname, 'src', 'renderer', 'assets', 'qr-codes.json'),
  JSON.stringify(output, null, 2)
)

console.log('QR codes converted successfully!')
