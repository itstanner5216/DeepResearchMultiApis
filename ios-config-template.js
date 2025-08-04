// iOS Scriptable Configuration Template for Deep Research
// Copy this configuration into your deep_research_script.js file

const CONFIG = {
  // === API Keys (Required) ===
  // Get your Brave Search API key from: https://api.search.brave.com/app/keys
  BRAVE_API_KEY: "your_brave_api_key_here",
  
  // Get your NewsAPI key from: https://newsapi.org/account  
  NEWS_API_KEY: "your_newsapi_key_here",
  
  // === Performance Settings ===
  TIMEOUT_MS: 15000,        // Network timeout (15 seconds recommended for iOS)
  RETRY_COUNT: 2,           // Number of retry attempts for failed API calls
  MAX_RESULTS: 5,           // Maximum results per API (1-10 recommended)
  
  // === Behavior Settings ===
  COPY_TO_CLIPBOARD: true,  // Automatically copy results to clipboard
  SHOW_NOTIFICATIONS: true  // Show iOS notifications for status updates
};

// Alternative: Use iOS Shortcuts Parameters (More Secure)
// Instead of hardcoding API keys above, you can pass them as parameters
// from iOS Shortcuts for better security:
//
// In your iOS Shortcut:
// 1. Add "Run Script" action
// 2. Set parameters like this:
//    {
//      "braveKey": "your_brave_key",
//      "newsKey": "your_news_key", 
//      "query": "search term"
//    }
//
// The script will automatically use these parameters if available

// Example iOS Shortcut configuration:
// Run Script (Scriptable)
// Parameters: 
// {
//   "braveKey": "BSA...",
//   "newsKey": "094...",
//   "query": "AI technology news"
// }