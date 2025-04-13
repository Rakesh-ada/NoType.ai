# NoType.ai Distribution Package

The following files and folders must be included in the distribution zip package:

## Essential Application Files

- **launch-notype.bat** - Main startup script
- **install-dependencies.bat** - Dependency installation script
- **check-npm.bat** - Script to verify Node.js installation
- **api_service.js** - Backend API service
- **main.js** - Main Electron process
- **renderer.js** - Renderer process script
- **preload.js** - Preload script for Electron
- **mcp_server.js** - Message Context Protocol server
- **mcp_client.js** - Client for the MCP server
- **mcp_ui.js** - UI module for the MCP functionality
- **index.html** - Main HTML file
- **styles.css** - CSS styles
- **package.json** - Node.js package configuration

## Documentation

- **README.md** - Main documentation
- **QUICK_START.txt** - Quick start guide
- **INSTALLATION_README.txt** - Installation instructions
- **MCP_INTEGRATION.md** - MCP feature documentation

## Folders

- **assets/** - Icons and assets
- **data/** - Data storage folder

## Node.js modules (optional)

If you want to include the dependencies to allow offline installation:
- **node_modules/** - All Node.js modules (makes the zip much larger)

If not including node_modules, users must run install-dependencies.bat before using the application.

## How to Package

1. Create a new folder with all the above files
2. Compress the folder into a ZIP file
3. Distribute the ZIP to users
4. Include clear instructions to extract ALL files and run install-dependencies.bat first

## Distribution Checklist

- [ ] All essential files included
- [ ] Documentation included
- [ ] Tested the package by extracting and running on a fresh system
- [ ] Verified express and other dependencies are correctly installed 