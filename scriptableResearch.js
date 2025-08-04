/**
 * Scriptable-Compatible Deep Research Script
 * Optimized for iOS Scriptable app with native iOS integrations
 * Replaces Node.js dependencies with Scriptable equivalents
 */

// --- SCRIPTABLE CONFIGURATION ---
const CONFIG = {
  // API Keys - can be configured directly here or loaded from Keychain
  BRAVE_API_KEY: "",
  NEWS_API_KEY: "",
  NEWSDATA_API_KEY: "",
  
  // API Settings
  MAX_RESULTS: 5,
  TIMEOUT_MS: 15000,
  RETRY_COUNT: 2,
  
  // Scriptable Settings
  USE_KEYCHAIN: true,
  COPY_TO_CLIPBOARD: true,
  SHOW_NOTIFICATIONS: true,
  DEBUG_MODE: false
};

// --- SCRIPTABLE UTILITIES ---

// Scriptable Environment Detection
class ScriptableDetector {
  static isScriptable() {
    return typeof Pasteboard !== 'undefined' && 
           typeof Script !== 'undefined' && 
           typeof Notification !== 'undefined';
  }

  static getEnvironmentInfo() {
    return {
      isScriptable: this.isScriptable(),
      hasKeychain: typeof Keychain !== 'undefined',
      hasPasteboard: typeof Pasteboard !== 'undefined',
      hasNotifications: typeof Notification !== 'undefined'
    };
  }
}

// Scriptable Logger
class ScriptableLogger {
  static log(level, message, error = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    console.log(logEntry);
    
    if (error && CONFIG.DEBUG_MODE) {
      console.log(`Error details: ${error.message}`);
      if (error.stack) {
        console.log(`Stack: ${error.stack}`);
      }
    }
  }

  static info(message) { this.log('info', message); }
  static warn(message) { this.log('warn', message); }
  static error(message, error = null) { this.log('error', message, error); }
  static debug(message) { 
    if (CONFIG.DEBUG_MODE) {
      this.log('debug', message); 
    }
  }
}

// Scriptable Configuration Manager
class ScriptableConfigManager {
  static loadConfig() {
    const config = { ...CONFIG };
    
    // Try to load API keys from Keychain if enabled
    if (CONFIG.USE_KEYCHAIN && typeof Keychain !== 'undefined') {
      try {
        const keys = ['BRAVE_API_KEY', 'NEWS_API_KEY', 'NEWSDATA_API_KEY'];
        
        for (const key of keys) {
          if (Keychain.contains(key)) {
            const value = Keychain.get(key);
            if (value && value.trim()) {
              config[key] = value.trim();
              ScriptableLogger.debug(`Loaded ${key} from Keychain`);
            }
          }
        }
      } catch (error) {
        ScriptableLogger.warn('Failed to load keys from Keychain', error);
      }
    }
    
    // Load from args/parameters if provided
    if (typeof args !== 'undefined' && args.shortcutParameter) {
      try {
        const params = JSON.parse(args.shortcutParameter);
        Object.assign(config, params);
        ScriptableLogger.debug('Loaded config from Shortcuts parameters');
      } catch (error) {
        ScriptableLogger.debug('No valid Shortcuts parameters found');
      }
    }
    
    return {
      braveSearch: {
        apiKey: config.BRAVE_API_KEY || '',
        baseUrl: 'https://api.search.brave.com/res/v1/web/search',
        timeout: config.TIMEOUT_MS,
        retries: config.RETRY_COUNT
      },
      newsAPI: {
        apiKey: config.NEWS_API_KEY || '',
        baseUrl: 'https://newsapi.org/v2/everything',
        timeout: config.TIMEOUT_MS,
        retries: config.RETRY_COUNT
      },
      newsdataIO: {
        apiKey: config.NEWSDATA_API_KEY || '',
        baseUrl: 'https://newsdata.io/api/1/news',
        timeout: config.TIMEOUT_MS,
        retries: config.RETRY_COUNT
      }
    };
  }
}

