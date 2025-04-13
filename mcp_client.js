// mcp_client.js - Client interface for MCP server
const axios = require('axios');

class MCPClient {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.isConnected = false;
  }
  
  /**
   * Check if MCP server is running
   * @returns {Promise<boolean>} True if server is running
   */
  async checkConnection() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 1000 });
      this.isConnected = response.data && response.data.status === 'ok';
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }
  
  /**
   * Add a chat message to context
   * @param {string} profile - User profile name (e.g., 'Office', 'Friend') - can also be @name for contact
   * @param {string} platform - Platform name (e.g., 'WhatsApp', 'LinkedIn')
   * @param {string} message - Message text
   * @param {string} from - Sender ('Me' or 'Them')
   * @returns {Promise<Object>} Result with chatId and messageCount
   */
  async addChatMessage(profile, platform, message, from = 'Them') {
    try {
      // Check if profile is actually a contact name (starts with @)
      if (profile && profile.startsWith('@')) {
        const response = await axios.post(`${this.baseUrl}/add-chat`, {
          contactName: profile,
          message,
          from
        });
        
        return response.data;
      } else {
        // Regular profile/platform approach
        const response = await axios.post(`${this.baseUrl}/add-chat`, {
          profile,
          platform,
          message,
          from
        });
        
        return response.data;
      }
    } catch (error) {
      console.error('Error adding chat message:', error.message);
      throw new Error('Failed to add chat message');
    }
  }
  
  /**
   * Get chat context for a specific profile and platform or contact
   * @param {string} profile - User profile name or @name for contact
   * @param {string} platform - Platform name (not used for @name contacts)
   * @returns {Promise<Object>} Chat context with messages
   */
  async getContext(profile, platform) {
    try {
      // Check if profile is actually a contact name (starts with @)
      if (profile && profile.startsWith('@')) {
        const response = await axios.post(`${this.baseUrl}/get-context`, {
          contactName: profile
        });
        
        return response.data.context;
      } else {
        const response = await axios.post(`${this.baseUrl}/get-context`, {
          profile,
          platform
        });
        
        return response.data.context;
      }
    } catch (error) {
      console.error('Error getting context:', error.message);
      throw new Error('Failed to get chat context');
    }
  }
  
  /**
   * Reset context for a profile/platform or contact
   * @param {string} profile - User profile name or @name for contact
   * @param {string} platform - Optional platform name (not used for @name contacts)
   * @returns {Promise<Object>} Success status
   */
  async resetContext(profile, platform = null) {
    try {
      // Check if profile is actually a contact name (starts with @)
      if (profile && profile.startsWith('@')) {
        const response = await axios.post(`${this.baseUrl}/reset-context`, {
          contactName: profile
        });
        
        return response.data;
      } else {
        const response = await axios.post(`${this.baseUrl}/reset-context`, {
          profile,
          platform
        });
        
        return response.data;
      }
    } catch (error) {
      console.error('Error resetting context:', error.message);
      throw new Error('Failed to reset context');
    }
  }
  
  /**
   * Export context as text or JSON
   * @param {string} profile - User profile name or @name for contact
   * @param {string} platform - Platform name (not used for @name contacts)
   * @param {string} format - 'json' or 'txt'
   * @returns {Promise<Object|string>} Exported context
   */
  async exportContext(profile, platform, format = 'json') {
    try {
      // Check if profile is actually a contact name (starts with @)
      if (profile && profile.startsWith('@')) {
        const response = await axios.post(`${this.baseUrl}/export-context`, {
          contactName: profile,
          format
        }, {
          responseType: format === 'txt' ? 'text' : 'json'
        });
        
        return response.data;
      } else {
        const response = await axios.post(`${this.baseUrl}/export-context`, {
          profile,
          platform,
          format
        }, {
          responseType: format === 'txt' ? 'text' : 'json'
        });
        
        return response.data;
      }
    } catch (error) {
      console.error('Error exporting context:', error.message);
      throw new Error('Failed to export context');
    }
  }
  
  /**
   * List all available contexts
   * @returns {Promise<Array>} List of all contexts (including contact-based ones)
   */
  async listContexts() {
    try {
      const response = await axios.get(`${this.baseUrl}/list-contexts`);
      return response.data.contexts;
    } catch (error) {
      console.error('Error listing contexts:', error.message);
      throw new Error('Failed to list contexts');
    }
  }
  
  /**
   * Get formatted chat history for LLM context
   * @param {string} profile - User profile name or @name for contact
   * @param {string} platform - Platform name (not used for @name contacts)
   * @param {number} maxMessages - Maximum number of messages to include
   * @returns {Promise<string>} Formatted chat history
   */
  async getFormattedChatHistory(profile, platform, maxMessages = 10) {
    try {
      let context;
      
      // Check if profile is actually a contact name (starts with @)
      if (profile && profile.startsWith('@')) {
        context = await this.getContext(profile);
      } else {
        context = await this.getContext(profile, platform);
      }
      
      if (!context || !context.messages || context.messages.length === 0) {
        return '';
      }
      
      // Get the most recent messages up to maxMessages
      const recentMessages = context.messages.slice(-maxMessages);
      
      // Format the messages for LLM context
      let formattedHistory = '';
      
      // Add header based on whether it's a contact or profile/platform
      if (profile && profile.startsWith('@')) {
        formattedHistory = `Recent conversation history with ${profile}:\n\n`;
      } else {
        formattedHistory = `Recent conversation history (${profile}/${platform}):\n\n`;
      }
      
      recentMessages.forEach(msg => {
        formattedHistory += `${msg.from}: ${msg.text}\n\n`;
      });
      
      return formattedHistory.trim();
    } catch (error) {
      console.error('Error formatting chat history:', error.message);
      return '';
    }
  }
}

module.exports = MCPClient; 