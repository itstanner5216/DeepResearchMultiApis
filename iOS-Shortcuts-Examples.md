# iOS Shortcuts Configuration Examples

This file contains example iOS Shortcuts configurations for the unified Deep Research script.

## Basic Voice-Activated Shortcut

### Setup:
1. Open iOS Shortcuts app
2. Tap "+" to create new shortcut
3. Add these actions in order:

**Actions:**
1. **Dictate Text**
   - Language: English (US)
   - Locale: en-US

2. **Copy to Clipboard**
   - Input: Dictated Text

3. **Run Script**
   - Script: Deep Research
   - No parameters needed

4. **Get Clipboard**
   - (Gets the results from clipboard)

5. **Speak Text**
   - Text: "Research complete. Results are on your clipboard."
   - Rate: Normal
   - Voice: Default

### Siri Setup:
- Shortcut Settings → Add to Siri
- Record phrase: "Deep research" or "Research this"

---

## Text Input Shortcut

### Setup:
1. Create new shortcut
2. Add these actions:

**Actions:**
1. **Ask for Text**
   - Prompt: "What would you like to research?"
   - Default Answer: (leave blank)

2. **Copy to Clipboard**
   - Input: Provided Text

3. **Run Script**
   - Script: Deep Research

4. **Get Clipboard**

5. **Quick Look**
   - Input: Clipboard

---

## Share Sheet Shortcut

### Setup:
1. Create new shortcut
2. Enable "Use with Share Sheet" in settings
3. Add these actions:

**Actions:**
1. **Get Text from Input**
   - (Receives shared text)

2. **Copy to Clipboard**
   - Input: Text

3. **Run Script**
   - Script: Deep Research

4. **Get Clipboard**

5. **Share**
   - Input: Clipboard

### Usage:
- Select text in any app (Safari, Notes, etc.)
- Tap "Share"
- Select "Deep Research" shortcut

---

## Clipboard-to-Clipboard Shortcut

### Setup:
1. Create new shortcut
2. Add these actions:

**Actions:**
1. **Get Clipboard**
   - (Gets current clipboard content as query)

2. **Run Script**
   - Script: Deep Research

3. **Get Clipboard**
   - (Gets results from clipboard)

4. **Show Notification**
   - Title: "Deep Research Complete"
   - Body: "Results copied to clipboard"

### Usage:
1. Copy text to search anywhere
2. Run this shortcut
3. Results replace clipboard content

---

## Advanced Configuration with API Keys

If you want to pass API keys securely through Shortcuts:

### Setup:
1. Create new shortcut
2. Add these actions:

**Actions:**
1. **Ask for Text**
   - Prompt: "Search query?"

2. **Copy to Clipboard**
   - Input: Provided Text

3. **Get Value**
   - From Keychain
   - Key: "BRAVE_API_KEY"
   - Variable: braveKey

4. **Get Value**
   - From Keychain  
   - Key: "NEWS_API_KEY"
   - Variable: newsKey

5. **Get Value**
   - From Keychain
   - Key: "NEWSDATA_API_KEY"
   - Variable: newsdataKey

6. **Dictionary**
   - Create dictionary with:
   ```
   {
     "apiKeys": {
       "braveKey": braveKey,
       "newsKey": newsKey,
       "newsdataKey": newsdataKey
     }
   }
   ```

7. **Run Script**
   - Script: Deep Research
   - Input: Dictionary from step 6

---

## Troubleshooting Shortcuts

### Common Issues:

**"Script failed to run"**
- Check that Scriptable app is installed
- Verify script name matches exactly
- Ensure script is saved in Scriptable

**"No results returned"**
- Check internet connection
- Verify clipboard has search query
- Check API key configuration

**"Permission denied"**
- Enable Scriptable in iOS Settings > Privacy & Security
- Allow clipboard access for Shortcuts app

### Debug Shortcut:

Create a simple debug shortcut:

**Actions:**
1. **Get Clipboard**
2. **Show Result**
   - Shows current clipboard content
3. **Run Script** 
   - Your Deep Research script
4. **Get Clipboard**
5. **Show Result**
   - Shows script output

This helps identify where issues occur in the workflow.

---

## Performance Tips

- Use WiFi when possible for faster API calls
- Keep shortcuts simple for better reliability
- Test shortcuts individually before combining
- Monitor API usage to stay within limits
- Consider caching results for repeated queries

---

## Automation Ideas

### Morning News Briefing:
1. Trigger: Time of day (7:00 AM)
2. Action: Run research for "daily news technology"
3. Result: Speak headlines while getting ready

### Context-Aware Research:
1. Trigger: Focus mode (Work)
2. Action: Research work-related keywords
3. Result: Save to specific note or document

### Location-Based Research:
1. Trigger: Arrive at location
2. Action: Research local news or events
3. Result: Show notification with relevant info

### Quick Research Widget:
1. Create widget shortcut
2. Add to home screen
3. Tap for instant research on predefined topics

---

## Security Best Practices

### API Key Management:
- Store keys in iOS Keychain when possible
- Never hardcode keys in shared shortcuts
- Use dictionary actions for parameter passing
- Test shortcuts thoroughly before sharing

### Privacy Considerations:
- Be aware of clipboard content access
- Consider what data is passed to APIs
- Review shortcut permissions regularly
- Use secure network connections when possible

This comprehensive shortcuts guide provides multiple approaches for integrating the Deep Research script with iOS workflows, from simple clipboard operations to advanced automation scenarios.