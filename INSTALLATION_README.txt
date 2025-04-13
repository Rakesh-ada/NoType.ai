====================================
NoType.AI - INSTALLATION GUIDE
====================================

This package contains the following important files:

1. launch-notype.bat - The main startup file to launch the application
2. install-dependencies.bat - Installs required dependencies (run this first)
3. QUICK_START.txt - Essential instructions for using the application
4. MCP_INTEGRATION.md - Documentation for the Chat Context feature

INSTALLATION STEPS:
------------------

1. Extract the entire ZIP file to a folder of your choice
   * Keep all files and folders in their original structure

2. Run install-dependencies.bat
   * This will install required Node.js packages
   * You need to be connected to the internet
   * The process should take less than a minute

3. Run launch-notype.bat to start the application
   * If you see any errors, try running install-dependencies.bat again

4. On first launch:
   * Go to the Settings tab
   * Enter your Gemini API key
   * Select your default profile

TROUBLESHOOTING:
--------------

If the Settings button doesn't work:
1. Run troubleshoot.bat - this will fix most common issues
2. Follow the prompts to check for missing files and dependencies

If you see "Cannot find module 'express'" or similar errors:
1. Run install-dependencies.bat again
2. Make sure all files were extracted properly
3. Try restarting your computer and then launching the app again

If you need to see detailed error messages, run the app in debug mode:
1. Run launch-notype.bat --debug
2. This will open the app with developer tools

If you're having other issues, check the QUICK_START.txt file for more help.

Enjoy using NoType.AI! 