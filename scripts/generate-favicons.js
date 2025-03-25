const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { width: 16, height: 16, name: 'favicon-16x16.png' },
  { width: 32, height: 32, name: 'favicon-32x32.png' },
  { width: 180, height: 180, name: 'apple-touch-icon.png' },
  { width: 192, height: 192, name: 'android-chrome-192x192.png' },
  { width: 512, height: 512, name: 'android-chrome-512x512.png' }
];

const sourceFile = path.join(__dirname, '../public/images/logo.svg');
const outputDir = path.join(__dirname, '../public');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate PNG files
async function generatePNGs() {
  for (const size of sizes) {
    await sharp(sourceFile)
      .resize(size.width, size.height)
      .png()
      .toFile(path.join(outputDir, size.name));
    console.log(`Generated ${size.name}`);
  }
}

// Generate ICO file (16x16 and 32x32)
async function generateICO() {
  const icoSizes = [16, 32];
  const icoBuffers = await Promise.all(
    icoSizes.map(size =>
      sharp(sourceFile)
        .resize(size, size)
        .toBuffer()
    )
  );

  // Create ICO file
  const icoPath = path.join(outputDir, 'favicon.ico');
  fs.writeFileSync(icoPath, Buffer.concat(icoBuffers));
  console.log('Generated favicon.ico');
}

// Generate manifest.json
function generateManifest() {
  const manifest = {
    name: 'Capsa Tutoring',
    short_name: 'Capsa',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ],
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone'
  };

  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('Generated manifest.json');
}

// Generate all files
async function generateAll() {
  try {
    await generatePNGs();
    await generateICO();
    generateManifest();
    console.log('All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateAll(); 