# DeepResearchMultiApis

A comprehensive multi-API research script optimized for iOS devices with full Shortcuts app integration and clipboard compatibility.

## iOS Compatibility Features

This script is specifically designed to work seamlessly on iOS devices with the following features:

### ✅ iOS Environment Detection
- Automatically detects if running on iOS
- Adapts functionality based on the environment
- Provides graceful fallbacks for non-iOS platforms

### 📋 Enhanced Clipboard Integration
- Full iOS clipboard read/write support
- Error handling for clipboard operations
- Automatic clipboard copying of research results

### 🔗 iOS Shortcuts App Integration
- Native Shortcuts app compatibility
- Input parameter support through Shortcuts
- Structured output for Shortcuts workflows
- Error notifications through iOS notification system

## Setup Instructions for iOS

### Prerequisites
1. **Scriptable App**: Download and install [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) from the App Store
2. **API Keys**: Obtain API keys from the services you want to use

### Required API Keys
- **NewsAPI**: Get your free key from [newsapi.org](https://newsapi.org)
- **Newsdata.io**: Get your key from [newsdata.io](https://newsdata.io)
- **Brave Search**: Get your key from [brave.com/search/api](https://brave.com/search/api)
- **Google Custom Search**: Get API key and Search Engine ID from [Google Cloud Console](https://console.cloud.google.com)

### Installation Steps

1. **Copy the Script**:
   - Copy the entire `deep_research_script.js` content
   - Open Scriptable app on your iOS device
   - Tap the "+" to create a new script
   - Paste the script content
   - Save with a descriptive name (e.g., "Deep Research")

2. **Configure API Keys in Shortcuts**:
   - Open the Shortcuts app
   - Create a new shortcut
   - Add "Run Script" action and select your Scriptable script
   - Add "Text" actions for each API key:
     - `newsApiKey`: Your NewsAPI key
     - `newsdataKey`: Your Newsdata.io key
     - `braveApiKey`: Your Brave Search API key
     - `googleApiKey`: Your Google API key
     - `googleCx`: Your Google Custom Search Engine ID

3. **Set Up Query Input**:
   - Add an "Ask for Input" action at the beginning
   - Set input type to "Text"
   - Connect this to the script as `queryText` parameter

### Shortcuts Integration Example

```
1. Ask for Input (Text) → Variable: "Search Query"
2. Text Action → "YOUR_NEWS_API_KEY" → Variable: "newsApiKey"
3. Text Action → "YOUR_NEWSDATA_KEY" → Variable: "newsdataKey"
4. Text Action → "YOUR_BRAVE_API_KEY" → Variable: "braveApiKey"
5. Text Action → "YOUR_GOOGLE_API_KEY" → Variable: "googleApiKey"
6. Text Action → "YOUR_GOOGLE_CX" → Variable: "googleCx"
7. Run Script → Select "Deep Research" script
   - Pass all variables as input parameters
8. Show Result (optional)
```

### Usage

1. **From Shortcuts**: Run your configured shortcut
2. **From Scriptable**: Open the script and run directly
3. **From Siri**: Add your shortcut to Siri for voice activation

### Features

- **Multi-source research**: Combines results from Google, Brave, NewsAPI, and Newsdata.io
- **Intelligent fallbacks**: If one API fails, others continue working
- **Formatted output**: Results are formatted in Markdown for easy reading
- **Clipboard integration**: Results are automatically copied to clipboard
- **iOS notifications**: Get notified when research is complete
- **Error handling**: Comprehensive error handling with user-friendly messages

### Troubleshooting

#### Common Issues:

1. **"API key not configured" messages**:
   - Ensure all API keys are properly set in your Shortcuts workflow
   - Verify API keys are valid and have sufficient quota

2. **No results returned**:
   - Check your internet connection
   - Verify your search query is not too specific
   - Check if APIs are rate-limited

3. **Script errors**:
   - Ensure you're using the latest version of Scriptable app
   - Check that all API keys are correctly formatted
   - Try running with a simpler query first

#### iOS-Specific Notes:

- The script automatically detects iOS environment
- Clipboard operations are optimized for iOS
- Notifications use iOS native notification system
- All network requests work within iOS app sandbox

### Customization

You can customize the script by:
- Modifying the number of results per source
- Changing the output format
- Adding additional API sources
- Adjusting error handling behavior

### Privacy & Security

- API keys are handled securely within your device
- No data is stored permanently by the script
- All API calls are made directly from your device
- Results are only stored in clipboard temporarily

For support or issues, please refer to the repository documentation.
