/**
 * Deep Research Multi-APIs for iOS Scriptable
 * Unified implementation merging features from PR #3 and PR #4
 * Compatible with iOS 18.6+ and iOS Shortcuts with comprehensive error handling
 */

// --- CONFIGURATION ---
const CONFIG = {
  // API Keys - Configure these in Scriptable settings or through iOS Shortcuts
  BRAVE_API_KEY: "", // Set your Brave Search API key here
  NEWS_API_KEY: "", // Set your NewsAPI key here  
  NEWSDATA_API_KEY: "", // Set your Newsdata.io API key here
  GOOGLE_API_KEY: "", // Set your Google API key here (optional)
  GOOGLE_CX: "", // Set your Google Custom Search Engine ID here (optional)
  
  // API Settings - Optimized for mobile networks
  MAX_RESULTS: 5, // Limit results for mobile performance
  TIMEOUT_MS: 15000, // 15 second timeout for mobile networks
  RETRY_COUNT: 2, // Number of retries for failed requests
  
  // iOS Integration Settings
  USE_SHORTCUTS_INPUT: true, // Read query from Shortcuts input
  COPY_TO_CLIPBOARD: true, // Copy results to clipboard
  SHOW_NOTIFICATIONS: true, // Show completion notifications
  USE_IOS_KEYCHAIN: true // Try to load API keys from iOS Keychain
};

// --- GLOBAL VARIABLES ---
let query = "";
let timestamp = new Date().toLocaleString();

// --- iOS COMPATIBILITY AND ENVIRONMENT DETECTION ---
function isRunningOnIOS() {
  return typeof Pasteboard !== 'undefined' && typeof Script !== 'undefined';
}

// --- UTILITY FUNCTIONS ---
function log(level, message, data = null) {
  const logMessage = `[${new Date().toISOString()}] ${level}: ${message}`;
  console.log(logMessage);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logInfo(message, data = null) { log("INFO", message, data); }
function logWarn(message, data = null) { log("WARN", message, data); }
function logError(message, data = null) { log("ERROR", message, data); }

// Enhanced iOS-specific error handling (from PR #3)
function handleIOSError(error, context) {
  console.log(`❌ iOS Error in ${context}:`, error.message);
  if (isRunningOnIOS()) {
    let notification = new Notification();
    notification.title = "Research Script Error";
    notification.body = `Error in ${context}: ${error.message}`;
    notification.sound = null;
    notification.schedule();
  }
  return null;
}

// Enhanced clipboard functionality for iOS (from PR #3)
function copyToClipboard(content) {
  try {
    if (isRunningOnIOS()) {
      Pasteboard.copy(content);
      console.log("✅ Content copied to iOS clipboard");
      return true;
    } else {
      console.log("⚠️ Not running on iOS - clipboard copy skipped");
      return false;
    }
  } catch (error) {
    handleIOSError(error, "Clipboard Copy");
    return false;
  }
}

// Enhanced Shortcuts output for iOS (from PR #3)
function setShortcutOutput(content) {
  try {
    if (isRunningOnIOS() && typeof Script !== 'undefined') {
      Script.setShortcutOutput(content);
      console.log("✅ Output set for iOS Shortcuts");
      return true;
    } else {
      console.log("⚠️ Not running in iOS Shortcuts environment");
      return false;
    }
  } catch (error) {
    handleIOSError(error, "Shortcuts Output");
    return false;
  }
}

// --- FETCH HELPERS WITH RETRY LOGIC ---
async function fetchJSON(url, headers = {}) {
  try {
    let req = new Request(url);
    req.headers = headers;
    req.timeoutInterval = CONFIG.TIMEOUT_MS / 1000; // Convert ms to seconds for Scriptable
    
    logInfo(`Making request to: ${url}`);
    let json = await req.loadJSON();
    logInfo("✅ Fetch successful", { url, responseKeys: Object.keys(json || {}) });
    return json;
  } catch (e) {
    logError("❌ Fetch error", { url, error: e.message });
    return null;
  }
}

async function fetchWithRetry(url, headers = {}, maxRetries = CONFIG.RETRY_COUNT) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    logInfo(`Attempt ${attempt}/${maxRetries} for ${url}`);
    
    const result = await fetchJSON(url, headers);
    if (result !== null) {
      return result;
    }
    
    if (attempt < maxRetries) {
      const delay = 1000 * attempt; // Progressive delay
      logWarn(`Retrying in ${delay}ms...`);
      await new Promise(resolve => {
        if (typeof Timer !== 'undefined') {
          Timer.schedule(delay, false, resolve);
        } else {
          setTimeout(resolve, delay);
        }
      });
    }
  }
  
  logError(`All ${maxRetries} attempts failed for ${url}`);
  return null;
}

