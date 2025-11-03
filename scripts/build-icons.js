const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];
const sourceIcon = 'generated-icon.png';
const outputDir = 'icons';

async function buildIcons() {
  console.log('Building extension icons...');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const size of sizes) {
    const outputFile = path.join(outputDir, `icon-${size}.png`);
    
    await sharp(sourceIcon)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputFile);
    
    console.log(`✓ Created ${outputFile}`);
  }
  
  console.log('All icons generated successfully!');
}

buildIcons().catch(err => {
  console.error('Error building icons:', err);
  process.exit(1);
});
