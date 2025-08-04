# DeepResearchMultiApis

A robust deep research tool for iOS using Scriptable, compatible with iOS 18.6+ and iOS Shortcuts integration. Implements the core functionality from PR #2 optimized for mobile usage with comprehensive error handling and clipboard integration.

## Features

- **iOS 18.6+ Compatible**: Fully optimized for iOS Scriptable app
- **iOS Shortcuts Integration**: Seamless integration with iOS Shortcuts app
- **Multiple API Support**: Brave Search, NewsAPI, and Newsdata.io with fallback strategies
- **Clipboard Workflow**: Input from clipboard, output to clipboard for easy iOS usage
- **Comprehensive Error Handling**: Robust error handling with detailed logging
- **Secure API Key Storage**: Multiple options for storing API keys securely on iOS
- **Mobile Network Optimized**: Longer timeouts and retry logic for cellular networks
- **Voice Integration**: Works with Siri through iOS Shortcuts
- **Notification Support**: Native iOS notifications for completion status

## Core Functions Implemented

1. **`braveSearch()`** - Brave Search API integration with robust error handling
2. **`newsAPI()`** - NewsAPI.org integration with advanced parameter support  
3. **`newsdataFallback()`** - Newsdata.io API as fallback mechanism

All functions include comprehensive error handling, input validation, retry logic, and mobile network optimization.

## Quick Start

### 1. Install Scriptable
Download "Scriptable" from the App Store (free)

### 2. Add the Script
1. Open Scriptable
2. Create new script called "Deep Research"
3. Copy the content of `deep_research_script.js`
4. Configure your API keys (see setup guide)

### 3. Basic Usage
- Copy text to clipboard → Run script → Get results from clipboard
- Use with iOS Shortcuts for voice activation
- Share text from any app → Use "Deep Research" shortcut

## API Keys Required

Get free API keys from:
- **Brave Search**: [api.search.brave.com](https://api.search.brave.com/app/keys) (2,000 queries/month free)
- **NewsAPI**: [newsapi.org](https://newsapi.org/register) (1,000 requests/day free)  
- **Newsdata.io**: [newsdata.io](https://newsdata.io/register) (200 requests/day free)

## Documentation

- **[iOS Setup Guide](iOS_Setup_Guide.md)** - Complete installation and configuration instructions
- **[iOS Shortcuts Examples](iOS_Shortcuts_Examples.md)** - Ready-to-use Shortcuts configurations
- **[Compatibility Test](ios_compatibility_test.js)** - Test script to verify iOS compatibility

## iOS Shortcuts Examples

### Voice-Activated Research
1. Say "Hey Siri, deep research" 
2. Speak your query
3. Get results read back to you

### Share Sheet Integration
1. Select text in any app
2. Tap Share → "Deep Research"
3. View formatted results

### Clipboard Workflow
1. Copy search query
2. Run "Deep Research" shortcut
3. Results automatically replace clipboard

## Error Handling

The script includes comprehensive error handling for:
- Missing or invalid API keys
- Network connectivity issues
- API rate limiting and timeouts
- Invalid search queries
- iOS permission issues

## Mobile Optimization

- **15-second timeouts** for slower mobile networks
- **Progressive retry logic** with exponential backoff
- **Result limiting** to improve performance on mobile
- **Efficient clipboard management** for iOS workflows
- **Battery-conscious API calls** with smart fallbacks

## Testing

Run the compatibility test to verify your setup:
```javascript
// Copy ios_compatibility_test.js to Scriptable and run
```

Tests clipboard access, notifications, API integration, and iOS Shortcuts compatibility.

## Troubleshooting

**No results returned:**
- Check internet connection
- Verify API keys are configured
- Try simpler search terms
- Check API usage limits

**Script fails to run:**
- Ensure Scriptable has network permissions
- Check iOS clipboard access permissions
- Verify API keys are valid

**Shortcuts integration issues:**
- Enable clipboard access for Shortcuts app
- Check script name matches exactly in Shortcuts
- Test script directly in Scriptable first

## Advanced Usage

### Secure API Key Storage
```javascript
// Store in iOS Keychain via Shortcuts
Keychain.set("BRAVE_API_KEY", "your_key_here");
```

### Custom Result Formatting
Modify the `formatSection()` function to customize output format.

### Performance Tuning
Adjust `CONFIG.MAX_RESULTS` and `CONFIG.TIMEOUT_MS` for your needs.

## Privacy & Security

- All API keys stored locally on device
- No data sent to third parties except configured APIs
- HTTPS-only API communications
- Clipboard data used only for input/output

## License

ISC License

## Support

For issues with:
- **Setup**: See iOS_Setup_Guide.md
- **Shortcuts**: See iOS_Shortcuts_Examples.md  
- **Compatibility**: Run ios_compatibility_test.js
- **API Issues**: Check individual API documentation

This implementation fulfills the requirements from PR #2 with full iOS 18.6+ compatibility and iOS Shortcuts integration.