// --- BRAVE SEARCH API IMPLEMENTATION ---
async function braveSearch() {
  logInfo("Starting Brave Search", { query });
  
  if (!CONFIG.BRAVE_API_KEY) {
    logWarn("Brave Search API key not configured, skipping");
    return null;
  }
  
  if (!query || query.trim().length === 0) {
    logError("Query is empty or invalid");
    return null;
  }
  
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${CONFIG.MAX_RESULTS}&safesearch=moderate`;
  const headers = {
    'Accept': 'application/json',
    'X-Subscription-Token': CONFIG.BRAVE_API_KEY
  };
  
  try {
    const res = await fetchWithRetry(url, headers);
    
    if (!res || !res.web || !res.web.results) {
      logWarn("Brave Search returned no web results");
      return null;
    }
    
    logInfo(`Brave Search found ${res.web.results.length} results`);
    return res;
    
  } catch (error) {
    logError("Brave Search failed", { error: error.message });
    return null;
  }
}

// --- NEWSAPI PRIMARY IMPLEMENTATION ---
async function newsAPI() {
  logInfo("Starting NewsAPI search", { query });
  
  if (!CONFIG.NEWS_API_KEY) {
    logError("NewsAPI key not configured, falling back to Newsdata.io");
    return await newsdataFallback();
  }
  
  if (!query || query.trim().length === 0) {
    logError("Query is empty or invalid");
    return [];
  }
  
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=${CONFIG.MAX_RESULTS}&sortBy=publishedAt&apiKey=${CONFIG.NEWS_API_KEY}`;
  
  logInfo(`NewsAPI URL: ${url}`);

  try {
    const res = await fetchWithRetry(url);
    
    if (!res) {
      logWarn("NewsAPI request failed, falling back to Newsdata.io");
      return await newsdataFallback();
    }
    
    if (res.status !== "ok") {
      logWarn(`NewsAPI returned error status: ${res.status} - ${res.message || 'Unknown error'}`);
      return await newsdataFallback();
    }
    
    if (!res.articles || res.articles.length === 0) {
      logWarn("NewsAPI returned no articles, falling back to Newsdata.io");
      return await newsdataFallback();
    }

    logInfo(`NewsAPI found ${res.articles.length} articles`);
    
    return res.articles.map(article => ({
      title: article.title || "No Title",
      url: article.url || "",
      source: article.source?.name || "Unknown Source",
      description: article.description || "No description available",
      publishedAt: article.publishedAt || null,
      author: article.author || "Unknown Author"
    }));
    
  } catch (error) {
    logError("NewsAPI request failed", { error: error.message });
    return await newsdataFallback();
  }
}

// --- NEWSDATA.IO FALLBACK IMPLEMENTATION ---
async function newsdataFallback() {
  logInfo("Starting Newsdata.io fallback search", { query });
  
  if (!CONFIG.NEWSDATA_API_KEY) {
    logError("Newsdata.io API key not configured");
    return [];
  }
  
  if (!query || query.trim().length === 0) {
    logError("Query is empty or invalid");
    return [];
  }
  
  const url = `https://newsdata.io/api/1/news?apikey=${CONFIG.NEWSDATA_API_KEY}&q=${encodeURIComponent(query)}&language=en&country=us&size=${CONFIG.MAX_RESULTS}`;
  
  logInfo(`Newsdata.io URL: ${url}`);

  try {
    const res = await fetchWithRetry(url);
    
    if (!res) {
      logError("Newsdata.io request failed completely");
      return [];
    }
    
    if (res.status !== "success") {
      logError(`Newsdata.io returned error status: ${res.status} - ${res.message || 'Unknown error'}`);
      return [];
    }
    
    if (!res.results || res.results.length === 0) {
      logWarn("Newsdata.io returned no results");
      return [];
    }

    logInfo(`Newsdata.io found ${res.results.length} articles`);
    
    return res.results.map(r => ({
      title: r.title || "No Title",
      url: r.link || "",
      source: r.source_id || "Unknown Source",
      description: r.description || "No description provided",
      publishedAt: r.pubDate || null,
      creator: r.creator || "Unknown Creator"
    }));
    
  } catch (error) {
    logError("Newsdata.io request failed", { error: error.message });
    return [];
  }
}

