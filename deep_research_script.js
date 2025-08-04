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
Pasteboard.copy(output);

let n = new Notification();
n.title = "🧠 MyAssistantGPT’s research results are ready";
n.body = "Copied to clipboard.";
n.sound = null;
await n.schedule();

Script.setShortcutOutput(output);