// Scriptable Notification Manager
class ScriptableNotificationManager {
  static async notify(title, message, type = 'info') {
    ScriptableLogger.info(`NOTIFICATION: ${title} - ${message}`);
    
    if (CONFIG.SHOW_NOTIFICATIONS && typeof Notification !== 'undefined') {
      try {
        const notification = new Notification();
        notification.title = title;
        notification.body = message;
        notification.sound = null; // Silent notification
        
        // For immediate notifications in Scriptable
        await notification.schedule();
      } catch (error) {
        ScriptableLogger.warn('Failed to show notification', error);
      }
    }
  }
}

// Scriptable Retry Utility
class ScriptableRetryUtility {
  static async withRetry(fn, maxRetries = CONFIG.RETRY_COUNT, baseDelay = 1000) {
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
        
        const delay = baseDelay * attempt;
        ScriptableLogger.info(`Retrying in ${delay}ms...`);
        
        // Use Scriptable's Timer for delay
        await new Promise(resolve => {
          Timer.schedule(delay, false, resolve);
        });
      }
    }
  }
}

// --- SCRIPTABLE HTTP CLIENT ---
class ScriptableHttpClient {
  static async makeRequest(url, options = {}) {
    try {
      const request = new Request(url);
      
      // Set headers
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          request.headers[key] = value;
        });
      }
      
      // Set timeout (convert from ms to seconds)
      request.timeoutInterval = (options.timeout || CONFIG.TIMEOUT_MS) / 1000;
      
      // Set method
      request.method = options.method || 'GET';
      
      // Add query parameters
      if (options.params) {
        const urlObj = new URL(url);
        Object.entries(options.params).forEach(([key, value]) => {
          urlObj.searchParams.append(key, value);
        });
        request.url = urlObj.toString();
      }
      
      // Make the request
      const response = await request.loadJSON();
      
      return {
        data: response,
        status: 200 // Scriptable doesn't provide status codes directly
      };
      
    } catch (error) {
      ScriptableLogger.error(`HTTP request failed for ${url}`, error);
      throw error;
    }
  }
}

// --- SCRIPTABLE DEEP RESEARCHER ---
class ScriptableDeepResearcher {
  constructor() {
    this.config = ScriptableConfigManager.loadConfig();
    this.envInfo = ScriptableDetector.getEnvironmentInfo();
    
    ScriptableLogger.info(`Scriptable Deep Researcher initialized`);
    ScriptableLogger.debug('Environment info', this.envInfo);
  }

  // Brave Search for Scriptable
  async braveSearch(query, options = {}) {
    const functionName = 'braveSearch';
    ScriptableLogger.info(`${functionName}: Starting search for query: "${query}"`);
    
    try {
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new Error('Query must be a non-empty string');
      }

      if (!this.config.braveSearch.apiKey) {
        throw new Error('Brave Search API key not configured');
      }

      const params = {
        q: query.trim(),
        count: Math.min(options.count || CONFIG.MAX_RESULTS, 10),
        mkt: options.market || 'en-US',
        safesearch: options.safesearch || 'moderate'
      };

      const requestOptions = {
        method: 'GET',
        params: params,
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': this.config.braveSearch.apiKey,
          'User-Agent': 'Scriptable-DeepResearch/1.0'
        },
        timeout: this.config.braveSearch.timeout
      };

      const response = await ScriptableRetryUtility.withRetry(
        async () => {
          const result = await ScriptableHttpClient.makeRequest(
            this.config.braveSearch.baseUrl,
            requestOptions
          );
          
          if (!result.data) {
            throw new Error('Empty response from Brave Search API');
          }
          return result;
        },
        this.config.braveSearch.retries
      );

      const results = this.processBraveSearchResponse(response.data);
      
      ScriptableLogger.info(`${functionName}: Successfully retrieved ${results.length} results`);
      await ScriptableNotificationManager.notify('Brave Search', `Found ${results.length} results`);
      
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
      await ScriptableNotificationManager.notify('Brave Search Error', error.message, 'error');

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

