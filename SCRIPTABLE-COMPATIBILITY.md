# Scriptable Compatibility Update

The `iosResearch.js` file has been updated to be fully compatible with the Scriptable app on iOS, while maintaining backward compatibility with iOS terminal apps like a-Shell and iSH.

## Key Changes Made

### 1. **Removed Node.js-Specific Dependencies**
- **Replaced `clipboardy`** with Scriptable's `Pasteboard` API
- **Replaced `axios`** with Scriptable's `Request` class
- **Removed `dotenv`** dependency and implemented direct configuration or Keychain storage
- **Made `fs` and `path` usage conditional** for terminal apps only

### 2. **Removed Node.js-Specific Constructs**
- **Removed `#!/usr/bin/env node`** shebang line
- **Made `require.main` checks conditional** to work in both environments
- **Made `require()` statements conditional** for Node.js dependencies

### 3. **Enhanced Configuration Management**
- **Direct configuration** via `SCRIPTABLE_CONFIG` object
- **iOS Keychain support** for secure API key storage
- **Shortcuts parameters support** for passing configuration
- **Environment-aware loading** (Scriptable vs terminal apps)

### 4. **Cross-Platform HTTP Client**
- **IOSHttpClient class** that automatically chooses between:
  - Scriptable's `Request` class (when in Scriptable)
  - Node.js `axios` (when in terminal apps)

### 5. **Enhanced Environment Detection**
- **IOSDetector.isScriptable()** - detects Scriptable environment
- **IOSDetector.isTerminalApp()** - detects iOS terminal apps
- **Automatic adaptation** to the detected environment

### 6. **Improved Notification System**
- **Scriptable notifications** using the `Notification` class
- **Fallback to console output** for terminal apps
- **Shortcuts-compatible output** formatting

## Usage in Scriptable

### Basic Setup
1. Copy the `iosResearch.js` file content into a new Scriptable script
2. Configure API keys in the `SCRIPTABLE_CONFIG` object or use Keychain
3. Run the script directly or via iOS Shortcuts

### Configuration Options

#### Option 1: Direct Configuration
```javascript
const SCRIPTABLE_CONFIG = {
  BRAVE_API_KEY: "your_api_key_here",
  NEWS_API_KEY: "your_news_api_key",
  NEWSDATA_API_KEY: "your_newsdata_key",
  // ... other settings
};
```

#### Option 2: iOS Keychain (Recommended)
Store API keys securely in iOS Keychain using Shortcuts:
```
1. Create a Shortcuts workflow
2. Use "Set Value" actions to store keys in Keychain
3. Set USE_KEYCHAIN: true in config
```

#### Option 3: Shortcuts Parameters
Pass configuration as parameters when calling from iOS Shortcuts.

### Running the Script

#### Clipboard Workflow (Default)
1. Copy search query to clipboard
2. Run script in Scriptable
3. Results are copied back to clipboard

#### Direct Query
- Run with Shortcuts parameters containing the query
- Results are both copied to clipboard and set as Shortcuts output

#### Voice Activation
Create iOS Shortcuts that:
1. Accept voice input
2. Pass query to Scriptable script
3. Read results back to user

## Backward Compatibility

The updated script maintains full backward compatibility with iOS terminal apps:
- **Detects environment automatically**
- **Uses appropriate APIs** for each environment
- **Maintains original CLI interface** for terminal apps
- **Preserves all existing functionality**

## Testing

Run the compatibility test:
```bash
node ios-compatibility-test.js
```

This tests:
- Environment detection
- Clipboard functionality
- Notifications
- Shortcuts integration
- API framework
- Complete workflow

## Benefits

### For Scriptable Users
- **Native iOS integration** with Pasteboard, Notifications, Keychain
- **iOS Shortcuts compatibility** with voice control
- **Secure API key storage** via iOS Keychain
- **Optimized for mobile** performance and battery life

### For Terminal App Users
- **Maintains existing functionality** with `axios`, `clipboardy`, etc.
- **File system operations** still work where available
- **Environment variables** and config files still supported
- **All CLI options** remain functional

## Architecture

The script now uses a **dual-mode architecture**:

1. **Scriptable Mode** - When running in Scriptable app
   - Uses native iOS APIs (`Pasteboard`, `Request`, `Notification`)
   - Supports Keychain and Shortcuts integration
   - Optimized for iOS workflows

2. **Terminal Mode** - When running in iOS terminal apps
   - Uses Node.js APIs (`axios`, `clipboardy`, `fs`)
   - Supports file operations and environment variables
   - Maintains CLI compatibility

The **IOSDetector** class automatically determines the environment and the script adapts accordingly, providing the best experience for each platform while maintaining unified functionality.