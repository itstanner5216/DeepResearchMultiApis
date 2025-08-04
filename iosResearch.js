/**
 * iOS-Compatible Deep Research Script
 * Optimized for iOS Scriptable app with native integrations
 * Focuses on clipboard-to-clipboard workflow
 */

// Scriptable Configuration - can be modified directly or loaded from Keychain
const SCRIPTABLE_CONFIG = {
  BRAVE_API_KEY: "",
  NEWS_API_KEY: "",
  NEWSDATA_API_KEY: "",
  MAX_RESULTS: 5,
  TIMEOUT_MS: 15000,
  RETRY_COUNT: 2,
  USE_KEYCHAIN: true,
  COPY_TO_CLIPBOARD: true,
  SHOW_NOTIFICATIONS: true
};

// Scriptable Environment Detection
class IOSDetector {
    static isScriptable() {
        return typeof Pasteboard !== 'undefined' && 
               typeof Script !== 'undefined' && 
               typeof Notification !== 'undefined';
    }
    
    static isTerminalApp() {
        // Check for terminal app environment (a-Shell, iSH, etc.)
        if (typeof process !== 'undefined') {
            const platform = process.platform;
            const userAgent = process.env.USER_AGENT || '';
            const shell = process.env.SHELL || '';
            const term = process.env.TERM || '';
            
            return (
                platform === 'darwin' && (
                    userAgent.includes('iOS') ||
                    shell.includes('ash') ||  // a-Shell
                    shell.includes('ish') ||  // iSH
                    term.includes('xterm-256color') ||
                    process.env.TERM_PROGRAM === 'a-Shell' ||
                    process.env.TERM_PROGRAM === 'iSH'
                )
            );
        }
        return false;
    }

    static getIOSCompatiblePath(filename) {
        if (this.isScriptable()) {
            // In Scriptable, we don't use file system for logs
            return null;
        } else if (this.isTerminalApp() && typeof process !== 'undefined') {
            // On iOS terminal apps, use Documents directory or current directory
            const documentsPath = process.env.HOME ? path.join(process.env.HOME, 'Documents') : '.';
            return path.join(documentsPath, filename);
        }
        return filename;
    }
}

// iOS-Compatible Logger
class IOSLogger {
    static log(level, message, error = null) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        
        // Always log to console
        console.log(logEntry);
        
        // Only log to file if in terminal app (not in Scriptable)
        if (IOSDetector.isTerminalApp() && typeof fs !== 'undefined') {
            try {
                const logFile = IOSDetector.getIOSCompatiblePath('research.log');
                if (logFile) {
                    fs.appendFileSync(logFile, logEntry + (error ? `\nError: ${error.message}` : '') + '\n');
                }
            } catch (e) {
                // Silently fail on file logging issues
                if (!IOSDetector.isScriptable()) {
                    console.error('Failed to write to log file:', e.message);
                }
            }
        }
    }

    static info(message) { this.log('info', message); }
    static warn(message) { this.log('warn', message); }
    static error(message, error = null) { this.log('error', message, error); }
    static debug(message) { this.log('debug', message); }
}

