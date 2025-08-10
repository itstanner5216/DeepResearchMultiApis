#!/usr/bin/env node

/**
 * iOS-Compatible Deep Research Script
 * Optimized for iOS Shortcuts and terminal apps like a-Shell, iSH
 * Focuses on clipboard-to-clipboard workflow
 */

const axios = require('axios');
const clipboardy = require('node-clipboardy');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// iOS Environment Detection
class IOSDetector {
    static isIOS() {
        // Check various indicators that we're running on iOS
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

    static getIOSCompatiblePath(filename) {
        if (this.isIOS()) {
            // On iOS, use Documents directory or current directory
            const documentsPath = process.env.HOME ? path.join(process.env.HOME, 'Documents') : '.';
            return path.join(documentsPath, filename);
        }
        return path.join(__dirname, filename);
    }
}

// iOS-Compatible Logger
class IOSLogger {
    static log(level, message, error = null) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

        // Log to console using appropriate level
        if (level === 'error') {
            console.error(logEntry);
        } else if (level === 'warn') {
            console.warn(logEntry);
        } else {
            console.log(logEntry);
        }
        
        // Only log to file if not in iOS or if explicitly enabled
        if (!IOSDetector.isIOS() || process.env.IOS_FILE_LOGGING === 'true') {
            try {
                const logFile = IOSDetector.getIOSCompatiblePath('research.log');
                fs.appendFileSync(logFile, logEntry + (error ? `\nError: ${error.message}` : '') + '\n');
            } catch (e) {
                // Silently fail on iOS if file logging is not available
                if (!IOSDetector.isIOS()) {
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
        try {
            const configFile = IOSDetector.getIOSCompatiblePath('config.json');
            if (fs.existsSync(configFile)) {
                const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
                return config;
            }
        } catch (error) {
            IOSLogger.warn('Config file not found or invalid, using environment variables');
        }
        
        // Return default config with environment variables
        return {
            braveSearch: {
                apiKey: process.env.BRAVE_API_KEY || '',
                baseUrl: 'https://api.search.brave.com/res/v1/web/search',
                timeout: 15000, // Longer timeout for mobile networks
                retries: 2 // Fewer retries on mobile
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
        };
    }
}

// iOS-Compatible Notification Manager (no desktop notifications)
class IOSNotificationManager {
    static notify(title, message, type = 'info') {
        // On iOS, just log notifications instead of showing desktop notifications
        IOSLogger.info(`NOTIFICATION: ${title} - ${message}`);
        
        // For iOS shortcuts, we can output specially formatted text
        if (process.env.IOS_SHORTCUTS_MODE === 'true') {
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
                
                // Simple delay for iOS
                const delay = baseDelay * attempt;
                IOSLogger.info(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}

// iOS-Optimized Deep Researcher
class IOSDeepResearcher {
    constructor() {
        this.config = IOSConfigManager.loadConfig();
        this.isIOS = IOSDetector.isIOS();
        IOSLogger.info(`iOS Deep Researcher initialized (iOS: ${this.isIOS})`);
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
                url: this.config.braveSearch.baseUrl,
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
                    const result = await axios(requestConfig);
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
                url: this.config.newsAPI.baseUrl,
                params: params,
                headers: {
                    'Authorization': `Bearer ${this.config.newsAPI.apiKey}`,
                    'User-Agent': 'iOS-DeepResearch/1.0'
                },
                timeout: this.config.newsAPI.timeout
            };

            const response = await IOSRetryUtility.withRetry(
                async () => {
                    const result = await axios(requestConfig);
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
                url: this.config.newsdataIO.baseUrl,
                params: params,
                headers: {
                    'User-Agent': 'iOS-DeepResearch/1.0'
                },
                timeout: this.config.newsdataIO.timeout
            };

            const response = await IOSRetryUtility.withRetry(
                async () => {
                    const result = await axios(requestConfig);
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
            
            // Read query from clipboard
            let query;
            try {
                query = await clipboardy.read();
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

            // Flag to track if clipboard was updated successfully
            let clipboardUpdated = false;
            let success = true;

            // Write results back to clipboard
            try {
                await clipboardy.write(summary);
                clipboardUpdated = true;
                IOSLogger.info('Results summary written to clipboard');
                IOSNotificationManager.notify('Clipboard Updated', 'Search results copied to clipboard');
            } catch (error) {
                IOSLogger.error('Failed to write to clipboard', error);
                success = false; // Propagate failure
            }

            // For iOS Shortcuts, also output to console
            if (process.env.IOS_SHORTCUTS_MODE === 'true') {
                console.log('\n📋 RESULTS COPIED TO CLIPBOARD 📋\n');
                console.log(summary);
            }

            return {
                success: success,
                query: query,
                results: results,
                summary: summary,
                clipboardUpdated: clipboardUpdated
            };

        } catch (error) {
            IOSLogger.error('iOS clipboard workflow failed', error);
            IOSNotificationManager.notify('Workflow Error', error.message, 'error');
            
            // Try to write error to clipboard for shortcuts
            try {
                const errorMessage = `❌ Deep Research Error: ${error.message}\nTime: ${new Date().toISOString()}`;
                await clipboardy.write(errorMessage);
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

        summary += `\n🤖 Generated by iOS Deep Research v1.0\n`;
        return summary;
    }
}

// iOS CLI Interface
async function iosMain() {
    const args = process.argv.slice(2);
    const researcher = new IOSDeepResearcher();

    try {
        // Check if running on iOS
        if (IOSDetector.isIOS()) {
            IOSLogger.info('iOS environment detected');
            process.env.IOS_SHORTCUTS_MODE = 'true'; // Enable shortcuts mode
        }

        if (args.length === 0 || args[0] === '--clipboard') {
            // Default behavior: clipboard workflow (perfect for iOS shortcuts)
            await researcher.iosClipboardWorkflow();
        } else if (args[0] === '--config') {
            // Configuration mode
            console.log('📱 iOS Deep Research Configuration:');
            console.log(JSON.stringify(researcher.config, null, 2));
        } else if (args[0] === '--test-clipboard') {
            // Test clipboard access
            try {
                const clipContent = await clipboardy.read();
                console.log('✅ Clipboard read successful');
                console.log('📋 Current clipboard content:', clipContent || '(empty)');
                
                await clipboardy.write('iOS Deep Research Test - ' + new Date().toISOString());
                console.log('✅ Clipboard write successful');
            } catch (error) {
                console.log('❌ Clipboard access failed:', error.message);
            }
        } else {
            // Search with provided query
            const query = args.join(' ');
            IOSLogger.info(`iOS search for: "${query}"`);
            const results = await researcher.iosComprehensiveSearch(query);
            
            // Output results
            if (process.env.IOS_SHORTCUTS_MODE === 'true') {
                const summary = researcher.generateIOSResultsSummary(results);
                console.log(summary);
                
                // Also copy to clipboard for shortcuts
                try {
                    await clipboardy.write(summary);
                    console.log('\n📋 Results copied to clipboard for iOS Shortcuts');
                } catch (error) {
                    IOSLogger.warn('Could not copy to clipboard', error);
                }
            } else {
                console.log(JSON.stringify(results, null, 2));
            }
        }
    } catch (error) {
        IOSLogger.error('iOS main execution failed', error);
        
        if (process.env.IOS_SHORTCUTS_MODE === 'true') {
            console.log(`❌ Error: ${error.message}`);
        }
        
        process.exit(1);
    }
}

// Export for testing and module use
module.exports = { 
    IOSDeepResearcher, 
    IOSLogger, 
    IOSConfigManager, 
    IOSNotificationManager, 
    IOSRetryUtility,
    IOSDetector 
};

// Run if called directly
if (require.main === module) {
    iosMain();
}