/**
 * Simple Demo Script for Deep Research Multi-APIs
 * 
 * This demonstrates the core functions working without requiring real API keys.
 * Perfect for testing the implementation and showing how the script works.
 */

// Mock the Scriptable environment for demo purposes
if (typeof global !== 'undefined') {
  // Running in Node.js for demo
  global.Request = class {
    constructor(url) { this.url = url; this.headers = {}; this.timeoutInterval = 10; }
    async loadJSON() {
      console.log(`📡 Demo API call to: ${this.url}`);
      if (this.url.includes('brave')) {
        return { web: { results: [{ title: "Demo Brave Result", url: "https://example.com", description: "This is a demo result from Brave Search" }] } };
      } else if (this.url.includes('newsapi')) {
        return { status: "ok", articles: [{ title: "Demo News Article", url: "https://news.example.com", description: "Demo news article", source: { name: "Demo News" } }] };
      } else if (this.url.includes('newsdata')) {
        return { status: "success", results: [{ title: "Demo Newsdata Article", link: "https://newsdata.example.com", description: "Demo newsdata article", source_id: "demo_source" }] };
      }
      throw new Error("Demo network error");
    }
  };
  
  global.Pasteboard = {
    paste: () => "artificial intelligence",
    copy: (text) => { console.log(`📋 Clipboard: ${text.substring(0, 100)}...`); }
  };
  
  global.Notification = class {
    constructor() { this.title = ""; this.body = ""; this.sound = null; }
    async schedule() { console.log(`🔔 Notification: ${this.title} - ${this.body}`); }
  };
  
  global.Script = {
    setShortcutOutput: (output) => { console.log(`📱 Shortcuts Output Ready (${output.length} chars)`); }
  };
  
  global.Keychain = {
    contains: () => false,
    get: () => "",
    set: () => {}
  };
  
  global.Timer = {
    schedule: (delay, repeat, callback) => setTimeout(callback, delay)
  };
  
  global.args = null;
}

// Configuration for demo
const CONFIG = {
  BRAVE_API_KEY: "demo_brave_key",
  NEWS_API_KEY: "demo_news_key",  
  NEWSDATA_API_KEY: "demo_newsdata_key",
  MAX_RESULTS: 3,
  TIMEOUT_MS: 10000,
  RETRY_COUNT: 1,
  USE_SHORTCUTS_INPUT: true,
  COPY_TO_CLIPBOARD: true,
  SHOW_NOTIFICATIONS: true
};

let query = "";
let timestamp = new Date().toLocaleString();