// iOS-Compatible Configuration Manager
class IOSConfigManager {
    static loadConfig() {
        // First try to load from Scriptable configuration
        if (IOSDetector.isScriptable()) {
            const config = { ...SCRIPTABLE_CONFIG };
            
            // Try to load API keys from Keychain if enabled
            if (config.USE_KEYCHAIN && typeof Keychain !== 'undefined') {
                try {
                    const keys = ['BRAVE_API_KEY', 'NEWS_API_KEY', 'NEWSDATA_API_KEY'];
                    
                    for (const key of keys) {
                        if (Keychain.contains(key)) {
                            const value = Keychain.get(key);
                            if (value && value.trim()) {
                                config[key] = value.trim();
                            }
                        }
                    }
                } catch (error) {
                    IOSLogger.warn('Failed to load keys from Keychain', error);
                }
            }
            
            // Load from args/parameters if provided
            if (typeof args !== 'undefined' && args && args.shortcutParameter) {
                try {
                    const params = JSON.parse(args.shortcutParameter);
                    Object.assign(config, params);
                } catch (error) {
                    // Ignore parameter parsing errors
                }
            }
            
            return {
                braveSearch: {
                    apiKey: config.BRAVE_API_KEY || '',
                    baseUrl: 'https://api.search.brave.com/res/v1/web/search',
                    timeout: config.TIMEOUT_MS || 15000,
                    retries: config.RETRY_COUNT || 2
                },
                newsAPI: {
                    apiKey: config.NEWS_API_KEY || '',
                    baseUrl: 'https://newsapi.org/v2/everything',
                    timeout: config.TIMEOUT_MS || 15000,
                    retries: config.RETRY_COUNT || 2
                },
                newsdataIO: {
                    apiKey: config.NEWSDATA_API_KEY || '',
                    baseUrl: 'https://newsdata.io/api/1/news',
                    timeout: config.TIMEOUT_MS || 15000,
                    retries: config.RETRY_COUNT || 2
                }
            };
        }
        
        // Fallback for terminal apps - try to load config file
        try {
            if (typeof fs !== 'undefined') {
                const configFile = IOSDetector.getIOSCompatiblePath('config.json');
                if (configFile && fs.existsSync(configFile)) {
                    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
                    return config;
                }
            }
        } catch (error) {
            IOSLogger.warn('Config file not found or invalid, using environment variables');
        }
        
        // Return default config with environment variables (for terminal apps)
        const envConfig = (typeof process !== 'undefined') ? {
            braveSearch: {
                apiKey: process.env.BRAVE_API_KEY || '',
                baseUrl: 'https://api.search.brave.com/res/v1/web/search',
                timeout: 15000,
                retries: 2
            },
            newsAPI: {
                apiKey: process.env.NEWS_API_KEY || '',
                baseUrl: 'https://newsapi.org/v2/everything',
                timeout: 15000,
                retries: 2
            },
            newsdataIO: {
                apiKey: process.env.NEWSDATA_API_KEY || '',
                baseUrl: 'https://newsdata.io/api/1/news',
                timeout: 15000,
                retries: 2
            }
        } : {
            braveSearch: { apiKey: '', baseUrl: 'https://api.search.brave.com/res/v1/web/search', timeout: 15000, retries: 2 },
            newsAPI: { apiKey: '', baseUrl: 'https://newsapi.org/v2/everything', timeout: 15000, retries: 2 },
            newsdataIO: { apiKey: '', baseUrl: 'https://newsdata.io/api/1/news', timeout: 15000, retries: 2 }
        };
        
        return envConfig;
    }
}

// iOS-Compatible Notification Manager
class IOSNotificationManager {
    static async notify(title, message, type = 'info') {
        // Always log notifications
        IOSLogger.info(`NOTIFICATION: ${title} - ${message}`);
        
        // Use Scriptable notifications if available
        if (IOSDetector.isScriptable() && typeof Notification !== 'undefined') {
            try {
                const notification = new Notification();
                notification.title = title;
                notification.body = message;
                notification.sound = null;
                await notification.schedule();
            } catch (error) {
                IOSLogger.warn('Failed to show Scriptable notification', error);
            }
        }
        
        // For iOS shortcuts or terminal apps, output specially formatted text
        if ((typeof process !== 'undefined' && process.env.IOS_SHORTCUTS_MODE === 'true') || 
            (typeof args !== 'undefined')) {
            console.log(`📱 ${title}: ${message}`);
        }
    }
}

// Simplified Retry Utility for iOS
class IOSRetryUtility {
    static async withRetry(fn, maxRetries = 2, baseDelay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                IOSLogger.warn(`Attempt ${attempt} failed: ${error.message}`);
                
                if (attempt === maxRetries) {
                    throw lastError;
                }
                
                // Simple delay - use Scriptable Timer if available, otherwise setTimeout
                const delay = baseDelay * attempt;
                IOSLogger.info(`Retrying in ${delay}ms...`);
                
                if (IOSDetector.isScriptable() && typeof Timer !== 'undefined') {
                    await new Promise(resolve => {
                        Timer.schedule(delay, false, resolve);
                    });
                } else {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
    }
}

// Cross-platform HTTP Client
class IOSHttpClient {
    static async makeRequest(url, options = {}) {
        // Use Scriptable Request if available
        if (IOSDetector.isScriptable() && typeof Request !== 'undefined') {
            return this.makeScriptableRequest(url, options);
        }
        
        // Fallback to axios for terminal apps
        if (typeof axios !== 'undefined') {
            return this.makeAxiosRequest(url, options);
        }
        
        throw new Error('No HTTP client available');
    }
    
