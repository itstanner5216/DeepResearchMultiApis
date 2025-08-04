#!/usr/bin/env node

const axios = require('axios');
const clipboardy = require('node-clipboardy');
const notifier = require('node-notifier');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const CONFIG_FILE = path.join(__dirname, 'config.json');
const LOG_FILE = path.join(__dirname, 'research.log');

// Logger utility
class Logger {
    static log(level, message, error = null) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        
        console.log(logEntry);
        
        // Append to log file
        try {
            fs.appendFileSync(LOG_FILE, logEntry + (error ? `\nError: ${error.message}\nStack: ${error.stack}` : '') + '\n');
        } catch (e) {
            console.error('Failed to write to log file:', e.message);
        }
    }

    static info(message) { this.log('info', message); }
    static warn(message) { this.log('warn', message); }
    static error(message, error = null) { this.log('error', message, error); }
    static debug(message) { this.log('debug', message); }
}

// Configuration manager
class ConfigManager {
    static loadConfig() {
        try {
            if (fs.existsSync(CONFIG_FILE)) {
                const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
                return config;
            }
        } catch (error) {
            Logger.error('Failed to load config file', error);
        }
        
        // Return default config with environment variables
        return {
            braveSearch: {
                apiKey: process.env.BRAVE_API_KEY || '',
                baseUrl: 'https://api.search.brave.com/res/v1/web/search',
                timeout: 10000,
                retries: 3
            },
            newsAPI: {
                apiKey: process.env.NEWS_API_KEY || '',
                baseUrl: 'https://newsapi.org/v2/everything',
                timeout: 10000,
                retries: 3
            },
            newsdataIO: {
                apiKey: process.env.NEWSDATA_API_KEY || '',
                baseUrl: 'https://newsdata.io/api/1/news',
                timeout: 10000,
                retries: 3
            },
            googleSearch: {
                apiKey: process.env.GOOGLE_API_KEY || '',
                searchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID || '',
                baseUrl: 'https://www.googleapis.com/customsearch/v1',
                timeout: 10000,
                retries: 3
            }
        };
    }

    static saveConfig(config) {
        try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
            Logger.info('Configuration saved successfully');
        } catch (error) {
            Logger.error('Failed to save config file', error);
        }
    }
}

// Notification utility
class NotificationManager {
    static notify(title, message, type = 'info') {
        try {
            notifier.notify({
                title: title,
                message: message,
                sound: true,
                wait: false
            });
            Logger.info(`Notification sent: ${title} - ${message}`);
        } catch (error) {
            Logger.error('Failed to send notification', error);
        }
    }
}

