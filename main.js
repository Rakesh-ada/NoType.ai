const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, nativeImage, clipboard, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const ApiService = require('./api_service');
const MCPServer = require('./mcp_server');
const MCPClient = require('./mcp_client');

// Initialize settings store
const store = new Store();

let mainWindow;
let tray = null;
let appIcon = null;
let apiService = null;
let mcpServer = null;
let mcpClient = null;

// Set up error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

app.on('render-process-gone', (event, webContents, details) => {
  console.error('Renderer process gone:', details.reason);
});

app.on('child-process-gone', (event, details) => {
  console.error('Child process gone:', details.reason);
});

// Create custom directory for app data to prevent permission issues
function setupAppDataDirectory() {
  const userDataPath = app.getPath('userData');
  const customDataPath = path.join(userDataPath, 'notype-data');
  
  try {
    if (!fs.existsSync(customDataPath)) {
      fs.mkdirSync(customDataPath, { recursive: true });
    }
    app.setPath('userData', customDataPath);
    console.log('Set custom userData path:', customDataPath);
    return true;
  } catch (error) {
    console.error('Failed to set up app data directory:', error);
    return false;
  }
}

// Create default icon if it doesn't exist
function ensureIcon() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  
  // In a production environment, we'd expect the icon to exist
  // For development, we'll just use an empty icon as fallback
  try {
    if (fs.existsSync(iconPath)) {
      appIcon = nativeImage.createFromPath(iconPath);
    } else {
      console.log('Icon not found, using empty icon');
      // Create directory if it doesn't exist
      fs.mkdirSync(path.join(__dirname, 'assets'), { recursive: true });
      appIcon = nativeImage.createEmpty();
    }
    
    return appIcon;
  } catch (err) {
    console.error('Failed to handle icon:', err);
    // Return an empty icon as fallback
    return nativeImage.createEmpty();
  }
}

function createWindow() {
  // Ensure we have an icon
  ensureIcon();
  
  const windowOptions = {
    width: 400,
    height: 500,
    minWidth: 400,
    maxWidth: 400,
    minHeight: 500,
    maxHeight: 500,
    resizable: false,
    useContentSize: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      partition: 'persist:notype'
    },
    autoHideMenuBar: true
  };
  
  // Only set icon if we have a valid one
  if (appIcon && !appIcon.isEmpty()) {
    windowOptions.icon = appIcon;
  }
  
  mainWindow = new BrowserWindow(windowOptions);
  
  mainWindow.loadFile('index.html');

  // Hide window instead of closing it
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

function setupTray() {
  // Ensure we have an icon
  ensureIcon();
  
  try {
    // Only use the icon if we have a valid one
    tray = new Tray(appIcon || nativeImage.createEmpty());
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open', click: () => mainWindow.show() },
      { type: 'separator' },
      { label: 'Exit', click: () => {
        app.isQuitting = true;
        app.quit();
      }}
    ]);
    tray.setToolTip('NoType.ai');
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
  } catch (error) {
    console.error('Failed to set up tray icon:', error);
  }
}

// Register global shortcuts (Ctrl+Shift+T, Ctrl+A, and Ctrl+Shift+V)
function registerShortcuts() {
  try {
    // Show prompt
    globalShortcut.register('CommandOrControl+Shift+T', () => {
      mainWindow.webContents.send('show-prompt');
      mainWindow.show();
    });
    
    // Generate text without showing window
    globalShortcut.register('CommandOrControl+A', () => {
      mainWindow.webContents.send('generate-text');
      // Don't show the window - keep it minimized
    });
    
    // Add a shortcut to quickly paste the last generated text
    globalShortcut.register('CommandOrControl+Shift+V', () => {
      // Just send the event - the app will handle pasting from clipboard
      mainWindow.webContents.send('quick-paste');
    });
  } catch (error) {
    console.error('Failed to register global shortcut:', error);
  }
}

