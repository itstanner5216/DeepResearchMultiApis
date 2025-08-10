const params = typeof args !== 'undefined' ? args.shortcutParameter : undefined;

/**
 * Retrieves a value from the Keychain by key.
 * Returns undefined if the Keychain is not available or if an error occurs.
 *
 * @param {string} key - The key to retrieve from the Keychain.
 * @returns {string|undefined} The value associated with the key, or undefined if not found or on error.
 */
function getKeychainValue(key) {
  if (typeof Keychain === 'undefined') return undefined;
  try {
    return Keychain.get(key);
  } catch (_) {
    return undefined;
  }
}

function getApiKey(paramKey, storageKey, envKey, placeholder) {
  return (params && params[paramKey]) ||
    getKeychainValue(storageKey) ||
    (typeof process !== 'undefined' && process.env[envKey]) ||
    placeholder;
}

const PLACEHOLDERS = {
  BRAVE: 'YOUR_BRAVE_API_KEY',
  NEWS: 'YOUR_NEWS_API_KEY',
  NEWSDATA: 'YOUR_NEWSDATA_API_KEY'
};

const CONFIG = {
  BRAVE_API_KEY: getApiKey('braveKey', 'BRAVE_API_KEY', 'BRAVE_API_KEY', PLACEHOLDERS.BRAVE),
  NEWS_API_KEY: getApiKey('newsKey', 'NEWS_API_KEY', 'NEWS_API_KEY', PLACEHOLDERS.NEWS),
  NEWSDATA_API_KEY: getApiKey('newsdataKey', 'NEWSDATA_API_KEY', 'NEWSDATA_API_KEY', PLACEHOLDERS.NEWSDATA),
  TIMEOUT_MS: 15000,
  RETRY_COUNT: 2,
  MAX_RESULTS: 5,
  COPY_TO_CLIPBOARD: true,
  SHOW_NOTIFICATIONS: true,
  SCRAPE_CONTENT: true,
  MAX_CONTENT_LENGTH: 5000,
  SUMMARIZE: true
};

if (params) {
  if (params.scrapeContent !== undefined) CONFIG.SCRAPE_CONTENT = params.scrapeContent;
  if (params.summarize !== undefined) CONFIG.SUMMARIZE = params.summarize;
  if (params.maxContentLength) CONFIG.MAX_CONTENT_LENGTH = params.maxContentLength;
}

/**
 * Determines whether a key is considered "missing" in this context.
 * A key is considered missing if it is falsy (e.g., undefined, null, empty string, 0, false)
 * or if it matches the provided placeholder value.
 *
 * @param {*} key - The value to check for presence.
 * @param {*} placeholder - The placeholder value that indicates a missing key.
 * @returns {boolean} True if the key is missing; otherwise, false.
 */
function isMissing(key, placeholder) {
  return !key || key === placeholder;
}

function validateConfiguration() {
  const issues = [];
  const missingBrave = isMissing(CONFIG.BRAVE_API_KEY, PLACEHOLDERS.BRAVE);
  const missingNews = isMissing(CONFIG.NEWS_API_KEY, PLACEHOLDERS.NEWS);
  const missingNewsdata = isMissing(CONFIG.NEWSDATA_API_KEY, PLACEHOLDERS.NEWSDATA);

  if (missingBrave && missingNews && missingNewsdata) {
    issues.push("No API keys configured. Add keys via Shortcuts parameters, Keychain, or environment variables.");
  }
  if (missingBrave) {
    issues.push("Brave Search API key missing - web search will be unavailable");
  }
  if (missingNews) {
    issues.push("NewsAPI key missing - will rely on Newsdata.io fallback if available");
  }
  if (missingNewsdata) {
    issues.push("Newsdata.io API key missing - news fallback unavailable");
  }
  if (issues.length > 0) {
    console.log("⚠️ Configuration Issues:");
    issues.forEach(issue => console.log(`   • ${issue}`));
    if (missingBrave && missingNews && missingNewsdata) {
      showNotification("❌ Configuration Error", "No API keys found. Check script configuration.");
      throw new Error("Critical configuration error: No API keys found. BRAVE_API_KEY, NEWS_API_KEY, and NEWSDATA_API_KEY are all missing.");
    }
  }
  console.log("✅ Configuration validated");
  return true;
}

// Validate configuration and run the main logic only if validation succeeds.
async function runWithValidation() {
  try {
    validateConfiguration();
  } catch (error) {
    console.log(`❌ Configuration validation failed: ${error.message}`);
    Script.complete();
    return; // Stop execution after logging the validation failure
  }

  await main();
}

async function main() {
  console.log("🧠 Starting main execution...");
  const clipboard = typeof Pasteboard !== 'undefined' ? Pasteboard.paste() : undefined;
  let query = (params && params.query) || clipboard;
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
    console.log("⚠️ Query too long, truncating to 200 characters");
    let truncated = query.substring(0, 200);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 150) {
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
    n.identifier = `deep-research-${Date.now()}`;
    await n.schedule();
    console.log(`🔔 Notification sent: ${title}`);
  } catch (error) {
    console.log(`🔔 Notification (fallback): ${title}`);
    console.log(`   📝 ${body}`);
    console.log(`   ⚠️ Native notifications unavailable: ${error.message}`);
  }
}

