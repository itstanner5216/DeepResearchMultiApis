const braveSearchUrl = `https://api.search.brave.com/res/v1/web/search?q=${searchQuery}&count=${CONFIG.MAX_RESULTS}`;

function processResults(brave, news) {
  return { brave, news };
}

function displayResults(results) {
  console.log("🧾 Brave Results:", results.brave);
  console.log("🗞️ News Results:", results.news);
}