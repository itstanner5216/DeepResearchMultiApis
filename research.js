#!/usr/bin/env node

/**
 * Deep Research Multi-API Script
 * Fetches data from multiple APIs for comprehensive research purposes
 */

require('dotenv').config();
const axios = require('axios');
const clipboardy = require('clipboardy');
const notifier = require('node-notifier');
const fs = require('fs');
const path = require('path');

// Configuration and constants
const CONFIG = {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 10000,
    outputDir: './results',
    logFile: './research.log'
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Logger utility for debugging and error tracking
 */
class Logger {
    static log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        
        console.log(logEntry);
        if (data) {
            console.log(JSON.stringify(data, null, 2));
        }
        
        // Write to log file
        const logLine = data ? `${logEntry}\n${JSON.stringify(data, null, 2)}\n` : `${logEntry}\n`;
        fs.appendFileSync(CONFIG.logFile, logLine);
    }

    static info(message, data) { this.log('info', message, data); }
    static warn(message, data) { this.log('warn', message, data); }
    static error(message, data) { this.log('error', message, data); }
    static debug(message, data) { this.log('debug', message, data); }
}

/**
 * API Key Management
 */
class APIKeyManager {
    static getKey(service) {
        const envKey = `${service.toUpperCase()}_API_KEY`;
        const key = process.env[envKey];
        if (!key) {
            Logger.warn(`API key not found for ${service}. Set ${envKey} environment variable.`);
        }
        return key;
    }

    static validateKeys() {
        const requiredKeys = ['BRAVE', 'GOOGLE', 'NEWSAPI', 'NEWSDATA'];
        const missingKeys = [];
        
        requiredKeys.forEach(service => {
            if (!this.getKey(service)) {
                missingKeys.push(`${service}_API_KEY`);
            }
        });
        
        if (missingKeys.length > 0) {
            Logger.warn(`Missing API keys: ${missingKeys.join(', ')}`);
            return false;
        }
        return true;
    }
}

/**
 * HTTP Client with retry logic and error handling
 */
