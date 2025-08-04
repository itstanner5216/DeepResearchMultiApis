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
// Version: 2.0 - Enhanced with robust error handling and metadata

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
  // Enhanced input validation and initialization
  const Pasteboard = importModule("Pasteboard");

  // Get query from clipboard or Shortcuts parameter
  let query = "";
  if (args && args.shortcutParameter && args.shortcutParameter.query) {
    query = args.shortcutParameter.query;
    console.log("📱 Using query from Shortcuts parameter");
  } else {
    query = Pasteboard.pasteString();
    console.log("📋 Using query from clipboard");
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

// Enhanced fetch function with retry logic and timeout handling
async function fetchJSONWithRetry(url, headers = {}, retries = CONFIG.RETRY_COUNT) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const req = new Request(url);
      Object.entries(headers).forEach(([k, v]) => req.headers[k] = v);
      req.timeoutInterval = CONFIG.TIMEOUT_MS / 1000; // Scriptable uses seconds
      
      const data = await req.loadJSON();
      console.log(`✅ API call successful on attempt ${attempt}`);
      return { success: true, data: data };
    } catch (error) {
      console.log(`⚠️ Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === retries + 1) {
        return { 
          success: false, 
          error: error.message,
          statusCode: error.statusCode || null
        };
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 1000, 10000);
      console.log(`⏱️ Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => Timer.schedule(delay, false, resolve));
    }
  }
}

// Enhanced URL cleaning function
function cleanURL(url) {
  try {
    if (!url) return "Invalid URL";
    
    // Handle malformed URLs
    let cleanUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      cleanUrl = 'https://' + url;
    }
    
    const urlObj = new URL(cleanUrl);
    return urlObj.hostname + urlObj.pathname.replace(/\/$/, '');
  } catch (error) {
    // Fallback to simple cleaning for malformed URLs
    return url.replace(/^https?:\/\/(www\.)?/, "").split(/[?#]/)[0];
  }
}

// Enhanced content scraping function
async function scrapeContent(url) {
  if (!CONFIG.SCRAPE_CONTENT || !url) {
    return null;
  }
  
  try {
    console.log(`📄 Scraping content from: ${url}`);
    
    const req = new Request(url);
    req.headers = {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
    };
    req.timeoutInterval = CONFIG.TIMEOUT_MS / 1000;
    
    const html = await req.loadString();
    
    // Extract text content by removing HTML tags, scripts, and styles
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-zA-Z0-9#]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Limit content length for mobile performance
    if (content.length > CONFIG.MAX_CONTENT_LENGTH) {
      content = content.substring(0, CONFIG.MAX_CONTENT_LENGTH) + "...";
    }
    
    console.log(`✅ Content scraped: ${content.length} characters`);
    return content;
    
  } catch (error) {
    console.log(`❌ Content scraping failed for ${url}: ${error.message}`);
    return null;
  }
}

// Enhanced auto-summarization function
function summarizeContent(content) {
  if (!CONFIG.SUMMARIZE || !content || content.length < 100) {
    return null;
  }
  
  try {
    console.log("🧠 Generating summary...");
    
    // Split into sentences
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);
    
    if (sentences.length < 3) {
      return null;
    }
    
    // Score sentences based on position and keywords
    const keywords = ['important', 'significant', 'breakthrough', 'research', 'findings', 'reveals', 'shows', 'demonstrates', 'conclude', 'result'];
    
    const scored = sentences.map((sentence, i) => {
      let score = 0;
      
      // Position scoring (intro and conclusion weighted higher)
      if (i < sentences.length * 0.3) score += 2; // First 30%
      if (i > sentences.length * 0.7) score += 1; // Last 30%
      
      // Keyword scoring
      const lowerSentence = sentence.toLowerCase();
      keywords.forEach(keyword => {
        if (lowerSentence.includes(keyword)) score += 3;
      });
      
      // Length scoring (medium length preferred)
      if (sentence.length > 50 && sentence.length < 200) score += 1;
      
      return { sentence: sentence.trim(), score, index: i };
    });
    
    // Take top 3-5 sentences
    scored.sort((a, b) => b.score - a.score);
    const topSentences = scored.slice(0, Math.min(5, Math.max(3, sentences.length / 3)));
    
    // Restore original order
    topSentences.sort((a, b) => a.index - b.index);
    
    const summary = topSentences.map(item => `• ${item.sentence}`).join('\n');
    console.log(`✅ Summary generated: ${topSentences.length} key points`);
    
    return summary;
    
  } catch (error) {
    console.log(`❌ Summarization failed: ${error.message}`);
    return null;
  }
}

