# iOS Shortcuts Integration Example

This document provides a complete example of how to set up the Deep Research script with iOS Shortcuts.

## Step-by-Step Shortcuts Setup

### 1. Create New Shortcut
1. Open the Shortcuts app
2. Tap the "+" to create a new shortcut
3. Name it "Deep Research" or similar

### 2. Add Input Action
1. Add "Ask for Input" action
2. Set Input Type to "Text"
3. Set Prompt to "What would you like to research?"
4. Rename variable to "Search Query"

### 3. Add API Key Configuration
Add the following "Text" actions (one for each API key):

```
Text Action 1:
Content: "your_actual_newsapi_key_here"
Variable Name: "newsApiKey"

Text Action 2:
Content: "your_actual_newsdata_key_here"  
Variable Name: "newsdataKey"

Text Action 3:
Content: "your_actual_brave_api_key_here"
Variable Name: "braveApiKey"

Text Action 4:
Content: "your_actual_google_api_key_here"
Variable Name: "googleApiKey"

Text Action 5:
Content: "your_actual_google_cx_here"
Variable Name: "googleCx"
```

### 4. Add Script Execution
1. Add "Run Script" action
2. Select your "Deep Research" script from Scriptable
3. Map the input parameters:
   - queryText → Search Query
   - newsApiKey → newsApiKey
   - newsdataKey → newsdataKey
   - braveApiKey → braveApiKey
   - googleApiKey → googleApiKey
   - googleCx → googleCx

### 5. Optional: Add Result Display
1. Add "Show Result" action to display the research results
2. Connect it to the output of the Run Script action

## Security Note

⚠️ **API Key Security**: Store your API keys securely. Consider using iOS Shortcuts' "Text" actions to store them, or use environment variables if available.

## Example Shortcut Flow

```
1. Ask for Input → "Search Query"
2. Text → "your_newsapi_key" → "newsApiKey"
3. Text → "your_newsdata_key" → "newsdataKey"  
4. Text → "your_brave_key" → "braveApiKey"
5. Text → "your_google_key" → "googleApiKey"
6. Text → "your_google_cx" → "googleCx"
7. Run Script → "Deep Research"
   Input: All variables above
8. Show Result (Optional)
```

## API Key Sources

- **NewsAPI**: https://newsapi.org (Free tier available)
- **Newsdata.io**: https://newsdata.io (Free tier available)
- **Brave Search**: https://brave.com/search/api (Paid service)
- **Google Custom Search**: https://console.cloud.google.com (Free tier with limits)

## Testing Your Setup

1. Run the shortcut with a simple query like "artificial intelligence"
2. Check that results are copied to clipboard
3. Verify you receive a notification when complete
4. If errors occur, check the console in Scriptable for details

## Troubleshooting

- **No results**: Verify internet connection and API keys
- **Script errors**: Check Scriptable console for detailed error messages
- **Clipboard issues**: Ensure Scriptable has clipboard permissions
- **Notification issues**: Check iOS notification settings for Scriptable