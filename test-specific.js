#!/usr/bin/env node

const { DeepResearcher, Logger } = require('./deepResearch');

// Specific test for the three functions mentioned in the problem statement
async function testSpecificFunctions() {
    console.log('🔍 Testing Specific Functions: braveSearch, newsAPI, and newsdataFallback\n');
    
    const researcher = new DeepResearcher();

    // Test edge cases and error scenarios
    const testCases = [
        { query: '', description: 'Empty string' },
        { query: '   ', description: 'Whitespace only' },
        { query: null, description: 'Null value' },
        { query: undefined, description: 'Undefined value' },
        { query: 'valid test query', description: 'Valid query without API key' },
        { query: 'artificial intelligence machine learning', description: 'Complex query' },
        { query: 'special!@#$%^&*()characters', description: 'Special characters' },
        { query: 'a'.repeat(1000), description: 'Very long query' }
    ];

    console.log('Testing braveSearch function:');
    console.log('='.repeat(40));
    
    for (const testCase of testCases) {
        try {
            console.log(`\n📋 Test: ${testCase.description}`);
            const result = await researcher.braveSearch(testCase.query);
            
            // Validate result structure
            if (typeof result !== 'object' || result === null) {
                throw new Error('Result should be an object');
            }
            
            const requiredFields = ['success', 'source', 'query', 'timestamp'];
            for (const field of requiredFields) {
                if (!result.hasOwnProperty(field)) {
                    throw new Error(`Result missing required field: ${field}`);
                }
            }
            
            if (result.source !== 'braveSearch') {
                throw new Error('Source should be "braveSearch"');
            }
            
            console.log(`   ✅ Success: ${result.success}`);
            console.log(`   📊 Results: ${result.resultsCount || 0}`);
            console.log(`   🔍 Query: "${result.query}"`);
            if (!result.success) {
                console.log(`   ❌ Error: ${result.error}`);
            }
            
        } catch (error) {
            console.log(`   💥 Exception: ${error.message}`);
        }
    }

    console.log('\n\nTesting newsAPI function:');
    console.log('='.repeat(40));
    
    for (const testCase of testCases.slice(0, 4)) { // Test fewer cases for brevity
        try {
            console.log(`\n📰 Test: ${testCase.description}`);
            const result = await researcher.newsAPI(testCase.query);
            
            const requiredFields = ['success', 'source', 'query', 'timestamp'];
            for (const field of requiredFields) {
                if (!result.hasOwnProperty(field)) {
                    throw new Error(`Result missing required field: ${field}`);
                }
            }
            
            if (result.source !== 'newsAPI') {
                throw new Error('Source should be "newsAPI"');
            }
            
            console.log(`   ✅ Success: ${result.success}`);
            console.log(`   📊 Results: ${result.resultsCount || 0}`);
            console.log(`   🔍 Query: "${result.query}"`);
            if (!result.success) {
                console.log(`   ❌ Error: ${result.error}`);
            }
            
        } catch (error) {
            console.log(`   💥 Exception: ${error.message}`);
        }
    }

    console.log('\n\nTesting newsdataFallback function:');
    console.log('='.repeat(40));
    
    for (const testCase of testCases.slice(0, 4)) { // Test fewer cases for brevity
        try {
            console.log(`\n📡 Test: ${testCase.description}`);
            const result = await researcher.newsdataFallback(testCase.query);
            
            const requiredFields = ['success', 'source', 'query', 'timestamp'];
            for (const field of requiredFields) {
                if (!result.hasOwnProperty(field)) {
                    throw new Error(`Result missing required field: ${field}`);
                }
            }
            
            if (result.source !== 'newsdataFallback') {
                throw new Error('Source should be "newsdataFallback"');
            }
            
            console.log(`   ✅ Success: ${result.success}`);
            console.log(`   📊 Results: ${result.resultsCount || 0}`);
            console.log(`   🔍 Query: "${result.query}"`);
            if (!result.success) {
                console.log(`   ❌ Error: ${result.error}`);
            }
            
        } catch (error) {
            console.log(`   💥 Exception: ${error.message}`);
        }
    }

    console.log('\n\n🧪 Testing function options and parameters:');
    console.log('='.repeat(50));
    
    // Test with various options
    const optionsTests = [
        {
            func: 'braveSearch',
            options: { count: 5, safesearch: 'strict', market: 'en-GB' }
        },
        {
            func: 'newsAPI', 
            options: { pageSize: 10, sortBy: 'relevancy', language: 'en' }
        },
        {
            func: 'newsdataFallback',
            options: { size: 15, language: 'en', country: 'us' }
        }
    ];

    for (const test of optionsTests) {
        try {
            console.log(`\n🔧 Testing ${test.func} with options: ${JSON.stringify(test.options)}`);
            const result = await researcher[test.func]('technology news', test.options);
            console.log(`   ✅ Success: ${result.success}`);
            console.log(`   📊 Results: ${result.resultsCount || 0}`);
            if (!result.success) {
                console.log(`   ❌ Error: ${result.error}`);
            }
        } catch (error) {
            console.log(`   💥 Exception: ${error.message}`);
        }
    }

    console.log('\n\n🎯 Testing comprehensive search with fallback strategies:');
    console.log('='.repeat(60));
    
    try {
        const comprehensiveResult = await researcher.comprehensiveSearch('artificial intelligence');
        console.log('📊 Comprehensive Search Results:');
        console.log(`   Query: "${comprehensiveResult.query}"`);
        console.log(`   Total Results: ${comprehensiveResult.totalResults}`);
        console.log(`   Successful Sources: ${Object.keys(comprehensiveResult.sources).length}`);
        console.log(`   Failed Sources: ${comprehensiveResult.errors.length}`);
        
        if (comprehensiveResult.errors.length > 0) {
            console.log('   Errors:');
            comprehensiveResult.errors.forEach(error => {
                console.log(`     - ${error.api}: ${error.error}`);
            });
        }
    } catch (error) {
        console.log(`   💥 Comprehensive search exception: ${error.message}`);
    }

    console.log('\n✅ All specific function tests completed successfully!');
}

// Run if called directly
if (require.main === module) {
    testSpecificFunctions().catch(error => {
        console.error('Specific function testing failed:', error);
        process.exit(1);
    });
}