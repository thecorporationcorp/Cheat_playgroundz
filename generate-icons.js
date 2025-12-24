#!/usr/bin/env node

/**
 * Generate placeholder PWA icons
 * Creates basic black square icons with white "P" text
 * Usage: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// SVG template for icon
const createSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Black background -->
  <rect width="${size}" height="${size}" fill="#000000"/>

  <!-- White "P" text -->
  <text
    x="50%"
    y="50%"
    font-family="Arial, sans-serif"
    font-size="${Math.floor(size * 0.6)}"
    font-weight="bold"
    fill="#FFFFFF"
    text-anchor="middle"
    dominant-baseline="central">P</text>

  <!-- Red accent border -->
  <rect
    x="2"
    y="2"
    width="${size - 4}"
    height="${size - 4}"
    fill="none"
    stroke="#FF0000"
    stroke-width="4"/>
</svg>`;

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons
const sizes = [192, 512];

sizes.forEach(size => {
  const svgContent = createSVG(size);
  const svgPath = path.join(iconsDir, `icon-${size}.svg`);

  fs.writeFileSync(svgPath, svgContent);
  console.log(`✅ Created ${svgPath}`);
});

console.log('\n📝 SVG icons created!');
console.log('\n🔄 To convert to PNG, you have two options:');
console.log('\n   Option 1 - Using ImageMagick (if installed):');
sizes.forEach(size => {
  console.log(`   convert public/icons/icon-${size}.svg public/icons/icon-${size}.png`);
});

console.log('\n   Option 2 - Using sharp (install first: npm install sharp):');
console.log('   node convert-svg-to-png.js');

console.log('\n   Option 3 - Use online converter:');
console.log('   https://cloudconvert.com/svg-to-png');
console.log('   Upload icon-192.svg and icon-512.svg, download PNGs');

console.log('\n   Option 4 - Keep SVG (add to manifest.json):');
console.log('   Change icon src in manifest.json from .png to .svg');
console.log('   Note: Not all browsers support SVG icons in manifest');