// Retry utility with exponential backoff
class RetryUtility {
    static async withRetry(fn, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                Logger.warn(`Attempt ${attempt} failed: ${error.message}`);
                
                if (attempt === maxRetries) {
                    throw lastError;
                }
                
                // Exponential backoff with jitter
                const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
                Logger.info(`Retrying in ${Math.round(delay)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}

// Main Research Class
class DeepResearcher {
    constructor() {
        this.config = ConfigManager.loadConfig();
        Logger.info('DeepResearcher initialized');
    }

    // Brave Search API implementation with robust error handling
    async braveSearch(query, options = {}) {
        const functionName = 'braveSearch';
        Logger.info(`${functionName}: Starting search for query: "${query}"`);
        
        try {
            // Validate inputs
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                throw new Error('Query must be a non-empty string');
            }

            if (!this.config.braveSearch.apiKey) {
                throw new Error('Brave Search API key not configured');
            }

            // Prepare request parameters
            const params = {
                q: query.trim(),
                count: options.count || 10,
                offset: options.offset || 0,
                mkt: options.market || 'en-US',
                safesearch: options.safesearch || 'moderate',
                ...options.extra
            };

            const requestConfig = {
                method: 'GET',
                url: this.config.braveSearch.baseUrl,
                params: params,
                headers: {
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip',
                    'X-Subscription-Token': this.config.braveSearch.apiKey
                },
                timeout: this.config.braveSearch.timeout
            };

            Logger.debug(`${functionName}: Making request with params: ${JSON.stringify(params)}`);

            // Execute with retry logic
            const response = await RetryUtility.withRetry(
                async () => {
                    const result = await axios(requestConfig);
                    if (!result.data) {
                        throw new Error('Empty response from Brave Search API');
                    }
                    return result;
                },
                this.config.braveSearch.retries
            );

            // Validate and process response
            const results = this.processBraveSearchResponse(response.data);
            
            Logger.info(`${functionName}: Successfully retrieved ${results.length} results`);
            NotificationManager.notify('Brave Search', `Found ${results.length} results for "${query}"`);
            
            return {
                success: true,
                source: 'braveSearch',
                query: query,
                resultsCount: results.length,
                results: results,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            Logger.error(`${functionName}: Failed for query "${query}"`, error);
            
            // Handle different error types
            if (error.code === 'ECONNABORTED') {
                NotificationManager.notify('Brave Search Error', 'Request timeout', 'error');
            } else if (error.response?.status === 401) {
                NotificationManager.notify('Brave Search Error', 'Invalid API key', 'error');
            } else if (error.response?.status === 429) {
                NotificationManager.notify('Brave Search Error', 'Rate limit exceeded', 'error');
            } else {
                NotificationManager.notify('Brave Search Error', error.message, 'error');
            }

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
            Logger.error('Error processing Brave Search response', error);
        }
        
        return results;
    }

    // NewsAPI implementation with robust error handling
    async newsAPI(query, options = {}) {
        const functionName = 'newsAPI';
        Logger.info(`${functionName}: Starting news search for query: "${query}"`);
        
        try {
            // Validate inputs
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                throw new Error('Query must be a non-empty string');
            }

            if (!this.config.newsAPI.apiKey) {
                throw new Error('NewsAPI key not configured');
            }

            // Prepare request parameters
            const params = {
                q: query.trim(),
                pageSize: Math.min(options.pageSize || 20, 100), // NewsAPI max is 100
                page: options.page || 1,
                sortBy: options.sortBy || 'publishedAt',
                language: options.language || 'en',
                from: options.from || null,
                to: options.to || null,
                domains: options.domains || null,
                excludeDomains: options.excludeDomains || null
            };

            // Remove null values
            Object.keys(params).forEach(key => {
                if (params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            const requestConfig = {
                method: 'GET',
                url: this.config.newsAPI.baseUrl,
                params: params,
                headers: {
                    'Authorization': `Bearer ${this.config.newsAPI.apiKey}`,
                    'User-Agent': 'DeepResearchMultiApis/1.0'
                },
                timeout: this.config.newsAPI.timeout
            };

            Logger.debug(`${functionName}: Making request with params: ${JSON.stringify(params)}`);

            // Execute with retry logic
            const response = await RetryUtility.withRetry(
                async () => {
                    const result = await axios(requestConfig);
                    if (!result.data) {
                        throw new Error('Empty response from NewsAPI');
                    }
                    if (result.data.status !== 'ok') {
                        throw new Error(result.data.message || 'NewsAPI returned error status');
                    }
                    return result;
                },
                this.config.newsAPI.retries
            );

            // Process response
            const results = this.processNewsAPIResponse(response.data);
            
            Logger.info(`${functionName}: Successfully retrieved ${results.length} articles`);
            NotificationManager.notify('NewsAPI', `Found ${results.length} articles for "${query}"`);
            
            return {
                success: true,
                source: 'newsAPI',
                query: query,
                resultsCount: results.length,
                totalResults: response.data.totalResults || results.length,
                results: results,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            Logger.error(`${functionName}: Failed for query "${query}"`, error);
            
            // Handle different error types
            if (error.code === 'ECONNABORTED') {
                NotificationManager.notify('NewsAPI Error', 'Request timeout', 'error');
            } else if (error.response?.status === 401) {
                NotificationManager.notify('NewsAPI Error', 'Invalid API key', 'error');
            } else if (error.response?.status === 429) {
                NotificationManager.notify('NewsAPI Error', 'Rate limit exceeded', 'error');
            } else if (error.response?.status === 426) {
                NotificationManager.notify('NewsAPI Error', 'Upgrade required', 'error');
            } else {
                NotificationManager.notify('NewsAPI Error', error.message, 'error');
            }

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
                        content: article.content || '',
                        author: article.author || 'Unknown author',
                        source: article.source?.name || 'Unknown source',
                        publishedAt: article.publishedAt || null,
                        urlToImage: article.urlToImage || null
                    });
                });
            }
        } catch (error) {
            Logger.error('Error processing NewsAPI response', error);
        }
        
        return results;
    }

    // Newsdata.io fallback implementation with robust error handling
    async newsdataFallback(query, options = {}) {
        const functionName = 'newsdataFallback';
        Logger.info(`${functionName}: Starting fallback news search for query: "${query}"`);
        
        try {
            // Validate inputs
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                throw new Error('Query must be a non-empty string');
            }

            if (!this.config.newsdataIO.apiKey) {
                throw new Error('Newsdata.io API key not configured');
            }

            // Prepare request parameters
            const params = {
                apikey: this.config.newsdataIO.apiKey,
                q: query.trim(),
                language: options.language || 'en',
                country: options.country || null,
                category: options.category || null,
                domain: options.domain || null,
                size: Math.min(options.size || 10, 50), // Newsdata.io max varies by plan
                page: options.page || null
            };

            // Remove null values
            Object.keys(params).forEach(key => {
                if (params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            const requestConfig = {
                method: 'GET',
                url: this.config.newsdataIO.baseUrl,
                params: params,
                headers: {
                    'User-Agent': 'DeepResearchMultiApis/1.0'
                },
                timeout: this.config.newsdataIO.timeout
            };

            Logger.debug(`${functionName}: Making request with params: ${JSON.stringify(params)}`);

            // Execute with retry logic
            const response = await RetryUtility.withRetry(
                async () => {
                    const result = await axios(requestConfig);
                    if (!result.data) {
                        throw new Error('Empty response from Newsdata.io');
                    }
                    if (result.data.status !== 'success') {
                        throw new Error(result.data.message || 'Newsdata.io returned error status');
                    }
                    return result;
                },
                this.config.newsdataIO.retries
            );

            // Process response
            const results = this.processNewsdataResponse(response.data);
            
            Logger.info(`${functionName}: Successfully retrieved ${results.length} articles`);
            NotificationManager.notify('Newsdata.io', `Found ${results.length} articles for "${query}"`);
            
            return {
                success: true,
                source: 'newsdataFallback',
                query: query,
                resultsCount: results.length,
                totalResults: response.data.totalResults || results.length,
                results: results,
                nextPage: response.data.nextPage || null,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            Logger.error(`${functionName}: Failed for query "${query}"`, error);
            
            // Handle different error types
            if (error.code === 'ECONNABORTED') {
                NotificationManager.notify('Newsdata.io Error', 'Request timeout', 'error');
            } else if (error.response?.status === 401) {
                NotificationManager.notify('Newsdata.io Error', 'Invalid API key', 'error');
            } else if (error.response?.status === 429) {
                NotificationManager.notify('Newsdata.io Error', 'Rate limit exceeded', 'error');
            } else if (error.response?.status === 403) {
                NotificationManager.notify('Newsdata.io Error', 'Access forbidden', 'error');
            } else {
                NotificationManager.notify('Newsdata.io Error', error.message, 'error');
            }

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
                        content: article.content || '',
                        creator: article.creator || 'Unknown creator',
                        source: article.source_id || 'Unknown source',
                        publishedAt: article.pubDate || null,
                        imageUrl: article.image_url || null,
                        category: article.category || null,
                        country: article.country || null,
                        language: article.language || null
                    });
                });
            }
        } catch (error) {
            Logger.error('Error processing Newsdata.io response', error);
        }
        
        return results;
    }

    // Comprehensive search with fallback strategies
    async comprehensiveSearch(query, options = {}) {
        Logger.info(`Starting comprehensive search for query: "${query}"`);
        const results = {
            query: query,
            timestamp: new Date().toISOString(),
            sources: {},
            totalResults: 0,
            errors: []
        };

        // Try all APIs concurrently but handle failures gracefully
        const apiCalls = [];

        // Brave Search
        if (options.includeBrave !== false) {
            apiCalls.push(
                this.braveSearch(query, options.braveOptions)
                    .then(result => ({ api: 'braveSearch', result }))
                    .catch(error => ({ api: 'braveSearch', error: error.message }))
            );
        }

        // NewsAPI
        if (options.includeNews !== false) {
            apiCalls.push(
                this.newsAPI(query, options.newsOptions)
                    .then(result => ({ api: 'newsAPI', result }))
                    .catch(error => ({ api: 'newsAPI', error: error.message }))
            );
        }

        // Newsdata.io as fallback
        if (options.includeFallback !== false) {
            apiCalls.push(
                this.newsdataFallback(query, options.fallbackOptions)
                    .then(result => ({ api: 'newsdataFallback', result }))
                    .catch(error => ({ api: 'newsdataFallback', error: error.message }))
            );
        }

        try {
            const apiResults = await Promise.allSettled(apiCalls);
            
            apiResults.forEach(promiseResult => {
                if (promiseResult.status === 'fulfilled') {
                    const { api, result, error } = promiseResult.value;
                    
                    if (result && result.success) {
                        results.sources[api] = result;
                        results.totalResults += result.resultsCount || 0;
                    } else if (error) {
                        results.errors.push({ api, error });
                    }
                } else {
                    results.errors.push({ api: 'unknown', error: promiseResult.reason.message });
                }
            });

            // Final notification
            const successCount = Object.keys(results.sources).length;
            const errorCount = results.errors.length;
            
            if (successCount > 0) {
                NotificationManager.notify(
                    'Comprehensive Search Complete',
                    `${successCount} APIs succeeded, ${errorCount} failed. Total: ${results.totalResults} results`
                );
            } else {
                NotificationManager.notify(
                    'Comprehensive Search Failed',
                    'All APIs failed. Check your configuration and network connection.',
                    'error'
                );
            }

            Logger.info(`Comprehensive search completed: ${successCount} successes, ${errorCount} failures`);
            return results;

        } catch (error) {
            Logger.error('Comprehensive search failed completely', error);
            NotificationManager.notify('Search Error', 'Comprehensive search failed completely', 'error');
            
            results.errors.push({ api: 'comprehensive', error: error.message });
            return results;
        }
    }

    // Clipboard integration
    async searchFromClipboard() {
        try {
            const query = await clipboardy.read();
            if (!query || query.trim().length === 0) {
                throw new Error('Clipboard is empty or contains only whitespace');
            }

            Logger.info(`Searching for clipboard content: "${query}"`);
            const results = await this.comprehensiveSearch(query);
            
            // Optionally copy results back to clipboard
            if (results.totalResults > 0) {
                const summary = this.generateResultsSummary(results);
                await clipboardy.write(summary);
                Logger.info('Results summary copied to clipboard');
            }

            return results;
        } catch (error) {
            Logger.error('Failed to search from clipboard', error);
            NotificationManager.notify('Clipboard Search Error', error.message, 'error');
            throw error;
        }
    }

    generateResultsSummary(results) {
        let summary = `Deep Research Results for: "${results.query}"\n`;
        summary += `Generated: ${results.timestamp}\n`;
        summary += `Total Results: ${results.totalResults}\n\n`;

        Object.entries(results.sources).forEach(([api, data]) => {
            summary += `=== ${api.toUpperCase()} (${data.resultsCount} results) ===\n`;
            
            data.results.slice(0, 5).forEach((item, index) => {
                summary += `${index + 1}. ${item.title}\n`;
                summary += `   ${item.url}\n`;
                summary += `   ${item.description}\n\n`;
            });
        });

        if (results.errors.length > 0) {
            summary += `\n=== ERRORS ===\n`;
            results.errors.forEach(error => {
                summary += `${error.api}: ${error.error}\n`;
            });
        }

        return summary;
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const researcher = new DeepResearcher();

    try {
        if (args.length === 0) {
            // No arguments - search from clipboard
            Logger.info('No arguments provided, searching from clipboard');
            await researcher.searchFromClipboard();
        } else if (args[0] === '--config') {
            // Configuration mode
            console.log('Current configuration:');
            console.log(JSON.stringify(researcher.config, null, 2));
        } else {
            // Search with provided query
            const query = args.join(' ');
            Logger.info(`Searching for: "${query}"`);
            const results = await researcher.comprehensiveSearch(query);
            
            // Output results to console
            console.log(JSON.stringify(results, null, 2));
        }
    } catch (error) {
        Logger.error('Main execution failed', error);
        process.exit(1);
    }
}

// Export for testing
module.exports = { DeepResearcher, Logger, ConfigManager, NotificationManager, RetryUtility };

// Run if called directly
if (require.main === module) {
    main();
}