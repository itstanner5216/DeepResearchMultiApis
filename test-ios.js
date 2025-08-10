#!/usr/bin/env node

/**
 * iOS-specific tests for Deep Research Multi-APIs
 * Tests iOS compatibility and clipboard functionality
 */

const { 
    IOSDeepResearcher, 
    IOSLogger, 
    IOSDetector, 
    IOSConfigManager 
} = require('./iosResearch');

class IOSTestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    async runTest(name, testFunction) {
        try {
            console.log(`\n🧪 Testing: ${name}`);
            await testFunction();
            console.log(`✅ PASSED: ${name}`);
            this.passed++;
        } catch (error) {
            console.log(`❌ FAILED: ${name}`);
            console.log(`   Error: ${error.message}`);
            this.failed++;
        }
    }

    async runAllTests() {
        console.log('🚀 Starting iOS Deep Research Tests\n');
        console.log('=' .repeat(50));

        // Test iOS Detection
        await this.runTest('iOS Environment Detection', () => {
            const isIOS = IOSDetector.isIOS();
            console.log(`   iOS detected: ${isIOS}`);
            console.log(`   Platform: ${process.platform}`);
            console.log(`   Shell: ${process.env.SHELL || 'undefined'}`);
            console.log(`   Term: ${process.env.TERM || 'undefined'}`);
            // This test always passes as it's just checking detection
        });

        // Simulated detection for a-Shell environment
        await this.runTest('a-Shell Detection', () => {
            const originalShell = process.env.SHELL;
            const originalTerm = process.env.TERM;
            const originalProgram = process.env.TERM_PROGRAM;

            process.env.SHELL = '/bin/ash';
            process.env.TERM = 'xterm-256color';
            process.env.TERM_PROGRAM = 'a-Shell';

            const detected = IOSDetector.isIOS();

            process.env.SHELL = originalShell;
            process.env.TERM = originalTerm;
            process.env.TERM_PROGRAM = originalProgram;

            if (!detected) {
                throw new Error('Failed to detect a-Shell environment');
            }
        });

        // Simulated detection for iSH environment
        await this.runTest('iSH Detection', () => {
            const originalShell = process.env.SHELL;
            const originalTerm = process.env.TERM;
            const originalProgram = process.env.TERM_PROGRAM;

            process.env.SHELL = '/bin/ash';
            process.env.TERM = 'xterm-256color';
            process.env.TERM_PROGRAM = 'iSH';

            const detected = IOSDetector.isIOS();

            process.env.SHELL = originalShell;
            process.env.TERM = originalTerm;
            process.env.TERM_PROGRAM = originalProgram;

            if (!detected) {
                throw new Error('Failed to detect iSH environment');
            }
        });

        // Test iOS Path Resolution
        await this.runTest('iOS Path Resolution', () => {
            const configPath = IOSDetector.getIOSCompatiblePath('config.json');
            const logPath = IOSDetector.getIOSCompatiblePath('research.log');
            
            console.log(`   Config path: ${configPath}`);
            console.log(`   Log path: ${logPath}`);
            
            if (!configPath || !logPath) {
                throw new Error('Path resolution failed');
            }
        });

        // Test Configuration Loading
        await this.runTest('iOS Configuration Loading', () => {
            const config = IOSConfigManager.loadConfig();
            
            if (!config || typeof config !== 'object') {
                throw new Error('Configuration loading failed');
            }
            
            if (!config.braveSearch || !config.newsAPI || !config.newsdataIO) {
                throw new Error('Missing API configurations');
            }
            
            console.log(`   Loaded ${Object.keys(config).length} API configurations`);
        });

        // Test Logger
        await this.runTest('iOS Logger', () => {
            IOSLogger.info('Test info message');
            IOSLogger.warn('Test warning message');  
            IOSLogger.debug('Test debug message');
            
            // Test error logging
            const testError = new Error('Test error');
            IOSLogger.error('Test error message', testError);
            
            console.log('   Logger test completed successfully');
        });

        // Test Researcher Initialization
        await this.runTest('iOS Researcher Initialization', () => {
            const researcher = new IOSDeepResearcher();
            
            if (!researcher.config) {
                throw new Error('Researcher initialization failed - no config');
            }
            
            if (typeof researcher.isIOS !== 'boolean') {
                throw new Error('iOS detection not set properly');
            }
            
            console.log(`   Researcher initialized (iOS mode: ${researcher.isIOS})`);
        });

        // Test Input Validation
        await this.runTest('Input Validation', async () => {
            const researcher = new IOSDeepResearcher();
            
            // Test empty query
            const emptyResult = await researcher.braveSearch('');
            if (emptyResult.success !== false) {
                throw new Error('Empty query validation failed');
            }
            
            // Test null query  
            const nullResult = await researcher.braveSearch(null);
            if (nullResult.success !== false) {
                throw new Error('Null query validation failed');
            }
            
            // Test whitespace query
            const spaceResult = await researcher.braveSearch('   ');
            if (spaceResult.success !== false) {
                throw new Error('Whitespace query validation failed');
            }
            
            console.log('   Input validation working correctly');
        });

        // Test API Error Handling (without actual API calls)
        await this.runTest('API Error Handling', async () => {
            const researcher = new IOSDeepResearcher();
            
            // Force API key to be empty to test error handling
            const originalBraveKey = researcher.config.braveSearch.apiKey;
            researcher.config.braveSearch.apiKey = '';
            
            const result = await researcher.braveSearch('test query');
            
            if (result.success !== false) {
                throw new Error('API key validation failed');
            }
            
            if (!result.error.includes('API key not configured')) {
                throw new Error('Expected API key error message not found');
            }
            
            // Restore original key
            researcher.config.braveSearch.apiKey = originalBraveKey;
            
            console.log('   API error handling working correctly');
        });

        // Test Response Processing
        await this.runTest('Response Processing', () => {
            const researcher = new IOSDeepResearcher();
            
            // Test Brave Search response processing
            const braveData = {
                web: {
                    results: [
                        {
                            title: 'Test Title',
                            url: 'https://example.com',
                            description: 'Test Description'
                        }
                    ]
                }
            };
            
            const braveResults = researcher.processBraveSearchResponse(braveData);
            if (braveResults.length !== 1 || braveResults[0].title !== 'Test Title') {
                throw new Error('Brave Search response processing failed');
            }
            
            // Test NewsAPI response processing
            const newsData = {
                articles: [
                    {
                        title: 'News Title',
                        url: 'https://news.example.com',
                        description: 'News Description',
                        author: 'Test Author'
                    }
                ]
            };
            
            const newsResults = researcher.processNewsAPIResponse(newsData);
            if (newsResults.length !== 1 || newsResults[0].title !== 'News Title') {
                throw new Error('NewsAPI response processing failed');
            }
            
            console.log('   Response processing working correctly');
        });

        // Test iOS Results Summary Generation
        await this.runTest('iOS Results Summary Generation', () => {
            const researcher = new IOSDeepResearcher();
            
            const testResults = {
                query: 'test query',
                timestamp: new Date().toISOString(),
                totalResults: 2,
                sources: {
                    braveSearch: {
                        resultsCount: 1,
                        results: [{
                            title: 'Test Result',
                            url: 'https://example.com',
                            description: 'Test description'
                        }]
                    }
                },
                errors: [
                    { api: 'newsAPI', error: 'Test error' }
                ]
            };
            
            const summary = researcher.generateIOSResultsSummary(testResults);
            
            if (!summary.includes('🔍 Deep Research Results')) {
                throw new Error('Summary missing main header');
            }
            
            if (!summary.includes('test query')) {
                throw new Error('Summary missing query');
            }
            
            if (!summary.includes('Test Result')) {
                throw new Error('Summary missing results');
            }
            
            if (!summary.includes('❌ ERRORS')) {
                throw new Error('Summary missing errors section');
            }
            
            console.log('   iOS summary generation working correctly');
        });

        // Test Clipboard Functionality (if available)
        await this.runTest('Clipboard Functionality Test', async () => {
            try {
                const clipboardy = require('node-clipboardy');
                
                // Test write
                const testContent = 'iOS Deep Research Test - ' + new Date().toISOString();
                await clipboardy.write(testContent);
                
                // Test read
                const readContent = await clipboardy.read();
                
                if (readContent !== testContent) {
                    throw new Error('Clipboard read/write mismatch');
                }
                
                console.log('   Clipboard functionality working correctly');
                
            } catch (error) {
                if (error.message.includes('mismatch')) {
                    throw error;
                }
                // If clipboard is not available, just log it
                console.log('   Clipboard not available in this environment (this is OK)');
            }
        });

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log(`📊 Test Results Summary:`);
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`📈 Success Rate: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);
        
        if (this.failed === 0) {
            console.log('\n🎉 All iOS tests passed! The script is ready for iOS use.');
        } else {
            console.log('\n⚠️ Some tests failed. Check the errors above.');
            process.exit(1);
        }
    }
}

// Run tests
async function main() {
    const testRunner = new IOSTestRunner();
    await testRunner.runAllTests();
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Test runner failed:', error.message);
        process.exit(1);
    });
}

module.exports = { IOSTestRunner };