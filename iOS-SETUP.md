# iOS Setup Guide for Deep Research Multi-APIs

This guide explains how to set up and use the Deep Research script on iOS devices with iOS Shortcuts.

## iOS Compatibility

The script has been optimized for iOS 18.6+ and works with:
- **Scriptable** - JavaScript automation app for iOS (RECOMMENDED)
- **a-Shell** - Free terminal app for iOS
- **iSH** - Linux shell for iOS
- **iOS Shortcuts** - Apple's automation app

## Installation on iOS

### Option 1: Using Scriptable App (RECOMMENDED for iOS 18.6+)

**Scriptable is the preferred method as it's designed specifically for iOS automation and integrates seamlessly with iOS Shortcuts.**

1. **Install Scriptable from App Store**
   - Download "Scriptable" (free) from the App Store
   - Open Scriptable and complete initial setup

2. **Add the Deep Research Script**
   - Open Scriptable app
   - Tap the "+" button to create a new script
   - Name it "Deep Research" 
   - Copy the entire content from `scriptableResearch.js` into the script
   - Save the script

3. **Configure API Keys (Choose one method):**

   **Method A: Secure Keychain Storage (Recommended)**
   ```javascript
   // In Scriptable, create a new script called "Setup API Keys"
   // Run this once to store your keys securely:
   
   await Keychain.set('BRAVE_API_KEY', 'your_brave_api_key_here');
   await Keychain.set('NEWS_API_KEY', 'your_news_api_key_here');
   await Keychain.set('NEWSDATA_API_KEY', 'your_newsdata_api_key_here');
   ```

   **Method B: Direct Script Configuration**
   - Edit the `API_CONFIG` section in the script
   - Replace empty strings with your actual API keys
   - Save the script

4. **Test the Script**
   - Copy some text to your iPhone clipboard
   - Run the "Deep Research" script in Scriptable
   - Check if results are copied back to clipboard

### Option 2: Using a-Shell (Terminal Method)

1. **Install a-Shell from App Store**
   - Download "a-Shell" (free) from the App Store
   - Open a-Shell and run initial setup

2. **Install Node.js and dependencies**
   ```bash
   # In a-Shell
   pkg install nodejs npm
   
   # Navigate to your working directory
   cd Documents
   
   # Clone or download the repository files
   # (You'll need to transfer the files via Files app or other method)
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure API keys**
   ```bash
   # Create .env file
   echo "BRAVE_API_KEY=your_brave_key_here" > .env
   echo "NEWS_API_KEY=your_news_key_here" >> .env  
   echo "NEWSDATA_API_KEY=your_newsdata_key_here" >> .env
   ```

### Option 3: Using iSH

1. **Install iSH from App Store**
2. **Install Node.js**
   ```bash
   apk add nodejs npm
   ```
3. **Follow similar setup steps as a-Shell**

## iOS Shortcuts Integration

## iOS Shortcuts Integration

### Scriptable-Based Shortcuts (RECOMMENDED)

The Scriptable version provides the smoothest iOS Shortcuts integration:

1. **Create Basic Research Shortcut**
   - Open iOS Shortcuts app
   - Tap "+" to create new shortcut
   - Add "Run Script" action
   - Select "Deep Research" from your Scriptable scripts
   - Name the shortcut "Deep Research"
   - Save

2. **Enhanced Shortcuts with Input**

   **Voice-Activated Research (Siri)**
   ```
   Actions:
   1. "Dictate Text" (gets voice input)
   2. "Copy to Clipboard" (saves query to clipboard)  
   3. "Run Script" → Select "Deep Research" (Scriptable)
   4. "Get Clipboard" (gets results from clipboard)
   5. "Speak Text" → "Research complete" (audio feedback)
   ```

   **Share Sheet Research**
   ```
   Actions:
   1. "Get Text from Input" (gets shared text)
   2. "Copy to Clipboard" (saves to clipboard)
   3. "Run Script" → Select "Deep Research" (Scriptable)
   4. "Get Clipboard" (gets results)
   5. "Quick Look" (shows formatted results)
   ```

   **Manual Input Research**
   ```
   Actions:
   1. "Ask for Text" → "What to research?"
   2. "Copy to Clipboard"
   3. "Run Script" → Select "Deep Research" (Scriptable)
   4. "Get Clipboard"
   5. "Show Result"
   ```

### Terminal-Based Shortcuts (a-Shell/iSH)

For users who prefer terminal apps:

### Terminal-Based Shortcuts (a-Shell/iSH)

For users who prefer terminal apps:

   - Open iOS Shortcuts app
   - Create new shortcut
   - Add "Run Shell Script" action
   - Select your terminal app (a-Shell or iSH)
   - Script: `cd /path/to/your/project && node shortcutsResearch.js`
   - Add "Get Clipboard" action to show results

2. **Advanced Terminal Shortcut with Input**
   ```
   Actions:
   1. Get Text from Input
   2. Copy to Clipboard  
   3. Run Shell Script: "cd /your/path && node shortcutsResearch.js"
   4. Get Clipboard
   5. Show Result
   ```

## Usage Examples

## Usage Examples

### Scriptable App Usage (RECOMMENDED)

```javascript
// In Scriptable app, simply run the "Deep Research" script
// The script automatically:
// 1. Reads query from clipboard
// 2. Performs multi-API search
// 3. Writes formatted results back to clipboard
```

**Workflow:**
1. Copy search text to clipboard (from any app)
2. Run "Deep Research" script in Scriptable
3. Get results from clipboard

**Advanced Setup:**
```javascript
// Test clipboard functionality
await testClipboard();

