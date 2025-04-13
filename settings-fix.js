// settings-fix.js - Fixes the settings button functionality
document.addEventListener('DOMContentLoaded', () => {
  // Try to get the settings button
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsSection = document.getElementById('settingsSection');
  const promptSection = document.getElementById('promptSection');
  const responseSection = document.getElementById('responseSection');
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
  
  console.log('Settings fix loaded. Checking elements:');
  console.log('- Settings button:', settingsBtn ? 'Found' : 'Missing');
  console.log('- Settings section:', settingsSection ? 'Found' : 'Missing');
  
  // Add click handler to the settings button if found
  if (settingsBtn && settingsSection) {
    console.log('Adding event handlers to settings buttons');
    
    // Function to show a section
    function showSection(section) {
      // Hide all sections first
      if (promptSection) promptSection.style.display = 'none';
      if (responseSection) responseSection.style.display = 'none';
      if (settingsSection) settingsSection.style.display = 'none';
      
      // Show the requested section
      if (section === 'settings' && settingsSection) {
        settingsSection.style.display = 'block';
      } else if (section === 'prompt' && promptSection) {
        promptSection.style.display = 'block';
      } else if (section === 'response' && responseSection) {
        responseSection.style.display = 'flex';
      }
    }
    
    // Add click event to settings button
    settingsBtn.addEventListener('click', () => {
      console.log('Settings button clicked');
      showSection('settings');
    });
    
    // Add click event to cancel button
    if (cancelSettingsBtn) {
      cancelSettingsBtn.addEventListener('click', () => {
        console.log('Cancel settings button clicked');
        showSection('prompt');
      });
    }
    
    console.log('Settings button handlers added successfully');
  } else {
    console.error('Could not find settings elements to fix');
  }
}); 