    static async makeScriptableRequest(url, options = {}) {
        try {
            const request = new Request(url);
            
            // Set headers
            if (options.headers) {
                Object.entries(options.headers).forEach(([key, value]) => {
                    request.headers[key] = value;
                });
            }
            
            // Set timeout (convert from ms to seconds)
            request.timeoutInterval = (options.timeout || 15000) / 1000;
            
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
            throw error;
        }
    }
    
    static async makeAxiosRequest(url, options = {}) {
        const requestConfig = {
            method: options.method || 'GET',
            url: url,
            params: options.params,
            headers: options.headers,
            timeout: options.timeout || 15000
        };
        
        const response = await axios(requestConfig);
        return response;
    }
}

// iOS-Optimized Deep Researcher
class IOSDeepResearcher {
    constructor() {
        this.config = IOSConfigManager.loadConfig();
        this.isScriptable = IOSDetector.isScriptable();
        this.isTerminalApp = IOSDetector.isTerminalApp();
        IOSLogger.info(`iOS Deep Researcher initialized (Scriptable: ${this.isScriptable}, Terminal: ${this.isTerminalApp})`);
    }

    // Brave Search optimized for iOS
    async braveSearch(query, options = {}) {
        const functionName = 'braveSearch';
        IOSLogger.info(`${functionName}: Starting search for query: "${query}"`);
        
        try {
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                throw new Error('Query must be a non-empty string');
            }

            if (!this.config.braveSearch.apiKey) {
                throw new Error('Brave Search API key not configured');
            }

            const params = {
                q: query.trim(),
                count: Math.min(options.count || 5, 10), // Limit results on iOS
                mkt: options.market || 'en-US',
                safesearch: options.safesearch || 'moderate'
            };

            const requestConfig = {
                method: 'GET',
                params: params,
                headers: {
                    'Accept': 'application/json',
                    'X-Subscription-Token': this.config.braveSearch.apiKey,
                    'User-Agent': 'iOS-DeepResearch/1.0'
                },
                timeout: this.config.braveSearch.timeout
            };

            const response = await IOSRetryUtility.withRetry(
                async () => {
                    const result = await IOSHttpClient.makeRequest(
                        this.config.braveSearch.baseUrl,
                        requestConfig
                    );
                    if (!result.data) {
                        throw new Error('Empty response from Brave Search API');
                    }
                    return result;
                },
                this.config.braveSearch.retries
            );

            const results = this.processBraveSearchResponse(response.data);
            
            IOSLogger.info(`${functionName}: Successfully retrieved ${results.length} results`);
            IOSNotificationManager.notify('Brave Search', `Found ${results.length} results`);
            
            return {
                success: true,
                source: 'braveSearch',
                query: query,
                resultsCount: results.length,
                results: results,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            IOSLogger.error(`${functionName}: Failed for query "${query}"`, error);
            IOSNotificationManager.notify('Brave Search Error', error.message, 'error');

            return {
                success: false,
                source: 'braveSearch',
                query: query,
                error: error.message,
                errorCode: error.response?.status || error.code,
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
            IOSLogger.error('Error processing Brave Search response', error);
        }
        
        return results;
    }

    // NewsAPI optimized for iOS
    async newsAPI(query, options = {}) {
        const functionName = 'newsAPI';
        IOSLogger.info(`${functionName}: Starting news search for query: "${query}"`);
        
        try {
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                throw new Error('Query must be a non-empty string');
            }

            if (!this.config.newsAPI.apiKey) {
                throw new Error('NewsAPI key not configured');
            }

            const params = {
                q: query.trim(),
                pageSize: Math.min(options.pageSize || 10, 20), // Limit for iOS
                sortBy: options.sortBy || 'publishedAt',
                language: options.language || 'en'
            };

            const requestConfig = {
                method: 'GET',
                params: params,
                headers: {
                    'Authorization': `Bearer ${this.config.newsAPI.apiKey}`,
                    'User-Agent': 'iOS-DeepResearch/1.0'
                },
                timeout: this.config.newsAPI.timeout
            };

            const response = await IOSRetryUtility.withRetry(
                async () => {
                    const result = await IOSHttpClient.makeRequest(
                        this.config.newsAPI.baseUrl,
                        requestConfig
                    );
                    if (!result.data || result.data.status !== 'ok') {
                        throw new Error(result.data?.message || 'NewsAPI returned error');
                    }
                    return result;
                },
                this.config.newsAPI.retries
            );

            const results = this.processNewsAPIResponse(response.data);
            
            IOSLogger.info(`${functionName}: Successfully retrieved ${results.length} articles`);
            IOSNotificationManager.notify('NewsAPI', `Found ${results.length} articles`);
            
            return {
                success: true,
                source: 'newsAPI',
                query: query,
                resultsCount: results.length,
                results: results,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            IOSLogger.error(`${functionName}: Failed for query "${query}"`, error);
            IOSNotificationManager.notify('NewsAPI Error', error.message, 'error');

            return {
                success: false,
                source: 'newsAPI',
                query: query,
                error: error.message,
                errorCode: error.response?.status || error.code,
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
            IOSLogger.error('Error processing NewsAPI response', error);
        }
        
        return results;
    }

    // Newsdata.io fallback optimized for iOS
    async newsdataFallback(query, options = {}) {
        const functionName = 'newsdataFallback';
        IOSLogger.info(`${functionName}: Starting fallback news search for query: "${query}"`);
        
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
                size: Math.min(options.size || 10, 10) // Conservative limit for iOS
            };

            const requestConfig = {
                method: 'GET',
                params: params,
                headers: {
                    'User-Agent': 'iOS-DeepResearch/1.0'
                },
                timeout: this.config.newsdataIO.timeout
            };

            const response = await IOSRetryUtility.withRetry(
                async () => {
                    const result = await IOSHttpClient.makeRequest(
                        this.config.newsdataIO.baseUrl,
                        requestConfig
                    );
                    if (!result.data || result.data.status !== 'success') {
                        throw new Error(result.data?.message || 'Newsdata.io returned error');
                    }
                    return result;
                },
                this.config.newsdataIO.retries
            );

            const results = this.processNewsdataResponse(response.data);
            
            IOSLogger.info(`${functionName}: Successfully retrieved ${results.length} articles`);
            IOSNotificationManager.notify('Newsdata.io', `Found ${results.length} articles`);
            
            return {
                success: true,
                source: 'newsdataFallback',
                query: query,
                resultsCount: results.length,
                results: results,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            IOSLogger.error(`${functionName}: Failed for query "${query}"`, error);
            IOSNotificationManager.notify('Newsdata.io Error', error.message, 'error');

            return {
                success: false,
                source: 'newsdataFallback',
                query: query,
                error: error.message,
                errorCode: error.response?.status || error.code,
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
            IOSLogger.error('Error processing Newsdata.io response', error);
        }
        
        return results;
    }

    // iOS-optimized comprehensive search
    async iosComprehensiveSearch(query, options = {}) {
        IOSLogger.info(`Starting iOS comprehensive search for query: "${query}"`);
        const results = {
            query: query,
            timestamp: new Date().toISOString(),
            sources: {},
            totalResults: 0,
            errors: [],
            ios: true
        };

        // Try APIs sequentially on iOS to manage resources better
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
                IOSLogger.error(`API ${api} failed completely`, error);
                results.errors.push({ api: api, error: error.message });
            }
        }

        const successCount = Object.keys(results.sources).length;
        IOSLogger.info(`iOS comprehensive search completed: ${successCount} successes, ${results.errors.length} failures`);
        
        IOSNotificationManager.notify(
            'Search Complete',
            `${successCount} APIs succeeded. Total: ${results.totalResults} results`
        );

        return results;
    }

