/**
 * Deep Research Script for iOS Shortcuts
 * Enhanced multi-API research tool with improved error handling, partial failure support,
 * and better result formatting. Uses environment variables for secure API key management.
 */

// Load environment variables if available
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || "";
const NEWS_API_KEY = process.env.NEWS_API_KEY || "";

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

// Override configuration with Shortcuts parameters if provided
if (args && args.shortcutParameter) {
  const params = args.shortcutParameter;
  if (params.braveKey) CONFIG.BRAVE_API_KEY = params.braveKey;
  if (params.newsKey) CONFIG.NEWS_API_KEY = params.newsKey;
  if (params.scrapeContent !== undefined) CONFIG.SCRAPE_CONTENT = params.scrapeContent;
  if (params.summarize !== undefined) CONFIG.SUMMARIZE = params.summarize;
  if (params.maxContentLength) CONFIG.MAX_CONTENT_LENGTH = params.maxContentLength;
}

/**
 * Validates the configuration and throws meaningful errors for critical issues
 * @returns {boolean} true if configuration is valid
 * @throws {Error} when critical configuration issues are found
 */
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

// Validate configuration on startup
try {
  validateConfiguration();
} catch (error) {
  console.log(`❌ Configuration validation failed: ${error.message}`);
  Script.complete();
}

const Pasteboard = importModule("Pasteboard");

/**
 * Main execution function with enhanced input validation and processing
 */