function shouldUseFallback(newsResult, newsResults) {
  return newsResult.status === 'rejected' || 
         !newsResults || 
         !newsResults.articles || 
         newsResults.articles.length === 0;
}

async function newsdataFallback(searchQuery, fetchFn) {
  if (isMissing(CONFIG.NEWSDATA_API_KEY, PLACEHOLDERS.NEWSDATA)) {
    console.log('❌ Newsdata.io API key missing - fallback not attempted');
    return null;
  }
  const url = `https://newsdata.io/api/1/news?apikey=${CONFIG.NEWSDATA_API_KEY}&q=${encodeURIComponent(searchQuery)}`;
  try {
    const data = await fetchFn(url);
    if (!data || !data.results || data.results.length === 0) {
      console.log('⚠️ Newsdata.io returned no articles');
      return null;
    }
    return {
      articles: data.results.map(article => ({
        title: article.title || 'No title',
        url: article.link || '',
        description: article.description || 'No description available',
        publishedAt: article.pubDate || null,
        source: { name: article.source_id || 'Unknown source' }
      }))
    };
  } catch (error) {
    console.log('❌ Newsdata.io fallback failed:', error.message);
    return null;
  }
}

async function run(searchQuery, timestamp) {
  const braveSearchUrl = `https://api.search.brave.com/res/v1/web/search?q=${searchQuery}&count=${CONFIG.MAX_RESULTS}`;
  const newsApiUrl = `https://newsapi.org/v2/everything?q=${searchQuery}&apiKey=${CONFIG.NEWS_API_KEY}`;

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
        const delay = Math.pow(2, i) * 1000;
        console.log(`Waiting ${delay}ms before next retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  let usedFallback = false;

  try {
    const [braveResult, newsResult] = await Promise.allSettled([
      fetchWithRetry(braveSearchUrl, { "X-Subscription-Token": CONFIG.BRAVE_API_KEY }),
      fetchWithRetry(newsApiUrl)
    ]);

    const braveResults = braveResult.status === 'fulfilled' ? braveResult.value : null;
    let newsResults = newsResult.status === 'fulfilled' ? newsResult.value : null;

    if (braveResult.status === 'rejected') {
      console.log('❌ Brave Search failed:', braveResult.reason.message);
    }
    if (newsResult.status === 'rejected') {
      console.log('❌ News API failed:', newsResult.reason.message);
    }

    if (shouldUseFallback(newsResult, newsResults)) {
      console.log('🔄 NewsAPI unavailable or empty. Attempting Newsdata.io fallback...');
      newsResults = await newsdataFallback(searchQuery, fetchWithRetry);
      if (newsResults && newsResults.articles && newsResults.articles.length > 0) {
        usedFallback = true;
        console.log(`✅ Newsdata.io fallback succeeded with ${newsResults.articles.length} articles.`);
      } else {
        console.log('❌ Newsdata.io fallback failed or returned no articles.');
      }
    }

    const processedResults = processResults(braveResults, newsResults);
    if (usedFallback) {
      processedResults.sources.news.fallback = true;
    }
    displayResults(processedResults);

    // Add clipboard copying functionality (PR #18)
    if (CONFIG.COPY_TO_CLIPBOARD) {
      try {
        const serialized = JSON.stringify(processedResults, null, 2);
        if (typeof Pasteboard !== 'undefined') {
          Pasteboard.copy(serialized);
        }
        if (typeof Script !== "undefined" && typeof Script.setShortcutOutput === "function") {
          Script.setShortcutOutput(serialized);
        }
        console.log("📋 Results copied to clipboard");
      } catch (error) {
        console.log(`⚠️ Failed to copy results: ${error.message}`);
      }
    }

    const successCount = (braveResults ? 1 : 0) + (newsResults && newsResults.articles && newsResults.articles.length > 0 ? 1 : 0);
    console.log(`Search completed with ${successCount}/2 APIs successful at`, timestamp);
    if (usedFallback) {
      console.log('ℹ️ Newsdata.io fallback was used for news results.');
    }
    
    if (successCount === 0) {
      await showNotification("❌ Search Failed", "All APIs failed. Please check your configuration and try again.");
    } else if (successCount === 1) {
      await showNotification("⚠️ Partial Results", "Some APIs failed, but partial results are available.");
    } else {
      await showNotification("✅ Search Complete", "All search APIs completed successfully.");
    }

    if (usedFallback) {
      await showNotification("ℹ️ News Fallback Used", "NewsAPI unavailable; results provided by Newsdata.io.", false);
    }
  } catch (error) {
    console.error('Unexpected error during search:', error);
    await showNotification("❌ Search Failed", "An unexpected error occurred. Please try again later.");
  }
}

function processResults(brave, news) {
  const processed = {
    timestamp: new Date().toISOString(),
    sources: {},
    totalResults: 0,
    hasPartialFailure: false
  };

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

  console.log("\n📰 NEWS RESULTS:");
  if (results.sources.news.fallback) {
    console.log("   🔄 Results from Newsdata.io fallback");
  }
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

await runWithValidation();