    // iOS Shortcuts-optimized clipboard workflow
    async iosClipboardWorkflow() {
        try {
            IOSLogger.info('Starting iOS clipboard workflow');
            
            // Read query from clipboard - use Scriptable Pasteboard or clipboardy fallback
            let query;
            try {
                if (IOSDetector.isScriptable() && typeof Pasteboard !== 'undefined') {
                    query = Pasteboard.paste();
                } else if (typeof clipboardy !== 'undefined') {
                    query = await clipboardy.read();
                } else {
                    throw new Error('No clipboard access available');
                }
            } catch (error) {
                throw new Error('Failed to read from clipboard. Make sure clipboard access is enabled.');
            }

            if (!query || query.trim().length === 0) {
                throw new Error('Clipboard is empty or contains only whitespace');
            }

            query = query.trim();
            IOSLogger.info(`iOS workflow: Searching for clipboard content: "${query}"`);

            // Perform search
            const results = await this.iosComprehensiveSearch(query, {
                includeBrave: true,
                includeNews: true,
                includeFallback: true
            });

            // Generate iOS-friendly summary
            const summary = this.generateIOSResultsSummary(results);

            // Write results back to clipboard
            try {
                if (IOSDetector.isScriptable() && typeof Pasteboard !== 'undefined') {
                    Pasteboard.copy(summary);
                } else if (typeof clipboardy !== 'undefined') {
                    await clipboardy.write(summary);
                }
                IOSLogger.info('Results summary written to clipboard');
                await IOSNotificationManager.notify('Clipboard Updated', 'Search results copied to clipboard');
            } catch (error) {
                IOSLogger.error('Failed to write to clipboard', error);
                // Still return results even if clipboard write fails
            }

            // For iOS Shortcuts, also set shortcut output
            if (IOSDetector.isScriptable() && typeof Script !== 'undefined') {
                Script.setShortcutOutput(summary);
            } else if ((typeof process !== 'undefined' && process.env.IOS_SHORTCUTS_MODE === 'true') ||
                       (typeof args !== 'undefined')) {
                console.log('\n📋 RESULTS COPIED TO CLIPBOARD 📋\n');
                console.log(summary);
            }

            return {
                success: true,
                query: query,
                results: results,
                summary: summary,
                clipboardUpdated: true
            };

        } catch (error) {
            IOSLogger.error('iOS clipboard workflow failed', error);
            await IOSNotificationManager.notify('Workflow Error', error.message, 'error');
            
            // Try to write error to clipboard for shortcuts
            try {
                const errorMessage = `❌ Deep Research Error: ${error.message}\nTime: ${new Date().toISOString()}`;
                if (IOSDetector.isScriptable() && typeof Pasteboard !== 'undefined') {
                    Pasteboard.copy(errorMessage);
                    if (typeof Script !== 'undefined') {
                        Script.setShortcutOutput(errorMessage);
                    }
                } else if (typeof clipboardy !== 'undefined') {
                    await clipboardy.write(errorMessage);
                }
            } catch (clipError) {
                IOSLogger.error('Failed to write error to clipboard', clipError);
            }

            throw error;
        }
    }

