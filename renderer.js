// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  let isInitializing = true;
  let backendStatus = 'unknown'; // 'unknown', 'running', 'error'
  
  const elements = {
    // Sections
    promptSection: document.getElementById('promptSection'),
    responseSection: document.getElementById('responseSection'),
    settingsSection: document.getElementById('settingsSection'),
    
    // Prompt Form
    profileSelect: document.getElementById('profileSelect'),
    conversationText: document.getElementById('conversationText'),
    promptTone: document.getElementById('promptTone'),
    generateBtn: document.getElementById('generateBtn'),
    
    // Response
    responseText: document.getElementById('responseText'),
    editBtn: document.getElementById('editBtn'),
    copyBtn: document.getElementById('copyBtn'),
    
    // Settings Form
    settingsBtn: document.getElementById('settingsBtn'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    defaultProfileSelect: document.getElementById('defaultProfileSelect'),
    autoStartCheckbox: document.getElementById('autoStartCheckbox'),
    cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    
    // Tabs
    tabButtons: document.querySelectorAll('.tab-button'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Notification
    notification: document.getElementById('notification')
  };

  // Add this near the beginning of the file
  let clipboardHistory = [];
  const MAX_CLIPBOARD_HISTORY = 3;
  let selectedClipboardItem = null;

  // Helper Functions
  function showNotification(message, isError = false) {
    elements.notification.textContent = message;
    elements.notification.className = 'notification' + (isError ? ' error' : '');
    
    // Force reflow to trigger transition
    elements.notification.offsetHeight;
    
    elements.notification.classList.add('show');
    
    setTimeout(() => {
      elements.notification.classList.remove('show');
    }, 3000);
  }

  function showSection(section) {
    elements.promptSection.style.display = 'none';
    elements.responseSection.style.display = 'none';
    elements.settingsSection.style.display = 'none';
    
    if (section === 'prompt') {
      elements.promptSection.style.display = 'block';
    } else if (section === 'response') {
      elements.responseSection.style.display = 'flex';
    } else if (section === 'settings') {
      elements.settingsSection.style.display = 'block';
    }
  }

  // Update UI based on backend status
  function updateUIState() {
    const isDisabled = backendStatus !== 'running';
    
    elements.generateBtn.disabled = isDisabled;
    elements.saveSettingsBtn.disabled = isDisabled;
    
    if (isDisabled && !isInitializing) {
      elements.generateBtn.textContent = 'Backend Not Available';
      showNotification('Python backend is not running. Some features may be limited.', true);
    } else {
      elements.generateBtn.textContent = 'Generate Reply';
    }
  }

  // Initialize app
  async function initApp() {
    try {
      isInitializing = true;
      
      // Set up event listeners for Python process
      window.typeAI.onPythonOutput((data) => {
        console.log('Python output:', data);
      });
      
      window.typeAI.onPythonError((data) => {
        console.error('Python error:', data);
        showNotification('Error from Python: ' + data, true);
        backendStatus = 'error';
        updateUIState();
      });
      
      window.typeAI.onPythonCrashed(() => {
        showNotification('Python process crashed. Please restart the application.', true);
        backendStatus = 'error';
        updateUIState();
      });
      
      window.typeAI.onShowPrompt(() => {
        showSection('prompt');
      });
      
      // Setup keyboard shortcut listener for Ctrl+A
      window.typeAI.onGenerateText(() => {
        // Trigger generate button click programmatically without focusing app
        if (!elements.generateBtn.disabled) {
          // We need to invoke the generation logic directly rather than clicking the button
          // to avoid bringing focus to our app
          generateTextSilent();
        }
      });
      
      // Listen for paste-ready event
      window.typeAI.onPasteReady(() => {
        showNotification('Text copied! Press Ctrl+V to paste. Use /tone/ to specify reply tone.', false);
      });
      
      // Quick paste shortcut (Ctrl+Shift+V)
      window.typeAI.onQuickPaste(() => {
        const text = elements.responseText.textContent;
        if (text) {
          // Copy the text to clipboard
          navigator.clipboard.writeText(text)
            .then(() => {
              showNotification('Last response copied! Pro tip: Use /professional/ or /exact/ to specify tone.', false);
            })
            .catch(err => {
              showNotification('Failed to copy: ' + err.message, true);
            });
        } else {
          showNotification('No response to paste. Generate a reply first with /tone/ format.', true);
        }
      });
      
      // Update event handlers to use the new API service
      window.typeAI.onApiOutput((data) => {
        console.log('API output:', data);
      });
      
      window.typeAI.onApiError((data) => {
        console.error('API error:', data);
        showNotification('Error from API: ' + data, true);
        backendStatus = 'error';
        updateUIState();
      });
      
      // Add event listeners to minimize window when text fields are clicked outside the app
      document.addEventListener('click', (event) => {
        // Check if the click was on an input field outside of our app
        const clickedElement = event.target;
        const isTextInput = clickedElement && 
          (clickedElement.tagName === 'INPUT' || 
           clickedElement.tagName === 'TEXTAREA' || 
           clickedElement.isContentEditable);
        
        // If user clicked on a text input outside our app (after our app has focus)
        if (isTextInput && !document.getElementById('appContainer').contains(clickedElement)) {
          // Minimize our window
          window.typeAI.minimizeWindow();
        }
      }, true);  // Use capture phase to detect clicks earlier
      
      // Load config
      try {
        const config = await window.typeAI.getConfig() || {};
        
        // Set form values from config
        if (config.api_key) {
          elements.apiKeyInput.value = config.api_key;
        }
        
        if (config.default_profile) {
          elements.defaultProfileSelect.value = config.default_profile;
          elements.profileSelect.value = config.default_profile;
        }
        
        if (config.auto_start) {
          elements.autoStartCheckbox.checked = config.auto_start;
        }
        
        // Add profile options
        if (config.profiles && Array.isArray(config.profiles)) {
          // Clear existing options
          elements.profileSelect.innerHTML = '';
          elements.defaultProfileSelect.innerHTML = '';
          
          // Add new options
          config.profiles.forEach(profile => {
            const option1 = document.createElement('option');
            option1.value = profile;
            option1.textContent = profile;
            elements.profileSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = profile;
            option2.textContent = profile;
            elements.defaultProfileSelect.appendChild(option2);
          });
          
          // Set selected values
          if (config.default_profile) {
            elements.profileSelect.value = config.default_profile;
            elements.defaultProfileSelect.value = config.default_profile;
          }
        }
        
        // If we got here, the Python backend is probably running
        backendStatus = 'running';
      } catch (error) {
        console.warn('Error getting config, may be running in limited mode:', error);
        backendStatus = 'error';
      }

      // Add this line to your initApp function
      initClipboardHistory();
    } catch (error) {
      console.error('Error initializing app:', error);
      showNotification('Error initializing app: ' + error.message, true);
      backendStatus = 'error';
    } finally {
      isInitializing = false;
      updateUIState();
    }
  }

  // Event Listeners
  elements.generateBtn.addEventListener('click', async () => {
    if (backendStatus !== 'running') {
      showNotification('Backend is not available. Cannot generate reply.', true);
      return;
    }
    
    const profile = elements.profileSelect.value;
    let conversationText = '';
    
    // Get text from selected clipboard item
    if (selectedClipboardItem !== null && clipboardHistory[selectedClipboardItem]) {
      conversationText = clipboardHistory[selectedClipboardItem].text;
    }
    
    const promptTone = elements.promptTone.value;
    
    if (!conversationText) {
      showNotification('Please select a conversation from clipboard history', true);
      return;
    }
    
    if (!promptTone) {
      showNotification('Please enter how you want to reply or use @name to specify recipient', true);
      return;
    }
    
    try {
      // Show loading indicator
      elements.generateBtn.textContent = 'Generating...';
      elements.generateBtn.disabled = true;
      
      // Check for @name tag in the prompt
      const contactName = extractContactName(promptTone) || extractContactName(conversationText);
      
      // Try to get platform from UI if MCP tab exists and no contact name was found
      let platform = '';
      if (!contactName) {
        const mcpPlatformInput = document.getElementById('mcpPlatformInput');
        if (mcpPlatformInput) {
          platform = mcpPlatformInput.value.trim();
        }
      }
      
      // Generate reply with context if platform or contactName is available
      let result;
      if (contactName || platform) {
        result = await generateContextAwareReply(profile, platform, promptTone, conversationText);
      } else {
        // Call API service to generate reply (without context)
        result = await window.typeAI.generateReply({
          profile,
          conversation_text: conversationText,
          prompt_tone: promptTone
        });
      }
      
      if (result.success) {
        const generatedText = result.response;
        
        // Check if a text input field has focus (active cursor)
        const activeElement = document.activeElement;
        const isTextInput = activeElement && 
                          (activeElement.tagName === 'INPUT' || 
                            activeElement.tagName === 'TEXTAREA' || 
                            activeElement.isContentEditable);
        
        if (isTextInput) {
          // Insert at cursor position if possible
          try {
            if (typeof activeElement.setRangeText === 'function') {
              // For input and textarea elements
              const start = activeElement.selectionStart || 0;
              activeElement.setRangeText(generatedText, start, activeElement.selectionEnd || start);
              
              // Move cursor to the end of inserted text
              const newPosition = start + generatedText.length;
              activeElement.setSelectionRange(newPosition, newPosition);
              
              showNotification('Text inserted at cursor position!');
            } else if (activeElement.isContentEditable) {
              // For contentEditable elements
              document.execCommand('insertText', false, generatedText);
              showNotification('Text inserted at cursor position!');
            } else {
              // Fallback to clipboard
              navigator.clipboard.writeText(generatedText)
                .then(() => showNotification('Copied to clipboard!'));
            }
          } catch (err) {
            // Fallback to clipboard
            navigator.clipboard.writeText(generatedText)
              .then(() => showNotification('Copied to clipboard!'))
              .catch(err => showNotification('Failed to copy: ' + err.message, true));
          }
        } else {
          // No active cursor, use clipboard
          navigator.clipboard.writeText(generatedText)
            .then(() => showNotification('Copied to clipboard!'))
            .catch(err => showNotification('Failed to copy: ' + err.message, true));
        }
        
        // Store the generated text in the response element (but don't show it)
        elements.responseText.textContent = generatedText;
      } else {
        showNotification('Failed to generate reply: ' + result.error, true);
      }
    } catch (error) {
      console.error('Error generating reply:', error);
      showNotification('Error generating reply: ' + error.message, true);
    } finally {
      elements.generateBtn.textContent = 'Generate Reply';
      elements.generateBtn.disabled = false;
    }
  });

  elements.editBtn.addEventListener('click', () => {
    showSection('prompt');
  });

  elements.copyBtn.addEventListener('click', () => {
    const text = elements.responseText.textContent;
    
    // Check if a text input field has focus (active cursor)
    const activeElement = document.activeElement;
    const isTextInput = activeElement && 
                       (activeElement.tagName === 'INPUT' || 
                        activeElement.tagName === 'TEXTAREA' || 
                        activeElement.isContentEditable);
    
    if (isTextInput) {
      // Insert at cursor position if possible
      try {
        if (typeof activeElement.setRangeText === 'function') {
          // For input and textarea elements
          const start = activeElement.selectionStart || 0;
          activeElement.setRangeText(text, start, activeElement.selectionEnd || start);
          
          // Move cursor to the end of inserted text
          const newPosition = start + text.length;
          activeElement.setSelectionRange(newPosition, newPosition);
          
          showNotification('Text inserted at cursor position!');
        } else if (activeElement.isContentEditable) {
          // For contentEditable elements
          document.execCommand('insertText', false, text);
          showNotification('Text inserted at cursor position!');
        } else {
          // Fallback to clipboard if direct insertion fails
          navigator.clipboard.writeText(text)
            .then(() => showNotification('Copied to clipboard!'));
        }
      } catch (err) {
        // Fallback to clipboard if insertion fails
        navigator.clipboard.writeText(text)
          .then(() => showNotification('Copied to clipboard!'))
          .catch(err => showNotification('Failed to copy: ' + err.message, true));
      }
    } else {
      // No active cursor, use clipboard
      navigator.clipboard.writeText(text)
        .then(() => showNotification('Copied to clipboard!'))
        .catch(err => showNotification('Failed to copy: ' + err.message, true));
    }
  });

  elements.settingsBtn.addEventListener('click', () => {
    showSection('settings');
  });

  elements.cancelSettingsBtn.addEventListener('click', () => {
    showSection('prompt');
  });

  elements.saveSettingsBtn.addEventListener('click', async () => {
    const config = {
      api_key: elements.apiKeyInput.value,
      default_profile: elements.defaultProfileSelect.value,
      auto_start: elements.autoStartCheckbox.checked
    };
    
    try {
      await window.typeAI.saveConfig(config);
      showNotification('Settings saved successfully!');
      showSection('prompt');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('Error saving settings: ' + error.message, true);
    }
  });

  // Tab navigation
  elements.tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Set active tab button
      elements.tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show active tab content
      const tabName = button.getAttribute('data-tab');
      elements.tabContents.forEach(content => {
        if (content.id === tabName + 'Tab') {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      });
    });
  });

  // Function to generate text without showing UI or focusing app
  async function generateTextSilent() {
    if (backendStatus !== 'running') {
      showNotification('Backend is not available. Cannot generate reply.', true);
      return;
    }
    
    const profile = elements.profileSelect.value;
    let conversationText = '';
    let promptTone = elements.promptTone.value;
    let inputFieldText = ''; // Store text from the input field
    
    // Get text from selected clipboard item
    if (selectedClipboardItem !== null && clipboardHistory[selectedClipboardItem]) {
      conversationText = clipboardHistory[selectedClipboardItem].text;
    }
    
    // Check if there's an active text field with a prompt in it
    const activeElement = document.activeElement;
    const isTextInput = activeElement && 
                       (activeElement.tagName === 'INPUT' || 
                        activeElement.tagName === 'TEXTAREA' || 
                        activeElement.isContentEditable);
    
    // Only try to extract prompt if the active element is not within our app
    const isOutsideApp = !document.getElementById('appContainer').contains(activeElement);
    
    if (isTextInput && isOutsideApp) {
      try {
        let inputText = '';
        
        // Get text from the active input
        if (activeElement.isContentEditable) {
          inputText = activeElement.textContent || '';
        } else {
          inputText = activeElement.value || '';
        }
        
        // Check if there's an active text field and it has content
        if (activeElement) {
          const originalContent = inputText;
          
          if (originalContent) {
            // Check if the content has tone markers
            const toneMatch = originalContent.match(/\/([^\/]+)\//);
            
            if (toneMatch) {
              promptTone = toneMatch[1];
              
              // Remove the tone markers from the content
              const cleanedContent = originalContent.replace(/\/([^\/]+)\//, '').trim();
              inputFieldText = cleanedContent;
              
              // Update the active element with the cleaned content
              if (activeElement.value !== undefined) {
                activeElement.value = cleanedContent;
              } else if (activeElement.textContent !== undefined) {
                activeElement.textContent = cleanedContent;
              }
            } else {
              inputFieldText = originalContent;
            }
          }
        }
      } catch (err) {
        console.error('Error extracting tone from input:', err);
      }
    }
    
    if (!conversationText) {
      showNotification('Please select a conversation from clipboard history', true);
      return;
    }
    
    if (!promptTone) {
      showNotification('No tone specified. Use /tone/ format like /professional/ or /exact/ to specify reply tone.', true);
      return;
    }
    
    try {
      // Store reference to the active element
      const currentActiveElement = activeElement;
      
      // If tone is 'exact', use the inputFieldText as the conversationText
      if (promptTone.toLowerCase() === 'exact' && inputFieldText) {
        conversationText = inputFieldText;
      }
      
      // Try to get platform from UI if MCP tab exists
      let platform = '';
      const mcpPlatformInput = document.getElementById('mcpPlatformInput');
      if (mcpPlatformInput) {
        platform = mcpPlatformInput.value.trim();
      }
      
      // Generate reply with context if platform is available
      let result;
      if (platform) {
        result = await generateContextAwareReply(profile, platform, promptTone, conversationText);
      } else {
        // Send the request to the Python backend
        result = await window.typeAI.generateReply({
          profile,
          conversation_text: conversationText,
          prompt_tone: promptTone
        });
      }
      
      if (result.success) {
        const generatedText = result.response;
        
        // Store the generated text in the response element
        elements.responseText.textContent = generatedText;
        
        try {
          // Copy the text to clipboard
          await navigator.clipboard.writeText(generatedText);
          
          // Attempt to trigger a system paste (this will send a paste-ready notification)
          window.typeAI.simulatePaste();
        } catch (err) {
          console.error('Error with clipboard operation:', err);
          showNotification('Text copied. Press Ctrl+V to paste!', false);
        }
      } else {
        showNotification('Failed to generate reply: ' + result.error, true);
      }
    } catch (error) {
      console.error('Error generating reply:', error);
      showNotification('Error generating reply: ' + error.message, true);
    }
  }

  // Function to extract @name tag for contact-based context
  function extractContactName(text) {
    if (!text) return null;
    
    // Look for @name pattern in the text
    const match = text.match(/@([a-zA-Z0-9_]+)/);
    if (match && match[0]) {
      return match[0]; // Return the full @name tag
    }
    
    return null;
  }

  // New function to generate context-aware replies
  async function generateContextAwareReply(profile, platform, promptTone, clipboardText) {
    try {
      // Check if MCP client is available
      let hasMcpContext = false;
      
      try {
        // Check if there's a contact name in the prompt tone or clipboard text
        const contactName = extractContactName(promptTone) || extractContactName(clipboardText);
        
        // If contact name is found, use that instead of profile/platform
        if (contactName) {
          // Try to get conversation history for this contact
          const conversationHistory = await window.typeAI.mcpGetFormattedHistory({
            profile: contactName,
            maxMessages: 5  // Get the last 5 messages
          });
          
          // If we have conversation history, add the new message as context
          if (conversationHistory) {
            hasMcpContext = true;
            
            // Remove the @name tag from the clipboardText if it exists
            const cleanedClipboardText = clipboardText.replace(/@[a-zA-Z0-9_]+/g, '').trim();
            
            // Add the current clipboard text as a new message to the context
            await window.typeAI.mcpAddChat({
              profile: contactName,
              message: cleanedClipboardText || clipboardText,
              from: 'Them'  // Assume the clipboard content is from the other person
            });
            
            // Get updated conversation history with the new message
            const updatedHistory = await window.typeAI.mcpGetFormattedHistory({
              profile: contactName,
              maxMessages: 6  // Include the message we just added
            });
            
            // Generate reply with enhanced context
            const result = await window.typeAI.generateReply({
              profile: profile, // Still use the selected profile for generation style
              conversation_text: updatedHistory || clipboardText,
              prompt_tone: promptTone.replace(/@[a-zA-Z0-9_]+/g, '').trim() || promptTone // Remove @name from tone
            });
            
            // If reply was generated successfully, add it to the context
            if (result.success) {
              await window.typeAI.mcpAddChat({
                profile: contactName,
                message: result.response,
                from: 'Me'
              });
            }
            
            return result;
          }
        }
        // If no contact name, fall back to profile/platform
        else if (platform) {
          // Try to get conversation history for profile/platform
          const conversationHistory = await window.typeAI.mcpGetFormattedHistory({
            profile,
            platform,
            maxMessages: 5  // Get the last 5 messages
          });
          
          // If we have conversation history, add the new message as context
          if (conversationHistory) {
            hasMcpContext = true;
            
            // Add the current clipboard text as a new message to the context
            await window.typeAI.mcpAddChat({
              profile,
              platform,
              message: clipboardText,
              from: 'Them'  // Assume the clipboard content is from the other person
            });
            
            // Get updated conversation history with the new message
            const updatedHistory = await window.typeAI.mcpGetFormattedHistory({
              profile,
              platform,
              maxMessages: 6  // Include the message we just added
            });
            
            // Generate reply with enhanced context
            const result = await window.typeAI.generateReply({
              profile,
              conversation_text: updatedHistory || clipboardText,
              prompt_tone: promptTone
            });
            
            // If reply was generated successfully, add it to the context
            if (result.success) {
              await window.typeAI.mcpAddChat({
                profile,
                platform,
                message: result.response,
                from: 'Me'
              });
            }
            
            return result;
          }
        }
      } catch (err) {
        console.error('Error accessing MCP context:', err);
        // Fall back to regular generation if MCP fails
      }
      
      // If no MCP context or it failed, use the regular generate method
      if (!hasMcpContext) {
        return await window.typeAI.generateReply({
          profile,
          conversation_text: clipboardText,
          prompt_tone: promptTone
        });
      }
    } catch (error) {
      console.error('Error generating context-aware reply:', error);
      throw error;
    }
  }

  // Add this to the existing generateReply function
  function generateReply() {
    // Get the selected clipboard text
    let conversationText = '';
    if (selectedClipboardItem !== null && clipboardHistory[selectedClipboardItem]) {
      conversationText = clipboardHistory[selectedClipboardItem].text;
    }
    
    if (!conversationText) {
      showNotification('Please select a conversation from clipboard history.', true);
      return;
    }
    
    // Rest of your existing generateReply code
    // ...
  }

  // Add this to the existing generateReply function
  function initClipboardHistory() {
    const clipboardHistoryList = document.getElementById('clipboardHistoryList');
    const refreshClipboardBtn = document.getElementById('refreshClipboard');
    
    // Load any saved clipboard history from storage
    const savedHistory = localStorage.getItem('clipboardHistory');
    if (savedHistory) {
      try {
        clipboardHistory = JSON.parse(savedHistory);
        renderClipboardHistory();
      } catch (error) {
        console.error('Error loading clipboard history:', error);
        clipboardHistory = [];
      }
    }
    
    refreshClipboardBtn.addEventListener('click', async () => {
      try {
        // Read from clipboard
        const text = await navigator.clipboard.readText();
        
        // Don't add if empty or already exists as the most recent item
        if (!text || (clipboardHistory.length > 0 && clipboardHistory[0].text === text)) {
          return;
        }
        
        // Add to history
        const timestamp = new Date();
        clipboardHistory.unshift({
          text,
          timestamp
        });
        
        // Keep only the most recent items
        if (clipboardHistory.length > MAX_CLIPBOARD_HISTORY) {
          clipboardHistory = clipboardHistory.slice(0, MAX_CLIPBOARD_HISTORY);
        }
        
        // Save to storage
        localStorage.setItem('clipboardHistory', JSON.stringify(clipboardHistory));
        
        // Update the UI
        renderClipboardHistory();
        
        // Auto-select the newest item
        selectClipboardItem(0);
        
      } catch (error) {
        console.error('Failed to read clipboard:', error);
        showNotification('Failed to access clipboard. Please check permissions.', true);
      }
    });
    
    // Initial render
    renderClipboardHistory();
  }

  function renderClipboardHistory() {
    const clipboardHistoryList = document.getElementById('clipboardHistoryList');
    
    // Clear current list
    clipboardHistoryList.innerHTML = '';
    
    if (clipboardHistory.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-history-message';
      emptyMessage.textContent = 'No clipboard history available. Copy some text and click refresh.';
      clipboardHistoryList.appendChild(emptyMessage);
      return;
    }
    
    // Add each item
    clipboardHistory.forEach((item, index) => {
      const clipboardItem = document.createElement('div');
      clipboardItem.className = 'clipboard-item';
      if (selectedClipboardItem === index) {
        clipboardItem.classList.add('selected');
      }
      
      const content = document.createElement('div');
      content.className = 'clipboard-content';
      
      // Fixed truncation length for all items to ensure consistent display
      const maxLength = 40;
      
      // Truncate text to first line without adding ellipsis
      const firstLine = item.text.split('\n')[0].trim();
      const truncatedText = firstLine.length > maxLength ? firstLine.substring(0, maxLength) : firstLine;
      content.textContent = truncatedText;
      
      const timestamp = document.createElement('div');
      timestamp.className = 'clipboard-timestamp';
      timestamp.textContent = '';
      
      clipboardItem.appendChild(content);
      clipboardItem.appendChild(timestamp);
      
      // Add click handler
      clipboardItem.addEventListener('click', () => {
        selectClipboardItem(index);
      });
      
      clipboardHistoryList.appendChild(clipboardItem);
    });
  }

  function selectClipboardItem(index) {
    selectedClipboardItem = index;
    renderClipboardHistory();
  }

  function formatTimestamp(timestamp) {
    // Always return empty string
    return '';
  }

  // Initialize app
  initApp();
}); 