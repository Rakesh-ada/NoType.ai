// Simplified Python API bridge for development without Python backend
const EventEmitter = require('events');
const Store = require('electron-store');

class PythonAPIBridge extends EventEmitter {
  constructor() {
    super();
    this.store = new Store();
    this.config = this.store.get('config') || {
      api_key: "",
      default_profile: "Office",
      profiles: ["Office", "Friend", "Partner", "Family"],
      tones: ["Professional and concise", "Friendly and casual", "Funny and sarcastic", "Apologetic and romantic"],
      auto_start: false,
      max_history: 5
    };
  }
  
  // Mock sending a command to Python and getting a response
  sendCommand(command) {
    return new Promise((resolve, reject) => {
      // Process command based on action
      switch (command.action) {
        case 'get_config':
          resolve({
            id: command.id,
            success: true,
            config: this.config
          });
          break;
          
        case 'save_config':
          try {
            this.config = { ...this.config, ...command.config };
            this.store.set('config', this.config);
            resolve({
              id: command.id,
              success: true
            });
          } catch (err) {
            reject({
              id: command.id,
              success: false,
              error: err.message
            });
          }
          break;
          
        case 'generate_reply':
          // Mock generating a reply with a delay
          setTimeout(() => {
            const reply = this.mockGenerateReply(
              command.conversation_text,
              command.prompt_tone,
              command.user_profile
            );
            resolve({
              id: command.id,
              success: true,
              response: reply
            });
          }, 1500); // Simulate some delay
          break;
          
        case 'exit':
          resolve({
            id: command.id,
            success: true,
            message: "Exiting"
          });
          break;
          
        default:
          reject({
            id: command.id,
            success: false,
            error: "Unknown command"
          });
      }
    });
  }
  
  // Mock generating a reply
  mockGenerateReply(conversation, tone, profile) {
    const templates = {
      'Office': [
        "Thank you for your email. I appreciate your input on this matter.",
        "I'll review this information and get back to you shortly.",
        "Let's schedule a meeting to discuss this further.",
        "I've reviewed the documentation and everything looks good to proceed."
      ],
      'Friend': [
        "Hey, sounds good! Let's do it!",
        "LOL that's hilarious! 😂",
        "I'm free this weekend, wanna hang out?",
        "No worries, take your time!"
      ],
      'Partner': [
        "I miss you too, can't wait to see you tonight!",
        "I love you so much! ❤️",
        "Let's plan something special for this weekend.",
        "That sounds wonderful. I'm looking forward to it."
      ],
      'Family': [
        "Thanks for letting me know. I'll be there!",
        "Love you all! See you at dinner.",
        "Can you pick up some groceries on your way back?",
        "I'm so proud of what you've accomplished!"
      ]
    };
    
    // Get templates for the selected profile
    const profileTemplates = templates[profile] || templates['Office'];
    
    // Select a random template
    const randomIndex = Math.floor(Math.random() * profileTemplates.length);
    const baseTemplate = profileTemplates[randomIndex];
    
    // Customize based on tone
    if (tone.toLowerCase().includes('funny') || tone.toLowerCase().includes('humor')) {
      return baseTemplate + " 😂 Just kidding! But seriously, let's talk soon!";
    } else if (tone.toLowerCase().includes('professional') || tone.toLowerCase().includes('formal')) {
      return "Dear recipient,\n\n" + baseTemplate + "\n\nBest regards,\nSender";
    } else if (tone.toLowerCase().includes('apologetic')) {
      return "I'm really sorry about that. " + baseTemplate + " Hope we can move past this.";
    } else {
      return baseTemplate;
    }
  }
  
  // Start the bridge
  start() {
    // Emit startup message
    this.emit('output', 'Starting mock Python bridge...');
    this.emit('output', 'Ready to process commands');
    return this;
  }
}

module.exports = PythonAPIBridge; 