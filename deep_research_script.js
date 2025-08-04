// --- iOS COMPATIBILITY AND CONFIGURATION ---
// iOS Environment Detection
function isRunningOnIOS() {
  return typeof Pasteboard !== 'undefined' && typeof Script !== 'undefined';
}

// Configuration - These should be set in Shortcuts or as script parameters
let query = args.queryText || args.plainTexts?.[0] || "recent technology news";
let timestamp = new Date().toLocaleString();

// API Keys - These should be configured in iOS Shortcuts as input parameters
let newsKey = args.newsApiKey || "YOUR_NEWS_API_KEY";
let newsdataKey = args.newsdataKey || "YOUR_NEWSDATA_KEY";
let braveKey = args.braveApiKey || "YOUR_BRAVE_API_KEY";
let googleKey = args.googleApiKey || "YOUR_GOOGLE_API_KEY";
let googleCx = args.googleCx || "YOUR_GOOGLE_CX";

// iOS-specific error handling
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

// Enhanced clipboard functionality for iOS
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

// Enhanced Shortcuts output for iOS
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

// --- FETCH HELPERS ---
async function fetchJSON(url, headers = {}) {
  try {
    let req = new Request(url);
    req.headers = headers;
    let json = await req.loadJSON();
    console.log("✅ Fetch successful:", url, json);
    return json;
  } catch (e) {
    console.log("❌ Fetch error:", url, e.message);
    return null;
  }
}

// --- NEWSAPI PRIMARY ---
async function newsAPI() {
  let url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=3&apiKey=${newsKey}`;
  console.log("🔎 NewsAPI URL:", url);

  let res = await fetchJSON(url);
  if (res?.status !== "ok" || !res?.articles?.length) {
    console.log("🟡 NewsAPI returned no results or an error:", res?.status, res?.message);
    return await newsdataFallback(); // Fallback to Newsdata.io
  }

  return res.articles.map(article => ({
    title: article.title,
    url: article.url,
    source: article.source.name,
    description: article.description
  }));
}

// --- NEWSDATA.IO FALLBACK ---
async function newsdataFallback() {
  let url = `https://newsdata.io/api/1/news?apikey=${newsdataKey}&q=${encodeURIComponent(query)}&language=en&country=us`;
  console.log("🔎 Newsdata.io URL:", url);

  let res = await fetchJSON(url);
  if (!res?.results?.length) {
    console.log("❌ Newsdata.io returned no results or an error:", res?.status, res?.message);
    return [];
  }

  return res.results.map(r => ({
    title: r.title || "No Title",
    url: r.link,
    source: r.source_id,
    description: r.description || "No description provided."
  }));
}

// --- BRAVE SEARCH ---
async function braveSearch() {
  if (!braveKey || braveKey === "YOUR_BRAVE_API_KEY") {
    console.log("🟡 Brave API key not configured, skipping Brave search");
    return { web: { results: [] } };
  }

  try {
    let url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;
    let headers = {
      "X-Subscription-Token": braveKey,
      "Accept": "application/json"
    };
    console.log("🔎 Brave Search URL:", url);

    let res = await fetchJSON(url, headers);
    if (!res?.web?.results?.length) {
      console.log("🟡 Brave Search returned no results");
      return { web: { results: [] } };
    }

    return res;
  } catch (error) {
    return handleIOSError(error, "Brave Search") || { web: { results: [] } };
  }
}

// --- GOOGLE SEARCH ---
async function googleSearch() {
  if (!googleKey || googleKey === "YOUR_GOOGLE_API_KEY" || !googleCx || googleCx === "YOUR_GOOGLE_CX") {
    console.log("🟡 Google API credentials not configured, skipping Google search");
    return { items: [] };
  }

  try {
    let url = `https://www.googleapis.com/customsearch/v1?key=${googleKey}&cx=${googleCx}&q=${encodeURIComponent(query)}&num=5`;
    console.log("🔎 Google Search URL:", url);

    let res = await fetchJSON(url);
    if (!res?.items?.length) {
      console.log("🟡 Google Search returned no results");
      return { items: [] };
    }

    return res;
  } catch (error) {
    return handleIOSError(error, "Google Search") || { items: [] };
  }
}

// --- GOOGLE IMAGES ---
async function googleImages() {
  if (!googleKey || googleKey === "YOUR_GOOGLE_API_KEY" || !googleCx || googleCx === "YOUR_GOOGLE_CX") {
    console.log("🟡 Google API credentials not configured, skipping Google Images");
    return { items: [] };
  }

  try {
    let url = `https://www.googleapis.com/customsearch/v1?key=${googleKey}&cx=${googleCx}&q=${encodeURIComponent(query)}&searchType=image&num=3`;
    console.log("🔎 Google Images URL:", url);

    let res = await fetchJSON(url);
    if (!res?.items?.length) {
      console.log("🟡 Google Images returned no results");
      return { items: [] };
    }

    return res;
  } catch (error) {
    return handleIOSError(error, "Google Images") || { items: [] };
  }
}

