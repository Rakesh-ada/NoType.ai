// Simple installation helper script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Checking and installing Node.js dependencies...');

try {
  // Check if node_modules exists
  if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log('Installing Node.js dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('Node.js dependencies installed successfully.');
  } else {
    console.log('Node.js dependencies already installed.');
  }
  
  // Check for Python dependencies
  console.log('\nMake sure Python dependencies are installed:');
  console.log('pip install -r NoType.ai/requirements.txt');
  
  console.log('\nDependencies check completed. You can now run the app with:');
  console.log('npm start');
} catch (error) {
  console.error('Error installing dependencies:', error.message);
  process.exit(1);
} 