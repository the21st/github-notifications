const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = 'dist';
const outputZip = path.join(distDir, 'github-pr-monitor.zip');

const filesToPackage = [
  'manifest.json',
  'background.js',
  'content.js',
  'icons/icon-16.png',
  'icons/icon-48.png',
  'icons/icon-128.png'
];

console.log('Packaging extension...');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create zip using standard zip command
try {
  // Remove old zip if it exists
  if (fs.existsSync(outputZip)) {
    fs.unlinkSync(outputZip);
  }
  
  // Create zip with all required files
  execSync(`zip -r ${outputZip} ${filesToPackage.join(' ')}`, {
    stdio: 'inherit'
  });
  
  console.log(`✓ Extension packaged successfully: ${outputZip}`);
  
  const stats = fs.statSync(outputZip);
  console.log(`  Package size: ${(stats.size / 1024).toFixed(2)} KB`);
} catch (err) {
  console.error('Error packaging extension:', err);
  process.exit(1);
}
