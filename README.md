# DeepResearchMultiApis

A comprehensive JavaScript script designed to fetch data from multiple APIs for deep research purposes. The script provides unified access to Brave Search, Google Search (web and images), NewsAPI, and Newsdata.io with robust error handling, logging, and user notifications.

## Features

- **Multi-API Integration**: Seamlessly query multiple search and news APIs
- **Clipboard Support**: Read search queries from clipboard and copy results back
- **System Notifications**: Get notified when research is complete or encounters errors
- **Robust Error Handling**: Automatic retries, fallback strategies, and detailed logging
- **Formatted Output**: Results saved in Markdown format with structured data
- **API Key Management**: Secure environment-based API key configuration

## Supported APIs

1. **Brave Search** - Web search results
2. **Google Custom Search** - Web and image search results
3. **NewsAPI** - News articles from various sources
4. **Newsdata.io** - News articles with fallback strategies

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

3. Set up your API keys:
```bash
npm run setup
```

4. Edit the `.env` file with your API keys:
```bash
# Copy from .env.template and fill in your keys
BRAVE_API_KEY=your_brave_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CSE_ID=your_custom_search_engine_id_here
NEWSAPI_API_KEY=your_newsapi_key_here
NEWSDATA_API_KEY=your_newsdata_key_here
```

## API Key Setup

### Brave Search
- Sign up at [Brave Search API](https://api.search.brave.com/)
- Get your API key from the dashboard

### Google Custom Search
- Get API key from [Google Cloud Console](https://developers.google.com/custom-search/v1/introduction)
- Create a Custom Search Engine at [Google CSE](https://cse.google.com/)
- Note your Search Engine ID

### NewsAPI
- Sign up at [NewsAPI](https://newsapi.org/)
- Get your free API key (supports up to 1000 requests/day)

### Newsdata.io
- Sign up at [Newsdata.io](https://newsdata.io/)
- Get your API key from the dashboard

## Usage

### Command Line

```bash
# With search query as argument
node research.js "artificial intelligence"

# Or use npm script
npm start "machine learning trends"

# Read query from clipboard (copy text first)
node research.js
```

### Programmatic Usage

```javascript
const { performResearch, braveSearch, newsAPI } = require('./research.js');

// Perform comprehensive research
async function example() {
    try {
        const results = await performResearch('climate change');
        console.log('Research complete:', results);
    } catch (error) {
        console.error('Research failed:', error);
    }
}

// Use individual API functions
async function braveExample() {
    try {
        const results = await braveSearch('renewable energy', {
            count: 20,
            freshness: 'pd' // past day
        });
        console.log('Brave results:', results);
    } catch (error) {
        console.error('Brave search failed:', error);
    }
}
```

## API Functions

### `braveSearch(query, options)`
Search the web using Brave Search API.

**Options:**
- `type`: 'web' (default)
- `count`: Number of results (default: 10)
- `offset`: Results offset (default: 0)
- `market`: Market code (default: 'en-US')
- `freshness`: Time filter ('pd', 'pw', 'pm', 'py')
- `safesearch`: Safe search level

### `googleSearch(query, options)`
Search using Google Custom Search Engine.

**Options:**
- `type`: 'web' (default) or 'image'
- `count`: Number of results (max: 10)
- `start`: Starting index (default: 1)

### `newsAPI(query, options)`
Search news articles using NewsAPI.

**Options:**
- `endpoint`: 'everything' (default) or 'top-headlines'
- `pageSize`: Results per page (max: 100)
- `page`: Page number
- `sortBy`: 'publishedAt' (default), 'relevancy', 'popularity'
- `language`: Language code (default: 'en')
- `from`: Date from (YYYY-MM-DD)
- `to`: Date to (YYYY-MM-DD)
- `sources`: Comma-separated source IDs
- `domains`: Comma-separated domains

### `newsdataFallback(query, options)`
Search news using Newsdata.io with automatic fallback.

**Options:**
- `size`: Number of results (max: 50)
- `language`: Language code (default: 'en')
- `category`: News category
- `country`: Country code
- `domain`: Specific domain

## Output Format

Results are saved in Markdown format with:
- Timestamp and query information
- Results from each API source
- Error information for failed APIs
- Structured data including titles, URLs, descriptions, and metadata

Example output structure:
```markdown
# Deep Research Results
Generated: 2025-01-01T12:00:00.000Z

## Brave Search
Query: "artificial intelligence"
Total Results: 1000000
Type: web

### Result 1
**Title:** Understanding Artificial Intelligence
**URL:** https://example.com/ai-guide
**Description:** Comprehensive guide to AI...
...
```

## Error Handling

The script includes comprehensive error handling:

- **Automatic Retries**: Failed requests are retried up to 3 times
- **Fallback Strategies**: Newsdata.io includes automatic fallback with simplified queries
- **Graceful Degradation**: If one API fails, others continue to work
- **Detailed Logging**: All errors and debug information logged to `research.log`
- **User Notifications**: System notifications for success/failure status

## Logging

All operations are logged to:
- Console output (with timestamps)
- `research.log` file (persistent logging)

Log levels:
- `INFO`: General operation information
- `WARN`: Warning conditions (missing API keys, etc.)
- `ERROR`: Error conditions with stack traces
- `DEBUG`: Detailed debugging information

## File Structure

```
DeepResearchMultiApis/
├── research.js          # Main application script
├── package.json         # Node.js dependencies and scripts
├── .env.template        # API key configuration template
├── .gitignore          # Git ignore rules
├── README.md           # This documentation
├── results/            # Output directory for research results
└── research.log        # Application log file
```

## Development

### Adding New APIs

To add a new API integration:

1. Create a new function following the pattern:
```javascript
async function newAPISearch(query, options = {}) {
    Logger.info(`Starting New API search for: "${query}"`);
    
    const apiKey = APIKeyManager.getKey('NEWAPI');
    if (!apiKey) {
        throw new Error('New API key not configured');
    }
    
    try {
        // API implementation
        const response = await HTTPClient.makeRequest(url, requestOptions);
        
        return {
            source: 'New API',
            query,
            timestamp: new Date().toISOString(),
            total: response.totalResults || 0,
            results: response.results || []
        };
    } catch (error) {
        Logger.error('New API failed', error);
        throw new Error(`New API failed: ${error.message}`);
    }
}
```

2. Add the API to the research orchestrator in `performResearch()`
3. Add API key configuration to `.env.template`
4. Update documentation

### Testing

Currently, the script includes basic error handling and logging. For testing individual components:

```javascript
// Test individual API functions
const { braveSearch } = require('./research.js');

braveSearch('test query')
    .then(results => console.log('Success:', results))
    .catch(error => console.error('Error:', error));
```

## Troubleshooting

### Common Issues

1. **API Key Errors**
   - Ensure all API keys are correctly set in `.env` file
   - Check API key validity and rate limits

2. **Network Errors**
   - Check internet connection
   - Verify API endpoints are accessible
   - Check for firewall restrictions

3. **Clipboard Issues**
   - Ensure clipboard permissions are granted
   - Try running with administrator/sudo privileges if needed

4. **Notification Issues**
   - Check system notification permissions
   - On Linux, ensure notification daemon is running

### Debug Mode

For detailed debugging, check the `research.log` file or run with increased logging:

```bash
# View real-time logs
tail -f research.log

# Run with debug output
node research.js "debug query" 2>&1 | tee debug.log
```

## License

ISC License - see package.json for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs in `research.log`
3. Open an issue on GitHub with detailed information