    generateIOSResultsSummary(results) {
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

        const platform = IOSDetector.isScriptable() ? 'Scriptable' : 'iOS Terminal';
        summary += `\n🤖 Generated by ${platform} Deep Research v2.0\n`;
        return summary;
    }
}

// iOS CLI Interface
async function iosMain() {
    const researcher = new IOSDeepResearcher();

    try {
        // Detect environment and set appropriate mode
        if (IOSDetector.isScriptable()) {
            IOSLogger.info('Scriptable environment detected');
            
            // Handle different input sources for Scriptable
            let query = '';
            
            // 1. Check for Shortcuts parameter
            if (typeof args !== 'undefined' && args && args.shortcutParameter) {
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
            if (!query && typeof args !== 'undefined' && args && args.plaintextParameters) {
                query = args.plaintextParameters;
            }
            
            // 3. Default to clipboard workflow
            if (!query) {
                await researcher.iosClipboardWorkflow();
                return;
            }
            
            // 4. Direct query search
            IOSLogger.info(`Scriptable search for: "${query}"`);
            const results = await researcher.iosComprehensiveSearch(query);
            
            // Generate and output results
            const summary = researcher.generateIOSResultsSummary(results);
            console.log(summary);
            
            // Copy to clipboard and set Shortcuts output
            if (SCRIPTABLE_CONFIG.COPY_TO_CLIPBOARD) {
                try {
                    Pasteboard.copy(summary);
                    console.log('\n📋 Results copied to clipboard');
                } catch (error) {
                    IOSLogger.warn('Could not copy to clipboard', error);
                }
            }
            
            if (typeof Script !== 'undefined') {
                Script.setShortcutOutput(summary);
            }
            
        } else if (IOSDetector.isTerminalApp()) {
            // Terminal app mode (a-Shell, iSH, etc.)
            const args = typeof process !== 'undefined' ? process.argv.slice(2) : [];
            
            IOSLogger.info('iOS terminal environment detected');
            if (typeof process !== 'undefined') {
                process.env.IOS_SHORTCUTS_MODE = 'true'; // Enable shortcuts mode
            }

            if (args.length === 0 || args[0] === '--clipboard') {
                // Default behavior: clipboard workflow
                await researcher.iosClipboardWorkflow();
            } else if (args[0] === '--config') {
                // Configuration mode
                console.log('📱 iOS Deep Research Configuration:');
                console.log(JSON.stringify(researcher.config, null, 2));
            } else if (args[0] === '--test-clipboard') {
                // Test clipboard access
                try {
                    const clipContent = typeof clipboardy !== 'undefined' ? await clipboardy.read() : '(no clipboardy)';
                    console.log('✅ Clipboard read test completed');
                    console.log('📋 Current clipboard content:', clipContent || '(empty)');
                    
                    if (typeof clipboardy !== 'undefined') {
                        await clipboardy.write('iOS Deep Research Test - ' + new Date().toISOString());
                        console.log('✅ Clipboard write test completed');
                    }
                } catch (error) {
                    console.log('❌ Clipboard access failed:', error.message);
                }
            } else {
                // Search with provided query
                const query = args.join(' ');
                IOSLogger.info(`iOS search for: "${query}"`);
                const results = await researcher.iosComprehensiveSearch(query);
                
                // Output results
                const summary = researcher.generateIOSResultsSummary(results);
                console.log(summary);
                
                // Copy to clipboard for shortcuts
                try {
                    if (typeof clipboardy !== 'undefined') {
                        await clipboardy.write(summary);
                        console.log('\n📋 Results copied to clipboard for iOS Shortcuts');
                    }
                } catch (error) {
                    IOSLogger.warn('Could not copy to clipboard', error);
                }
            }
        } else {
            // Default fallback mode
            IOSLogger.info('Running in fallback mode');
            await researcher.iosClipboardWorkflow();
        }
    } catch (error) {
        IOSLogger.error('iOS main execution failed', error);
        
        const errorMessage = `❌ Error: ${error.message}`;
        console.log(errorMessage);
        
        // Try to provide error output for Shortcuts
        if (IOSDetector.isScriptable() && typeof Script !== 'undefined') {
            Script.setShortcutOutput(errorMessage);
        }
        
        if (typeof process !== 'undefined') {
            process.exit(1);
        } else {
            throw error;
        }
    }
}

// Export for testing and module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        IOSDeepResearcher, 
        IOSLogger, 
        IOSConfigManager, 
        IOSNotificationManager, 
        IOSRetryUtility,
        IOSDetector,
        IOSHttpClient
    };
}

// Run if called directly (terminal apps) or in Scriptable
if ((typeof require !== 'undefined' && require.main === module) || 
    (typeof module === 'undefined')) {
    iosMain().catch(error => {
        console.error('Script execution failed:', error.message);
        if (typeof process !== 'undefined') {
            process.exit(1);
        }
    });
}