// Set up API keys securely
await setupAPIKeys();
```

### Terminal App Usage

**iOS-optimized scripts:**

**Terminal scripts:**

```bash
# Default: read from clipboard, search, write results to clipboard
node iosResearch.js

# Same as above (explicit)
node iosResearch.js --clipboard

# Search with specific query
node iosResearch.js "artificial intelligence"

# Test clipboard access
node iosResearch.js --test-clipboard

# View configuration
node iosResearch.js --config
```

**Shortcuts wrapper:**

```bash
# This is specifically for iOS Shortcuts
node shortcutsResearch.js
```

## iOS-Specific Features

## iOS-Specific Features

### Scriptable App Advantages

- **No Dependencies**: Uses native iOS APIs, no Node.js modules required
- **Secure Storage**: API keys stored in iOS Keychain
- **Native Integration**: Perfect iOS Shortcuts compatibility
- **Lightweight**: Single JavaScript file, runs directly on iOS
- **iOS Notifications**: Native iOS notifications for results
- **Offline Capable**: Script works without internet for testing

### Optimizations for iOS

- **Reduced resource usage**: Fewer simultaneous API calls
- **Shorter timeouts**: Optimized for mobile networks  
- **No desktop notifications**: Uses iOS notifications instead
- **Flexible file paths**: Works with iOS file system restrictions
- **Error resilience**: Handles network issues gracefully

### Clipboard Workflow

### Clipboard Workflow

Both versions are designed around a simple workflow:

1. **Copy search query** to clipboard (manually, Siri, or share sheet)
2. **Run the script** (via Scriptable or Shortcuts)
3. **Get results** from clipboard (formatted for easy reading)

**Scriptable Workflow:**
- Instant execution within iOS
- Native clipboard access via Pasteboard API
- iOS notifications for status updates

**Terminal Workflow:**
- Traditional command-line interface
- Node.js-based clipboard access
- Console logging for status updates

### Output Format

Results are formatted specifically for iOS:

```
🔍 Deep Research Results
Query: "your search query"
📅 Nov 15, 2024, 2:30 PM
📊 Total Results: 25

🦁 BRAVESEARCH (10 results)
========================================
1. Article Title Here
   🔗 https://example.com/article
   📝 Brief description of the article...

📰 NEWSAPI (15 results)  
========================================
1. News Article Title
   🔗 https://news.example.com
   📝 News article description...

❌ ERRORS
========================================
• someAPI: Rate limit exceeded