// --- GOOGLE SEARCH IMPLEMENTATION (OPTIONAL) ---
async function googleSearch() {
  if (!CONFIG.GOOGLE_API_KEY || !CONFIG.GOOGLE_CX) {
    logInfo("Google Search credentials not configured, skipping");
    return null;
  }
  
  if (!query || query.trim().length === 0) {
    logError("Query is empty or invalid");
    return null;
  }
  
  const url = `https://www.googleapis.com/customsearch/v1?key=${CONFIG.GOOGLE_API_KEY}&cx=${CONFIG.GOOGLE_CX}&q=${encodeURIComponent(query)}&num=${CONFIG.MAX_RESULTS}`;
  
  try {
    const res = await fetchWithRetry(url);
    
    if (!res || !res.items || res.items.length === 0) {
      logWarn("Google Search returned no results");
      return null;
    }
    
    logInfo(`Google Search found ${res.items.length} results`);
    return res;
    
  } catch (error) {
    logError("Google Search failed", { error: error.message });
    return null;
  }
}

// --- GOOGLE IMAGES IMPLEMENTATION (OPTIONAL) ---
async function googleImages() {
  if (!CONFIG.GOOGLE_API_KEY || !CONFIG.GOOGLE_CX) {
    logInfo("Google Images credentials not configured, skipping");
    return null;
  }
  
  if (!query || query.trim().length === 0) {
    logError("Query is empty or invalid");
    return null;
  }
  
  const url = `https://www.googleapis.com/customsearch/v1?key=${CONFIG.GOOGLE_API_KEY}&cx=${CONFIG.GOOGLE_CX}&q=${encodeURIComponent(query)}&searchType=image&num=3`;
  
  try {
    const res = await fetchWithRetry(url);
    
    if (!res || !res.items || res.items.length === 0) {
      logWarn("Google Images returned no results");
      return null;
    }
    
    logInfo(`Google Images found ${res.items.length} results`);
    return res;
    
  } catch (error) {
    logError("Google Images failed", { error: error.message });
    return null;
  }
}

// --- FORMATTING FUNCTIONS ---
function formatSection(title, items) {
  if (!items || items.length === 0) {
    return null;
  }
  
  let section = `\n## ${title} (${items.length} results)\n`;
  
  items.forEach((item, index) => {
    section += `\n${index + 1}. **${item.title}**\n`;
    section += `   🔗 ${item.url}\n`;
    if (item.description) {
      section += `   📝 ${item.description}\n`;
    }
    if (item.source) {
      section += `   📰 Source: ${item.source}\n`;
    }
    if (item.publishedAt) {
      section += `   📅 ${new Date(item.publishedAt).toLocaleDateString()}\n`;
    }
    if (item.author || item.creator) {
      section += `   ✍️ ${item.author || item.creator}\n`;
    }
  });
  
  return section;
}

function formatImages(images) {
  if (!images || !images.items || images.items.length === 0) {
    return null;
  }
  
  let section = `\n## 🖼️ Related Images (${images.items.length} results)\n`;
  images.items.slice(0, 3).forEach((item, index) => {
    let title = item.title || `Image ${index + 1}`;
    let url = item.link || "#";
    let thumbnail = item.image?.thumbnailLink || url;
    
    section += `\n${index + 1}. **${title}**\n`;
    section += `   🔗 Image URL: ${url}\n`;
    section += `   🖼️ Thumbnail: ${thumbnail}\n`;
  });
  
  return section;
}

