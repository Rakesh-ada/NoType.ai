// mcp_server.js - Lightweight MCP (Message Context Protocol) Server
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const PORT = process.env.MCP_PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data', 'mcp_data.json');
const MAX_MESSAGES_PER_CHAT = 50; // Limit number of messages to prevent memory bloat

class MCPServer {
  constructor() {
    this.app = express();
    this.contexts = {};
    this.isRunning = false;
    this.server = null;
    
    // Load data from file if exists
    this.loadData();
    
    // Configure middleware
    this.app.use(express.json());
    
    // Set up routes
    this.setupRoutes();
  }
  
  // Set up API routes
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', contacts: Object.keys(this.contexts) });
    });
    
    // Add new chat message
    this.app.post('/add-chat', (req, res) => {
      try {
        // Accept both profile/platform and contactName parameters
        const { profile, platform, message, from, contactName } = req.body;
        
        // If contactName is provided (starting with @), use that
        // Otherwise fall back to profile/platform combination
        if (contactName && contactName.startsWith('@')) {
          if (!message) {
            return res.status(400).json({ error: 'Missing required fields' });
          }
          
          const chatId = this.addContactMessage(contactName, message, from || 'Them');
          
          res.json({ 
            success: true, 
            chatId,
            messageCount: this.getContactMessageCount(contactName)
          });
        } else {
          // Legacy profile/platform approach
          if (!profile || !platform || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
          }
          
          const chatId = this.addChatMessage(profile, platform, message, from || 'Them');
          
          res.json({ 
            success: true, 
            chatId,
            messageCount: this.getMessageCount(profile, platform)
          });
        }
      } catch (error) {
        console.error('Error adding chat:', error);
        res.status(500).json({ error: 'Failed to add chat message' });
      }
    });
    
    // Get context for specific contact or profile/platform
    this.app.post('/get-context', (req, res) => {
      try {
        const { profile, platform, contactName } = req.body;
        
        // If contactName is provided (starting with @), use that
        if (contactName && contactName.startsWith('@')) {
          const context = this.getContactContext(contactName);
          
          res.json({ 
            success: true, 
            context
          });
        } else {
          // Legacy profile/platform approach
          if (!profile || !platform) {
            return res.status(400).json({ error: 'Missing profile or platform' });
          }
          
          const context = this.getContext(profile, platform);
          
          res.json({ 
            success: true, 
            context
          });
        }
      } catch (error) {
        console.error('Error getting context:', error);
        res.status(500).json({ error: 'Failed to get context' });
      }
    });
    
    // Reset context for contact or profile/platform
    this.app.post('/reset-context', (req, res) => {
      try {
        const { profile, platform, contactName } = req.body;
        
        // If contactName is provided (starting with @), use that
        if (contactName && contactName.startsWith('@')) {
          this.resetContactContext(contactName);
          
          res.json({ 
            success: true, 
            message: `Context reset for ${contactName}`
          });
        } else {
          // Legacy profile/platform approach
          if (!profile) {
            return res.status(400).json({ error: 'Missing profile' });
          }
          
          this.resetContext(profile, platform);
          
          res.json({ 
            success: true, 
            message: platform ? 
              `Context reset for ${profile}/${platform}` : 
              `All contexts reset for ${profile}`
          });
        }
      } catch (error) {
        console.error('Error resetting context:', error);
        res.status(500).json({ error: 'Failed to reset context' });
      }
    });
    
    // Export context for contact or profile/platform
    this.app.post('/export-context', (req, res) => {
      try {
        const { profile, platform, format, contactName } = req.body;
        
        let context;
        
        // If contactName is provided (starting with @), use that
        if (contactName && contactName.startsWith('@')) {
          context = this.getContactContext(contactName);
        } else {
          // Legacy profile/platform approach
          if (!profile || !platform) {
            return res.status(400).json({ error: 'Missing profile or platform' });
          }
          
          context = this.getContext(profile, platform);
        }
        
        if (!context || !context.messages || context.messages.length === 0) {
          return res.status(404).json({ error: 'No context found' });
        }
        
        if (format === 'txt') {
          // Format as plain text
          let textContent = contactName ? 
            `Chat History - ${contactName}\n` : 
            `Chat History - ${profile}/${platform}\n`;
          textContent += `Generated: ${new Date().toISOString()}\n\n`;
          
          context.messages.forEach(msg => {
            textContent += `[${msg.from}]: ${msg.text}\n`;
          });
          
          res.setHeader('Content-Type', 'text/plain');
          const filename = contactName ? 
            `${contactName.substring(1)}_chat.txt` : 
            `${profile}_${platform}_chat.txt`;
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          return res.send(textContent);
        } else {
          // Default to JSON
          res.setHeader('Content-Type', 'application/json');
          const filename = contactName ? 
            `${contactName.substring(1)}_chat.json` : 
            `${profile}_${platform}_chat.json`;
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          return res.json(context);
        }
      } catch (error) {
        console.error('Error exporting context:', error);
        res.status(500).json({ error: 'Failed to export context' });
      }
    });
    
    // List all available contexts (both contacts and profile/platform)
    this.app.get('/list-contexts', (req, res) => {
      try {
        const contextList = [];
        
        // Iterate through profiles and platforms (legacy format)
        for (const profile in this.contexts) {
          // Skip contact entries (those starting with @)
          if (profile.startsWith('@')) continue;
          
          for (const platform in this.contexts[profile]) {
            const messageCount = this.contexts[profile][platform].messages.length;
            const chatId = this.contexts[profile][platform].chatId;
            
            contextList.push({
              profile,
              platform,
              messageCount,
              chatId,
              lastUpdated: this.contexts[profile][platform].lastUpdated || null
            });
          }
        }
        
        // Add contact-based contexts
        for (const contactName in this.contexts) {
          if (contactName.startsWith('@')) {
            const messageCount = this.contexts[contactName].messages.length;
            const chatId = this.contexts[contactName].chatId;
            
            contextList.push({
              contactName,
              messageCount,
              chatId,
              lastUpdated: this.contexts[contactName].lastUpdated || null
            });
          }
        }
        
        res.json({ 
          success: true, 
          contexts: contextList
        });
      } catch (error) {
        console.error('Error listing contexts:', error);
        res.status(500).json({ error: 'Failed to list contexts' });
      }
    });
  }
  
  // Add message to a contact-based chat
  addContactMessage(contactName, message, from = 'Them') {
    if (!this.contexts[contactName]) {
      // Initialize new contact chat
      this.contexts[contactName] = {
        chatId: this.generateChatId(),
        messages: [],
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Add message
    this.contexts[contactName].messages.push({
      from,
      text: message,
      timestamp: new Date().toISOString()
    });
    
    // Trim if over the limit
    if (this.contexts[contactName].messages.length > MAX_MESSAGES_PER_CHAT) {
      this.contexts[contactName].messages = this.contexts[contactName].messages.slice(-MAX_MESSAGES_PER_CHAT);
    }
    
    // Update timestamp
    this.contexts[contactName].lastUpdated = new Date().toISOString();
    
    // Save to disk
    this.saveData();
    
    return this.contexts[contactName].chatId;
  }
  
  // Get message count for contact-based chat
  getContactMessageCount(contactName) {
    if (!this.contexts[contactName]) {
      return 0;
    }
    
    return this.contexts[contactName].messages.length;
  }
  
  // Get full context for contact-based chat
  getContactContext(contactName) {
    if (!this.contexts[contactName]) {
      // Return empty context
      return {
        contactName,
        chatId: this.generateChatId(),
        messages: [],
        lastUpdated: new Date().toISOString()
      };
    }
    
    return {
      contactName,
      chatId: this.contexts[contactName].chatId,
      messages: this.contexts[contactName].messages,
      lastUpdated: this.contexts[contactName].lastUpdated
    };
  }
  
  // Reset context for contact-based chat
  resetContactContext(contactName) {
    if (this.contexts[contactName]) {
      // Keep the chatId but reset messages
      this.contexts[contactName].messages = [];
      this.contexts[contactName].lastUpdated = new Date().toISOString();
      
      // Save to disk
      this.saveData();
    }
  }
  
  // Original methods (kept for backward compatibility)
  // Add message to a profile/platform chat
  addChatMessage(profile, platform, message, from = 'Them') {
    // Create profile if it doesn't exist
    if (!this.contexts[profile]) {
      this.contexts[profile] = {};
    }
    
    // Create platform if it doesn't exist
    if (!this.contexts[profile][platform]) {
      this.contexts[profile][platform] = {
        chatId: this.generateChatId(),
        messages: [],
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Add message
    this.contexts[profile][platform].messages.push({
      from,
      text: message,
      timestamp: new Date().toISOString()
    });
    
    // Trim if over the limit
    if (this.contexts[profile][platform].messages.length > MAX_MESSAGES_PER_CHAT) {
      this.contexts[profile][platform].messages = this.contexts[profile][platform].messages.slice(-MAX_MESSAGES_PER_CHAT);
    }
    
    // Update timestamp
    this.contexts[profile][platform].lastUpdated = new Date().toISOString();
    
    // Save to disk
    this.saveData();
    
    return this.contexts[profile][platform].chatId;
  }
  
  // Get message count for a specific profile/platform
  getMessageCount(profile, platform) {
    if (!this.contexts[profile] || !this.contexts[profile][platform]) {
      return 0;
    }
    
    return this.contexts[profile][platform].messages.length;
  }
  
  // Get context for specific profile and platform
  getContext(profile, platform) {
    if (!this.contexts[profile] || !this.contexts[profile][platform]) {
      return { 
        profile, 
        platform, 
        chatId: this.generateChatId(profile, platform),
        messages: [] 
      };
    }
    
    return {
      profile,
      platform,
      chatId: this.contexts[profile][platform].chatId,
      messages: this.contexts[profile][platform].messages,
      lastUpdated: this.contexts[profile][platform].lastUpdated
    };
  }
  
  // Reset context for profile/platform
  resetContext(profile, platform) {
    if (!this.contexts[profile]) {
      return;
    }
    
    if (platform) {
      // Reset specific platform
      if (this.contexts[profile][platform]) {
        this.contexts[profile][platform] = {
          chatId: this.generateChatId(profile, platform),
          messages: [],
          lastUpdated: new Date().toISOString()
        };
      }
    } else {
      // Reset all platforms for profile
      this.contexts[profile] = {};
    }
    
    // Save data to file
    this.saveData();
  }
  
  // Generate unique chat ID
  generateChatId(profile, platform) {
    const seed = `${profile}-${platform}-${Date.now()}`;
    return crypto.createHash('md5').update(seed).digest('hex').substring(0, 10);
  }
  
  // Save data to file
  saveData() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.contexts, null, 2));
    } catch (error) {
      console.error('Error saving MCP data:', error);
    }
  }
  
  // Load data from file
  loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        this.contexts = JSON.parse(data);
        console.log(`Loaded MCP data with ${Object.keys(this.contexts).length} profiles`);
      } else {
        this.contexts = {};
      }
    } catch (error) {
      console.error('Error loading MCP data:', error);
      this.contexts = {};
    }
  }
  
  // Start the server
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(PORT, () => {
          this.isRunning = true;
          console.log(`MCP Server running on port ${PORT}`);
          resolve(PORT);
        });
      } catch (error) {
        console.error('Failed to start MCP server:', error);
        reject(error);
      }
    });
  }
  
  // Stop the server
  stop() {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        return resolve(false);
      }
      
      this.server.close((err) => {
        if (err) {
          console.error('Error closing MCP server:', err);
          return reject(err);
        }
        
        this.isRunning = false;
        console.log('MCP Server stopped');
        resolve(true);
      });
    });
  }
}

// Export server class
module.exports = MCPServer;

// If this file is run directly, start the server
if (require.main === module) {
  const server = new MCPServer();
  server.start()
    .then(() => console.log('MCP Server started successfully'))
    .catch(err => console.error('Failed to start MCP server:', err));
} 