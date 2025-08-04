# DeepResearchMultiApis

A robust multi-API deep research tool designed for MyAssistantGPT that fetches data from multiple search and news APIs with comprehensive error handling and fallback strategies.

## Features

- **Multiple API Support**: Brave Search, NewsAPI, and Newsdata.io
- **Robust Error Handling**: Comprehensive error handling with detailed logging
- **Fallback Strategies**: Automatic fallbacks when APIs fail
- **Retry Logic**: Exponential backoff retry mechanism
- **Clipboard Integration**: Search from clipboard content
- **System Notifications**: Desktop notifications for search results
- **iOS Compatibility**: Optimized for iOS 18.6+ with Shortcuts support
- **Flexible Configuration**: JSON and environment variable configuration
- **Comprehensive Logging**: Detailed logging to file and console

## Installation

1. Clone the repository:
```bash
git clone https://github.com/itstanner5216/DeepResearchMultiApis.git
cd DeepResearchMultiApis
```

2. Install dependencies:
```bash
npm install
```

3. Configure API keys:
```bash
cp .env.example .env
# Edit .env file with your API keys
```

## API Keys Setup

### Brave Search API
1. Visit [Brave Search API](https://api.search.brave.com/app/keys)
2. Sign up for an account and get your API key
3. Add to `.env`: `BRAVE_API_KEY=your_key_here`

### NewsAPI
1. Visit [NewsAPI](https://newsapi.org/account)
2. Sign up for an account and get your API key
3. Add to `.env`: `NEWS_API_KEY=your_key_here`

### Newsdata.io
1. Visit [Newsdata.io](https://newsdata.io/account/dashboard)
2. Sign up for an account and get your API key
3. Add to `.env`: `NEWSDATA_API_KEY=your_key_here`

## Usage

### Desktop/Server Usage

Search with a query:
```bash
node deepResearch.js "artificial intelligence"
```

Search from clipboard:
```bash
node deepResearch.js
```

View configuration:
```bash
npm run config
```

### iOS Usage

For iOS devices, use the optimized iOS version:

```bash
# iOS-optimized script with clipboard workflow
node iosResearch.js

# iOS Shortcuts integration
node shortcutsResearch.js
```

**📱 iOS Setup**: See [iOS-SETUP.md](iOS-SETUP.md) for detailed iOS installation and Shortcuts integration instructions.

### Using npm scripts:
```bash
npm start "your search query"
npm run search "your search query"
npm run config
npm test

# iOS-specific scripts
npm run ios              # iOS clipboard workflow
npm run ios-config       # iOS configuration
npm run ios-test         # Test iOS clipboard access
npm run shortcuts        # iOS Shortcuts wrapper
```

### Programmatic Usage

```javascript
const { DeepResearcher } = require('./deepResearch');

const researcher = new DeepResearcher();

// Search with Brave Search
const braveResults = await researcher.braveSearch('AI technology');

// Search with NewsAPI
const newsResults = await researcher.newsAPI('artificial intelligence');

// Search with Newsdata.io (fallback)
const fallbackResults = await researcher.newsdataFallback('machine learning');

// Comprehensive search (all APIs)
const allResults = await researcher.comprehensiveSearch('deep learning');
```

## API Functions

### braveSearch(query, options)
Searches using Brave Search API with robust error handling.

**Parameters:**
- `query` (string): Search query
- `options` (object): Optional parameters
  - `count`: Number of results (default: 10)
  - `offset`: Result offset (default: 0)
  - `market`: Market/region (default: 'en-US')
  - `safesearch`: Safe search level (default: 'moderate')

**Returns:** Promise with result object containing:
- `success`: Boolean indicating success/failure
- `source`: 'braveSearch'
- `query`: Original query
- `resultsCount`: Number of results
- `results`: Array of search results
- `timestamp`: ISO timestamp

### newsAPI(query, options)
Searches news using NewsAPI with robust error handling.

**Parameters:**
- `query` (string): Search query
- `options` (object): Optional parameters
  - `pageSize`: Results per page (default: 20, max: 100)
  - `page`: Page number (default: 1)
  - `sortBy`: Sort order (default: 'publishedAt')
  - `language`: Language code (default: 'en')
  - `from`: Start date
  - `to`: End date

**Returns:** Promise with result object containing news articles.

### newsdataFallback(query, options)
Searches news using Newsdata.io API as fallback with robust error handling.

**Parameters:**
- `query` (string): Search query
- `options` (object): Optional parameters
  - `language`: Language code (default: 'en')
  - `country`: Country code
  - `category`: News category
  - `size`: Number of results (default: 10, max: 50)

**Returns:** Promise with result object containing news articles.

## Error Handling

The tool includes comprehensive error handling:

- **API Key Validation**: Checks for missing or invalid API keys
- **Network Timeouts**: Configurable timeouts with retry logic
- **Rate Limiting**: Handles rate limit responses gracefully
- **Invalid Responses**: Validates API responses
- **Fallback Mechanisms**: Uses alternative APIs when primary fails

## Configuration

### Environment Variables (.env)
```env
BRAVE_API_KEY=your_brave_api_key
NEWS_API_KEY=your_newsapi_key
NEWSDATA_API_KEY=your_newsdata_key
GOOGLE_API_KEY=your_google_key (optional)
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id (optional)
```

### Configuration File (config.json)
The tool auto-generates a configuration file with API settings, timeouts, and retry policies.

## Testing

Run the test suite:
```bash
npm test
```

The tests validate:
- Configuration loading
- Error handling for all API functions
- Input validation
- Retry mechanisms
- Response processing

## Logging

Logs are written to:
- Console (formatted output)
- `research.log` file (detailed logs)

Log levels: INFO, WARN, ERROR, DEBUG

## System Requirements

### Desktop/Server
- Node.js 14+ 
- Internet connection for API access
- Valid API keys for the services you want to use

### iOS Requirements
- iOS 18.6 or later
- Terminal app: **a-Shell** (recommended) or **iSH**
- iOS Shortcuts app (for automation)
- Node.js installed in terminal app
- Valid API keys

📱 **For iOS setup instructions**, see [iOS-SETUP.md](iOS-SETUP.md)

## Error Codes

Common error scenarios:
- `401`: Invalid API key
- `429`: Rate limit exceeded
- `ECONNABORTED`: Request timeout
- `403`: Access forbidden
- `426`: Upgrade required (NewsAPI)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

ISC License
