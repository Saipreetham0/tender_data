// Simple script to create basic app icons
const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createSVGIcon = (size, text = 'RT') => {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#3b82f6" rx="20"/>
    <text x="${size/2}" y="${size/2 + size/8}" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="${size/2.5}" font-weight="bold">${text}</text>
  </svg>`;
};

// Create icon files
const publicDir = path.join(__dirname, '..', 'public');

// Create android-chrome-192x192.png as SVG (browsers will handle it)
fs.writeFileSync(
  path.join(publicDir, 'android-chrome-192x192.svg'),
  createSVGIcon(192)
);

// Create android-chrome-512x512.png as SVG
fs.writeFileSync(
  path.join(publicDir, 'android-chrome-512x512.svg'),
  createSVGIcon(512)
);

// Create favicon.ico as SVG
fs.writeFileSync(
  path.join(publicDir, 'favicon.svg'),
  createSVGIcon(32)
);

console.log('Icons generated successfully!');