// --- INPUT HANDLING ---
async function getSearchQuery() {
  // First, try to get query from iOS Shortcuts input
  if (CONFIG.USE_SHORTCUTS_INPUT && typeof args !== 'undefined' && args) {
    if (args.shortcutParameter) {
      logInfo("Using query from Shortcuts input");
      return args.shortcutParameter.toString().trim();
    }
    
    if (args.queryText) {
      logInfo("Using query from script arguments");
      return args.queryText.toString().trim();
    }
    
    if (args.plainTexts && args.plainTexts[0]) {
      logInfo("Using query from plain text arguments");
      return args.plainTexts[0].toString().trim();
    }
  }
  
  // Try to get from clipboard
  try {
    if (typeof Pasteboard !== 'undefined') {
      const clipboardContent = Pasteboard.paste();
      if (clipboardContent && clipboardContent.trim().length > 0) {
        logInfo("Using query from clipboard");
        return clipboardContent.trim();
      }
    }
  } catch (error) {
    logWarn("Could not read from clipboard", { error: error.message });
  }
  
  // Fallback to a default query
  logWarn("No query found, using default");
  return "artificial intelligence technology"; // Default fallback query
}

// --- CONFIGURATION LOADING ---
async function loadConfiguration() {
  logInfo("Loading configuration from multiple sources");
  
  // First, try from iOS Shortcuts parameters
  if (typeof args !== 'undefined' && args) {
    if (args.apiKeys) {
      logInfo("Loading API keys from Shortcuts parameters");
      if (args.apiKeys.braveKey) CONFIG.BRAVE_API_KEY = args.apiKeys.braveKey;
      if (args.apiKeys.newsKey) CONFIG.NEWS_API_KEY = args.apiKeys.newsKey;
      if (args.apiKeys.newsdataKey) CONFIG.NEWSDATA_API_KEY = args.apiKeys.newsdataKey;
      if (args.apiKeys.googleKey) CONFIG.GOOGLE_API_KEY = args.apiKeys.googleKey;
      if (args.apiKeys.googleCx) CONFIG.GOOGLE_CX = args.apiKeys.googleCx;
    }
    
    // Individual key parameters (from PR #3 approach)
    if (args.newsApiKey) CONFIG.NEWS_API_KEY = args.newsApiKey;
    if (args.newsdataKey) CONFIG.NEWSDATA_API_KEY = args.newsdataKey;
    if (args.braveApiKey) CONFIG.BRAVE_API_KEY = args.braveApiKey;
    if (args.googleApiKey) CONFIG.GOOGLE_API_KEY = args.googleApiKey;
    if (args.googleCx) CONFIG.GOOGLE_CX = args.googleCx;
  }
  
  // Try to load from Keychain (iOS secure storage)
  if (CONFIG.USE_IOS_KEYCHAIN) {
    try {
      if (typeof Keychain !== 'undefined') {
        if (Keychain.contains("BRAVE_API_KEY")) {
          CONFIG.BRAVE_API_KEY = Keychain.get("BRAVE_API_KEY");
          logInfo("Loaded Brave API key from Keychain");
        }
        if (Keychain.contains("NEWS_API_KEY")) {
          CONFIG.NEWS_API_KEY = Keychain.get("NEWS_API_KEY");
          logInfo("Loaded News API key from Keychain");
        }
        if (Keychain.contains("NEWSDATA_API_KEY")) {
          CONFIG.NEWSDATA_API_KEY = Keychain.get("NEWSDATA_API_KEY");
          logInfo("Loaded Newsdata API key from Keychain");
        }
        if (Keychain.contains("GOOGLE_API_KEY")) {
          CONFIG.GOOGLE_API_KEY = Keychain.get("GOOGLE_API_KEY");
          logInfo("Loaded Google API key from Keychain");
        }
        if (Keychain.contains("GOOGLE_CX")) {
          CONFIG.GOOGLE_CX = Keychain.get("GOOGLE_CX");
          logInfo("Loaded Google CX from Keychain");
        }
      }
    } catch (error) {
      logWarn("Could not access Keychain", { error: error.message });
    }
  }
}