  // NewsAPI for Scriptable
  async newsAPI(query, options = {}) {
    const functionName = 'newsAPI';
    ScriptableLogger.info(`${functionName}: Starting news search for query: "${query}"`);
    
    try {
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new Error('Query must be a non-empty string');
      }

      if (!this.config.newsAPI.apiKey) {
        throw new Error('NewsAPI key not configured');
      }

      const params = {
        q: query.trim(),
        pageSize: Math.min(options.pageSize || CONFIG.MAX_RESULTS, 20),
        sortBy: options.sortBy || 'publishedAt',
        language: options.language || 'en'
      };

      const requestOptions = {
        method: 'GET',
        params: params,
        headers: {
          'Authorization': `Bearer ${this.config.newsAPI.apiKey}`,
          'User-Agent': 'Scriptable-DeepResearch/1.0'
        },
        timeout: this.config.newsAPI.timeout
      };

      const response = await ScriptableRetryUtility.withRetry(
        async () => {
          const result = await ScriptableHttpClient.makeRequest(
            this.config.newsAPI.baseUrl,
            requestOptions
          );
          
          if (!result.data || result.data.status !== 'ok') {
            throw new Error(result.data?.message || 'NewsAPI returned error');
          }
          return result;
        },
        this.config.newsAPI.retries
      );

      const results = this.processNewsAPIResponse(response.data);
      
      ScriptableLogger.info(`${functionName}: Successfully retrieved ${results.length} articles`);
      await ScriptableNotificationManager.notify('NewsAPI', `Found ${results.length} articles`);
      
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
      await ScriptableNotificationManager.notify('NewsAPI Error', error.message, 'error');

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

  // Newsdata.io fallback for Scriptable
  async newsdataFallback(query, options = {}) {
    const functionName = 'newsdataFallback';
    ScriptableLogger.info(`${functionName}: Starting fallback news search for query: "${query}"`);
    
    try {
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new Error('Query must be a non-empty string');
      }

      if (!this.config.newsdataIO.apiKey) {
        throw new Error('Newsdata.io API key not configured');
      }

      const params = {
        apikey: this.config.newsdataIO.apiKey,
        q: query.trim(),
        language: options.language || 'en',
        size: Math.min(options.size || CONFIG.MAX_RESULTS, 10)
      };

      const requestOptions = {
        method: 'GET',
        params: params,
        headers: {
          'User-Agent': 'Scriptable-DeepResearch/1.0'
        },
        timeout: this.config.newsdataIO.timeout
      };

      const response = await ScriptableRetryUtility.withRetry(
        async () => {
          const result = await ScriptableHttpClient.makeRequest(
            this.config.newsdataIO.baseUrl,
            requestOptions
          );
          
          if (!result.data || result.data.status !== 'success') {
            throw new Error(result.data?.message || 'Newsdata.io returned error');
          }
          return result;
        },
        this.config.newsdataIO.retries
      );

      const results = this.processNewsdataResponse(response.data);
      
      ScriptableLogger.info(`${functionName}: Successfully retrieved ${results.length} articles`);
      await ScriptableNotificationManager.notify('Newsdata.io', `Found ${results.length} articles`);
      
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
      await ScriptableNotificationManager.notify('Newsdata.io Error', error.message, 'error');

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

  // Scriptable-optimized comprehensive search
  async scriptableComprehensiveSearch(query, options = {}) {
    ScriptableLogger.info(`Starting Scriptable comprehensive search for query: "${query}"`);
    
    const results = {
      query: query,
      timestamp: new Date().toISOString(),
      sources: {},
      totalResults: 0,
      errors: [],
      scriptable: true
    };

    // Try APIs sequentially for better resource management on mobile
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
    ScriptableLogger.info(`Scriptable comprehensive search completed: ${successCount} successes, ${results.errors.length} failures`);
    
    await ScriptableNotificationManager.notify(
      'Search Complete',
      `${successCount} APIs succeeded. Total: ${results.totalResults} results`
    );

    return results;
  }

  // Scriptable clipboard workflow
  async scriptableClipboardWorkflow() {
    try {
      ScriptableLogger.info('Starting Scriptable clipboard workflow');
      
      // Read query from clipboard using Pasteboard
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
      ScriptableLogger.info(`Scriptable workflow: Searching for clipboard content: "${query}"`);

      // Perform search
      const results = await this.scriptableComprehensiveSearch(query, {
        includeBrave: true,
        includeNews: true,
        includeFallback: true
      });

      // Generate Scriptable-friendly summary
      const summary = this.generateScriptableResultsSummary(results);

      // Write results back to clipboard using Pasteboard
      if (CONFIG.COPY_TO_CLIPBOARD) {
        try {
          Pasteboard.copy(summary);
          ScriptableLogger.info('Results summary written to clipboard');
          await ScriptableNotificationManager.notify('Clipboard Updated', 'Search results copied to clipboard');
        } catch (error) {
          ScriptableLogger.error('Failed to write to clipboard', error);
        }
      }

      // Set Shortcuts output
      if (typeof Script !== 'undefined') {
        Script.setShortcutOutput(summary);
      }

      return {
        success: true,
        query: query,
        results: results,
        summary: summary,
        clipboardUpdated: CONFIG.COPY_TO_CLIPBOARD
      };

    } catch (error) {
      ScriptableLogger.error('Scriptable clipboard workflow failed', error);
      await ScriptableNotificationManager.notify('Workflow Error', error.message, 'error');
      
      // Try to write error to clipboard for shortcuts
      try {
        const errorMessage = `❌ Deep Research Error: ${error.message}\nTime: ${new Date().toISOString()}`;
        Pasteboard.copy(errorMessage);
        if (typeof Script !== 'undefined') {
          Script.setShortcutOutput(errorMessage);
        }
      } catch (clipError) {
        ScriptableLogger.error('Failed to write error to clipboard', clipError);
      }

      throw error;
    }
  }

  generateScriptableResultsSummary(results) {
    let summary = `🔍 Deep Research Results\n`;
    summary += `Query: "${results.query}"\n`;
    summary += `📅 ${new Date(results.timestamp).toLocaleString()}\n`;
    summary += `📊 Total Results: ${results.totalResults}\n\n`;

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

    summary += `\n🤖 Generated by Scriptable Deep Research v2.0\n`;
    return summary;
  }
}

// --- SCRIPTABLE MAIN EXECUTION ---
async function scriptableMain() {
  try {
    const researcher = new ScriptableDeepResearcher();
    
    // Check if running in Scriptable
    if (!ScriptableDetector.isScriptable()) {
      console.log('⚠️ This script is optimized for Scriptable app');
      console.log('Environment info:', ScriptableDetector.getEnvironmentInfo());
    }

    // Handle different input sources
    let query = '';
    
    // 1. Check for Shortcuts parameter
    if (typeof args !== 'undefined' && args.shortcutParameter) {
      try {
        const param = JSON.parse(args.shortcutParameter);
        if (param.query) {
          query = param.query;
        }
      } catch (e) {
        // Not JSON, treat as direct query
        query = args.shortcutParameter;
      }
    }
    
    // 2. Check for plaintext parameter
    if (!query && typeof args !== 'undefined' && args.plaintextParameters) {
      query = args.plaintextParameters;
    }
    
    // 3. Default to clipboard workflow
    if (!query) {
      await researcher.scriptableClipboardWorkflow();
      return;
    }
    
    // 4. Direct query search
    ScriptableLogger.info(`Scriptable search for: "${query}"`);
    const results = await researcher.scriptableComprehensiveSearch(query);
    
    // Generate and output results
    const summary = researcher.generateScriptableResultsSummary(results);
    console.log(summary);
    
    // Copy to clipboard if enabled
    if (CONFIG.COPY_TO_CLIPBOARD) {
      try {
        Pasteboard.copy(summary);
        console.log('\n📋 Results copied to clipboard');
      } catch (error) {
        ScriptableLogger.warn('Could not copy to clipboard', error);
      }
    }
    
    // Set Shortcuts output
    if (typeof Script !== 'undefined') {
      Script.setShortcutOutput(summary);
    }
    
  } catch (error) {
    ScriptableLogger.error('Scriptable main execution failed', error);
    
    const errorMessage = `❌ Error: ${error.message}`;
    console.log(errorMessage);
    
    // Try to provide error output for Shortcuts
    if (typeof Script !== 'undefined') {
      Script.setShortcutOutput(errorMessage);
    }
    
    throw error;
  }
}

// --- SCRIPTABLE ENTRY POINT ---
// Run the main function
scriptableMain().catch(error => {
  console.error('Scriptable script failed:', error.message);
});

// Export for testing (if in Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    ScriptableDeepResearcher, 
    ScriptableLogger, 
    ScriptableConfigManager, 
    ScriptableNotificationManager, 
    ScriptableRetryUtility,
    ScriptableDetector,
    ScriptableHttpClient
  };
}