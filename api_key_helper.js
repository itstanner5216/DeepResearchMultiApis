/**
 * API Key Configuration Helper for iOS Scriptable
 * 
 * This script helps you securely configure API keys for the Deep Research script.
 * Run this once to set up your API keys, then use the main Deep Research script.
 */

// Configuration options
const STORAGE_METHOD = {
  KEYCHAIN: "keychain",    // Most secure - uses iOS Keychain
  SCRIPT: "script",        // Convenient - directly in script
  SHORTCUTS: "shortcuts"   // Flexible - via iOS Shortcuts parameters
};

console.log("🔑 Deep Research API Key Configuration Helper");
console.log("=".repeat(50));

// API Key Information
const API_INFO = {
  BRAVE_API_KEY: {
    name: "Brave Search API",
    url: "https://api.search.brave.com/app/keys",
    description: "Get 2,000 free queries per month",
    keyName: "BRAVE_API_KEY"
  },
  NEWS_API_KEY: {
    name: "NewsAPI",
    url: "https://newsapi.org/register",
    description: "Get 1,000 free requests per day",
    keyName: "NEWS_API_KEY"
  },
  NEWSDATA_API_KEY: {
    name: "Newsdata.io",
    url: "https://newsdata.io/register",
    description: "Get 200 free requests per day",
    keyName: "NEWSDATA_API_KEY"
  }
};

function displayApiKeyInfo() {
  console.log("\n📚 API Key Requirements:");
  console.log("-".repeat(30));
  
  Object.values(API_INFO).forEach(api => {
    console.log(`\n${api.name}:`);
    console.log(`  📍 URL: ${api.url}`);
    console.log(`  📊 Plan: ${api.description}`);
    console.log(`  🔑 Key Name: ${api.keyName}`);
  });
}

function generateKeychainScript() {
  console.log("\n🔐 iOS Keychain Storage Method (Recommended)");
  console.log("-".repeat(45));
  console.log("\nCreate a new Shortcut in iOS Shortcuts app with these actions:");
  console.log("\n1. Ask for Text actions (for each API key):");
  
  Object.values(API_INFO).forEach(api => {
    console.log(`
Action: Ask for Text
  Prompt: "Enter your ${api.name} API key"
  Variable Name: ${api.keyName.toLowerCase()}
  
Action: Set Value
  Value: [${api.keyName.toLowerCase()} variable]
  Keychain Item: "${api.keyName}"
    `);
  });
  
  console.log("\n2. Then run this Shortcut once to store all keys securely.");
  console.log("\n✅ After setup, the Deep Research script will automatically");
  console.log("   read keys from Keychain - no code changes needed!");
}

function generateScriptConfig() {
  console.log("\n📝 Direct Script Configuration Method");
  console.log("-".repeat(40));
  console.log("\nReplace the CONFIG section in deep_research_script.js:");
  console.log(`
const CONFIG = {
  // Add your API keys here:
  BRAVE_API_KEY: "your_brave_api_key_here",
  NEWS_API_KEY: "your_newsapi_key_here",  
  NEWSDATA_API_KEY: "your_newsdata_key_here",
  
  // Keep other settings as they are:
  MAX_RESULTS: 5,
  TIMEOUT_MS: 15000,
  RETRY_COUNT: 2,
  USE_SHORTCUTS_INPUT: true,
  COPY_TO_CLIPBOARD: true,
  SHOW_NOTIFICATIONS: true
};`);
  
  console.log("\n⚠️  Security Note: Keys are stored in plain text in the script.");
  console.log("   Only use this method if you're comfortable with that.");
}

function generateShortcutsConfig() {
  console.log("\n📱 iOS Shortcuts Parameter Method");
  console.log("-".repeat(35));
  console.log("\nCreate a Shortcut that passes API keys as parameters:");
  console.log(`
1. Add 'Dictionary' action with these keys:
   {
     "apiKeys": {
       "braveKey": "your_brave_api_key",
       "newsKey": "your_newsapi_key",
       "newsdataKey": "your_newsdata_key"
     },
     "queryText": "[ask for text or get from clipboard]"
   }

2. Add 'Run Script' action:
   - Script: Deep Research
   - Input: [Dictionary from step 1]

3. The script will use these keys for that run only.`);
  
  console.log("\n✅ Most flexible method - keys not stored anywhere permanently.");
}

function displayTestInstructions() {
  console.log("\n🧪 Testing Your Configuration");
  console.log("-".repeat(30));
  console.log("\n1. Run the ios_compatibility_test.js script first");
  console.log("2. Try the demo_script.js to see the workflow");
  console.log("3. Test with a simple query like 'technology news'");
  console.log("4. Check console output for any error messages");
  console.log("\n🚨 Common Issues:");
  console.log("   • Invalid API key format");
  console.log("   • Network permission denied");
  console.log("   • API rate limits exceeded");
  console.log("   • Clipboard access denied");
}

function displaySecurityTips() {
  console.log("\n🔒 Security Best Practices");
  console.log("-".repeat(25));
  console.log("\n✅ DO:");
  console.log("   • Use iOS Keychain for storage (most secure)");
  console.log("   • Keep API keys private and don't share them");
  console.log("   • Monitor your API usage regularly");
  console.log("   • Use free tiers to start");
  console.log("\n❌ DON'T:");
  console.log("   • Share scripts with API keys in them");
  console.log("   • Use API keys in shared Shortcuts");
  console.log("   • Store keys in cloud sync if avoidable");
  console.log("   • Exceed API rate limits");
}

// Main configuration workflow
async function runConfigurationHelper() {
  displayApiKeyInfo();
  
  console.log("\n🛠️  Configuration Methods:");
  console.log("Choose the method that works best for you:\n");
  
  generateKeychainScript();
  generateScriptConfig();  
  generateShortcutsConfig();
  
  displayTestInstructions();
  displaySecurityTips();
  
  console.log("\n🎉 Configuration Helper Complete!");
  console.log("Choose one method above and follow the instructions.");
  console.log("\nNext steps:");
  console.log("1. Get your API keys from the URLs listed");
  console.log("2. Configure using your preferred method");
  console.log("3. Test with ios_compatibility_test.js");
  console.log("4. Start using the Deep Research script!");
  
  // For iOS Shortcuts integration
  if (typeof Script !== 'undefined') {
    const helpText = `Deep Research API Configuration

🔑 Get API Keys:
• Brave Search: api.search.brave.com/app/keys
• NewsAPI: newsapi.org/register  
• Newsdata.io: newsdata.io/register

📱 Setup Methods:
1. iOS Keychain (most secure)
2. Direct script editing
3. Shortcuts parameters

See console output for detailed instructions.

Ready to configure your API keys!`;

    Script.setShortcutOutput(helpText);
    
    if (typeof Pasteboard !== 'undefined') {
      Pasteboard.copy(helpText);
    }
  }
}

// Run the helper
runConfigurationHelper();