# NoType.ai

A desktop application that uses AI to generate high-quality, contextual reply messages based on conversation history and specified tone. This application uses Google's Gemini API for AI-powered responses.

## Features

- Generate contextual replies to conversations
- Multiple user profiles (Office, Friend, Partner, Family)
- Customizable tone for replies (including "exact" mode to use text without AI modification)
- Chat Context management (NEW!) - Store and track conversation history
- Clipboard monitoring
- Global keyboard shortcut (Ctrl+A)
- System tray integration

## Quick Start Guide (For End Users)

1. **Installation**: 
   - Extract all files from the NoType.ai zip file to a folder
   - Run `install-dependencies.bat` to ensure all dependencies are installed
   - Run `launch-notype.bat` to start the application

2. **First Run**:
   - Enter your Google Gemini API key in the settings
   - Select your default profile

3. **Using the App**:
   - Copy text from a conversation (Ctrl+C)
   - Click "Refresh" in the app to load the text
   - Type your tone in the prompt field (e.g., "professional", "funny", "angry")
   - Click "Generate Reply"
   - The response will be copied to your clipboard automatically

4. **Using Chat Context**:
   - Click the "Chat Context" tab in the application
   - Select a profile and enter a platform (e.g., "WhatsApp", "LinkedIn")
   - Add messages to build a conversation history
   - When generating replies, the app will use this context for more relevant responses

5. **Quick Format**:
   - You can also type `/tone/your message` in any text field
   - Press Ctrl+A to generate a response based on the copied conversation
   - Try `/exact/your exact message` to use your text without AI modifications
   - The response will be copied to your clipboard ready to paste

## Troubleshooting

If you encounter an error like "Cannot find module 'express'":
1. Run the `install-dependencies.bat` file included in the package
2. This will install all required dependencies
3. Try running `launch-notype.bat` again

## For Developers

### Prerequisites

- Node.js (v14 or higher)
- Google Gemini API key
- Required npm packages: express, axios, electron-store

### Installation

```bash
# Install Node.js dependencies
npm install

# Run the development version
npm start
```

### Building for Distribution

To create a single-file installer for Windows:

```bash
# Create a single executable installer
npm run build-single
```

This will generate a NoType.ai-Setup.exe file in the dist folder that you can share with anyone.

## Keyboard Shortcuts

- `Ctrl+A`: Generate a reply based on copied conversation and specified tone
- `Ctrl+Shift+V`: Quick paste the last generated response

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Go to API keys and create a new key
4. Copy the API key and paste it in the NoType.ai settings

## License

ISC 