// Enhanced Brave Search with comprehensive error handling
async function braveSearch(q) {
  if (!CONFIG.BRAVE_API_KEY) {
    console.log("❌ Brave API key not configured");
    return { success: false, error: "API key not configured", results: [] };
  }
  
  if (!q || q.trim().length < 2) {
    console.log("❌ Query too short for Brave Search");
    return { success: false, error: "Query must be at least 2 characters", results: [] };
  }
  
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=${CONFIG.MAX_RESULTS}`;
  const headers = { "X-Subscription-Token": CONFIG.BRAVE_API_KEY };
  
  console.log("🔍 Searching with Brave...");
  const response = await fetchJSONWithRetry(url, headers);
  
  if (!response.success) {
    const errorMsg = response.statusCode === 401 ? "Invalid API key" : 
                    response.statusCode === 429 ? "Rate limit exceeded" :
                    response.error || "Unknown error";
    console.log(`❌ Brave Search failed: ${errorMsg}`);
    return { success: false, error: errorMsg, results: [] };
  }
  
  if (!response.data?.web?.results) {
    console.log("⚠️ No web results from Brave Search");
    return { success: false, error: "No results found", results: [] };
  }
  
  return { 
    success: true, 
    results: response.data.web.results,
    totalResults: response.data.web.results.length
  };
}

// Enhanced News Search with comprehensive error handling and metadata
async function newsSearch(q) {
  if (!CONFIG.NEWS_API_KEY) {
    console.log("❌ NewsAPI key not configured");
    return { success: false, error: "API key not configured", results: [] };
  }
  
  if (!q || q.trim().length < 2) {
    console.log("❌ Query too short for News Search");
    return { success: false, error: "Query must be at least 2 characters", results: [] };
  }
  
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&pageSize=${CONFIG.MAX_RESULTS}&apiKey=${CONFIG.NEWS_API_KEY}&sortBy=publishedAt`;
  
  console.log("📰 Searching news...");
  const response = await fetchJSONWithRetry(url);
  
  if (!response.success) {
    const errorMsg = response.statusCode === 401 ? "Invalid API key" : 
                    response.statusCode === 429 ? "Rate limit exceeded" :
                    response.statusCode === 426 ? "Upgrade required" :
                    response.error || "Unknown error";
    console.log(`❌ NewsAPI failed: ${errorMsg}`);
    return { success: false, error: errorMsg, results: [] };
  }
  
  if (response.data?.status !== 'ok') {
    console.log(`❌ NewsAPI error: ${response.data?.message || 'Unknown error'}`);
    return { success: false, error: response.data?.message || 'API error', results: [] };
  }
  
  if (!response.data?.articles?.length) {
    console.log("⚠️ No articles found");
    return { success: false, error: "No articles found", results: [] };
  }
  
  return { 
    success: true, 
    results: response.data.articles,
    totalResults: response.data.totalResults || response.data.articles.length
  };
}

// Enhanced markdown formatting with metadata and content scraping
async function formatMarkdown(results, title, isNews = false) {
  let md = `## ${title}\n`;
  
  if (!results?.length) {
    return md + "❌ No results available.\n\n";
  }
  
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const itemTitle = r.title || "Untitled";
    const itemUrl = r.url || "#";
    const description = r.description || r.snippet || "No preview available.";
    
    md += `${i + 1}. **${itemTitle}**\n`;
    md += `🔗 ${cleanURL(itemUrl)}\n`;
    
    if (isNews) {
      // Add news-specific metadata
      if (r.publishedAt) {
        const publishDate = new Date(r.publishedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        md += `📅 Published: ${publishDate}\n`;
      }
      
      if (r.source?.name) {
        md += `📰 Source: ${r.source.name}\n`;
      }
      
      if (r.author && r.author !== "Unknown author") {
        md += `✍️ Author: ${r.author}\n`;
      }
    }
    
    md += `📝 ${description}\n`;
    
    // Add scraped content and summary if enabled
    if (CONFIG.SCRAPE_CONTENT && itemUrl && itemUrl !== "#") {
      const content = await scrapeContent(itemUrl);
      if (content) {
        if (CONFIG.SUMMARIZE) {
          const summary = summarizeContent(content);
          if (summary) {
            md += `📄 **Key Points:**\n${summary}\n`;
          }
        } else {
          const preview = content.length > 300 ? content.substring(0, 300) + "..." : content;
          md += `📄 **Content Preview:** ${preview}\n`;
        }
      }
    }
    
    md += "\n";
  }
  
  return md;
}

