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
        let logCount = 0;
        let warnCount = 0;
        let errorCount = 0;

        const origLog = console.log;
        const origWarn = console.warn;
        const origError = console.error;

        console.log = () => { logCount++; };
        console.warn = () => { warnCount++; };
        console.error = () => { errorCount++; };

        try {
            Logger.info('Test log message');
            Logger.warn('Test warning message');
            Logger.error('Test error message');
        } finally {
            console.log = origLog;
            console.warn = origWarn;
            console.error = origError;
        }

        if (logCount !== 1) {
            throw new Error('Logger.info should call console.log once');
        }
        if (warnCount !== 1) {
            throw new Error('Logger.warn should call console.warn once');
        }
        if (errorCount !== 1) {
            throw new Error('Logger.error should call console.error once');
        }
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
        if (!researcher.config.braveSearch.apiKey) {
            if (result.success !== false) {
                throw new Error('Result.success should be false when API key is missing');
            }
            if (!result.error) {
                throw new Error('Result should include error when API key is missing');
            }
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
        if (!researcher.config.newsAPI.apiKey) {
            if (result.success !== false) {
                throw new Error('Result.success should be false when API key is missing');
            }
            if (!result.error) {
                throw new Error('Result should include error when API key is missing');
            }
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
        if (!researcher.config.newsdataIO.apiKey) {
            if (result.success !== false) {
                throw new Error('Result.success should be false when API key is missing');
            }
            if (!result.error) {
                throw new Error('Result should include error when API key is missing');
            }
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

    // Test 8: Newsdata response normalization
    await runner.test('Newsdata Response Normalization', async () => {
        const mockData = {
            results: [
                {
                    title: 'Example',
                    link: 'https://example.com',
                    description: 'desc',
                    content: 'content',
                    creator: ['A', 'B'],
                    source_id: 'source',
                    pubDate: '2024-01-01',
                    image_url: 'img',
                    category: ['tech', 'ai'],
                    country: ['us', 'gb'],
                    language: 'en'
                }
            ]
        };
        const normalized = researcher.processNewsdataResponse(mockData);
        if (normalized[0].creator !== 'A, B') {
            throw new Error('Creator array not normalized');
        }
        if (normalized[0].category !== 'tech, ai') {
            throw new Error('Category array not normalized');
        }
        if (normalized[0].country !== 'us, gb') {
            throw new Error('Country array not normalized');
        }
    });

    // Test 9: Comprehensive search
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

    // Test 10: Results summary generation
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

    await runner.test('Summary Results Limit', async () => {
        const limitedResearcher = new DeepResearcher({ summaryResultsLimit: 3 });
        const mockResults = {
            query: 'limit test',
            timestamp: new Date().toISOString(),
            totalResults: 5,
            sources: {
                testapi: {
                    resultsCount: 5,
                    results: [
                        { title: 'Title1', url: 'https://1.com', description: 'd1' },
                        { title: 'Title2', url: 'https://2.com', description: 'd2' },
                        { title: 'Title3', url: 'https://3.com', description: 'd3' },
                        { title: 'Title4', url: 'https://4.com', description: 'd4' },
                        { title: 'Title5', url: 'https://5.com', description: 'd5' }
                    ]
                }
            },
            errors: []
        };

        const summary = limitedResearcher.generateResultsSummary(mockResults);
        if (!summary.includes('Title3') || summary.includes('Title4')) {
            throw new Error('Summary results limit not applied correctly');
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