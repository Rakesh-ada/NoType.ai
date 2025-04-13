// Script to run the app with the mock backend
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Temporarily rename the NoType.ai directory if it exists
const apiDir = path.join(__dirname, 'NoType.ai');
const tempDir = path.join(__dirname, 'NoType.ai.bak');

if (fs.existsSync(apiDir)) {
  try {
    // Rename only if not already renamed
    if (!fs.existsSync(tempDir)) {
      fs.renameSync(apiDir, tempDir);
      console.log('Temporarily renamed NoType.ai directory');
    }
  } catch (err) {
    console.error('Failed to rename directory:', err);
  }
}

console.log('Starting application with mock backend...');

// Start the app with environment variable to use mock backend
const electron = spawn('npm', ['start'], { 
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    USE_MOCK_BACKEND: 'true'
  }
});

// Handle exit
electron.on('exit', (code) => {
  console.log(`Electron process exited with code ${code}`);
  
  // Restore the original directory
  if (fs.existsSync(tempDir)) {
    try {
      // Make sure the temporary directory doesn't exist anymore
      if (fs.existsSync(apiDir)) {
        fs.rmSync(apiDir, { recursive: true, force: true });
      }
      fs.renameSync(tempDir, apiDir);
      console.log('Restored NoType.ai directory');
    } catch (err) {
      console.error('Failed to restore directory:', err);
    }
  }
  
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('Received SIGINT, cleaning up...');
  electron.kill();
}); 