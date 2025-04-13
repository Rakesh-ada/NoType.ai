// JavaScript backend service to replace the Python implementation
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

// Remove unused constants

// Add function to safely get file paths
function getSafePath(filename) {
  try {
    // Create app directory if it doesn't exist
    const appDir = path.join(__dirname, 'data');
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }
    return path.join(appDir, filename);
  } catch (error) {
    console.error(`Error creating path for ${filename}:`, error);
    // Fallback to using the app directory directly
    return path.join(__dirname, filename);
  }
}

const DEFAULT_PROFILES = ["Office", "Friend", "Partner", "Family"];
const DEFAULT_TONES = ["Professional and concise", "Friendly and casual", "Funny and sarcastic", "Apologetic and romantic", "Exact text (no modifications)"];
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const MAX_HISTORY = 3; // Changed from 5 to 3 to match renderer.js

class ApiService extends EventEmitter {
  constructor() {
    super();
    this.config = this.loadConfig();
    this.history = this.loadHistory();
    this.clipboardText = "";
    this.currentProfile = this.config.default_profile || "Office";
  }

  loadConfig() {
    try {
      const configPath = getSafePath('config.json');
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    
    // Return default config if file doesn't exist or fails to load
    return {
      api_key: "",
      default_profile: "Office",
      profiles: DEFAULT_PROFILES,
      tones: DEFAULT_TONES,
      auto_start: false,
      max_history: MAX_HISTORY // Updated default to 3
    };
  }

  saveConfig() {
    try {
      const configPath = getSafePath('config.json');
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }

  loadHistory() {
    try {
      const historyPath = getSafePath('history.json');
      if (fs.existsSync(historyPath)) {
        const historyData = fs.readFileSync(historyPath, 'utf8');
        return JSON.parse(historyData);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
    
    // Return empty history if file doesn't exist or fails to load
    return {
      clipboard_history: [],
      prompt_history: [],
      response_history: []
    };
  }

  saveHistory() {
    try {
      const historyPath = getSafePath('history.json');
      fs.writeFileSync(historyPath, JSON.stringify(this.history, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving history:', error);
      return false;
    }
  }

  addToHistory(clipboardText, prompt, response) {
    const timestamp = new Date().toISOString();
    
    // Add to clipboard history
    this.history.clipboard_history.unshift({
      text: clipboardText,
      timestamp: timestamp
    });
    
    // Add to prompt history
    this.history.prompt_history.unshift({
      text: prompt,
      profile: this.currentProfile,
      timestamp: timestamp
    });
    
    // Add to response history
    this.history.response_history.unshift({
      text: response,
      prompt: prompt,
      profile: this.currentProfile,
      timestamp: timestamp
    });
    
    // Trim histories to max_history
    const maxHistory = this.config.max_history || MAX_HISTORY;
    this.history.clipboard_history = this.history.clipboard_history.slice(0, maxHistory);
    this.history.prompt_history = this.history.prompt_history.slice(0, maxHistory);
    this.history.response_history = this.history.response_history.slice(0, maxHistory);
    
    this.saveHistory();
  }

  async generateReply(conversationText, promptTone, userProfile) {
    // Check if the promptTone is for exact text
    if (promptTone.toLowerCase() === 'exact') {
      // Return the cleaned content without AI processing
      return conversationText;
    }
    
    const prompt = `You are an AI that helps generate high-quality, human-like reply messages based on conversation history and a specified tone or intent.

Here is the copied conversation:
"""
${conversationText}
"""

Here is the user's intent or tone:
"""
${promptTone}
"""

Here is the user's current profile type:
"""
${userProfile}
"""

Instructions:
- Write a reply that matches the conversation context, user's intent/tone, and profile type.
- Keep it natural, short and context-aware.
- Maintain language consistency — if the original text is in Hindi, reply in Hindi.
- Do not add "AI" mentions or meta-notes.
- Only return the raw reply message — no headers or descriptions.`;

    try {
      const apiKey = this.config.api_key;
      if (!apiKey) {
        return "Error: No API key provided. Please set your API key in the settings.";
      }

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${apiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }]
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data && response.data.candidates && response.data.candidates.length > 0) {
        return response.data.candidates[0].content.parts[0].text.trim();
      } else if (response.data && response.data.error) {
        return `Error: ${response.data.error.message || 'Unknown API error'}`;
      } else {
        return "Error: Unexpected API response format";
      }
    } catch (error) {
      console.error('Error generating reply:', error);
      return `Error: ${error.message || 'Unknown error'}`;
    }
  }

  // API functions to be called from main process
  async getConfig() {
    return this.config;
  }

  async saveConfigUpdate(newConfig) {
    this.config = { ...this.config, ...newConfig };
    return this.saveConfig();
  }

  async generateReplyApi(conversationText, promptTone, userProfile) {
    this.currentProfile = userProfile;
    const response = await this.generateReply(conversationText, promptTone, userProfile);
    this.addToHistory(conversationText, promptTone, response);
    return response;
  }

  async exit() {
    // Clean up and close the API service
    try {
      // Save any pending changes
      this.saveConfig();
      this.saveHistory();
      
      // Emit an event to indicate shutdown
      this.emit('output', 'API service is shutting down');
      
      return true;
    } catch (error) {
      console.error('Error during API service shutdown:', error);
      return false;
    }
  }
}

module.exports = ApiService; 