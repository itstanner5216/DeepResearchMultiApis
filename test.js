#!/usr/bin/env node

/**
 * Basic functionality test for the research script
 */

const path = require('path');
const fs = require('fs');

// Import the research module
const research = require('./research.js');

console.log('Testing Deep Research Multi-API Script...\n');

// Test 1: Logger functionality
console.log('✓ Testing Logger...');
research.Logger.info('Test log message');
research.Logger.warn('Test warning');
research.Logger.error('Test error');

// Test 2: API Key Manager
console.log('✓ Testing API Key Manager...');
const hasKeys = research.APIKeyManager.validateKeys();
console.log(`  API keys configured: ${hasKeys ? 'Yes' : 'No (expected for test)'}`);

// Test 3: Result Formatter
console.log('✓ Testing Result Formatter...');
const mockResults = [
    {
        source: 'Test API',
        query: 'test query',
        timestamp: new Date().toISOString(),
        total: 2,
        type: 'web',
        results: [
            {
                title: 'Test Result 1',
                url: 'https://example.com/1',
                description: 'This is a test result',
                publishedAt: '2025-01-01T00:00:00Z'
            },
            {
                title: 'Test Result 2',
                url: 'https://example.com/2',
                description: 'This is another test result'
            }
        ]
    },
    {
        source: 'Error API',
        query: 'test query',
        error: 'Test error message',
        timestamp: new Date().toISOString()
    }
];

const formatted = research.ResultFormatter.formatResults(mockResults);
console.log('  ✓ Result formatting successful');
console.log('  Sample output (first 200 chars):');
console.log('  ' + formatted.substring(0, 200) + '...\n');

// Test 4: Check file structure
console.log('✓ Testing file structure...');
const requiredFiles = [
    'research.js',
    'package.json',
    '.env.template',
    '.gitignore',
    'README.md'
];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`  ✓ ${file} exists`);
    } else {
        console.log(`  ✗ ${file} missing`);
    }
});

// Test 5: Check dependencies
console.log('\n✓ Testing dependencies...');
try {
    require('axios');
    console.log('  ✓ axios available');
} catch (e) {
    console.log('  ✗ axios missing');
}

try {
    require('dotenv');
    console.log('  ✓ dotenv available');
} catch (e) {
    console.log('  ✗ dotenv missing');
}

try {
    require('clipboardy');
    console.log('  ✓ clipboardy available');
} catch (e) {
    console.log('  ✗ clipboardy missing');
}

try {
    require('node-notifier');
    console.log('  ✓ node-notifier available');
} catch (e) {
    console.log('  ✗ node-notifier missing');
}

console.log('\n✓ Basic tests completed!');
console.log('\nTo fully test the script:');
console.log('1. Copy .env.template to .env');
console.log('2. Add your API keys to .env');
console.log('3. Run: node research.js "your search query"');
console.log('4. Or copy a query to clipboard and run: node research.js');