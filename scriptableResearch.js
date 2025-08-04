/**
 * Scriptable iOS Deep Research Script
 * Compatible with iOS 18.6+ Scriptable app
 * Designed for seamless iOS Shortcuts integration with clipboard workflow
 * 
 * Setup Instructions:
 * 1. Install Scriptable app from App Store
 * 2. Copy this script into Scriptable
 * 3. Configure API keys in the script or use iOS Keychain
 * 4. Create iOS Shortcut to run this script
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

// API Configuration - Update these with your API keys
// You can also store them securely in iOS Keychain using Keychain.set()
const API_CONFIG = {
  braveSearch: {
    apiKey: '', // Set your Brave Search API key here
    baseUrl: 'https://api.search.brave.com/res/v1/web/search',
    timeout: 15000
  },
  newsAPI: {
    apiKey: '', // Set your NewsAPI key here  
    baseUrl: 'https://newsapi.org/v2/everything',
    timeout: 15000
  },
  newsdataIO: {
    apiKey: '', // Set your Newsdata.io API key here
    baseUrl: 'https://newsdata.io/api/1/news', 
    timeout: 15000
  }
};

// =============================================================================
// SCRIPTABLE UTILITIES
// =============================================================================

class ScriptableLogger {
  static log(level, message, error = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    console.log(logEntry);
    
    if (error) {
      console.error(`Error details: ${error.message}`);
    }
  }
  
  static info(message) { this.log('info', message); }
  static warn(message) { this.log('warn', message); }
  static error(message, error = null) { this.log('error', message, error); }
  static debug(message) { this.log('debug', message); }
}

class ScriptableNotification {
  static notify(title, message, type = 'info') {
    // Create iOS notification
    const notification = new Notification();
    notification.title = title;
    notification.body = message;
    notification.sound = type === 'error' ? 'failure' : 'default';
    notification.schedule();
    
    ScriptableLogger.info(`NOTIFICATION: ${title} - ${message}`);
  }
}

class ScriptableConfig {
  static async loadAPIKeys() {
    const config = { ...API_CONFIG };
    
    try {
      // Try to load API keys from iOS Keychain for security
      const braveKey = await Keychain.get('BRAVE_API_KEY');
      const newsKey = await Keychain.get('NEWS_API_KEY'); 
      const newsdataKey = await Keychain.get('NEWSDATA_API_KEY');
      
      if (braveKey) config.braveSearch.apiKey = braveKey;
      if (newsKey) config.newsAPI.apiKey = newsKey;
      if (newsdataKey) config.newsdataIO.apiKey = newsdataKey;
      
      ScriptableLogger.info('API keys loaded from Keychain');
    } catch (error) {
      ScriptableLogger.warn('Could not load from Keychain, using hardcoded keys');
    }
    
    return config;
  }
  
  static async setAPIKey(service, key) {
    try {
      await Keychain.set(`${service.toUpperCase()}_API_KEY`, key);
      ScriptableLogger.info(`API key set for ${service}`);
      return true;
    } catch (error) {
      ScriptableLogger.error(`Failed to set API key for ${service}`, error);
      return false;
    }
  }
}

// =============================================================================
// HTTP REQUEST UTILITY
// =============================================================================

class ScriptableHTTP {
  static async request(config) {
    try {
      const request = new Request(config.url);
      request.method = config.method || 'GET';
      request.timeoutInterval = config.timeout || 15000;
      
      // Set headers
      if (config.headers) {
        Object.keys(config.headers).forEach(key => {
          request.headers[key] = config.headers[key];
        });
      }
      
      // Add query parameters for GET requests
      if (config.params && config.method !== 'POST') {
        const url = new URL(config.url);
        Object.keys(config.params).forEach(key => {
          url.searchParams.append(key, config.params[key]);
        });
        request.url = url.toString();
      }
      
      // Set body for POST requests
      if (config.body) {
        request.body = JSON.stringify(config.body);
      }
      
      const response = await request.loadJSON();
      
      return {
        data: response,
        status: 200, // Scriptable doesn't expose status codes easily
        headers: {}
      };
      
    } catch (error) {
      ScriptableLogger.error('HTTP request failed', error);
      throw new Error(`Network request failed: ${error.message}`);
    }
  }
}

// =============================================================================
// RETRY UTILITY
// =============================================================================

class ScriptableRetry {
  static async withRetry(fn, maxRetries = 2, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        ScriptableLogger.warn(`Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Simple delay
        const delay = baseDelay * attempt;
        ScriptableLogger.info(`Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
  }
  
  static sleep(ms) {
    return new Promise(resolve => Timer.schedule(ms, false, resolve));
  }
}

// =============================================================================
// MAIN RESEARCH CLASS
// =============================================================================

class ScriptableDeepResearcher {
  constructor() {
    this.config = null;
    ScriptableLogger.info('Scriptable Deep Researcher initialized for iOS 18.6+');
  }
  
  async initialize() {
    this.config = await ScriptableConfig.loadAPIKeys();
    ScriptableLogger.info('Configuration loaded');
  }
  
  // Brave Search implementation
  async braveSearch(query, options = {}) {
    const functionName = 'braveSearch';
    ScriptableLogger.info(`${functionName}: Starting search for query: "${query}"`);
    
    try {
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new Error('Query must be a non-empty string');
      }
      
      if (!this.config.braveSearch.apiKey) {
        throw new Error('Brave Search API key not configured. Use Keychain.set("BRAVE_API_KEY", "your_key") or update the script.');
      }
      
      const params = {
        q: query.trim(),
        count: Math.min(options.count || 5, 10),
        mkt: options.market || 'en-US',
        safesearch: options.safesearch || 'moderate'
      };
      
      const requestConfig = {
        method: 'GET',
        url: this.config.braveSearch.baseUrl,
        params: params,
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': this.config.braveSearch.apiKey,
          'User-Agent': 'Scriptable-iOS-DeepResearch/1.0'
        },
        timeout: this.config.braveSearch.timeout
      };
      
      const response = await ScriptableRetry.withRetry(
        async () => {
          const result = await ScriptableHTTP.request(requestConfig);
          if (!result.data) {
            throw new Error('Empty response from Brave Search API');
          }
          return result;
        },
        2
      );
      
      const results = this.processBraveSearchResponse(response.data);
      
      ScriptableLogger.info(`${functionName}: Successfully retrieved ${results.length} results`);
      ScriptableNotification.notify('Brave Search', `Found ${results.length} results`);
      
      return {
        success: true,
        source: 'braveSearch',
        query: query,
        resultsCount: results.length,
        results: results,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      ScriptableLogger.error(`${functionName}: Failed for query "${query}"`, error);
      ScriptableNotification.notify('Brave Search Error', error.message, 'error');
      
      return {
        success: false,
        source: 'braveSearch',
        query: query,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  processBraveSearchResponse(data) {
    const results = [];
    
    try {
      if (data.web && data.web.results) {
        data.web.results.forEach(item => {
          results.push({
            title: item.title || 'No title',
            url: item.url || '',
            description: item.description || 'No description',
            published: item.published || null
          });
        });
      }
    } catch (error) {
      ScriptableLogger.error('Error processing Brave Search response', error);
    }
    
    return results;
  }
  
  // NewsAPI implementation
  async newsAPI(query, options = {}) {
    const functionName = 'newsAPI';
    ScriptableLogger.info(`${functionName}: Starting news search for query: "${query}"`);
    
    try {
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new Error('Query must be a non-empty string');
      }
      
      if (!this.config.newsAPI.apiKey) {
        throw new Error('NewsAPI key not configured. Use Keychain.set("NEWS_API_KEY", "your_key") or update the script.');
      }
      
      const params = {
        q: query.trim(),
        pageSize: Math.min(options.pageSize || 10, 20),
        sortBy: options.sortBy || 'publishedAt',
        language: options.language || 'en'
      };
      
      const requestConfig = {
        method: 'GET',
        url: this.config.newsAPI.baseUrl,
        params: params,
        headers: {
          'Authorization': `Bearer ${this.config.newsAPI.apiKey}`,
          'User-Agent': 'Scriptable-iOS-DeepResearch/1.0'
        },
        timeout: this.config.newsAPI.timeout
      };
      
      const response = await ScriptableRetry.withRetry(
        async () => {
          const result = await ScriptableHTTP.request(requestConfig);
          if (!result.data || result.data.status !== 'ok') {
            throw new Error(result.data?.message || 'NewsAPI returned error');
          }
          return result;
        },
        2
      );
      
      const results = this.processNewsAPIResponse(response.data);
      
      ScriptableLogger.info(`${functionName}: Successfully retrieved ${results.length} articles`);
      ScriptableNotification.notify('NewsAPI', `Found ${results.length} articles`);
      
      return {
        success: true,
        source: 'newsAPI',
        query: query,
        resultsCount: results.length,
        results: results,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      ScriptableLogger.error(`${functionName}: Failed for query "${query}"`, error);
      ScriptableNotification.notify('NewsAPI Error', error.message, 'error');
      
      return {
        success: false,
        source: 'newsAPI',
        query: query,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  processNewsAPIResponse(data) {
    const results = [];
    
    try {
      if (data.articles) {
        data.articles.forEach(article => {
          results.push({
            title: article.title || 'No title',
            url: article.url || '',
            description: article.description || 'No description',
            author: article.author || 'Unknown author',
            source: article.source?.name || 'Unknown source',
            publishedAt: article.publishedAt || null
          });
        });
      }
    } catch (error) {
      ScriptableLogger.error('Error processing NewsAPI response', error);
    }
    
    return results;
  }
  
  // Newsdata.io fallback implementation
  async newsdataFallback(query, options = {}) {
    const functionName = 'newsdataFallback';
    ScriptableLogger.info(`${functionName}: Starting fallback news search for query: "${query}"`);
    
    try {
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new Error('Query must be a non-empty string');
      }
      
      if (!this.config.newsdataIO.apiKey) {
        throw new Error('Newsdata.io API key not configured. Use Keychain.set("NEWSDATA_API_KEY", "your_key") or update the script.');
      }
      
      const params = {
        apikey: this.config.newsdataIO.apiKey,
        q: query.trim(),
        language: options.language || 'en',
        size: Math.min(options.size || 10, 10)
      };
      
      const requestConfig = {
        method: 'GET',
        url: this.config.newsdataIO.baseUrl,
        params: params,
        headers: {
          'User-Agent': 'Scriptable-iOS-DeepResearch/1.0'
        },
        timeout: this.config.newsdataIO.timeout
      };
      
      const response = await ScriptableRetry.withRetry(
        async () => {
          const result = await ScriptableHTTP.request(requestConfig);
          if (!result.data || result.data.status !== 'success') {
            throw new Error(result.data?.message || 'Newsdata.io returned error');
          }
          return result;
        },
        2
      );
      
      const results = this.processNewsdataResponse(response.data);
      
      ScriptableLogger.info(`${functionName}: Successfully retrieved ${results.length} articles`);
      ScriptableNotification.notify('Newsdata.io', `Found ${results.length} articles`);
      
      return {
        success: true,
        source: 'newsdataFallback',
        query: query,
        resultsCount: results.length,
        results: results,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      ScriptableLogger.error(`${functionName}: Failed for query "${query}"`, error);
      ScriptableNotification.notify('Newsdata.io Error', error.message, 'error');
      
      return {
        success: false,
        source: 'newsdataFallback',
        query: query,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  processNewsdataResponse(data) {
    const results = [];
    
    try {
      if (data.results) {
        data.results.forEach(article => {
          results.push({
            title: article.title || 'No title',
            url: article.link || '',
            description: article.description || 'No description',
            creator: article.creator || 'Unknown creator',
            source: article.source_id || 'Unknown source',
            publishedAt: article.pubDate || null
          });
        });
      }
    } catch (error) {
      ScriptableLogger.error('Error processing Newsdata.io response', error);
    }
    
    return results;
  }
  
  // Comprehensive search optimized for iOS
  async comprehensiveSearch(query, options = {}) {
    ScriptableLogger.info(`Starting comprehensive search for query: "${query}"`);
    const results = {
      query: query,
      timestamp: new Date().toISOString(),
      sources: {},
      totalResults: 0,
      errors: [],
      platform: 'Scriptable iOS 18.6+'
    };
    
    // Try APIs sequentially to manage iOS resources
    const apiList = [];
    
    if (options.includeBrave !== false && this.config.braveSearch.apiKey) {
      apiList.push('brave');
    }
    if (options.includeNews !== false && this.config.newsAPI.apiKey) {
      apiList.push('news');
    }
    if (options.includeFallback !== false && this.config.newsdataIO.apiKey) {
      apiList.push('fallback');
    }
    
    for (const api of apiList) {
      try {
        let result;
        switch (api) {
          case 'brave':
            result = await this.braveSearch(query, options.braveOptions);
            break;
          case 'news':
            result = await this.newsAPI(query, options.newsOptions);
            break;
          case 'fallback':
            result = await this.newsdataFallback(query, options.fallbackOptions);
            break;
        }
        
        if (result.success) {
          results.sources[result.source] = result;
          results.totalResults += result.resultsCount || 0;
        } else {
          results.errors.push({ api: result.source, error: result.error });
        }
      } catch (error) {
        ScriptableLogger.error(`API ${api} failed completely`, error);
        results.errors.push({ api: api, error: error.message });
      }
    }
    
    const successCount = Object.keys(results.sources).length;
    ScriptableLogger.info(`Comprehensive search completed: ${successCount} successes, ${results.errors.length} failures`);
    
    ScriptableNotification.notify(
      'Search Complete',
      `${successCount} APIs succeeded. Total: ${results.totalResults} results`
    );
    
    return results;
  }
  
  // Main clipboard workflow for iOS Shortcuts
  async clipboardWorkflow() {
    try {
      ScriptableLogger.info('Starting Scriptable clipboard workflow for iOS Shortcuts');
      
      // Read query from clipboard using Scriptable's Pasteboard API
      let query;
      try {
        query = Pasteboard.paste();
      } catch (error) {
        throw new Error('Failed to read from clipboard. Make sure clipboard access is enabled.');
      }
      
      if (!query || query.trim().length === 0) {
        throw new Error('Clipboard is empty or contains only whitespace');
      }
      
      query = query.trim();
      ScriptableLogger.info(`Clipboard workflow: Searching for: "${query}"`);
      
      // Perform search
      const results = await this.comprehensiveSearch(query, {
        includeBrave: true,
        includeNews: true,
        includeFallback: true
      });
      
      // Generate iOS-friendly summary
      const summary = this.generateResultsSummary(results);
      
      // Write results back to clipboard using Scriptable's Pasteboard API
      try {
        Pasteboard.copy(summary);
        ScriptableLogger.info('Results summary written to clipboard');
        ScriptableNotification.notify('Clipboard Updated', 'Search results copied to clipboard');
      } catch (error) {
        ScriptableLogger.error('Failed to write to clipboard', error);
        // Still return results even if clipboard write fails
      }
      
      // Output to console for debugging
      console.log('\n📋 RESULTS COPIED TO CLIPBOARD 📋\n');
      console.log(summary);
      
      return {
        success: true,
        query: query,
        results: results,
        summary: summary,
        clipboardUpdated: true
      };
      
    } catch (error) {
      ScriptableLogger.error('Scriptable clipboard workflow failed', error);
      ScriptableNotification.notify('Workflow Error', error.message, 'error');
      
      // Try to write error to clipboard for shortcuts
      try {
        const errorMessage = `❌ Deep Research Error: ${error.message}\nTime: ${new Date().toISOString()}`;
        Pasteboard.copy(errorMessage);
      } catch (clipError) {
        ScriptableLogger.error('Failed to write error to clipboard', clipError);
      }
      
      throw error;
    }
  }
  
  generateResultsSummary(results) {
    let summary = `🔍 Deep Research Results\n`;
    summary += `Query: "${results.query}"\n`;
    summary += `📅 ${new Date(results.timestamp).toLocaleString()}\n`;
    summary += `📊 Total Results: ${results.totalResults}\n`;
    summary += `📱 Platform: ${results.platform}\n\n`;
    
    const sourceIcons = {
      braveSearch: '🦁',
      newsAPI: '📰',
      newsdataFallback: '📡'
    };
    
    Object.entries(results.sources).forEach(([api, data]) => {
      const icon = sourceIcons[api] || '🔍';
      summary += `${icon} ${api.toUpperCase()} (${data.resultsCount} results)\n`;
      summary += `${'='.repeat(40)}\n`;
      
      data.results.slice(0, 3).forEach((item, index) => {
        summary += `${index + 1}. ${item.title}\n`;
        summary += `   🔗 ${item.url}\n`;
        if (item.description && item.description !== 'No description') {
          summary += `   📝 ${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}\n`;
        }
        summary += '\n';
      });
    });
    
    if (results.errors.length > 0) {
      summary += `\n❌ ERRORS\n`;
      summary += `${'='.repeat(40)}\n`;
      results.errors.forEach(error => {
        summary += `• ${error.api}: ${error.error}\n`;
      });
    }
    
    summary += `\n🤖 Generated by Scriptable iOS Deep Research v1.0\n`;
    return summary;
  }
}

// =============================================================================
// MAIN EXECUTION FOR iOS SHORTCUTS
// =============================================================================

async function main() {
  try {
    ScriptableLogger.info('🚀 Scriptable Deep Research starting for iOS 18.6+...');
    
    const researcher = new ScriptableDeepResearcher();
    await researcher.initialize();
    
    // Always use clipboard workflow for iOS Shortcuts integration
    const result = await researcher.clipboardWorkflow();
    
    if (result.success) {
      // Output success message for shortcuts
      console.log('✅ DEEP RESEARCH COMPLETE');
      console.log(`🔍 Query: "${result.query}"`);
      console.log(`📊 Total Results: ${result.results.totalResults}`);
      console.log('📋 Results copied to clipboard');
      
      // Show notification for successful completion
      ScriptableNotification.notify(
        'Deep Research Complete',
        `Found ${result.results.totalResults} results for "${result.query}"`
      );
      
    } else {
      console.log('❌ DEEP RESEARCH FAILED');
      console.log('Check your API keys and network connection');
      
      ScriptableNotification.notify(
        'Deep Research Failed',
        'Check API keys and network connection',
        'error'
      );
    }
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    
    // Provide helpful error messages for common iOS issues
    if (error.message.includes('clipboard')) {
      console.log('💡 Tip: Make sure to allow clipboard access in iOS Settings');
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      console.log('💡 Tip: Check your internet connection and try again');
    } else if (error.message.includes('API key')) {
      console.log('💡 Tip: Configure your API keys using Keychain.set() or update the script');
    }
    
    ScriptableNotification.notify(
      'Deep Research Error',
      error.message,
      'error'
    );
  }
}

// =============================================================================
// HELPER FUNCTIONS FOR SETUP
// =============================================================================

// Call this function to set up API keys securely in iOS Keychain
async function setupAPIKeys() {
  console.log('🔑 Setting up API keys in iOS Keychain...');
  
  // Example usage - update with your actual keys
  // await ScriptableConfig.setAPIKey('BRAVE', 'your_brave_api_key_here');
  // await ScriptableConfig.setAPIKey('NEWS', 'your_news_api_key_here'); 
  // await ScriptableConfig.setAPIKey('NEWSDATA', 'your_newsdata_api_key_here');
  
  console.log('⚠️  Update the setupAPIKeys() function with your actual API keys');
  console.log('Then run this function once to store them securely');
}

// Test function to verify clipboard functionality
async function testClipboard() {
  try {
    console.log('📋 Testing clipboard functionality...');
    
    // Test reading from clipboard
    const clipContent = Pasteboard.paste();
    console.log('✅ Clipboard read successful');
    console.log('📋 Current clipboard content:', clipContent || '(empty)');
    
    // Test writing to clipboard
    const testMessage = 'Scriptable Deep Research Test - ' + new Date().toISOString();
    Pasteboard.copy(testMessage);
    console.log('✅ Clipboard write successful');
    
    return true;
  } catch (error) {
    console.log('❌ Clipboard access failed:', error.message);
    return false;
  }
}

// =============================================================================
// EXECUTION
// =============================================================================

// Run the main function when script is executed
await main();