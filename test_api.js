// Test script for the JavaScript backend API
const ApiService = require('./api_service');

async function runTest() {
  console.log('Testing API Service...');
  
  // Initialize API service
  const apiService = new ApiService();
  
  // Register event handlers
  apiService.on('output', (message) => {
    console.log(`API output: ${message}`);
  });
  
  apiService.on('error', (error) => {
    console.error(`API error: ${error}`);
  });
  
  try {
    // Get configuration
    const config = await apiService.getConfig();
    console.log('Current configuration:');
    console.log(JSON.stringify(config, null, 2));
    
    // Test API with a sample prompt
    console.log('\nTesting API with sample prompt...');
    const response = await apiService.generateReply(
      'Hello, how are you doing today?',
      'friendly and casual',
      'Friend'
    );
    
    console.log('\nAPI Response:');
    console.log(response);
    
    // Clean exit
    await apiService.exit();
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest(); 