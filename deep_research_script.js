const braveKey = "YOUR_BRAVE_API_KEY";
const newsKey = "YOUR_NEWS_API_KEY";
const summarize = false;
const Pasteboard = importModule("Pasteboard");
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

async function braveSearch(q) {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=5`;
    return await fetchJSON(url, { "X-Subscription-Token": braveKey });
}

async function newsSearch(q) {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&pageSize=3&apiKey=${newsKey}`;
    return await fetchJSON(url);
}

function formatMarkdown(results, title) {
    let md = `# 🧠 Deep Research Result – ${timestamp}\n**Query:** ${query}\n\n## ${title}\n`;
    if (!results?.length) return md + "❌ No results.\n";
    results.forEach((r, i) => {
        md += `${i + 1}. **${r.title || "Untitled"}**\n🔗 https://${cleanURL(r.url)}\n> ${r.snippet || "No preview available."}\n\n`;
    });
    return md;
}

async function run() {
    console.log(`Running query: ${query}`);
    let webResults = [];
    const brave = await braveSearch(query);
    if (brave?.web?.results?.length) {
        webResults = brave.web.results.map(r => ({ title: r.title, url: r.url, snippet: r.description || r.snippet || "", }));
    }
    let newsResults = [];
    const news = await newsSearch(query);
    if (news?.articles?.length) {
        newsResults = news.articles.map(a => ({ title: a.title, url: a.url, snippet: a.description || a.content || "", }));
    }
    let output = formatMarkdown(webResults, "Web Results");
    if (newsResults.length) {
        output += `\n## News Results\n`;
        output += formatMarkdown(newsResults, "News");
    }
    Pasteboard.copy(output);
    await showNotification("🧠 Results ready", "Copied to clipboard.");
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