function initApiService() {
  try {
    console.log('Initializing API service...');
    apiService = new ApiService();
    
    // Emit events to renderer
    apiService.on('output', (message) => {
      console.log(`API service output: ${message}`);
      if (mainWindow) {
        mainWindow.webContents.send('api-output', message);
      }
    });
    
    apiService.on('error', (error) => {
      console.error(`API service error: ${error}`);
      if (mainWindow) {
        mainWindow.webContents.send('api-error', error);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Failed to initialize API service:', error);
    return false;
  }
}

// Initialize MCP (Message Context Protocol) server
function initMCPServer() {
  try {
    console.log('Initializing MCP server...');
    mcpServer = new MCPServer();
    mcpClient = new MCPClient(); // Create client for easy internal access
    
    // Start the server
    mcpServer.start()
      .then(port => {
        console.log(`MCP server started on port ${port}`);
        mainWindow?.webContents.send('mcp-status', { running: true, port });
      })
      .catch(err => {
        console.error('Failed to start MCP server:', err);
        mainWindow?.webContents.send('mcp-status', { running: false, error: err.message });
      });
    
    return true;
  } catch (error) {
    console.error('Failed to initialize MCP server:', error);
    return false;
  }
}

app.whenReady().then(() => {
  // Set up app data directory first to avoid permission issues
  setupAppDataDirectory();
  
  createWindow();
  setupTray();
  registerShortcuts();
  initApiService();
  initMCPServer(); // Initialize the MCP server

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async () => {
  app.isQuitting = true;
  
  // Close API service
  if (apiService) {
    try {
      await apiService.exit();
    } catch (error) {
      console.error('Error closing API service:', error);
    }
  }
  
  // Stop MCP server
  if (mcpServer) {
    try {
      await mcpServer.stop();
    } catch (error) {
      console.error('Error stopping MCP server:', error);
    }
  }
});

// IPC handlers
ipcMain.handle('get-config', async () => {
  // If apiService isn't running, return default config
  if (!apiService) {
    return {
      api_key: "",
      default_profile: "Office",
      profiles: ["Office", "Friend", "Partner", "Family"],
      tones: ["Professional and concise", "Friendly and casual", "Funny and sarcastic", "Apologetic and romantic"],
      auto_start: false,
      max_history: 5
    };
  }
  
  try {
    return await apiService.getConfig();
  } catch (err) {
    console.error('Error getting config:', err);
    throw err;
  }
});

ipcMain.handle('save-config', async (event, config) => {
  // If apiService isn't running, store in electron-store for now
  if (!apiService) {
    store.set('config', config);
    return true;
  }
  
  try {
    return await apiService.saveConfigUpdate(config);
  } catch (err) {
    console.error('Error saving config:', err);
    throw err;
  }
});

ipcMain.handle('generate-reply', async (event, data) => {
  // If apiService isn't running, return error
  if (!apiService) {
    throw new Error('API service is not running. Please restart the application.');
  }
  
  try {
    const response = await apiService.generateReplyApi(
      data.conversation_text, 
      data.prompt_tone, 
      data.profile
    );
    return {
      success: true,
      response: response
    };
  } catch (err) {
    console.error('Error generating reply:', err);
    throw err;
  }
});

// Add this handler for the minimize-window IPC event
ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

// Add this handler for the simulate-paste event
ipcMain.on('simulate-paste', () => {
  try {
    // We'll use a simple approach:
    // 1. Send Ctrl+V key via Electron's sendInputEvent
    // 2. This works because the window is minimized and focus should be on the previous app
    
    // Create a keyboard event for Ctrl+V
    // Note: This might not work across all apps due to security restrictions
    
    // For Windows, common paste shortcut is Ctrl+V
    if (process.platform === 'win32') {
      // Alternative: use AutoHotkey or similar tools via child_process
      // For now, just notify the user to paste manually
      app.focus(); // Try to return focus to the previous app
      
      // Show notification
      if (mainWindow) {
        mainWindow.webContents.send('paste-ready');
      }
    }
    // For Mac, common paste shortcut is Cmd+V
    else if (process.platform === 'darwin') {
      app.hide(); // Try to return focus to the previous app
      
      // Show notification
      if (mainWindow) {
        mainWindow.webContents.send('paste-ready');
      }
    }
  } catch (error) {
    console.error('Failed to simulate paste:', error);
  }
});

// Add IPC handlers for MCP server
ipcMain.handle('mcp-add-chat', async (event, data) => {
  try {
    if (!mcpClient) {
      throw new Error('MCP client not initialized');
    }
    
    const { profile, platform, message, from } = data;
    const result = await mcpClient.addChatMessage(profile, platform, message, from);
    return result;
  } catch (err) {
    console.error('Error in mcp-add-chat:', err);
    throw err;
  }
});

ipcMain.handle('mcp-get-context', async (event, data) => {
  try {
    if (!mcpClient) {
      throw new Error('MCP client not initialized');
    }
    
    const { profile, platform } = data;
    const context = await mcpClient.getContext(profile, platform);
    return context;
  } catch (err) {
    console.error('Error in mcp-get-context:', err);
    throw err;
  }
});

ipcMain.handle('mcp-reset-context', async (event, data) => {
  try {
    if (!mcpClient) {
      throw new Error('MCP client not initialized');
    }
    
    const { profile, platform } = data;
    const result = await mcpClient.resetContext(profile, platform);
    return result;
  } catch (err) {
    console.error('Error in mcp-reset-context:', err);
    throw err;
  }
});

ipcMain.handle('mcp-list-contexts', async () => {
  try {
    if (!mcpClient) {
      throw new Error('MCP client not initialized');
    }
    
    const contexts = await mcpClient.listContexts();
    return contexts;
  } catch (err) {
    console.error('Error in mcp-list-contexts:', err);
    throw err;
  }
});

ipcMain.handle('mcp-export-context', async (event, data) => {
  try {
    if (!mcpClient) {
      throw new Error('MCP client not initialized');
    }
    
    const { profile, platform, format } = data;
    const result = await mcpClient.exportContext(profile, platform, format);
    return result;
  } catch (err) {
    console.error('Error in mcp-export-context:', err);
    throw err;
  }
});

ipcMain.handle('mcp-get-formatted-history', async (event, data) => {
  try {
    if (!mcpClient) {
      throw new Error('MCP client not initialized');
    }
    
    const { profile, platform, maxMessages } = data;
    const history = await mcpClient.getFormattedChatHistory(profile, platform, maxMessages);
    return history;
  } catch (err) {
    console.error('Error in mcp-get-formatted-history:', err);
    throw err;
  }
}); 