async function main() {
  console.log("🧠 Starting main execution...");
  let query = args?.shortcutParameter?.query || Pasteboard.pasteString();
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
  
  // Improved query truncation with word boundary preservation
  if (query.length > 200) {
    console.log("⚠️ Query very long, truncating to 200 characters");
    // Try to truncate at a word boundary
    let truncated = query.substring(0, 200);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 150) { // Only use word boundary if it's not too short
      truncated = truncated.substring(0, lastSpace);
    }
    query = truncated.trim();
    await showNotification("⚠️ Query Truncated", `Search query was shortened to ${query.length} characters.`);
  }

  const encodedQuery = encodeURIComponent(query);

  console.log(`✅ Query validated and encoded: "${query}" (${query.length} characters)`);
  const now = new Date();
  const timestamp = now.toLocaleString("en-US", {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  await run(encodedQuery, timestamp);
}

/**
 * Show notification with fallback for environments without native notifications
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {boolean} sound - Whether to play sound
 */
async function showNotification(title, body, sound = true) {
  if (!CONFIG.SHOW_NOTIFICATIONS) {
    console.log(`🔔 Notification (silent): ${title} - ${body}`);
    return;
  }
  
  try {
    // Try native notification first
    let n = new Notification();
    n.title = title;
    n.body = body;
    n.sound = sound ? "default" : null;
    n.identifier = `deep-research-${Date.now()}`;
    await n.schedule();
    console.log(`🔔 Notification sent: ${title}`);
  } catch (error) {
    // Fallback: log notification details to console
    console.log(`🔔 Notification (fallback): ${title}`);
    console.log(`   📝 ${body}`);
    console.log(`   ⚠️ Native notifications unavailable: ${error.message}`);
  }
}

/**
 * Execute search across multiple APIs with graceful partial failure handling
 * @param {string} searchQuery - Encoded search query
 * @param {string} timestamp - Formatted timestamp for logging
 */
async function run(searchQuery, timestamp) {
  const braveSearchUrl = `https://api.search.brave.com/res/v1/web/search?q=${searchQuery}&count=${CONFIG.MAX_RESULTS}`;
  const newsApiUrl = `https://newsapi.org/v2/everything?q=${searchQuery}&apiKey=${CONFIG.NEWS_API_KEY}`;

  /**
   * Fetch with retry logic, exponential backoff, and delays between retries
   * @param {string} url - The URL to fetch
   * @param {object} headers - Request headers
   * @param {number} retries - Number of retry attempts
   * @returns {Promise} Response data
   */
  const fetchWithRetry = async (url, headers = {}, retries = CONFIG.RETRY_COUNT) => {
    for (let i = 0; i < retries; i++) {
      try {
        const req = new Request(url);
        req.timeoutInterval = CONFIG.TIMEOUT_MS / 1000;
        Object.entries(headers).forEach(([k, v]) => req.headers[k] = v);
        return await req.loadJSON();
      } catch (error) {
        console.log(`Retry ${i + 1}/${retries} failed for URL: ${url}`);
        if (i === retries - 1) throw error;
        
        // Exponential backoff: wait 2^i seconds (1s, 2s, 4s, etc.)
        const delay = Math.pow(2, i) * 1000;
        console.log(`Waiting ${delay}ms before next retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  try {
    // Use Promise.allSettled to handle partial failures gracefully
    const [braveResult, newsResult] = await Promise.allSettled([
      fetchWithRetry(braveSearchUrl, { "X-Subscription-Token": CONFIG.BRAVE_API_KEY }),
      fetchWithRetry(newsApiUrl)
    ]);

    // Extract successful results and handle failures
    const braveResults = braveResult.status === 'fulfilled' ? braveResult.value : null;
    const newsResults = newsResult.status === 'fulfilled' ? newsResult.value : null;

    // Log any failures
    if (braveResult.status === 'rejected') {
      console.log('❌ Brave Search failed:', braveResult.reason.message);
    }
    if (newsResult.status === 'rejected') {
      console.log('❌ News API failed:', newsResult.reason.message);
    }

    // Process and display results even if some APIs failed
    const processedResults = processResults(braveResults, newsResults);
    displayResults(processedResults);

    const successCount = (braveResults ? 1 : 0) + (newsResults ? 1 : 0);
    console.log(`Search completed with ${successCount}/2 APIs successful at`, timestamp);
    
    // Show notification about partial failures if applicable
    if (successCount === 0) {
      await showNotification("❌ Search Failed", "All APIs failed. Please check your configuration and try again.");
    } else if (successCount === 1) {
      await showNotification("⚠️ Partial Results", "Some APIs failed, but partial results are available.");
    } else {
      await showNotification("✅ Search Complete", "All search APIs completed successfully.");
    }
  } catch (error) {
    console.error('Unexpected error during search:', error);
    await showNotification("❌ Search Failed", "An unexpected error occurred. Please try again later.");
  }
}

/**
 * Process and filter API results for better structure and usability
 * @param {object|null} brave - Brave search results
 * @param {object|null} news - News API results
 * @returns {object} Processed and structured results
 */
function processResults(brave, news) {
  const processed = {
    timestamp: new Date().toISOString(),
    sources: {},
    totalResults: 0,
    hasPartialFailure: false
  };

  // Process Brave search results
  if (brave && brave.web && brave.web.results) {
    processed.sources.brave = {
      available: true,
      count: brave.web.results.length,
      results: brave.web.results.slice(0, CONFIG.MAX_RESULTS).map((result, index) => ({
        position: index + 1,
        title: result.title || 'No title',
        url: result.url || '',
        description: result.description || 'No description available',
        published: result.published || null
      }))
    };
    processed.totalResults += processed.sources.brave.count;
  } else {
    processed.sources.brave = { available: false, count: 0, results: [] };
    processed.hasPartialFailure = true;
  }

  // Process News API results
  if (news && news.articles) {
    processed.sources.news = {
      available: true,
      count: news.articles.length,
      results: news.articles.slice(0, CONFIG.MAX_RESULTS).map((article, index) => ({
        position: index + 1,
        title: article.title || 'No title',
        url: article.url || '',
        description: article.description || 'No description available',
        published: article.publishedAt || null,
        source: article.source?.name || 'Unknown source'
      }))
    };
    processed.totalResults += processed.sources.news.count;
  } else {
    processed.sources.news = { available: false, count: 0, results: [] };
    processed.hasPartialFailure = true;
  }

  return processed;
}

/**
 * Display search results in a formatted, readable manner
 * @param {object} results - Processed search results
 */
function displayResults(results) {
  console.log("\n" + "=".repeat(60));
  console.log("📊 SEARCH RESULTS SUMMARY");
  console.log("=".repeat(60));
  console.log(`🕒 Timestamp: ${results.timestamp}`);
  console.log(`📈 Total Results: ${results.totalResults}`);
  
  if (results.hasPartialFailure) {
    console.log("⚠️ Status: Partial results (some APIs failed)");
  } else {
    console.log("✅ Status: All APIs successful");
  }

  // Display Brave Search results
  console.log("\n🔍 WEB SEARCH RESULTS (Brave Search):");
  if (results.sources.brave.available && results.sources.brave.results.length > 0) {
    results.sources.brave.results.forEach(result => {
      console.log(`\n${result.position}. ${result.title}`);
      console.log(`   🔗 ${result.url}`);
      console.log(`   📝 ${result.description}`);
      if (result.published) {
        console.log(`   📅 Published: ${result.published}`);
      }
    });
  } else {
    console.log("   ❌ No web search results available");
  }

  // Display News results
  console.log("\n📰 NEWS RESULTS:");
  if (results.sources.news.available && results.sources.news.results.length > 0) {
    results.sources.news.results.forEach(result => {
      console.log(`\n${result.position}. ${result.title}`);
      console.log(`   🔗 ${result.url}`);
      console.log(`   📝 ${result.description}`);
      console.log(`   📰 Source: ${result.source}`);
      if (result.published) {
        console.log(`   📅 Published: ${new Date(result.published).toLocaleDateString()}`);
      }
    });
  } else {
    console.log("   ❌ No news results available");
  }

  console.log("\n" + "=".repeat(60));
}

await main();