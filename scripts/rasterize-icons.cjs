const sharp = require('sharp');
const path = require('path');

const files = ['icon-background', 'icon-foreground', 'icon-only'];

async function run() {
  for (const name of files) {
    const svgPath = path.join(__dirname, '..', 'assets', `${name}.svg`);
    const pngPath = path.join(__dirname, '..', 'assets', `${name}.png`);
    await sharp(svgPath, { density: 384 }).resize(1024, 1024).png().toFile(pngPath);
    console.log('wrote', pngPath);
  }
  const splashSvg = path.join(__dirname, '..', 'assets', 'splash.svg');
  const splashPng = path.join(__dirname, '..', 'assets', 'splash.png');
  await sharp(splashSvg, { density: 384 }).resize(2732, 2732).png().toFile(splashPng);
  console.log('wrote', splashPng);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
