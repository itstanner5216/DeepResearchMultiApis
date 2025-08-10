# iOS Setup Guide for Deep Research Multi-APIs

This comprehensive guide will help you set up the unified Deep Research script on iOS using the Scriptable app for iOS 18.6+, combining the best features from multiple iOS implementations.

## Requirements

- iOS 18.6 or later
- Scriptable app (free from App Store)
- Valid API keys for the services you want to use
- Internet connection

## Installation Steps

### 1. Install Scriptable

1. Download "Scriptable" from the App Store (it's free)
2. Open Scriptable and complete initial setup

### 2. Add the Deep Research Script

1. Open Scriptable
2. Tap the "+" button to create a new script
3. Name it "Deep Research"
4. Copy the entire content of `deep_research_script.js` into the script editor
5. Save the script

### 3. Configure API Keys

The script automatically looks for API keys in this order:

1. Shortcut parameters (`braveKey`, `newsKey`)
2. iOS Keychain entries (`BRAVE_API_KEY`, `NEWS_API_KEY`)
3. Environment variables (`BRAVE_API_KEY`, `NEWS_API_KEY`)
4. Placeholder values in the script

If none are found, placeholders are used and the script warns you.

#### Option A: iOS Keychain (Most Secure)
Use iOS Shortcuts to store API keys securely:

1. Open iOS Shortcuts app
2. Create a new shortcut to set keys:
   - Add "Set Value" action
   - Set to Keychain
   - Key: "BRAVE_API_KEY", Value: your key
   - Repeat for other API keys (NEWS_API_KEY, NEWSDATA_API_KEY, etc.)

#### Option B: Via iOS Shortcuts Parameters
Pass API keys as parameters when calling from iOS Shortcuts (most flexible).

#### Option C: Environment Variables
Set `BRAVE_API_KEY` and `NEWS_API_KEY` in your environment when running
the script outside of Shortcuts (e.g., in Node.js).

## Getting API Keys

### Brave Search API
1. Visit [Brave Search API](https://api.search.brave.com/app/keys)
2. Sign up for a free account
3. Generate an API key
4. Free tier includes 2,000 queries per month

### NewsAPI
1. Visit [NewsAPI.org](https://newsapi.org/register)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Free tier includes 1,000 requests per day

### Newsdata.io
1. Visit [Newsdata.io](https://newsdata.io/register)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Free tier includes 200 requests per day

### Google Custom Search (Optional)
1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Custom Search API
4. Get API key and create Custom Search Engine ID
5. Free tier includes 100 searches per day

## Usage Methods

### 1. Running Directly in Scriptable

1. Open Scriptable
2. Tap "Deep Research" script
3. Script will read from clipboard or use default query
4. Wait for results to be copied to clipboard

### 2. iOS Shortcuts Integration

#### Basic Clipboard Workflow:
1. Open iOS Shortcuts app
2. Create new shortcut called "Deep Research"
3. Add these actions:
   - **Get Clipboard** (gets search query)
   - **Run Script** → Select "Deep Research"
   - **Get Clipboard** (gets results)
   - **Quick Look** or **Share** (display results)

#### Advanced Input Shortcut:
1. Add **Ask for Text** action
   - Prompt: "What would you like to research?"
2. Add **Copy to Clipboard** action
3. Add **Run Script** → Select "Deep Research"
4. Add **Get Clipboard** → Get results
5. Add **Quick Look** → Display results

#### Voice-Activated via Siri:
1. Create shortcut as above
2. Go to shortcut settings
3. Add "Add to Siri"
4. Record phrase like "Deep research" or "Search the web"

### 3. Share Sheet Integration

1. Create new shortcut
2. Enable "Use with Share Sheet" in settings
3. Add these actions:
   - **Get Text from Input**
   - **Copy to Clipboard**
   - **Run Script** → Select "Deep Research"
   - **Get Clipboard**
   - **Share**

**Usage:** Select text in any app → Share → "Deep Research"

## Advanced Configuration

### Secure API Key Management with Shortcuts

Create a setup shortcut that stores keys securely:

```
Actions:
1. Ask for Text → "Enter Brave Search API Key"
2. Set Value → Keychain Item: "BRAVE_API_KEY"
3. Ask for Text → "Enter NewsAPI Key"  
4. Set Value → Keychain Item: "NEWS_API_KEY"
5. Ask for Text → "Enter Newsdata.io Key"
6. Set Value → Keychain Item: "NEWSDATA_API_KEY"
```

The script will automatically read these keys from Keychain.

### Custom Result Formatting

Modify the formatSection() function in the script to customize output format for your needs.

### Performance Tuning

Adjust these CONFIG values for your network/usage:
- `MAX_RESULTS`: Number of results per source (default: 5)
- `TIMEOUT_MS`: Network timeout (default: 15000ms)
- `RETRY_COUNT`: Retry attempts (default: 2)

## Troubleshooting

### Common Issues

**"No results found"**
- Check your internet connection
- Verify API keys are correct and not expired
- Try a different search query
- Check if you've exceeded API limits

**"Script execution failed"**
- Check API key configuration
- Ensure Scriptable has network permissions
- Verify iOS clipboard access permissions
- Check iOS console for error details

**"Clipboard access failed"**
- Enable clipboard access in iOS Settings > Privacy & Security
- Grant Scriptable necessary permissions

**"Network timeout"**
- Mobile networks can be slower
- Try on WiFi if having issues on cellular
- Script uses 15-second timeouts by default

**"Shortcuts integration issues"**
- Enable clipboard access for Shortcuts app
- Check script name matches exactly in Shortcuts
- Test script directly in Scriptable first

### Error Messages

- **"Brave Search API key not configured"**: Add your Brave API key
- **"NewsAPI key not configured"**: Add your NewsAPI key  
- **"No valid search query provided"**: Ensure query is in clipboard or passed via Shortcuts

## Performance Tips

- Use WiFi when possible for faster results
- Keep search queries specific but not too narrow
- Monitor your API usage to stay within free limits
- Consider upgrading API plans if you need more requests

## Privacy & Security

- API keys are stored locally on your device
- No data is sent to third parties except the configured APIs
- All API calls are made over HTTPS
- Clipboard data is only used for input/output
- iOS Keychain provides encrypted storage for API keys

## Features

### Core Functionality
- **Multiple API Support**: Brave Search, NewsAPI, Newsdata.io (Google optional)
- **Intelligent Fallbacks**: Automatic fallback from NewsAPI to Newsdata.io
- **Mobile Optimization**: Extended timeouts and retry logic for cellular networks
- **Comprehensive Error Handling**: User-friendly error messages and notifications

### iOS Integration
- **Clipboard Workflow**: Input from clipboard, output to clipboard
- **Shortcuts Integration**: Full iOS Shortcuts app compatibility
- **Voice Control**: Siri integration through Shortcuts
- **Share Sheet**: Research text from any app
- **Native Notifications**: iOS notification system integration
- **Keychain Security**: Secure API key storage

### Advanced Features
- **Multiple Input Methods**: Clipboard, Shortcuts parameters, direct input
- **Configurable Settings**: Customizable timeouts, result limits, and formatting
- **Concurrent API Calls**: Parallel execution for faster results
- **Detailed Logging**: Comprehensive console output for debugging

## Support

If you encounter issues:

1. Check the console output in Scriptable for error messages
2. Verify your API keys are valid and not expired
3. Test with a simple query like "technology news"
4. Ensure you have an active internet connection
5. Try running the script directly in Scriptable first

The script includes comprehensive error handling and logging to help diagnose issues.

## Next Steps

After setup:
1. Test with the compatibility test script
2. Create your preferred Shortcuts workflows
3. Set up Siri voice commands
4. Customize formatting and settings as needed

This unified implementation provides the most comprehensive iOS deep research solution with advanced error handling, multiple input methods, and seamless integration with iOS workflows.