class HTTPClient {
    static async makeRequest(url, options = {}, retries = CONFIG.maxRetries) {
        try {
            const response = await axios({
                url,
                timeout: CONFIG.timeout,
                ...options
            });
            
            Logger.debug(`Request successful: ${url}`, { status: response.status });
            return response.data;
        } catch (error) {
            Logger.error(`Request failed: ${url}`, {
                message: error.message,
                status: error.response?.status,
                retries: CONFIG.maxRetries - retries + 1
            });
            
            if (retries > 0 && error.response?.status >= 500) {
                Logger.info(`Retrying request in ${CONFIG.retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
                return this.makeRequest(url, options, retries - 1);
            }
            
            throw error;
        }
    }
}

/**
 * Brave Search API Integration
 */
async function braveSearch(query, options = {}) {
    Logger.info(`Starting Brave Search for: "${query}"`);
    
    const apiKey = APIKeyManager.getKey('BRAVE');
    if (!apiKey) {
        throw new Error('Brave API key not configured');
    }
    
    try {
        const searchType = options.type || 'web';
        const url = `https://api.search.brave.com/res/v1/${searchType}/search`;
        
        const params = {
            q: query,
            count: options.count || 10,
            offset: options.offset || 0,
            mkt: options.market || 'en-US'
        };
        
        if (options.freshness) params.freshness = options.freshness;
        if (options.safesearch) params.safesearch = options.safesearch;
        
        const response = await HTTPClient.makeRequest(url, {
            method: 'GET',
            headers: {
                'X-Subscription-Token': apiKey,
                'Accept': 'application/json'
            },
            params
        });
        
        const results = {
            source: 'Brave Search',
            query,
            type: searchType,
            timestamp: new Date().toISOString(),
            total: response.web?.totalCount || 0,
            results: response.web?.results || response.images?.results || []
        };
        
        Logger.info(`Brave Search completed: ${results.total} results found`);
        return results;
    } catch (error) {
        Logger.error('Brave Search failed', error);
        throw new Error(`Brave Search failed: ${error.message}`);
    }
}

/**
 * Google Search API Integration (Custom Search Engine)
 */
async function googleSearch(query, options = {}) {
    Logger.info(`Starting Google Search for: "${query}"`);
    
    const apiKey = APIKeyManager.getKey('GOOGLE');
    const cseId = process.env.GOOGLE_CSE_ID;
    
    if (!apiKey || !cseId) {
        throw new Error('Google API key or Custom Search Engine ID not configured');
    }
    
    try {
        const searchType = options.type || 'web';
        const url = 'https://www.googleapis.com/customsearch/v1';
        
        const params = {
            key: apiKey,
            cx: cseId,
            q: query,
            num: Math.min(options.count || 10, 10), // Google CSE max is 10
            start: options.start || 1
        };
        
        if (searchType === 'image') {
            params.searchType = 'image';
        }
        
        const response = await HTTPClient.makeRequest(url, {
            method: 'GET',
            params
        });
        
        const results = {
            source: 'Google Search',
            query,
            type: searchType,
            timestamp: new Date().toISOString(),
            total: parseInt(response.searchInformation?.totalResults || 0),
            results: response.items || []
        };
        
        Logger.info(`Google Search completed: ${results.results.length} results found`);
        return results;
    } catch (error) {
        Logger.error('Google Search failed', error);
        throw new Error(`Google Search failed: ${error.message}`);
    }
}

/**
 * NewsAPI Integration
 */
async function newsAPI(query, options = {}) {
    Logger.info(`Starting NewsAPI search for: "${query}"`);
    
    const apiKey = APIKeyManager.getKey('NEWSAPI');
    if (!apiKey) {
        throw new Error('NewsAPI key not configured');
    }
    
    try {
        const endpoint = options.endpoint || 'everything';
        const url = `https://newsapi.org/v2/${endpoint}`;
        
        const params = {
            apiKey,
            q: query,
            pageSize: Math.min(options.pageSize || 20, 100),
            page: options.page || 1,
            sortBy: options.sortBy || 'publishedAt',
            language: options.language || 'en'
        };
        
        if (options.from) params.from = options.from;
        if (options.to) params.to = options.to;
        if (options.sources) params.sources = options.sources;
        if (options.domains) params.domains = options.domains;
        
        const response = await HTTPClient.makeRequest(url, {
            method: 'GET',
            params
        });
        
        const results = {
            source: 'NewsAPI',
            query,
            endpoint,
            timestamp: new Date().toISOString(),
            total: response.totalResults || 0,
            results: response.articles || []
        };
        
        Logger.info(`NewsAPI completed: ${results.total} articles found`);
        return results;
    } catch (error) {
        Logger.error('NewsAPI failed', error);
        throw new Error(`NewsAPI failed: ${error.message}`);
    }
}

/**
 * Newsdata.io Integration with Fallback
 */
async function newsdataFallback(query, options = {}) {
    Logger.info(`Starting Newsdata.io search for: "${query}"`);
    
    const apiKey = APIKeyManager.getKey('NEWSDATA');
    if (!apiKey) {
        throw new Error('Newsdata.io API key not configured');
    }
    
    try {
        const url = 'https://newsdata.io/api/1/news';
        
        const params = {
            apikey: apiKey,
            q: query,
            size: Math.min(options.size || 10, 50),
            language: options.language || 'en',
            category: options.category,
            country: options.country,
            domain: options.domain
        };
        
        // Remove undefined parameters
        Object.keys(params).forEach(key => {
            if (params[key] === undefined) {
                delete params[key];
            }
        });
        
        const response = await HTTPClient.makeRequest(url, {
            method: 'GET',
            params
        });
        
        const results = {
            source: 'Newsdata.io',
            query,
            timestamp: new Date().toISOString(),
            total: response.totalResults || response.results?.length || 0,
            results: response.results || []
        };
        
        Logger.info(`Newsdata.io completed: ${results.total} articles found`);
        return results;
    } catch (error) {
        Logger.error('Newsdata.io failed, attempting fallback', error);
        
        // Fallback to alternative parameters or simplified query
        try {
            Logger.info('Attempting Newsdata.io fallback with simplified query');
            const fallbackParams = {
                apikey: APIKeyManager.getKey('NEWSDATA'),
                q: query.split(' ').slice(0, 3).join(' '), // Simplified query
                size: 5,
                language: 'en'
            };
            
            const fallbackResponse = await HTTPClient.makeRequest('https://newsdata.io/api/1/news', {
                method: 'GET',
                params: fallbackParams
            });
            
            const fallbackResults = {
                source: 'Newsdata.io (Fallback)',
                query,
                timestamp: new Date().toISOString(),
                total: fallbackResponse.totalResults || fallbackResponse.results?.length || 0,
                results: fallbackResponse.results || []
            };
            
            Logger.info(`Newsdata.io fallback completed: ${fallbackResults.total} articles found`);
            return fallbackResults;
        } catch (fallbackError) {
            Logger.error('Newsdata.io fallback also failed', fallbackError);
            throw new Error(`Newsdata.io failed: ${error.message}, Fallback failed: ${fallbackError.message}`);
        }
    }
}

/**
 * Clipboard utilities
 */
class ClipboardManager {
    static async readInput() {
        try {
            const content = await clipboardy.read();
            Logger.info('Read input from clipboard', { length: content.length });
            return content.trim();
        } catch (error) {
            Logger.error('Failed to read from clipboard', error);
            throw new Error('Failed to read clipboard content');
        }
    }
    
    static async writeOutput(content) {
        try {
            await clipboardy.write(content);
            Logger.info('Wrote output to clipboard', { length: content.length });
        } catch (error) {
            Logger.error('Failed to write to clipboard', error);
            throw new Error('Failed to write to clipboard');
        }
    }
}

/**
 * Notification manager
 */
class NotificationManager {
    static notify(title, message, type = 'info') {
        try {
            notifier.notify({
                title,
                message,
                sound: true,
                wait: false
            });
            Logger.info(`Notification sent: ${title}`);
        } catch (error) {
            Logger.error('Failed to send notification', error);
        }
    }
    
    static success(message) {
        this.notify('Research Complete', message, 'success');
    }
    
    static error(message) {
        this.notify('Research Error', message, 'error');
    }
}

/**
 * Result formatter and output manager
 */
class ResultFormatter {
    static formatResults(allResults) {
        const timestamp = new Date().toISOString();
        let formatted = `# Deep Research Results\n`;
        formatted += `Generated: ${timestamp}\n\n`;
        
        allResults.forEach((result, index) => {
            if (result.error) {
                formatted += `## ${result.source} - ERROR\n`;
                formatted += `Error: ${result.error}\n\n`;
            } else {
                formatted += `## ${result.source}\n`;
                formatted += `Query: "${result.query}"\n`;
                formatted += `Total Results: ${result.total}\n`;
                formatted += `Type: ${result.type || 'articles'}\n\n`;
                
                if (result.results && result.results.length > 0) {
                    result.results.slice(0, 5).forEach((item, i) => {
                        formatted += `### Result ${i + 1}\n`;
                        
                        if (item.title) formatted += `**Title:** ${item.title}\n`;
                        if (item.url || item.link) formatted += `**URL:** ${item.url || item.link}\n`;
                        if (item.description || item.snippet) formatted += `**Description:** ${item.description || item.snippet}\n`;
                        if (item.publishedAt || item.pubDate) formatted += `**Published:** ${item.publishedAt || item.pubDate}\n`;
                        if (item.source?.name) formatted += `**Source:** ${item.source.name}\n`;
                        
                        formatted += '\n';
                    });
                }
                formatted += '---\n\n';
            }
        });
        
        return formatted;
    }
    
    static async saveResults(results, query) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `research-${query.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.md`;
        const filepath = path.join(CONFIG.outputDir, filename);
        
        try {
            const formatted = this.formatResults(results);
            fs.writeFileSync(filepath, formatted);
            Logger.info(`Results saved to: ${filepath}`);
            return filepath;
        } catch (error) {
            Logger.error('Failed to save results', error);
            throw error;
        }
    }
}

/**
 * Main research orchestrator
 */
async function performResearch(query, options = {}) {
    Logger.info(`Starting comprehensive research for: "${query}"`);
    
    const results = [];
    const apis = [
        { name: 'Brave Search', func: braveSearch, options: { type: 'web' } },
        { name: 'Google Search (Web)', func: googleSearch, options: { type: 'web' } },
        { name: 'Google Search (Images)', func: googleSearch, options: { type: 'image' } },
        { name: 'NewsAPI', func: newsAPI, options: {} },
        { name: 'Newsdata.io', func: newsdataFallback, options: {} }
    ];
    
    // Execute all API calls
    for (const api of apis) {
        try {
            Logger.info(`Executing ${api.name}...`);
            const result = await api.func(query, { ...api.options, ...options });
            results.push(result);
        } catch (error) {
            Logger.error(`${api.name} failed`, error);
            results.push({
                source: api.name,
                query,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    return results;
}

/**
 * Main application entry point
 */
async function main() {
    try {
        Logger.info('Deep Research Multi-API Script Starting');
        
        // Validate API keys
        APIKeyManager.validateKeys();
        
        // Get query from command line argument or clipboard
        let query = process.argv[2];
        
        if (!query) {
            Logger.info('No query provided as argument, reading from clipboard...');
            try {
                query = await ClipboardManager.readInput();
            } catch (error) {
                Logger.error('Failed to read query from clipboard');
                console.error('Usage: node research.js "your search query" or copy query to clipboard');
                process.exit(1);
            }
        }
        
        if (!query || query.trim().length === 0) {
            throw new Error('No search query provided');
        }
        
        Logger.info(`Research query: "${query}"`);
        
        // Perform research
        const results = await performResearch(query.trim());
        
        // Format and output results
        const formattedResults = ResultFormatter.formatResults(results);
        
        // Save to file
        const filepath = await ResultFormatter.saveResults(results, query);
        
        // Copy to clipboard
        await ClipboardManager.writeOutput(formattedResults);
        
        // Send notification
        const successCount = results.filter(r => !r.error).length;
        const totalCount = results.length;
        NotificationManager.success(`Research complete! ${successCount}/${totalCount} APIs successful. Results copied to clipboard.`);
        
        Logger.info(`Research completed successfully. Results saved to: ${filepath}`);
        console.log('\n' + formattedResults);
        
    } catch (error) {
        Logger.error('Research failed', error);
        NotificationManager.error(`Research failed: ${error.message}`);
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Export functions for testing
module.exports = {
    braveSearch,
    googleSearch,
    newsAPI,
    newsdataFallback,
    performResearch,
    Logger,
    APIKeyManager,
    ClipboardManager,
    NotificationManager,
    ResultFormatter
};

// Run main function if script is executed directly
if (require.main === module) {
    main();
}