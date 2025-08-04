# iOS Setup Guide for Deep Research Multi-APIs

This guide will help you set up the Deep Research script on iOS using the Scriptable app for iOS 18.6+.

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

You have several options to configure your API keys:

#### Option A: Direct Configuration (Simplest)
Edit the script and add your API keys directly in the CONFIG section:

```javascript
const CONFIG = {
  BRAVE_API_KEY: "your_brave_api_key_here",
  NEWS_API_KEY: "your_newsapi_key_here",  
  NEWSDATA_API_KEY: "your_newsdata_key_here",
  // ... rest of config
};
```

#### Option B: iOS Keychain (Most Secure)
Use iOS Shortcuts to store API keys securely:

1. Open iOS Shortcuts app
2. Create a new shortcut to set keys:
   - Add "Set Value" action
   - Set to Keychain
   - Key: "BRAVE_API_KEY", Value: your key
   - Repeat for other API keys

#### Option C: Via iOS Shortcuts Parameters
Pass API keys as parameters when calling from iOS Shortcuts.

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

## Usage

### Running Directly in Scriptable

1. Open Scriptable
2. Tap "Deep Research" script
3. Enter a search query when prompted (or copy to clipboard first)
4. Wait for results to be copied to clipboard

### iOS Shortcuts Integration

#### Basic Shortcut Setup:

1. Open iOS Shortcuts app
2. Create new shortcut
3. Add "Run Script" action
4. Select your Deep Research script
5. Add "Get Clipboard" action to get results
6. Add "Show Result" or "Share" action

#### Advanced Shortcut with Input:

1. Add "Ask for Text" action (or "Get Text from Share Sheet")
2. Add "Copy to Clipboard" action
3. Add "Run Script" action for Deep Research
4. Add "Get Clipboard" action for results
5. Add "Quick Look" or "Share" action

#### Siri Integration:

1. Create a shortcut as above
2. Go to shortcut settings
3. Add "Add to Siri"
4. Record phrase like "Deep research" or "Search the web"

## Troubleshooting

### Common Issues

**"No results found"**
- Check your internet connection
- Verify API keys are correct
- Try a different search query
- Check if you've exceeded API limits

**"Script execution failed"**
- Check API key configuration
- Ensure Scriptable has network permissions
- Try running script again
- Check iOS console for error details

**"Clipboard access failed"**
- Enable clipboard access in iOS Settings > Privacy & Security
- Grant Scriptable necessary permissions

**"Network timeout"**
- Mobile networks can be slower
- Script uses 15-second timeouts by default
- Try on WiFi if having issues on cellular

### Error Messages

- **"Brave Search API key not configured"**: Add your Brave API key
- **"NewsAPI key not configured"**: Add your NewsAPI key  
- **"No valid search query provided"**: Ensure query is copied to clipboard or passed via Shortcuts

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

## Customization

You can modify the script to:
- Change the number of results returned (edit `MAX_RESULTS`)
- Adjust timeout values for slower networks
- Disable notifications or clipboard copying
- Add additional formatting options

## Support

If you encounter issues:

1. Check the console output in Scriptable for error messages
2. Verify your API keys are valid and not expired
3. Test with a simple query like "technology news"
4. Ensure you have an active internet connection
5. Try running the script directly in Scriptable first

The script includes comprehensive error handling and logging to help diagnose issues.