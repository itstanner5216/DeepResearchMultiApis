// 👇 ENHANCED SCRIPTABLE.JS WITH CONTENT SCRAPING & AUTO-SUMMARIZATION

// Load API keys from config file (do not hardcode sensitive keys)
const API_KEYS_PATH = "/private/api_keys.json";
let braveKey = null;
let newsKey = null;

// Helper to load or prompt for API keys
function loadApiKeys() {
  let fm = FileManager.iCloud();
  let keys = {};
  if (fm.fileExists(API_KEYS_PATH)) {
    try {
      let content = fm.readString(API_KEYS_PATH);
      keys = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse API keys file:", e);
    }
  }
  if (!keys.braveKey) {
    keys.braveKey = Prompt.text("Enter your Brave API key:");
  }
  if (!keys.newsKey) {
    keys.newsKey = Prompt.text("Enter your News API key:");
  }
  // Save back if new keys were entered
  fm.writeString(API_KEYS_PATH, JSON.stringify(keys));
  return keys;
}

const apiKeys = loadApiKeys();
braveKey = apiKeys.braveKey;
newsKey = apiKeys.newsKey;
const summarize = true; // Enable auto-summarization

// New configuration options
const CONFIG = {
  SCRAPE_CONTENT: true,        // Enable/disable content scraping  
  MAX_CONTENT_LENGTH: 5000,    // Mobile-optimized content limit
  SUMMARIZE: true              // Enable bullet-point summaries
};

let Pasteboard;
try {
  Pasteboard = importModule("Pasteboard");
} catch (e) {
  console.error("❌ Failed to import Pasteboard module. Are you running in Scriptable?");
  if (typeof Script !== "undefined" && Script.complete) Script.complete();
  throw e;
}
let query = Pasteboard.pasteString();
if (!query || query.trim().length < 3) {
  console.log("❌ No valid clipboard input found.");
  Script.complete();
}

const now = new Date();
const timestamp = now.toLocaleString("en-US");

async function fetchJSON(url, headers = {}) {
  try {
    const req = new Request(url);
    Object.entries(headers).forEach(([k, v]) => req.headers[k] = v);
    return await req.loadJSON();
  } catch (e) {
    console.error(`Error loading JSON from ${url}`);
    return null;
  }
}

function cleanURL(url) {
  return url.replace(/^https?:\/\/(www\.)?/, "").split(/[?#]/)[0];
}

// Content scraping function
async function scrapeContent(url) {
  if (!CONFIG.SCRAPE_CONTENT) return null;
  
  try {
    console.log(`Scraping content from: ${url}`);
    const req = new Request(url);
    req.headers = {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15'
    };
    
    const html = await req.loadString();
    if (!html) return null;
    
    // Extract text from HTML
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    
    // Limit content length for mobile
    if (text.length > CONFIG.MAX_CONTENT_LENGTH) {
      text = text.substring(0, CONFIG.MAX_CONTENT_LENGTH) + "...";
    }
    
    console.log(`Scraped ${text.length} characters`);
    return text;
  } catch (e) {
    console.error(`Scraping failed for ${url}: ${e.message}`);
    return null;
  }
}

// Auto-summarization function
function summarizeContent(content) {
  if (!CONFIG.SUMMARIZE || !content || content.length < 100) return null;
  
  console.log('Generating summary...');
  
  // Split into sentences
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  if (sentences.length <= 3) {
    return sentences.map(s => `• ${s.trim()}`).join('\n');
  }
  
  // Score sentences for importance
  const keyWords = ['breakthrough', 'significant', 'research', 'study', 'found', 'discovered', 'concluded', 'shows', 'reveals', 'important', 'major'];
  
  let scored = sentences.map((sentence, i) => {
    let score = 0;
    
    // Position scoring (intro/conclusion important)
    if (i < 2 || i >= sentences.length - 2) score += 2;
    
    // Keyword scoring
    keyWords.forEach(word => {
      if (sentence.toLowerCase().includes(word)) score += 1;
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
  
  return topSentences.map(item => `• ${item.sentence}`).join('\n');
}

async function braveSearch(q) {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=5`;
  return await fetchJSON(url, { "X-Subscription-Token": braveKey });
}

async function newsSearch(q) {
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&pageSize=3&apiKey=${newsKey}`;
  return await fetchJSON(url);
}

async function formatResultsWithContent(results, title) {
  let md = `# 🧠 Deep Research Result – ${timestamp}\n**Query:** ${query}\n\n## ${title}\n`;
  if (!results?.length) return md + "❌ No results.\n";
  
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const cleaned = cleanURL(r.url);
    const hasProtocol = /^(?:[a-z]+:)?\/\//i.test(cleaned);
    md += `${i + 1}. **${r.title || "Untitled"}**\n   🔗 ${hasProtocol ? cleaned : "https://" + cleaned}\n   📝 ${r.snippet || "No preview available."}\n`;
    
    // Add scraped content and summary if enabled
    if (CONFIG.SCRAPE_CONTENT && r.url) {
      const content = await scrapeContent(r.url);
      if (content) {
        if (CONFIG.SUMMARIZE) {
          const summary = summarizeContent(content);
          if (summary) {
            md += `   📄 **Key Points:**\n${summary.split('\n').map(line => `   ${line}`).join('\n')}\n`;
          }
        } else {
          const preview = content.length > 300 ? content.substring(0, 300) + "..." : content;
          md += `   📄 **Content:** ${preview}\n`;
        }
      }
    }
    md += "\n";
  }
  return md;
}

async function run() {
  console.log(`Running query: ${query}`);
  let webResults = [];
  
  // Enhanced Brave Search with fallback logic
  const brave = await braveSearch(query);
  if (brave?.web?.results?.length) {
    webResults = brave.web.results.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.description || r.snippet || "",
    }));
  }

  let newsResults = [];
  
  // Fallback logic: if Brave has no results, NewsAPI becomes primary
  if (webResults.length === 0) {
    console.log("No Brave results, making NewsAPI primary source");
  }
  
  const news = await newsSearch(query);
  if (news?.articles?.length) {
    newsResults = news.articles.map(a => ({
      title: a.title,
      url: a.url,
      snippet: a.description || a.content || "",
    }));
  }

  let output = await formatResultsWithContent(webResults, "Web Results");
  if (newsResults.length) {
    output += "\n## News Results\n";
    output += await formatResultsWithContent(newsResults, "");
  }

  Pasteboard.copy(output);
  
  let notificationBody = "Copied to clipboard";
  if (CONFIG.SCRAPE_CONTENT) notificationBody += " with full content";
  if (CONFIG.SUMMARIZE) notificationBody += " + summaries";
  
  await showNotification("🧠 Results ready", notificationBody);
  Script.setShortcutOutput(output);
  Script.complete();
}

async function showNotification(title, body) {
  let n = new Notification();
  n.title = title;
  n.body = body;
  await n.schedule();
}

await run();