// Utility functions
function log(level, message, data = null) {
  console.log(`[${level}] ${message}`);
  if (data && typeof data === 'object') {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logInfo(message, data = null) { log("INFO", message, data); }
function logWarn(message, data = null) { log("WARN", message, data); }
function logError(message, data = null) { log("ERROR", message, data); }

// Core functions (simplified for demo)
async function fetchJSON(url, headers = {}) {
  try {
    let req = new Request(url);
    req.headers = headers;
    let json = await req.loadJSON();
    logInfo("✅ API call successful");
    return json;
  } catch (e) {
    logError("❌ API call failed: " + e.message);
    return null;
  }
}

async function braveSearch() {
  logInfo("🦁 Starting Brave Search...");
  
  if (!query) {
    logError("No query provided");
    return null;
  }
  
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${CONFIG.MAX_RESULTS}`;
  const headers = { 'X-Subscription-Token': CONFIG.BRAVE_API_KEY };
  
  const res = await fetchJSON(url, headers);
  
  if (res && res.web && res.web.results) {
    logInfo(`Found ${res.web.results.length} Brave Search results`);
    return res;
  }
  
  return null;
}

async function newsAPI() {
  logInfo("📰 Starting NewsAPI search...");
  
  if (!query) {
    logError("No query provided");
    return [];
  }
  
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${CONFIG.NEWS_API_KEY}`;
  const res = await fetchJSON(url);
  
  if (res && res.status === "ok" && res.articles) {
    logInfo(`Found ${res.articles.length} news articles`);
    return res.articles.map(article => ({
      title: article.title,
      url: article.url,
      source: article.source?.name,
      description: article.description
    }));
  }
  
  logWarn("NewsAPI failed, trying fallback...");
  return await newsdataFallback();
}

async function newsdataFallback() {
  logInfo("📡 Starting Newsdata.io fallback...");
  
  if (!query) {
    logError("No query provided");
    return [];
  }
  
  const url = `https://newsdata.io/api/1/news?apikey=${CONFIG.NEWSDATA_API_KEY}&q=${encodeURIComponent(query)}`;
  const res = await fetchJSON(url);
  
  if (res && res.status === "success" && res.results) {
    logInfo(`Found ${res.results.length} fallback articles`);
    return res.results.map(r => ({
      title: r.title,
      url: r.link,
      source: r.source_id,
      description: r.description
    }));
  }
  
  logWarn("Fallback also failed");
  return [];
}

function formatSection(title, items) {
  if (!items || items.length === 0) return null;
  
  let section = `\n## ${title}\n`;
  items.forEach((item, index) => {
    section += `\n${index + 1}. **${item.title}**\n`;
    section += `   🔗 ${item.url}\n`;
    if (item.description) {
      section += `   📝 ${item.description}\n`;
    }
  });
  
  return section;
}

async function getSearchQuery() {
  // Try clipboard first
  try {
    const clipboardContent = Pasteboard.paste();
    if (clipboardContent && clipboardContent.trim()) {
      logInfo("Using query from clipboard");
      return clipboardContent.trim();
    }
  } catch (error) {
    logWarn("Could not read clipboard");
  }
  
  // Fallback to default
  return "artificial intelligence";
}

// Main demo function
async function demoDeepResearch() {
  console.log("🚀 Deep Research Multi-APIs Demo");
  console.log("=".repeat(50));
  
  try {
    // Get search query
    query = await getSearchQuery();
    logInfo(`Demo search query: "${query}"`);
    
    // Execute searches
    console.log("\n📡 Executing API searches...");
    const [brave, news] = await Promise.all([
      braveSearch(),
      newsAPI()
    ]);
    
    // Format results
    const sections = [
      `# 🧠 Demo Deep Research Results`,
      `**Query:** "${query}"`,
      `**Time:** ${new Date().toLocaleString()}`,
      formatSection("🦁 Brave Search", brave?.web?.results),
      formatSection("📰 News", news)
    ];

    const output = sections.filter(Boolean).join("\n");
    
    console.log("\n" + "=".repeat(50));
    console.log("📋 DEMO RESULTS:");
    console.log("=".repeat(50));
    console.log(output);
    console.log("=".repeat(50));
    
    // Simulate iOS integrations
    if (CONFIG.COPY_TO_CLIPBOARD) {
      Pasteboard.copy(output);
    }
    
    if (CONFIG.SHOW_NOTIFICATIONS) {
      const notification = new Notification();
      notification.title = "🧠 Demo Research Complete";
      notification.body = `Demo results for "${query}" ready`;
      await notification.schedule();
    }
    
    Script.setShortcutOutput(output);
    
    console.log("\n✅ Demo completed successfully!");
    console.log("\n💡 This demonstrates:");
    console.log("  • Brave Search API integration");
    console.log("  • NewsAPI with fallback to Newsdata.io");
    console.log("  • Clipboard input/output workflow");
    console.log("  • iOS Shortcuts integration");
    console.log("  • Error handling and logging");
    console.log("  • Mobile-optimized formatting");
    
    return output;
    
  } catch (error) {
    logError("Demo failed: " + error.message);
    
    const errorOutput = `❌ Demo Error: ${error.message}`;
    Pasteboard.copy(errorOutput);
    Script.setShortcutOutput(errorOutput);
    
    console.log("\n❌ Demo encountered an error.");
    console.log("In a real iOS environment, this would be handled gracefully.");
  }
}

// Run demo
if (require.main === module) {
  demoDeepResearch();
}