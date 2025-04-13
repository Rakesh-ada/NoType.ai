# Packaging NoType.AI for Distribution

This guide explains how to package the NoType.AI application for distribution to users.

## Required Files

Ensure the following files are included in your distribution package:

- `index.html` - Main application interface
- `main.js` - Electron main process
- `renderer.js` - Electron renderer process
- `preload.js` - Preload script for Electron
- `api_service.js` - API service for handling requests
- `mcp_server.js` - Server component
- `mcp_client.js` - Client component
- `mcp_ui.js` - UI component
- `settings-fix.js` - Fixes for settings functionality
- `config.json` - Configuration file
- `styles.css` - Application styling
- `python/` - Directory containing Python scripts
- `check-npm.bat` - Script to check for npm installation
- `install-dependencies.bat` - Script to install dependencies
- `launch-notype.bat` - Script to launch the application
- `troubleshoot.bat` - Script to troubleshoot common issues
- `QUICK_START.txt` - Quick start guide
- `INSTALLATION_README.txt` - Installation instructions

## Packaging Steps

1. **Verify all files are present and working**
   - Run `troubleshoot.bat` to ensure all required files are present
   - Test the application by running `launch-notype.bat`

2. **Create Distribution Package**
   - Create a ZIP file containing all required files
   - Ensure the folder structure is maintained
   - Name the ZIP file with the application version (e.g., `NoType-AI-v1.0.zip`)

3. **Optional: Create Installer**
   - Consider using a tool like [Inno Setup](https://jrsoftware.org/isinfo.php) or [NSIS](https://nsis.sourceforge.io/) to create an installer
   - The installer should:
     - Install all required files
     - Create desktop shortcuts
     - Check for Node.js and install it if missing

## Distribution Notes

- **API Key:** Remind users they will need to enter their own API key in the settings
- **Node.js:** Make it clear that Node.js is required to run the application
- **Dependencies:** Ensure users know to run `install-dependencies.bat` after extraction
- **First Launch:** Let users know the first launch may take longer while dependencies are loaded

## Troubleshooting Support

Ensure these troubleshooting aids are included:

- `troubleshoot.bat` for diagnosing and fixing common issues
- Debug mode option (`launch-notype.bat --debug`)
- Clear instructions in the QUICK_START.txt and INSTALLATION_README.txt

## Versioning

When updating the application:

1. Update the version number in the package.json file
2. Document changes in a CHANGELOG.md file
3. Update any instructions that may have changed 