🤖 Generated by Scriptable iOS Deep Research v1.0
```

## Troubleshooting

### Common Issues

## Troubleshooting

### Common Issues

**Scriptable App Issues:**

**"API key not configured"**
- Check that API keys are set in either the script directly or via Keychain
- Run the `setupAPIKeys()` function to store keys securely
- Verify keys with `await Keychain.get('BRAVE_API_KEY')` in Scriptable

**"Clipboard access failed"**
- Ensure Scriptable has permission to access clipboard
- Check iOS Settings > Privacy & Security > Scriptable
- Test with the `testClipboard()` function

**"Network timeout"** 
- iOS networks can be slower; the script uses longer timeouts
- Try again on Wi-Fi or better cellular connection
- Check if APIs are accessible from your location

**Terminal App Issues:**

**"Clipboard access failed"**
- Make sure your terminal app has clipboard permissions
- In iOS Settings > Privacy & Security > Accessibility, enable clipboard access

**"API key not configured"**
- Check your .env file has the correct API keys
- Make sure the .env file is in the same directory as the script

**"Command not found"**
- Make sure Node.js is properly installed in your terminal app
- Check that you're in the correct directory

### iOS-Specific Limitations

### iOS-Specific Limitations

**Scriptable App:**
- **API Limits**: Respects iOS background processing limits
- **Network**: Cellular networks may have different timeouts
- **Storage**: Uses iOS secure storage (Keychain) for API keys
- **Processing**: Optimized for iOS performance characteristics

**Terminal Apps:**
- **File system access**: Limited to app containers and Documents folder
- **Background execution**: iOS may terminate long-running processes
- **Network restrictions**: Cellular networks may have different timeouts
- **Memory limits**: iOS aggressively manages app memory

## Shortcuts Examples

## Shortcuts Examples

### Scriptable-Based Shortcuts

**Basic Research Shortcut:**
1. Run Script (Scriptable) → "Deep Research"
2. Get Clipboard → Shows results

**Siri Voice Research:**
1. Dictate Text (gets voice input)
2. Copy to Clipboard  
3. Run Script (Scriptable) → "Deep Research"
4. Get Clipboard
5. Speak Text → "Research complete"

**Share Sheet Research:**
1. Get Text from Input (from shared content)
2. Copy to Clipboard
3. Run Script (Scriptable) → "Deep Research" 
4. Get Clipboard
5. Quick Look (shows formatted results)

**Widget Shortcut:**
1. Ask for Text → "Research topic?"
2. Copy to Clipboard
3. Run Script (Scriptable) → "Deep Research"
4. Get Clipboard
5. Show Notification (brief summary)

## Performance Tips

## Performance Tips

- **Use Scriptable** for best iOS performance and integration
- **Use fewer APIs** on cellular networks to save data
- **Cache results** by saving to Files app when needed
- **Use specific queries** rather than very broad searches
- **Monitor data usage** as API calls consume cellular data
- **Test on Wi-Fi first** before using on cellular

## Security Notes

## Security Notes

- **API keys (Scriptable)**: Store securely in iOS Keychain using `Keychain.set()`
- **API keys (Terminal)**: Store in .env file, never in shortcuts directly
- **Clipboard data**: Be aware that clipboard content is accessible to scripts
- **Network traffic**: All API calls are made over HTTPS
- **Local storage**: Logs and config files stay on device
- **iOS Sandbox**: Scripts run in iOS app sandboxes for security

## Getting API Keys

See the main README.md for detailed instructions on getting API keys from:
- Brave Search API
- NewsAPI.org  
- Newsdata.io

All APIs offer free tiers suitable for personal use on iOS.

## Quick Start Summary

**For Scriptable Users (Recommended):**
1. Install Scriptable app from App Store
2. Create new script, paste `scriptableResearch.js` content
3. Configure API keys via Keychain or direct edit
4. Create iOS Shortcut: Run Script → "Deep Research"
5. Test: Copy text → Run shortcut → Check clipboard

**For Terminal Users:**
1. Install a-Shell or iSH from App Store
2. Install Node.js and dependencies
3. Configure .env file with API keys
4. Create iOS Shortcut: Run Shell Script → node shortcutsResearch.js
5. Test clipboard workflow