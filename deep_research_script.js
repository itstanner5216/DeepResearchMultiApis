const BRAVE_API_KEY = "BSAUZcHnbsKgi9GTsu4wQV2SPEeZ3wy";
const NEWS_API_KEY = "09494b1a857d48a3b7fe62515c1ab8f9";

const CONFIG = {
  BRAVE_API_KEY: BRAVE_API_KEY,
  NEWS_API_KEY: NEWS_API_KEY,
  TIMEOUT_MS: 15000,
  RETRY_COUNT: 2,
  MAX_RESULTS: 5,
  COPY_TO_CLIPBOARD: true,
  SHOW_NOTIFICATIONS: true,
  SCRAPE_CONTENT: true,
  MAX_CONTENT_LENGTH: 5000,
  SUMMARIZE: true
};

if (args && args.shortcutParameter) {
  const params = args.shortcutParameter;
  if (params.braveKey) CONFIG.BRAVE_API_KEY = params.braveKey;
  if (params.newsKey) CONFIG.NEWS_API_KEY = params.newsKey;
  if (params.scrapeContent !== undefined) CONFIG.SCRAPE_CONTENT = params.scrapeContent;
  if (params.summarize !== undefined) CONFIG.SUMMARIZE = params.summarize;
  if (params.maxContentLength) CONFIG.MAX_CONTENT_LENGTH = params.maxContentLength;
}

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
      throw new Error("Critical configuration error: No API keys found. Both BRAVE_API_KEY and NEWS_API_KEY are missing.");
    }
  }
  console.log("✅ Configuration validated");
  return true;
}

try {
  validateConfiguration();
} catch (error) {
  console.log(`❌ Configuration validation failed: ${error.message}`);
  Script.complete();
}

async function main() {
  console.log("🧠 Starting main execution...");
  let query = args?.shortcutParameter?.query || Pasteboard.paste();
  if (!query) {
    console.log("❌ No input found in clipboard or parameters");
    await showNotification("❌ No Input", "Please copy a search query to the clipboard or pass via Shortcuts.");
    Script.complete();
    return;
  }
  
  query = query.trim();
  if (query.length < 2) {
    console.log("❌ Query too short (minimum 2 characters required)");
    await showNotification("❌ Query Too Short", "Search query must be at least 2 characters long.");
    Script.complete();
    return;
  }

  if (query.length > 200) {
    console.log("⚠️ Query very long, truncating to 200 characters");
    let truncated = query.substring(0, 200);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 150) {
      truncated = truncated.substring(0, lastSpace);
    }
    query = truncated.trim();
    await showNotification("⚠️ Query Truncated", `Search query was shortened to ${query.length} characters.`);
  }

  const encodedQuery = encodeURIComponent(query);

  console.log(`✅ Query validated and encoded: ",