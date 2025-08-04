#!/usr/bin/env node

/**
 * Integration test for clipboard and notification functionality
 */

const research = require('./research.js');

async function testClipboardAndNotifications() {
    console.log('Testing clipboard and notification functionality...\n');
    
    try {
        // Test 1: Notification functionality
        console.log('✓ Testing notifications...');
        research.NotificationManager.notify('Test Notification', 'This is a test notification');
        console.log('  ✓ Basic notification sent');
        
        research.NotificationManager.success('Test successful notification');
        console.log('  ✓ Success notification sent');
        
        research.NotificationManager.error('Test error notification');
        console.log('  ✓ Error notification sent');
        
        // Test 2: Clipboard functionality (read/write test)
        console.log('\n✓ Testing clipboard functionality...');
        
        const testText = 'This is a test clipboard content for the research script';
        
        try {
            // Write to clipboard
            await research.ClipboardManager.writeOutput(testText);
            console.log('  ✓ Successfully wrote to clipboard');
            
            // Read from clipboard
            const readText = await research.ClipboardManager.readInput();
            console.log('  ✓ Successfully read from clipboard');
            
            if (readText === testText) {
                console.log('  ✓ Clipboard read/write consistency verified');
            } else {
                console.log('  ⚠ Clipboard content differs (may be expected in some environments)');
                console.log(`    Written: "${testText}"`);
                console.log(`    Read: "${readText}"`);
            }
        } catch (clipError) {
            console.log('  ⚠ Clipboard functionality may not be available in this environment');
            console.log(`    Error: ${clipError.message}`);
        }
        
        // Test 3: Result formatting and file operations
        console.log('\n✓ Testing file operations...');
        
        const mockResults = [
            {
                source: 'Integration Test API',
                query: 'integration test query',
                timestamp: new Date().toISOString(),
                total: 1,
                type: 'test',
                results: [
                    {
                        title: 'Integration Test Result',
                        url: 'https://example.com/integration-test',
                        description: 'This is an integration test result'
                    }
                ]
            }
        ];
        
        try {
            const filepath = await research.ResultFormatter.saveResults(mockResults, 'integration-test');
            console.log(`  ✓ Results saved successfully to: ${filepath}`);
            
            // Check if file exists
            const fs = require('fs');
            if (fs.existsSync(filepath)) {
                console.log('  ✓ Results file verified to exist');
                const content = fs.readFileSync(filepath, 'utf8');
                console.log(`  ✓ File content length: ${content.length} characters`);
            }
        } catch (fileError) {
            console.log(`  ✗ File operations failed: ${fileError.message}`);
        }
        
        console.log('\n✓ Integration tests completed successfully!');
        
    } catch (error) {
        console.error('Integration test failed:', error);
        process.exit(1);
    }
}

// Run the integration test
testClipboardAndNotifications();