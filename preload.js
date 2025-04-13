const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('typeAI', {
  // Config operations
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // AI Operations
  generateReply: (data) => ipcRenderer.invoke('generate-reply', data),
  
  // Window control
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  
  // Keyboard simulation
  simulatePaste: () => ipcRenderer.send('simulate-paste'),
  
  // MCP (Message Context Protocol) operations
  mcpAddChat: (data) => ipcRenderer.invoke('mcp-add-chat', data),
  mcpGetContext: (data) => ipcRenderer.invoke('mcp-get-context', data),
  mcpResetContext: (data) => ipcRenderer.invoke('mcp-reset-context', data),
  mcpListContexts: () => ipcRenderer.invoke('mcp-list-contexts'),
  mcpExportContext: (data) => ipcRenderer.invoke('mcp-export-context', data),
  mcpGetFormattedHistory: (data) => ipcRenderer.invoke('mcp-get-formatted-history', data),
  
  // Listen for events from main process
  onApiOutput: (callback) => ipcRenderer.on('api-output', (_, data) => callback(data)),
  onApiError: (callback) => ipcRenderer.on('api-error', (_, data) => callback(data)),
  onPasteReady: (callback) => ipcRenderer.on('paste-ready', () => callback()),
  onMcpStatus: (callback) => ipcRenderer.on('mcp-status', (_, data) => callback(data)),
  
  // For backward compatibility
  onPythonOutput: (callback) => ipcRenderer.on('api-output', (_, data) => callback(data)),
  onPythonError: (callback) => ipcRenderer.on('api-error', (_, data) => callback(data)),
  onPythonCrashed: (callback) => ipcRenderer.on('api-error', (_, data) => callback('API service crashed')),
  onShowPrompt: (callback) => ipcRenderer.on('show-prompt', () => callback()),
  
  // Add keyboard shortcut handler
  onGenerateText: (callback) => ipcRenderer.on('generate-text', () => callback()),
  onQuickPaste: (callback) => ipcRenderer.on('quick-paste', () => callback()),
  
  // Remove event listeners
  removeAllListeners: (channel) => {
    if (channel) {
      ipcRenderer.removeAllListeners(channel);
    } else {
      [
        'api-output', 
        'api-error', 
        'show-prompt', 
        'generate-text', 
        'paste-ready', 
        'quick-paste',
        'mcp-status'
      ].forEach(
        (channel) => ipcRenderer.removeAllListeners(channel)
      );
    }
  }
});

// Add window resize support for auto-adjusting window height
contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => {
    // Allow only specific channels for security
    const validChannels = ['resize-window', 'minimize-window'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  }
}); 