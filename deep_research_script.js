// Enhanced Deep Research Script for iOS Scriptable
// Integrates Brave Search and NewsAPI with comprehensive error handling
// 
// Setup Instructions:
// 1. Get API keys:
//    - Brave Search: https://api.search.brave.com/app/keys
//    - NewsAPI: https://newsapi.org/account
// 2. Either:
//    - Update CONFIG below with your API keys, OR
//    - Pass keys via iOS Shortcuts parameters for better security
// 3. Copy search query to clipboard and run script
//
// Version: 2.1 - Enhanced with better clipboard handling and debugging

// Configuration - Replace these with your API keys
// For security, consider storing these in iOS Shortcuts parameters or Keychain
const CONFIG = {
  BRAVE_API_KEY: "", // Get from: https://api.search.brave.com/app/keys
  NEWS_API_KEY: "",  // Get from: https://newsapi.org/account
  TIMEOUT_MS: 15000,     // Network timeout for iOS
  RETRY_COUNT: 2,        // Retry attempts
  MAX_RESULTS: 5,        // Results per API
  COPY_TO_CLIPBOARD: true,
  SHOW_NOTIFICATIONS: true,
  // Enhanced features from PR #8
  SCRAPE_CONTENT: true,        // Enable/disable content scraping  
  MAX_CONTENT_LENGTH: 5000,    // Mobile-optimized content limit
  SUMMARIZE: true              // Enable bullet-point summaries
};

// Check if running with Shortcuts parameters (more secure)
if (args && args.shortcutParameter) {
  const params = args.shortcutParameter;
  if (params.braveKey) CONFIG.BRAVE_API_KEY = params.braveKey;
  if (params.newsKey) CONFIG.NEWS_API_KEY = params.newsKey;
  // Enhanced features configuration
  if (params.scrapeContent !== undefined) CONFIG.SCRAPE_CONTENT = params.scrapeContent;
  if (params.summarize !== undefined) CONFIG.SUMMARIZE = params.summarize;
  if (params.maxContentLength) CONFIG.MAX_CONTENT_LENGTH = params.maxContentLength;
}

// Configuration validation
function validateConfiguration() {
  const issues = [];
  
  if (!CONFIG.BRAVE_API_KEY && !CONFIG.NEWS_API_KEY) {
    issues.push("No API keys configured. Add keys to CONFIG or pass via Shortcuts parameters.");
  }
  
  if (!CONFIG.BRAVE_API_KEY) {
    issues.push("Brave Search API key missing - web search will be unavailable");
  }
  
  if (!CONFIG.NEWS_API_KEY) {
    issues.push("NewsAPI key missing - news search will be unavailable");
  }
  
  if (issues.length > 0) {
    console.log("⚠️ Configuration Issues:");
    issues.forEach(issue => console.log(`   • ${issue}`));
    
    if (!CONFIG.BRAVE_API_KEY && !CONFIG.NEWS_API_KEY) {
      showNotification("❌ Configuration Error", "No API keys found. Check script configuration.");
      Script.complete();
      return false;
    }
  }
  
  console.log("✅ Configuration validated");
  return true;
}

// Only proceed if configuration is valid
if (!validateConfiguration()) {
  Script.complete();
}

// Main execution wrapped in async function
async function main() {
  console.log("🧠 Starting main execution...");

  // Enhanced input validation and initialization
  const Pasteboard = importModule("Pasteboard");

  // Get query from clipboard or Shortcuts parameter
  let query = "";
  if (args && args.shortcutParameter && args.shortcutParameter.query) {
    query = args.shortcutParameter.query;
    console.log("📱 Using query from Shortcuts parameter");
  } else {
    try {
      query = Pasteboard.pasteString();
      console.log("📋 Using query from clipboard");
    } catch (error) {
      console.log("❌ Error reading from clipboard: " + error.message);
      await showNotification("❌ Clipboard Error", "Unable to read clipboard content. Check clipboard permissions or content.");
      Script.complete();
      return;
    }
  }

  // Comprehensive input validation
  if (!query) {
    console.log("❌ No input found in clipboard or parameters");
    await showNotification("❌ No Input", "Please copy a search query to clipboard or pass via Shortcuts");
    Script.complete();
    return;
  }

  query = query.trim();
  if (query.length < 2) {
    console.log("❌ Query too short (minimum 2 characters required)");
    await showNotification("❌ Query Too Short", "Search query must be at least 2 characters long");
    Script.complete();
    return;
  }

  if (query.length > 200) {
    console.log("⚠️ Query very long, truncating to 200 characters");
    query = query.substring(0, 200).trim();
    await showNotification("⚠️ Query Truncated", "Search query was shortened to 200 characters");
  }

  console.log(`✅ Query validated: "${query}" (${query.length} characters)`);

  // Generate timestamp for results
  const now = new Date();
  const timestamp = now.toLocaleString("en-US", {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Execute the research
  await run(query, timestamp);
}

// Enhanced notification function with error handling
async function showNotification(title, body, sound = true) {
  if (!CONFIG.SHOW_NOTIFICATIONS) {
    console.log(`🔔 Notification (silent): ${title} - ${body}`);
    return;
  }

  try {
    let n = new Notification();
    n.title = title;
    n.body = body;
    n.sound = sound ? "default" : null;

    // Add identifier for notification management
    n.identifier = `deep-research-${Date.now()}`;

    await n.schedule();
    console.log(`🔔 Notification sent: ${title}`);
  } catch (error) {
    console.log(`❌ Failed to send notification: ${error.message}`);
    // Don't throw error as notification failure shouldn't stop the script
  }
}

// Start the main execution
await main();