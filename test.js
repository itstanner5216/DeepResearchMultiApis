#!/usr/bin/env node

const { DeepResearcher, Logger, ConfigManager, RetryUtility } = require('./deepResearch');

// Simple test runner
class TestRunner {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.tests = [];
    }

    async test(name, testFn) {
        console.log(`\n🧪 Testing: ${name}`);
        let testPassed = false;
        try {
            await testFn();
            console.log(`✅ PASSED: ${name}`);
            this.passed++;
            testPassed = true;
        } catch (error) {
            console.log(`❌ FAILED: ${name}`);
            console.log(`   Error: ${error.message}`);
            this.failed++;
        }
        this.tests.push({ name, passed: testPassed });
    }

    summary() {
        console.log(`\n📊 Test Summary:`);
        console.log(`   Passed: ${this.passed}`);
        console.log(`   Failed: ${this.failed}`);
        console.log(`   Total: ${this.passed + this.failed}`);
        
        if (this.failed > 0) {
            console.log(`\n❌ Some tests failed. Check your API configuration.`);
            process.exit(1);
        } else {
            console.log(`\n✅ All tests passed!`);
        }
    }
}

async function runTests() {
    const runner = new TestRunner();
    const researcher = new DeepResearcher();

    // Test 1: Configuration loading
    await runner.test('Configuration Loading', async () => {
        const config = ConfigManager.loadConfig();
        if (!config || typeof config !== 'object') {
            throw new Error('Config should be an object');
        }
        if (!config.braveSearch || !config.newsAPI || !config.newsdataIO) {
            throw new Error('Config should contain all API configurations');
        }
    });

    // Test 2: Logger functionality
    await runner.test('Logger Functionality', async () => {
        Logger.info('Test log message');
        Logger.warn('Test warning message');
        Logger.error('Test error message');
        // If we reach here without throwing, logger is working
    });

    // Test 3: Retry utility
    await runner.test('Retry Utility', async () => {
        let attempts = 0;
        const result = await RetryUtility.withRetry(async () => {
            attempts++;
            if (attempts < 2) {
                throw new Error('Simulated failure');
            }
            return 'success';
        }, 3);
        
        if (result !== 'success' || attempts !== 2) {
            throw new Error('Retry utility did not work as expected');
        }
    });

    // Test 4: BraveSearch function (with invalid API key - should fail gracefully)
    await runner.test('BraveSearch Error Handling', async () => {
        const result = await researcher.braveSearch('test query');
        if (result.success === true && !researcher.config.braveSearch.apiKey) {
            throw new Error('Should fail with empty API key');
        }
        if (!result.hasOwnProperty('success')) {
            throw new Error('Result should have success property');
        }
        if (!result.hasOwnProperty('source')) {
            throw new Error('Result should have source property');
        }
    });

    // Test 5: NewsAPI function (with invalid API key - should fail gracefully)
    await runner.test('NewsAPI Error Handling', async () => {
        const result = await researcher.newsAPI('test query');
        if (result.success === true && !researcher.config.newsAPI.apiKey) {
            throw new Error('Should fail with empty API key');
        }
        if (!result.hasOwnProperty('success')) {
            throw new Error('Result should have success property');
        }
        if (!result.hasOwnProperty('source')) {
            throw new Error('Result should have source property');
        }
    });

    // Test 6: NewsdataFallback function (with invalid API key - should fail gracefully)
    await runner.test('NewsdataFallback Error Handling', async () => {
        const result = await researcher.newsdataFallback('test query');
        if (result.success === true && !researcher.config.newsdataIO.apiKey) {
            throw new Error('Should fail with empty API key');
        }
        if (!result.hasOwnProperty('success')) {
            throw new Error('Result should have success property');
        }
        if (!result.hasOwnProperty('source')) {
            throw new Error('Result should have source property');
        }
    });

    // Test 7: Input validation
    await runner.test('Input Validation', async () => {
        // Test empty query
        const result1 = await researcher.braveSearch('');
        if (result1.success === true) {
            throw new Error('Should fail with empty query');
        }

        // Test null query
        const result2 = await researcher.newsAPI(null);
        if (result2.success === true) {
            throw new Error('Should fail with null query');
        }

        // Test undefined query
        const result3 = await researcher.newsdataFallback(undefined);
        if (result3.success === true) {
            throw new Error('Should fail with undefined query');
        }
    });

    // Test 8: Comprehensive search
    await runner.test('Comprehensive Search', async () => {
        const result = await researcher.comprehensiveSearch('test query');
        if (!result.hasOwnProperty('query')) {
            throw new Error('Result should have query property');
        }
        if (!result.hasOwnProperty('sources')) {
            throw new Error('Result should have sources property');
        }
        if (!result.hasOwnProperty('errors')) {
            throw new Error('Result should have errors property');
        }
        if (!result.hasOwnProperty('totalResults')) {
            throw new Error('Result should have totalResults property');
        }
    });

    // Test 9: Results summary generation
    await runner.test('Results Summary Generation', async () => {
        const mockResults = {
            query: 'test',
            timestamp: new Date().toISOString(),
            totalResults: 1,
            sources: {
                braveSearch: {
                    resultsCount: 1,
                    results: [{
                        title: 'Test Title',
                        url: 'https://example.com',
                        description: 'Test description'
                    }]
                }
            },
            errors: []
        };
        
        const summary = researcher.generateResultsSummary(mockResults);
        if (!summary || typeof summary !== 'string') {
            throw new Error('Summary should be a non-empty string');
        }
        if (!summary.includes('Test Title')) {
            throw new Error('Summary should include result titles');
        }
    });

    runner.summary();
}

// Run tests if called directly
if (require.main === module) {
    console.log('🚀 Starting Deep Research Multi-APIs Tests\n');
    runTests().catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}