// Utility function to format date safely
function formatDate(dateString) {
  try {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return null;
  }
}

// Enhanced main execution function with comprehensive error handling
async function run(query, timestamp) {
  console.log(`🧠 Starting Deep Research for: "${query}"`);
  
  const errors = [];
  let totalResults = 0;
  
  // Initialize output with header
  let output = `# 🧠 Deep Research Result – ${timestamp}\n**Query:** ${query}\n\n`;
  
  // Execute searches with fallback logic
  console.log("🔍 Executing web search...");
  const braveResult = await braveSearch(query);
  
  if (braveResult.success && braveResult.results?.length) {
    console.log(`✅ Brave Search: ${braveResult.results.length} results`);
    const webResults = braveResult.results.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.description || r.snippet || "",
    }));
    output += await formatMarkdown(webResults, "🌐 Web Results");
    totalResults += braveResult.results.length;
  } else {
    console.log(`❌ Brave Search failed: ${braveResult.error}`);
    errors.push(`Web Search: ${braveResult.error}`);
    output += "## 🌐 Web Results\n❌ Web search failed\n\n";
  }
  
  console.log("📰 Executing news search...");
  const newsResult = await newsSearch(query);
  
  if (newsResult.success && newsResult.results?.length) {
    console.log(`✅ News Search: ${newsResult.results.length} results`);
    const newsResults = newsResult.results.map(a => ({
      title: a.title,
      url: a.url,
      description: a.description || a.content || "",
      publishedAt: a.publishedAt,
      source: a.source,
      author: a.author
    }));
    output += await formatMarkdown(newsResults, "📰 News Results", true);
    totalResults += newsResult.results.length;
  } else {
    console.log(`❌ News Search failed: ${newsResult.error}`);
    errors.push(`News Search: ${newsResult.error}`);
    output += "## 📰 News Results\n❌ News search failed\n\n";
  }
  
  // Add summary and error information
  output += `---\n**📊 Summary:** ${totalResults} total results found\n`;
  output += `**⏰ Generated:** ${timestamp}\n`;
  
  if (errors.length > 0) {
    output += `**⚠️ Errors:** ${errors.join(", ")}\n`;
  }
  
  // Handle output based on configuration
  if (CONFIG.COPY_TO_CLIPBOARD && totalResults > 0) {
    const Pasteboard = importModule("Pasteboard");
    Pasteboard.copy(output);
    console.log("📋 Results copied to clipboard");
  }
  
  // Send appropriate notification
  if (CONFIG.SHOW_NOTIFICATIONS) {
    if (totalResults > 0) {
      const features = [];
      if (CONFIG.SCRAPE_CONTENT) features.push("content");
      if (CONFIG.SUMMARIZE) features.push("summaries");
      const featuresText = features.length > 0 ? ` with ${features.join(" + ")}` : "";
      
      await showNotification("🧠 Research Complete", `Found ${totalResults} results${featuresText}. ${errors.length > 0 ? `${errors.length} API(s) failed.` : 'All APIs succeeded.'}`);
    } else {
      await showNotification("⚠️ Research Failed", `No results found. Check your query and API configuration.`);
    }
  }
  
  // Set shortcut output for iOS Shortcuts integration
  Script.setShortcutOutput(output);
  
  console.log(`🎯 Research completed: ${totalResults} results, ${errors.length} errors`);
  Script.complete();
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