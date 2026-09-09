// Generates PWA icon PNGs into public/ from the existing brand source
// assets in assets/ (the same "&" mark used for the Android app icon) -
// no new branding, just re-exported at PWA-required sizes.
const sharp = require('sharp');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');
const PUBLIC = path.join(__dirname, '..', 'public');

async function run() {
  // Full-bleed flat composite (background + safe-zone-respecting foreground)
  // for contexts that apply their OWN mask/rounding and need a square,
  // non-transparent source image: maskable PWA icons and the iOS
  // apple-touch-icon (iOS renders transparent corners badly).
  const fullBleedBuffer = await sharp(path.join(ASSETS, 'icon-background.png'))
    .composite([{ input: path.join(ASSETS, 'icon-foreground.png') }])
    .png()
    .toBuffer();

  await sharp(fullBleedBuffer).resize(192, 192).toFile(path.join(PUBLIC, 'pwa-maskable-192x192.png'));
  await sharp(fullBleedBuffer).resize(512, 512).toFile(path.join(PUBLIC, 'pwa-maskable-512x512.png'));
  await sharp(fullBleedBuffer).resize(180, 180).toFile(path.join(PUBLIC, 'apple-touch-icon.png'));
  console.log('wrote maskable + apple-touch-icon variants');

  // Standard "any"-purpose icons — the already-composed circular badge
  // (icon-only.png), which looks right shown as-is without any OS mask.
  const iconOnly = path.join(ASSETS, 'icon-only.png');
  await sharp(iconOnly).resize(192, 192).toFile(path.join(PUBLIC, 'pwa-192x192.png'));
  await sharp(iconOnly).resize(512, 512).toFile(path.join(PUBLIC, 'pwa-512x512.png'));
  console.log('wrote standard pwa icons');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
