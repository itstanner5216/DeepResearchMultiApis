// Original content of the deep_research_script.js file...

let originalClipboardContent = Pasteboard.paste()?.trim(); // Capture current clipboard content
if (!query) {
  console.log("❌ No input found in clipboard or parameters");
  await showNotification("❌ No Input", "Please copy a search query to the clipboard or pass via Shortcuts.");
  Script.complete();
  return;
}

query = query.trim();
if (query === originalClipboardContent) {
  console.log("⚠️ Clipboard content unchanged. Prompting user.");
  await showNotification("⚠️ Clipboard Unchanged", "The clipboard content is the same as the previous query. Please update it and retry.");
  Script.complete();
  return;
}

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

// Clear clipboard after processing
Pasteboard.copy("");
console.log("✅ Clipboard cleared after processing.");