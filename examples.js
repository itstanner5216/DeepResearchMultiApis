#!/usr/bin/env node

/**
 * Example usage of the Deep Research Multi-API Script
 * This demonstrates all key features and functionality
 */

const { 
    performResearch, 
    braveSearch, 
    googleSearch, 
    newsAPI, 
    newsdataFallback,
    Logger 
} = require('./research.js');

async function examples() {
    console.log('Deep Research Multi-API Script - Usage Examples\n');
    
    // Example 1: Complete research workflow
    console.log('Example 1: Complete Research Workflow');
    console.log('=====================================');
    console.log('await performResearch("artificial intelligence trends");');
    console.log('// This will:');
    console.log('// - Query all APIs (Brave, Google web/images, NewsAPI, Newsdata.io)');
    console.log('// - Handle errors gracefully');
    console.log('// - Format and save results');
    console.log('// - Copy results to clipboard');
    console.log('// - Send completion notification\n');
    
    // Example 2: Individual API usage
    console.log('Example 2: Individual API Functions');
    console.log('===================================');
    
    console.log('// Brave Search with options');
    console.log('await braveSearch("renewable energy", {');
    console.log('    count: 20,');
    console.log('    freshness: "pd", // past day');
    console.log('    safesearch: "moderate"');
    console.log('});\n');
    
    console.log('// Google Search for images');
    console.log('await googleSearch("solar panels", {');
    console.log('    type: "image",');
    console.log('    count: 10');
    console.log('});\n');
    
    console.log('// NewsAPI with date filtering');
    console.log('await newsAPI("climate change", {');
    console.log('    from: "2025-01-01",');
    console.log('    sortBy: "popularity",');
    console.log('    language: "en"');
    console.log('});\n');
    
    console.log('// Newsdata.io with fallback');
    console.log('await newsdataFallback("technology", {');
    console.log('    category: "technology",');
    console.log('    country: "us"');
    console.log('});\n');
    
    // Example 3: Error handling
    console.log('Example 3: Error Handling');
    console.log('=========================');
    console.log('try {');
    console.log('    const results = await performResearch("query");');
    console.log('    console.log("Research successful:", results);');
    console.log('} catch (error) {');
    console.log('    Logger.error("Research failed", error);');
    console.log('    // Script continues with partial results');
    console.log('}\n');
    
    // Example 4: Command line usage
    console.log('Example 4: Command Line Usage');
    console.log('=============================');
    console.log('# Basic usage');
    console.log('node research.js "machine learning"');
    console.log('');
    console.log('# Read from clipboard');
    console.log('node research.js');
    console.log('');
    console.log('# Using npm scripts');
    console.log('npm start "blockchain technology"');
    console.log('npm run research "quantum computing"\n');
    
    // Example 5: Configuration
    console.log('Example 5: API Configuration');
    console.log('============================');
    console.log('# Set up environment');
    console.log('npm run setup');
    console.log('');
    console.log('# Edit .env file with your API keys:');
    console.log('BRAVE_API_KEY=your_brave_api_key');
    console.log('GOOGLE_API_KEY=your_google_api_key');
    console.log('GOOGLE_CSE_ID=your_search_engine_id');
    console.log('NEWSAPI_API_KEY=your_newsapi_key');
    console.log('NEWSDATA_API_KEY=your_newsdata_key\n');
    
    console.log('For complete documentation, see README.md');
    console.log('For API key setup instructions, see .env.template');
}

// Run examples if called directly
if (require.main === module) {
    examples();
}