// --- MAIN EXECUTION ---
async function main() {
  try {
    logInfo("🚀 Starting Deep Research Multi-APIs for iOS");
    logInfo("Unified implementation with iOS 18.6+ compatibility");
    
    // Load configuration from multiple sources
    await loadConfiguration();
    
    // Get search query from multiple sources
    query = await getSearchQuery();
    
    if (!query || query.trim().length === 0) {
      throw new Error("No valid search query provided");
    }
    
    logInfo(`Searching for: "${query}"`);
    
    // Set timestamp
    timestamp = new Date().toLocaleString();
    
    // Execute all searches concurrently for better performance
    logInfo("Executing API searches concurrently...");
    const [brave, google, images, news] = await Promise.all([
      braveSearch(),
      googleSearch(), 
      googleImages(),
      newsAPI()
    ]);
    
    logInfo("All API searches completed");
    
    // Format results with enhanced formatting
    const sections = [
      `# 🧠 Deep Research Results – ${timestamp}`,
      `**Query:** "${query}"`,
      formatSection("🦁 Brave Search", brave?.web?.results),
      formatSection("🌐 Google Web", google?.items),
      formatImages(images),
      formatSection("📰 News", news)
    ];

    let output = sections.filter(Boolean).join("\n").trim();

    // Handle case with no results
    if (!output || output.length < 50) {
      output = `⚠️ No usable results returned for: "${query}"

**Possible issues:**
- Query too vague or specific
- API rate limits exceeded  
- Invalid API keys configured
- Network connectivity issues

**Suggestions:**
- Try refining your search query
- Check your API key configuration
- Verify internet connection
- Try again in a few minutes

**Debug Info:**
- Brave Search: ${brave ? '✅ Responded' : '❌ Failed'}
- Google Search: ${google ? '✅ Responded' : '❌ Failed'} 
- News Search: ${Array.isArray(news) ? `✅ ${news.length} results` : '❌ Failed'}
- Timestamp: ${timestamp}`;
    }

    // Enhanced iOS delivery with better error handling
    let clipboardSuccess = false;
    let shortcutSuccess = false;
    
    try {
      // Copy to clipboard if enabled
      if (CONFIG.COPY_TO_CLIPBOARD) {
        clipboardSuccess = copyToClipboard(output);
      }
      
      // Set Shortcuts output
      shortcutSuccess = setShortcutOutput(output);
      
    } catch (error) {
      handleIOSError(error, "Output Delivery");
    }

    // Show notification if enabled
    if (CONFIG.SHOW_NOTIFICATIONS && isRunningOnIOS()) {
      try {
        const notification = new Notification();
        notification.title = "🧠 Deep Research Complete";
        notification.body = `Results for "${query}" ready${clipboardSuccess ? ' (copied to clipboard)' : ''}`;
        notification.sound = null; // Silent notification
        await notification.schedule();
      } catch (error) {
        logWarn("Notification failed", { error: error.message });
      }
    }
    
    // Log final status
    logInfo("✅ Deep Research completed successfully");
    logInfo(`📋 Clipboard: ${clipboardSuccess ? "✅" : "❌"}`);
    logInfo(`🔗 Shortcuts: ${shortcutSuccess ? "✅" : "❌"}`);
    
    return output;
    
  } catch (error) {
    logError("❌ Deep Research failed", { error: error.message, stack: error.stack });
    
    const errorOutput = `❌ Deep Research Error

**Error:** ${error.message}

**Time:** ${new Date().toLocaleString()}

**Troubleshooting:**
1. Check your internet connection
2. Verify API keys are configured correctly
3. Try a different search query
4. Check iOS Shortcuts permissions

**Support:**
- Ensure clipboard access is enabled
- Verify Scriptable has network permissions
- Check that API keys are valid and not expired`;

    // Enhanced error delivery
    try {
      if (CONFIG.COPY_TO_CLIPBOARD) {
        copyToClipboard(errorOutput);
      }
      
      setShortcutOutput(errorOutput);
      
      if (CONFIG.SHOW_NOTIFICATIONS && isRunningOnIOS()) {
        const notification = new Notification();
        notification.title = "❌ Deep Research Error";
        notification.body = error.message;
        notification.sound = "failure";
        await notification.schedule();
      }
    } catch (deliveryError) {
      logError("Failed to deliver error message", { error: deliveryError.message });
    }
    
    throw error;
  }
}

// --- RUN THE SCRIPT ---
main().catch(error => {
  console.error("Fatal error in Deep Research script:", error);
});