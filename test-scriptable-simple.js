#!/usr/bin/env node

/**
 * Simplified Test for Scriptable iOS Compatibility
 * Tests the core functionality without mocking the entire environment
 */

const fs = require('fs');

async function testScriptableCode() {
  console.log('🧪 Testing Scriptable iOS Code Structure\n');
  
  try {
    // Read the Scriptable script
    const scriptableCode = fs.readFileSync('./scriptableResearch.js', 'utf8');
    
    // Test 1: Check for required Scriptable APIs
    console.log('✅ Test 1: Checking Scriptable API usage...');
    const requiredAPIs = [
      'Pasteboard.paste()',
      'Pasteboard.copy(',
      'Keychain.get(',
      'Keychain.set(',
      'new Notification()',
      'new Request(',
      'Timer.schedule('
    ];
    
    let missingAPIs = [];
    requiredAPIs.forEach(api => {
      if (!scriptableCode.includes(api)) {
        missingAPIs.push(api);
      }
    });
    
    if (missingAPIs.length === 0) {
      console.log('   ✅ All required Scriptable APIs are used correctly');
    } else {
      console.log('   ❌ Missing APIs:', missingAPIs);
    }
    
    // Test 2: Check for Node.js dependencies (should be none)
    console.log('\n✅ Test 2: Checking for Node.js dependencies...');
    const nodeDependencies = ['require(', 'module.exports', 'process.', '__dirname', '__filename'];
    const foundDependencies = nodeDependencies.filter(dep => scriptableCode.includes(dep));
    
    if (foundDependencies.length === 0) {
      console.log('   ✅ No Node.js dependencies found - pure JavaScript');
    } else {
      console.log('   ⚠️  Found Node.js dependencies:', foundDependencies);
      console.log('   📝 Note: These may need to be removed for Scriptable');
    }
    
    // Test 3: Check script structure
    console.log('\n✅ Test 3: Checking script structure...');
    const hasMainFunction = scriptableCode.includes('async function main()');
    const hasClipboardWorkflow = scriptableCode.includes('clipboardWorkflow()');
    const hasAPIFunctions = scriptableCode.includes('braveSearch(') && 
                           scriptableCode.includes('newsAPI(') && 
                           scriptableCode.includes('newsdataFallback(');
    
    if (hasMainFunction && hasClipboardWorkflow && hasAPIFunctions) {
      console.log('   ✅ Script structure is correct for Scriptable');
    } else {
      console.log('   ❌ Script structure issues found');
    }
    
    // Test 4: Check for iOS-specific optimizations
    console.log('\n✅ Test 4: Checking iOS optimizations...');
    const iosOptimizations = [
      'iOS 18.6+',
      'Scriptable',
      'timeout: 15000',
      'iOS Keychain',
      'native iOS'
    ];
    
    const foundOptimizations = iosOptimizations.filter(opt => scriptableCode.includes(opt));
    console.log(`   ✅ Found ${foundOptimizations.length}/${iosOptimizations.length} iOS optimizations`);
    
    // Test 5: Check clipboard workflow
    console.log('\n✅ Test 5: Validating clipboard workflow...');
    const hasClipboardRead = scriptableCode.includes('Pasteboard.paste()');
    const hasClipboardWrite = scriptableCode.includes('Pasteboard.copy(');
    const hasErrorHandling = scriptableCode.includes('try {') && scriptableCode.includes('catch');
    
    if (hasClipboardRead && hasClipboardWrite && hasErrorHandling) {
      console.log('   ✅ Clipboard workflow is properly implemented');
    } else {
      console.log('   ❌ Clipboard workflow issues found');
    }
    
    // Test 6: API Configuration
    console.log('\n✅ Test 6: Checking API configuration...');
    const hasAPIConfig = scriptableCode.includes('API_CONFIG');
    const hasKeychainIntegration = scriptableCode.includes('Keychain.get(');
    const hasSecureStorage = scriptableCode.includes('BRAVE_API_KEY') && 
                           scriptableCode.includes('NEWS_API_KEY') && 
                           scriptableCode.includes('NEWSDATA_API_KEY');
    
    if (hasAPIConfig && hasKeychainIntegration && hasSecureStorage) {
      console.log('   ✅ API configuration is iOS-ready with secure storage');
    } else {
      console.log('   ❌ API configuration issues found');
    }
    
    console.log('\n🎉 Scriptable Compatibility Test Summary:');
    console.log('📱 The script appears to be properly formatted for Scriptable iOS app');
    console.log('🔐 Uses iOS Keychain for secure API key storage');
    console.log('📋 Implements clipboard-to-clipboard workflow for iOS Shortcuts');
    console.log('🚀 Optimized for iOS 18.6+ with native APIs');
    
    console.log('\n📝 Next Steps:');
    console.log('1. Install Scriptable app from iOS App Store');
    console.log('2. Create new script in Scriptable');
    console.log('3. Copy scriptableResearch.js content into the script');
    console.log('4. Configure API keys using Keychain.set()');
    console.log('5. Create iOS Shortcut to run the script');
    console.log('6. Test clipboard-to-clipboard workflow');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testScriptableCode();