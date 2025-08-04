/**
 * Demo Script for Deep Research Multi-APIs
 * 
 * This demonstrates the unified Deep Research implementation working without requiring real API keys.
 * Perfect for understanding the functionality and testing the workflow.
 */

console.log("🚀 Deep Research Multi-APIs Demo");
console.log("=".repeat(50));
console.log("This demo shows how the unified implementation works without real API keys.\n");

// Mock the Scriptable environment for demo purposes
if (typeof global !== 'undefined') {
  // Running in Node.js for demo
  global.Request = class DemoRequest {
    constructor(url) { 
      this.url = url; 
      this.headers = {}; 
      this.timeoutInterval = 10; 
    }
    
    async loadJSON() {
      console.log(`📡 Demo API call to: ${this.url}`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      if (this.url.includes('brave')) {
        return { 
          web: { 
            results: [
              { title: "Demo: The Future of AI Technology", url: "https://example.com/ai-future", description: "Exploring the latest developments in artificial intelligence and their impact on society." },
              { title: "Demo: Machine Learning Breakthrough", url: "https://example.com/ml-breakthrough", description: "Scientists achieve new milestone in machine learning research." }
            ] 
          } 
        };
      } else if (this.url.includes('newsapi')) {
        return { 
          status: "ok", 
          articles: [
            { title: "Demo: AI News Article", url: "https://news.example.com/ai-news", description: "Latest developments in AI technology", source: { name: "Demo Tech News" }, publishedAt: "2024-01-15T10:00:00Z", author: "Demo Author" },
            { title: "Demo: Tech Industry Update", url: "https://news.example.com/tech-update", description: "Industry insights and trends", source: { name: "Demo Business" }, publishedAt: "2024-01-15T09:00:00Z", author: "Jane Demo" }
          ] 
        };
      } else if (this.url.includes('newsdata')) {
        return { 
          status: "success", 
          results: [
            { title: "Demo: Global Tech Trends", link: "https://newsdata.example.com/tech-trends", description: "Worldwide technology trends analysis", source_id: "demo_global", pubDate: "2024-01-15 08:00:00", creator: "Demo Reporter" }
          ] 
        };
      }
      
      throw new Error("Demo network error");
    }
  };
  
  global.Pasteboard = {
    paste: () => "artificial intelligence technology trends",
    copy: (text) => { 
      console.log(`📋 Demo: Results copied to clipboard (${text.length} characters)`);
      global.demoClipboard = text;
    }
  };
  
  global.Notification = class DemoNotification {
    constructor() { this.title = ""; this.body = ""; this.sound = null; }
    async schedule() { 
      console.log(`🔔 Demo Notification: ${this.title} - ${this.body}`); 
    }
  };
  
  global.Script = {
    setShortcutOutput: (output) => { 
      console.log(`📱 Demo: Shortcuts output ready (${output.length} characters)`);
      global.demoShortcutOutput = output;
    }
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

// Demo configuration
const DEMO_CONFIG = {
  BRAVE_API_KEY: "demo_brave_key_12345",
  NEWS_API_KEY: "demo_news_key_67890",  
  NEWSDATA_API_KEY: "demo_newsdata_key_abcde",
  MAX_RESULTS: 3,
  TIMEOUT_MS: 5000,
  RETRY_COUNT: 1,
  USE_SHORTCUTS_INPUT: true,
  COPY_TO_CLIPBOARD: true,
  SHOW_NOTIFICATIONS: true
};

let query = "";
let timestamp = new Date().toLocaleString();

// Demo utility functions
function demoLog(level, message, data = null) {
  const logMessage = `[DEMO ${level}] ${message}`;
  console.log(logMessage);
  if (data && typeof data === 'object') {
    console.log(JSON.stringify(data, null, 2));
  }
}

function isRunningOnIOS() {
  return typeof Pasteboard !== 'undefined' && typeof Script !== 'undefined';
}

// Demo core functions
async function demoFetchJSON(url, headers = {}) {
  try {
    let req = new Request(url);
    req.headers = headers;
    let json = await req.loadJSON();
    demoLog("INFO", "✅ API call successful");
    return json;
  } catch (e) {
    demoLog("ERROR", "❌ API call failed: " + e.message);
    return null;
  }
}

async function demoBraveSearch() {
  demoLog("INFO", "🦁 Starting Brave Search demo...");
  
  if (!query) {
    demoLog("ERROR", "No query provided");
    return null;
  }
  
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${DEMO_CONFIG.MAX_RESULTS}`;
  const headers = { 'X-Subscription-Token': DEMO_CONFIG.BRAVE_API_KEY };
  
  const res = await demoFetchJSON(url, headers);
  
  if (res && res.web && res.web.results) {
    demoLog("INFO", `Found ${res.web.results.length} Brave Search results`);
    return res;
  }
  
  return null;
}

async function demoNewsAPI() {
  demoLog("INFO", "📰 Starting NewsAPI demo...");
  
  if (!query) {
    demoLog("ERROR", "No query provided");
    return [];
  }
  
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${DEMO_CONFIG.NEWS_API_KEY}`;
  const res = await demoFetchJSON(url);
  
  if (res && res.status === "ok" && res.articles) {
    demoLog("INFO", `Found ${res.articles.length} news articles`);
    return res.articles.map(article => ({
      title: article.title,
      url: article.url,
      source: article.source?.name,
      description: article.description,
      publishedAt: article.publishedAt,
      author: article.author
    }));
  }
  
  demoLog("WARN", "NewsAPI demo failed, trying fallback...");
  return await demoNewsdataFallback();
}

async function demoNewsdataFallback() {
  demoLog("INFO", "📡 Starting Newsdata.io fallback demo...");
  
  if (!query) {
    demoLog("ERROR", "No query provided");
    return [];
  }
  
  const url = `https://newsdata.io/api/1/news?apikey=${DEMO_CONFIG.NEWSDATA_API_KEY}&q=${encodeURIComponent(query)}`;
  const res = await demoFetchJSON(url);
  
  if (res && res.status === "success" && res.results) {
    demoLog("INFO", `Found ${res.results.length} fallback articles`);
    return res.results.map(r => ({
      title: r.title,
      url: r.link,
      source: r.source_id,
      description: r.description,
      publishedAt: r.pubDate,
      creator: r.creator
    }));
  }
  
  demoLog("WARN", "Fallback also failed");
  return [];
}

function demoFormatSection(title, items) {
  if (!items || items.length === 0) return null;
  
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

async function demoGetSearchQuery() {
  try {
    const clipboardContent = Pasteboard.paste();
    if (clipboardContent && clipboardContent.trim()) {
      demoLog("INFO", "Using query from demo clipboard");
      return clipboardContent.trim();
    }
  } catch (error) {
    demoLog("WARN", "Could not read demo clipboard");
  }
  
  return "artificial intelligence technology trends";
}

// Main demo function
async function runDeepResearchDemo() {
  console.log("📱 iOS Environment:", isRunningOnIOS() ? "Detected ✅" : "Not detected ❌");
  console.log("🔧 Demo Mode: Full functionality simulation\n");
  
  try {
    // Get search query
    query = await demoGetSearchQuery();
    demoLog("INFO", `Demo search query: "${query}"`);
    
    // Set timestamp
    timestamp = new Date().toLocaleString();
    
    // Execute searches
    console.log("\n📡 Executing demo API searches...");
    const [brave, news] = await Promise.all([
      demoBraveSearch(),
      demoNewsAPI()
    ]);
    
    console.log("\n✅ All demo API searches completed");
    
    // Format results
    const sections = [
      `# 🧠 Deep Research Demo Results – ${timestamp}`,
      `**Query:** "${query}"`,
      demoFormatSection("🦁 Brave Search", brave?.web?.results),
      demoFormatSection("📰 News", news)
    ];

    const output = sections.filter(Boolean).join("\n");
    
    console.log("\n" + "=".repeat(60));
    console.log("📋 DEMO RESULTS OUTPUT:");
    console.log("=".repeat(60));
    console.log(output);
    console.log("=".repeat(60));
    
    // Simulate iOS integrations
    if (DEMO_CONFIG.COPY_TO_CLIPBOARD) {
      Pasteboard.copy(output);
    }
    
    if (DEMO_CONFIG.SHOW_NOTIFICATIONS) {
      const notification = new Notification();
      notification.title = "🧠 Demo Research Complete";
      notification.body = `Demo results for "${query}" ready`;
      await notification.schedule();
    }
    
    Script.setShortcutOutput(output);
    
    console.log("\n✅ Demo completed successfully!");
    console.log("\n💡 This demo demonstrates:");
    console.log("  • Multiple API integration (Brave Search, NewsAPI, Newsdata.io)");
    console.log("  • Intelligent fallback mechanism (NewsAPI → Newsdata.io)");
    console.log("  • iOS clipboard input/output workflow");
    console.log("  • iOS Shortcuts integration compatibility");
    console.log("  • Comprehensive error handling and logging");
    console.log("  • Mobile-optimized result formatting");
    console.log("  • Concurrent API execution for performance");
    
    console.log("\n🚀 Ready for production use with real API keys!");
    console.log("📖 See iOS-SETUP.md for installation instructions");
    
    return output;
    
  } catch (error) {
    demoLog("ERROR", "Demo failed: " + error.message);
    
    const errorOutput = `❌ Demo Error: ${error.message}`;
    Pasteboard.copy(errorOutput);
    Script.setShortcutOutput(errorOutput);
    
    console.log("\n❌ Demo encountered an error.");
    console.log("In a real iOS environment, this would be handled gracefully with user-friendly error messages.");
  }
}

// Feature showcase
console.log("🎯 Key Features Showcase:");
console.log("  ✅ iOS 18.6+ Scriptable compatibility");
console.log("  ✅ Multiple API source integration");
console.log("  ✅ Intelligent fallback mechanisms");
console.log("  ✅ Clipboard-based workflow");
console.log("  ✅ iOS Shortcuts integration");
console.log("  ✅ Siri voice activation support");
console.log("  ✅ Comprehensive error handling");
console.log("  ✅ Mobile network optimization");
console.log("  ✅ Secure API key management");
console.log("  ✅ Native iOS notifications\n");

// Run demo
runDeepResearchDemo();

// Export for Node.js if available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runDeepResearchDemo };
}