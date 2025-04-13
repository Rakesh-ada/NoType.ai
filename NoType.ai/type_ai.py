import os
import sys
import json
import time
import threading
import argparse
import requests
from datetime import datetime

# Application Constants
APP_NAME = "Type.ai"
APP_VERSION = "1.0.0"
CONFIG_FILE = "config.json"
HISTORY_FILE = "history.json"
DEFAULT_PROFILES = ["Office", "Friend", "Partner", "Family"]
DEFAULT_TONES = ["Professional and concise", "Friendly and casual", "Funny and sarcastic", "Apologetic and romantic"]
GEMINI_API_KEY = "AIzaSyDjonLXdO1u8KdXllXSiAsZB0VFXG2iRbU"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

class TypeAI:
    def __init__(self, api_mode=False):
        self.config = self.load_config()
        self.history = self.load_history()
        self.clipboard_text = ""
        self.current_profile = self.config.get("default_profile", "Office")
        self.api_mode = api_mode
        
        # Initialize with the provided API key
        if not self.config.get("api_key"):
            self.config["api_key"] = GEMINI_API_KEY
            self.save_config()

    def load_config(self):
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r') as f:
                    return json.load(f)
            except:
                pass
        return {
            "api_key": GEMINI_API_KEY,
            "default_profile": "Office",
            "profiles": DEFAULT_PROFILES,
            "tones": DEFAULT_TONES,
            "auto_start": False,
            "max_history": 5
        }
    
    def save_config(self):
        with open(CONFIG_FILE, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def load_history(self):
        if os.path.exists(HISTORY_FILE):
            try:
                with open(HISTORY_FILE, 'r') as f:
                    return json.load(f)
            except:
                pass
        return {
            "clipboard_history": [],
            "prompt_history": [],
            "response_history": []
        }
    
    def save_history(self):
        with open(HISTORY_FILE, 'w') as f:
            json.dump(self.history, f, indent=2)
    
    def add_to_history(self, clipboard_text, prompt, response):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Add to clipboard history
        self.history["clipboard_history"].insert(0, {
            "text": clipboard_text,
            "timestamp": timestamp
        })
        
        # Add to prompt history
        self.history["prompt_history"].insert(0, {
            "text": prompt,
            "profile": self.current_profile,
            "timestamp": timestamp
        })
        
        # Add to response history
        self.history["response_history"].insert(0, {
            "text": response,
            "prompt": prompt,
            "profile": self.current_profile,
            "timestamp": timestamp
        })
        
        # Trim histories to max_history
        max_history = self.config.get("max_history", 5)
        self.history["clipboard_history"] = self.history["clipboard_history"][:max_history]
        self.history["prompt_history"] = self.history["prompt_history"][:max_history]
        self.history["response_history"] = self.history["response_history"][:max_history]
        
        self.save_history()
    
    def generate_reply(self, conversation_text, prompt_tone, user_profile):
        prompt = f"""You are an AI that helps generate high-quality, human-like reply messages based on conversation history and a specified tone or intent.

Here is the copied conversation:
\"\"\"
{conversation_text}
\"\"\"

Here is the user's intent or tone:
\"\"\"
{prompt_tone}
\"\"\"

Here is the user's current profile type:
\"\"\"
{user_profile}
\"\"\"

Instructions:
- Write a reply that matches the conversation context, user's intent/tone, and profile type.
- Keep it natural, short and context-aware.
- Maintain language consistency — if the original text is in Hindi, reply in Hindi.
- Do not add "AI" mentions or meta-notes.
- Only return the raw reply message — no headers or descriptions.
"""

        try:
            api_key = self.config.get("api_key", GEMINI_API_KEY)
            url = f"{GEMINI_API_URL}?key={api_key}"
            
            headers = {'Content-Type': 'application/json'}
            data = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
            
            response = requests.post(url, headers=headers, json=data)
            response_json = response.json()
            
            if 'candidates' in response_json and len(response_json['candidates']) > 0:
                response_text = response_json['candidates'][0]['content']['parts'][0]['text'].strip()
                return response_text
            else:
                error_message = response_json.get('error', {}).get('message', 'Unknown error')
                return f"Error: {error_message}"
                
        except Exception as e:
            print(f"Error generating reply: {str(e)}")
            return f"Error: {str(e)}"
    
    # API Mode functions
    def api_generate_reply(self, conversation_text, prompt_tone, user_profile):
        response = self.generate_reply(conversation_text, prompt_tone, user_profile)
        # Add to history
        self.add_to_history(conversation_text, prompt_tone, response)
        return response
    
    def api_get_config(self):
        return self.config
    
    def api_save_config(self, new_config):
        self.config.update(new_config)
        self.save_config()
        return True
    
    def api_start(self):
        """
        Start the API service for Electron UI
        This is a simple implementation that reads from stdin and writes to stdout
        """
        print("Starting TypeAI in API mode")
        sys.stdout.flush()  # Ensure output is flushed
        
        while True:
            try:
                # Read command from stdin
                command_line = input()
                if not command_line:
                    continue
                
                # Parse JSON command
                command = json.loads(command_line)
                command_id = command.get("id", "unknown")
                
                # Process command
                response = {"id": command_id, "success": False, "error": "Unknown command"}
                
                if command.get("action") == "generate_reply":
                    conversation_text = command.get("conversation_text", "")
                    prompt_tone = command.get("prompt_tone", "")
                    user_profile = command.get("user_profile", "Office")
                    
                    response_text = self.api_generate_reply(conversation_text, prompt_tone, user_profile)
                    response = {"id": command_id, "success": True, "response": response_text}
                
                elif command.get("action") == "get_config":
                    config = self.api_get_config()
                    response = {"id": command_id, "success": True, "config": config}
                
                elif command.get("action") == "save_config":
                    success = self.api_save_config(command.get("config", {}))
                    response = {"id": command_id, "success": success}
                
                elif command.get("action") == "exit":
                    response = {"id": command_id, "success": True, "message": "Exiting"}
                    print(json.dumps(response))
                    sys.stdout.flush()
                    break
                
                # Send response
                print(json.dumps(response))
                sys.stdout.flush()  # Ensure output is flushed immediately
            
            except Exception as e:
                error_response = {
                    "id": command_id if 'command_id' in locals() else "unknown", 
                    "success": False, 
                    "error": str(e)
                }
                print(json.dumps(error_response))
                sys.stdout.flush()  # Ensure error output is flushed

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='TypeAI - AI-powered reply generator')
    parser.add_argument('--api-mode', action='store_true', help='Run in API mode for Electron UI')
    parser.add_argument('--test', action='store_true', help='Run a test generation')
    args = parser.parse_args()
    
    app = TypeAI(api_mode=args.api_mode)
    
    if args.test:
        # Test the API with a simple prompt
        conversation = "Hello, how are you doing today?"
        tone = "friendly and casual"
        profile = "Friend"
        
        print("Testing API with:")
        print(f"Conversation: {conversation}")
        print(f"Tone: {tone}")
        print(f"Profile: {profile}")
        print("\nGenerating response...")
        
        response = app.generate_reply(conversation, tone, profile)
        print("\nResponse:")
        print(response)
        return
    
    if args.api_mode:
        # Run in API mode for Electron
        app.api_start()
    else:
        print("Please use --api-mode or --test flag")

if __name__ == "__main__":
    main() 