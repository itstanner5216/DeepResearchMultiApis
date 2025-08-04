# Enhanced Features Guide

## 🆕 New Features in Deep Research Scriptable.js

This document outlines the new features added to the Scriptable.js implementation:

### 📄 Full Article Scraping

The script now extracts complete article content from search result URLs.

**Configuration:**
```javascript
CONFIG.SCRAPE_CONTENT = true;  // Enable/disable content scraping
CONFIG.MAX_CONTENT_LENGTH = 5000;  // Limit for mobile performance
```

**How it works:**
1. For each search result URL, the script fetches the full webpage
2. Extracts text content by removing HTML tags, scripts, and styles
3. Cleans up whitespace and HTML entities
4. Truncates content to configured maximum length for mobile optimization

### 🧠 Auto-Summarization

Intelligent summarization generates 3-5 key bullet points from scraped content.

**Configuration:**
```javascript
CONFIG.SUMMARIZE = true;  // Enable/disable summarization
```

**Algorithm:**
- Splits content into sentences
- Scores sentences based on:
  - Position (intro/conclusion sentences weighted higher)
  - Keyword presence (important, significant, breakthrough, etc.)
  - Optimal length (50-200 characters)
- Selects top 3-5 sentences
- Formats as bullet points

### 🔄 Enhanced Fallback Logic

Improved fallback mechanism for when Brave Search returns no results:

1. **Primary Search**: Execute Brave Search first
2. **Fallback Detection**: Check if Brave returned results
3. **News Priority**: If no Brave results, NewsAPI becomes primary source
4. **Comprehensive Coverage**: All APIs still executed for maximum coverage

### ⚙️ Configuration Options

New configuration options for enhanced features:

```javascript
const CONFIG = {
  // Content Scraping Settings
  SCRAPE_CONTENT: true,        // Enable full article scraping
  SUMMARIZE: true,             // Enable auto-summarization
  MAX_CONTENT_LENGTH: 5000,    // Max content length (mobile optimized)
  
  // Existing settings remain the same...
  MAX_RESULTS: 5,
  TIMEOUT_MS: 15000,
  RETRY_COUNT: 2,
  COPY_TO_CLIPBOARD: true,
  SHOW_NOTIFICATIONS: true
};
```

### 📱 iOS Shortcuts Integration

The enhanced features work seamlessly with iOS Shortcuts:

**Pass configuration via Shortcuts:**
```javascript
// In iOS Shortcuts, pass these parameters:
{
  "scrapeContent": true,
  "summarize": true,
  "maxContentLength": 3000
}
```

### 📋 Output Format

Enhanced output includes scraped content and summaries:

```markdown
# 🧠 Deep Research Results – [timestamp]
**Query:** "your search query"

## 🦁 Brave Search (2 results)

1. **Article Title**
   🔗 https://example.com/article
   📝 Original description
   📄 **Key Points:**
   • Automatically generated summary point 1
   • Key finding or insight from the article
   • Important conclusion or implication

2. **Another Article**
   🔗 https://example.com/article2
   📝 Original description
   📄 **Content Preview:** First 300 characters... (when summarization disabled)
```

### 📱 Enhanced Notifications

Success notifications now show active features:

```
🧠 Deep Research Complete
Results for "query" ready (copied to clipboard) with full content + summaries
```

### 🛠️ Troubleshooting

**Content scraping fails:**
- ✅ Check internet connection
- ✅ Verify target website is accessible
- ✅ Try disabling scraping: `CONFIG.SCRAPE_CONTENT = false`

**Summarization not working:**
- ✅ Ensure content is long enough (>100 characters)
- ✅ Check if scraping succeeded first
- ✅ Try disabling: `CONFIG.SUMMARIZE = false`

**Performance issues:**
- ✅ Reduce `MAX_CONTENT_LENGTH` (try 3000 or 2000)
- ✅ Reduce `MAX_RESULTS` to fewer items
- ✅ Disable scraping for faster results

### 🔧 Mobile Optimization

Features designed specifically for iOS performance:

- **Content Length Limits**: Configurable maximum to prevent memory issues
- **Timeout Handling**: Scraping respects existing timeout settings
- **Error Recovery**: Failed scraping doesn't break the overall workflow
- **Efficient Processing**: Text extraction optimized for mobile CPUs

### 🎯 Use Cases

**Research with Full Context:**
- Get search results + complete article content
- Perfect for academic research or fact-checking

**Quick Information Digest:**
- Enable summarization for bullet-point overviews
- Ideal for staying informed on topics quickly

**Mobile-Optimized Research:**
- Content limits ensure smooth performance on iPhone/iPad
- Clipboard workflow perfect for sharing between apps

### 🔄 Backward Compatibility

All existing features remain unchanged:
- ✅ Original search functionality preserved
- ✅ Existing configuration options work as before
- ✅ iOS Shortcuts integration unchanged
- ✅ All error handling and notifications maintained

Turn off new features by setting:
```javascript
CONFIG.SCRAPE_CONTENT = false;
CONFIG.SUMMARIZE = false;
```

The script will behave exactly as it did before the enhancements.