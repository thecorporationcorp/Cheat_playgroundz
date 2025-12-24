#!/usr/bin/env node

/**
 * Convert SVG icons to PNG using sharp
 * Requires: npm install sharp
 * Usage: node convert-svg-to-png.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is installed
try {
  require.resolve('sharp');
} catch (e) {
  console.error('❌ sharp is not installed');
  console.log('📦 Install it with: npm install sharp');
  process.exit(1);
}

const sharp = require('sharp');

const iconsDir = path.join(__dirname, 'public', 'icons');
const sizes = [192, 512];

async function convertSVGtoPNG() {
  for (const size of sizes) {
    const svgPath = path.join(iconsDir, `icon-${size}.svg`);
    const pngPath = path.join(iconsDir, `icon-${size}.png`);

    if (!fs.existsSync(svgPath)) {
      console.error(`❌ ${svgPath} not found`);
      console.log('Run: node generate-icons.js first');
      continue;
    }

    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(pngPath);

      console.log(`✅ Created ${pngPath}`);
    } catch (error) {
      console.error(`❌ Failed to convert icon-${size}.svg:`, error.message);
    }
  }

  console.log('\n✅ PNG icons generated!');
  console.log('🧹 You can now delete the .svg files if desired');
}

convertSVGtoPNG().catch(console.error);
