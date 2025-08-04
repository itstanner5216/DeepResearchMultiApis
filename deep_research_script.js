const CONFIG = {
  BRAVE_API_KEY: "BSAUZcHnbsKgi9GTsu4wQV2SPEeZ3wy",
  NEWS_API_KEY: "09494b1a857d48a3b7fe62515c1ab8f9",
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
      Script.complete();
      return false;
    }
  }
  console.log("✅ Configuration validated");
  return true;
}

if (!validateConfiguration()) {
  Script.complete();
}

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
  if (query.length > 200) {
    console.log("⚠️ Query very long, truncating to 200 characters");
    query = query.substring(0, 200).trim();
    await showNotification("⚠️ Query Truncated", "Search query was shortened to 200 characters.");
  }

  // Encode the query to ensure safe API usage
  const encodedQuery = encodeURIComponent(query);

  console.log(`✅ Query validated and encoded: "${encodedQuery}" (${encodedQuery.length} characters)`);
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
    console.log(`❌ Failed to send notification: ${error.message}`);
  }
}

async function run(searchQuery, timestamp) {
  const braveSearchUrl = `https://api.brave.com/v1/search?q=${searchQuery}`;
  const newsApiUrl = `https://newsapi.org/v2/everything?q=${searchQuery}&apiKey=${CONFIG.NEWS_API_KEY}`;

  const fetchWithRetry = async (url, retries = CONFIG.RETRY_COUNT) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error) {
        console.log(`Retry ${i + 1}/${retries} failed for URL: ${url}`);
        if (i === retries - 1) throw error;
      }
    }
  };

  try {
    const braveResultsPromise = fetchWithRetry(braveSearchUrl);
    const newsResultsPromise = fetchWithRetry(newsApiUrl);

    const [braveResults, newsResults] = await Promise.all([braveResultsPromise, newsResultsPromise]);

    // Process and display results
    const processedResults = processResults(braveResults, newsResults);
    displayResults(processedResults);

    console.log('Search completed successfully at', timestamp);
  } catch (error) {
    console.error('Failed to fetch search results:', error);
    await showNotification("❌ Search Failed", "Unable to fetch results. Please try again later.");
  }
}

await main();
