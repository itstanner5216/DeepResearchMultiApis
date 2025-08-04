#!/usr/bin/env node

/**
 * iOS Shortcuts Wrapper for Deep Research
 * Specifically designed for iOS Shortcuts app integration
 * Simplified entry point with clipboard-to-clipboard workflow
 */

const { IOSDeepResearcher, IOSLogger } = require('./iosResearch');

async function shortcutsMain() {
    // Set iOS shortcuts mode
    process.env.IOS_SHORTCUTS_MODE = 'true';
    
    try {
        IOSLogger.info('🚀 iOS Shortcuts Deep Research starting...');
        
        const researcher = new IOSDeepResearcher();
        
        // Always use clipboard workflow for shortcuts
        const result = await researcher.iosClipboardWorkflow();
        
        if (result.success) {
            // Output success message for shortcuts
            console.log('✅ DEEP RESEARCH COMPLETE');
            console.log(`🔍 Query: "${result.query}"`);
            console.log(`📊 Total Results: ${result.results.totalResults}`);
            console.log('📋 Results copied to clipboard');
            
            // Return success code
            process.exit(0);
        } else {
            console.log('❌ DEEP RESEARCH FAILED');
            console.log('Check your API keys and network connection');
            process.exit(1);
        }
        
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        
        // Try to provide helpful error messages for common iOS issues
        if (error.message.includes('clipboard')) {
            console.log('💡 Tip: Make sure to allow clipboard access in iOS Shortcuts');
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
            console.log('💡 Tip: Check your internet connection and try again');
        } else if (error.message.includes('API key')) {
            console.log('💡 Tip: Configure your API keys in the .env file');
        }
        
        process.exit(1);
    }
}

// Run the shortcuts main function
shortcutsMain();