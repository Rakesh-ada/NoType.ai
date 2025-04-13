# Local MCP Server Integration Guide

This document describes how to use the Message Context Protocol (MCP) server in your NoType.ai application to manage conversation context per profile and platform.

## Overview

The MCP server provides a lightweight way to store chat context for different user profiles and platforms. This is useful for maintaining conversation history when generating AI replies that need to be context-aware.

## Key Features

- **Profile & Platform Organization**: Store conversations by profile (e.g., "Office", "Friend") and platform (e.g., "WhatsApp", "LinkedIn")
- **Context Persistence**: Chat history is saved to disk and loaded on restart
- **Automatic ID Generation**: Each chat thread gets a unique ID
- **Export Functionality**: Export conversations as JSON or plaintext
- **Memory Efficient**: Conversations are capped at a configurable message limit

## API Reference

### Adding Chat Messages

```javascript
// Add a message from someone else
await window.typeAI.mcpAddChat({
  profile: "Office",
  platform: "WhatsApp",
  message: "When will the report be ready?",
  from: "Them"  // "Them" is the default if omitted
});

// Add your own message
await window.typeAI.mcpAddChat({
  profile: "Office",
  platform: "WhatsApp",
  message: "I'll have it ready by tomorrow morning.",
  from: "Me"
});
```

### Retrieving Context

```javascript
// Get all messages for a specific profile and platform
const context = await window.typeAI.mcpGetContext({
  profile: "Office",
  platform: "WhatsApp"
});

// The context object structure:
// {
//   profile: "Office",
//   platform: "WhatsApp",
//   chatId: "abc123def45",
//   messages: [
//     { from: "Them", text: "When will the report be ready?", timestamp: "..." },
//     { from: "Me", text: "I'll have it ready by tomorrow morning.", timestamp: "..." }
//   ],
//   lastUpdated: "2023-06-15T10:30:00.000Z"
// }
```

### Getting Formatted Context for AI Prompts

```javascript
// Get a formatted string suitable for AI context
const formatted = await window.typeAI.mcpGetFormattedHistory({
  profile: "Office",
  platform: "WhatsApp",
  maxMessages: 10  // optional, default is 10
});

// Example output:
// Recent conversation history (Office/WhatsApp):
// 
// Them: When will the report be ready?
// 
// Me: I'll have it ready by tomorrow morning.
```

### Resetting Context

```javascript
// Reset for a specific platform
await window.typeAI.mcpResetContext({
  profile: "Office",
  platform: "WhatsApp"
});

// Reset all platforms for a profile
await window.typeAI.mcpResetContext({
  profile: "Office"
});
```

### Exporting Context

```javascript
// Export as JSON
const jsonData = await window.typeAI.mcpExportContext({
  profile: "Office",
  platform: "WhatsApp",
  format: "json"  // default
});

// Export as plain text
const textData = await window.typeAI.mcpExportContext({
  profile: "Office",
  platform: "WhatsApp",
  format: "txt"
});
```

### Listing All Available Contexts

```javascript
const allContexts = await window.typeAI.mcpListContexts();

// Returns an array of available contexts:
// [
//   { profile: "Office", platform: "WhatsApp", messageCount: 2, chatId: "abc123def45", lastUpdated: "..." },
//   { profile: "Friend", platform: "Telegram", messageCount: 5, chatId: "xyz789uvw12", lastUpdated: "..." }
// ]
```

## Integration with AI Response Generation

To use the chat context when generating AI responses:

```javascript
// Example of incorporating chat history into your AI prompt
async function generateContextAwareReply(profile, platform, promptTone) {
  // Get the selected clipboard text
  const clipboardText = getClipboardText();
  
  // Get recent conversation history 
  const conversationHistory = await window.typeAI.mcpGetFormattedHistory({
    profile,
    platform,
    maxMessages: 5  // Adjust based on needs
  });
  
  // Combine with clipboard text to create full context
  const fullContext = conversationHistory ? 
    `${conversationHistory}\n\nNew message: ${clipboardText}` : 
    clipboardText;
  
  // Generate reply using the enhanced context
  const result = await window.typeAI.generateReply({
    profile,
    conversation_text: fullContext,
    prompt_tone: promptTone
  });
  
  // Optionally, add the reply to context
  if (result.success) {
    await window.typeAI.mcpAddChat({
      profile,
      platform, 
      message: result.response,
      from: "Me"
    });
  }
  
  return result;
}
```

## UI Integration

The MCP server comes with a pre-built UI that allows users to:

1. View chat contexts by profile and platform
2. Add new messages to the context
3. Reset conversation history
4. Export conversations as JSON or text

The UI is automatically added as a new tab in the NoType.ai interface.

## Technical Details

- Server runs on port 5000 by default (configurable via MCP_PORT environment variable)
- Data is stored in `data/mcp_data.json`
- Chat history is limited to 50 messages per conversation by default (configurable via MAX_MESSAGES_PER_CHAT constant)

## Customization

To customize the MCP server:

1. Edit `mcp_server.js` to change server configurations
2. Modify `mcp_ui.js` to customize the user interface
3. Update styles in the `mcp_ui.js` file (style block) 