// --- FORMATTING HELPERS ---
function formatSection(title, items) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return "";
  }

  let formatted = `\n## 🔍 ${title} Results\n`;
  items.slice(0, 5).forEach((item, index) => {
    let title_text = item.title || item.name || "No Title";
    let url = item.url || item.link || "#";
    let description = item.description || item.snippet || "No description available.";
    
    formatted += `\n### ${index + 1}. ${title_text}\n`;
    formatted += `**URL:** ${url}\n`;
    formatted += `**Description:** ${description}\n`;
  });

  return formatted;
}

function formatImages(images) {
  if (!images?.items || !Array.isArray(images.items) || images.items.length === 0) {
    return "";
  }

  let formatted = `\n## 🖼️ Related Images\n`;
  images.items.slice(0, 3).forEach((item, index) => {
    let title = item.title || `Image ${index + 1}`;
    let url = item.link || "#";
    let thumbnail = item.image?.thumbnailLink || url;
    
    formatted += `\n### ${index + 1}. ${title}\n`;
    formatted += `**Image URL:** ${url}\n`;
    formatted += `**Thumbnail:** ${thumbnail}\n`;
  });

  return formatted;
}


// --- SEARCH FUNCTION STUBS ---
async function braveSearch() {
  // Return dummy data matching expected structure
  return {
    web: {
      results: [
        { title: "Brave Result 1", url: "https://brave.com/1", description: "Description for Brave Result 1" },
        { title: "Brave Result 2", url: "https://brave.com/2", description: "Description for Brave Result 2" }
      ]
    }
  };
}

async function googleSearch() {
  // Return dummy data matching expected structure
  return {
    items: [
      { title: "Google Result 1", link: "https://google.com/1", snippet: "Description for Google Result 1" },
      { title: "Google Result 2", link: "https://google.com/2", snippet: "Description for Google Result 2" }
    ]
  };
}

async function googleImages() {
  // Return dummy data matching expected structure
  return {
    items: [
      { title: "Image 1", link: "https://images.com/1", image: { thumbnailLink: "https://images.com/thumb1" } },
      { title: "Image 2", link: "https://images.com/2", image: { thumbnailLink: "https://images.com/thumb2" } }
    ]
  };
}

async function newsAPI() {
  // Return dummy data matching expected structure
  return [
    { title: "News 1", url: "https://news.com/1", description: "Description for News 1" },
    { title: "News 2", url: "https://news.com/2", description: "Description for News 2" }
  ];
}
// --- RUN ALL ---
let [brave, google, images, news] = await Promise.all([
  braveSearch(),
  googleSearch(),
  googleImages(),
  newsAPI()
]);

// --- FINAL OUTPUT ---
let sections = [
  `# 🧠 Deep Research Result – ${timestamp}`,
  formatSection("Google Web", google?.items),
  formatSection("Brave Web", brave?.web?.results),
  formatImages(images),
  formatSection("News", news)
];

let output = sections.filter(Boolean).join("\n").trim();

if (!output || output.length < 20) {
  output = `⚠️ No usable results returned for: "${query}"
Possible issues:
- Query too vague
- API rate limits exceeded
- Invalid API keys
Try refining the query or checking API keys.`;
}

// --- DELIVER ---
// Enhanced iOS delivery with better error handling
try {
  // Copy to clipboard with iOS compatibility check
  let clipboardSuccess = copyToClipboard(output);
  
  // Set Shortcuts output with iOS compatibility check
  let shortcutSuccess = setShortcutOutput(output);

  // iOS notification with enhanced error handling
  if (isRunningOnIOS()) {
    let n = new Notification();
    n.title = "🧠 MyAssistantGPT's research results are ready";
    n.body = clipboardSuccess ? "Copied to clipboard." : "Research completed (clipboard error).";
    n.sound = null;
    await n.schedule();
  }

  // Log final status
  console.log("✅ Research completed successfully");
  console.log(`📋 Clipboard: ${clipboardSuccess ? "✅" : "❌"}`);
  console.log(`🔗 Shortcuts: ${shortcutSuccess ? "✅" : "❌"}`);
  
} catch (error) {
  handleIOSError(error, "Final Delivery");
  
  // Fallback delivery attempt
  if (isRunningOnIOS()) {
    try {
      Pasteboard.copy("⚠️ Research script encountered an error. Please check the configuration and try again.");
      Script.setShortcutOutput("⚠️ Research script encountered an error. Please check the configuration and try again.");
    } catch (fallbackError) {
      console.log("❌ Critical error: Unable to deliver results", fallbackError.message);
    }
  }
}

