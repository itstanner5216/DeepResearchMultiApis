#!/usr/bin/env node

/**
 * Test Script for Scriptable iOS Compatibility
 * This simulates the Scriptable environment to test our implementation
 */

// Mock Scriptable APIs for testing
const mockScriptableAPI = {
  Pasteboard: {
    paste: () => "artificial intelligence",
    copy: (text) => {
      console.log("📋 Mock Clipboard: Content copied");
      console.log("Content:", text.substring(0, 200) + "...");
    }
  },
  
  Keychain: {
    get: async (key) => {
      // Mock API keys for testing
      const mockKeys = {
        'BRAVE_API_KEY': process.env.BRAVE_API_KEY || 'mock_brave_key',
        'NEWS_API_KEY': process.env.NEWS_API_KEY || 'mock_news_key',
        'NEWSDATA_API_KEY': process.env.NEWSDATA_API_KEY || 'mock_newsdata_key'
      };
      return mockKeys[key] || null;
    },
    
    set: async (key, value) => {
      console.log(`🔐 Mock Keychain: Set ${key}`);
      return true;
    }
  },
  
  Notification: class {
    constructor() {
      this.title = '';
      this.body = '';
      this.sound = 'default';
    }
    
    schedule() {
      console.log(`📱 Mock Notification: ${this.title} - ${this.body}`);
    }
  },
  
  Request: class {
    constructor(url) {
      this.url = url;
      this.method = 'GET';
      this.headers = {};
      this.timeoutInterval = 15000;
      this.body = null;
    }
    
    async loadJSON() {
      // Mock successful API response
      console.log(`🌐 Mock Request: ${this.method} ${this.url}`);
      
      if (this.url.includes('brave')) {
        return {
          web: {
            results: [
              { title: "AI Research Article", url: "https://example.com/ai", description: "A comprehensive guide to AI" },
              { title: "Machine Learning Basics", url: "https://example.com/ml", description: "Introduction to ML concepts" }
            ]
          }
        };
      } else if (this.url.includes('newsapi')) {
        return {
          status: 'ok',
          articles: [
            { title: "AI News", url: "https://news.com/ai", description: "Latest AI developments", author: "Tech Reporter", source: { name: "Tech News" } }
          ]
        };
      } else if (this.url.includes('newsdata')) {
        return {
          status: 'success',
          results: [
            { title: "AI Innovation", link: "https://data.com/ai", description: "New AI breakthrough", creator: "Research Team", source_id: "research_journal" }
          ]
        };
      }
      
      throw new Error('Mock API endpoint not found');
    }
  },
  
  Timer: {
    schedule: (ms, repeats, callback) => {
      setTimeout(callback, ms);
    }
  },
  
  console: {
    log: (...args) => process.stdout.write('[Scriptable] ' + args.join(' ') + '\n'),
    error: (...args) => process.stderr.write('[Scriptable] ' + args.join(' ') + '\n')
  }
};

// Inject mock APIs into global scope
Object.assign(global, mockScriptableAPI);

async function testScriptableCompatibility() {
  console.log('🧪 Testing Scriptable iOS Compatibility\n');
  
  try {
    // Load and execute the Scriptable script
    const scriptableCode = require('fs').readFileSync('./scriptableResearch.js', 'utf8');
    
    // Extract the main functionality (everything except the final execution)
    const codeWithoutExecution = scriptableCode.replace(/await main\(\);?\s*$/, '');
    
    // Execute the script code
    eval(codeWithoutExecution);
    
    console.log('✅ Scriptable code loaded successfully\n');
    
    // Test the main functionality
    console.log('📋 Testing clipboard workflow...\n');
    
    const researcher = new ScriptableDeepResearcher();
    await researcher.initialize();
    
    console.log('🔍 Starting mock research...\n');
    
    // Test individual API functions with mock data
    console.log('Testing Brave Search...');
    const braveResult = await researcher.braveSearch('artificial intelligence');
    console.log('Brave Search Result:', braveResult.success ? '✅ Success' : '❌ Failed');
    
    console.log('\nTesting NewsAPI...');
    const newsResult = await researcher.newsAPI('artificial intelligence');
    console.log('NewsAPI Result:', newsResult.success ? '✅ Success' : '❌ Failed');
    
    console.log('\nTesting Newsdata.io...');
    const newsdataResult = await researcher.newsdataFallback('artificial intelligence');
    console.log('Newsdata.io Result:', newsdataResult.success ? '✅ Success' : '❌ Failed');
    
    console.log('\n🔍 Testing comprehensive search...');
    const comprehensiveResult = await researcher.comprehensiveSearch('artificial intelligence');
    console.log('Comprehensive Search Results:', comprehensiveResult.totalResults, 'total results');
    
    console.log('\n📋 Testing full clipboard workflow...');
    const clipboardResult = await researcher.clipboardWorkflow();
    
    if (clipboardResult.success) {
      console.log('✅ Clipboard workflow completed successfully');
      console.log(`📊 Found ${clipboardResult.results.totalResults} total results`);
      console.log('📋 Results formatted and copied to clipboard');
    } else {
      console.log('❌ Clipboard workflow failed');
    }
    
    console.log('\n🎉 Scriptable compatibility test completed successfully!');
    console.log('\n📱 The script should work correctly in the Scriptable iOS app');
    console.log('💡 Remember to configure real API keys before using on iOS');
    
  } catch (error) {
    console.error('❌ Scriptable compatibility test failed:', error.message);
    console.error('\nError details:', error.stack);
    process.exit(1);
  }
}

// Run the test
testScriptableCompatibility();