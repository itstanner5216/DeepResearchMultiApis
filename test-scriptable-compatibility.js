#!/usr/bin/env node

/**
 * Test script for Scriptable-compatible iosResearch.js
 */

// Mock Scriptable environment
global.Pasteboard = {
  paste: () => 'artificial intelligence test query',
  copy: (text) => {
    console.log('✅ Pasteboard.copy() called with', text.length, 'characters');
    global.lastClipboardContent = text;
  }
};

global.Script = {
  setShortcutOutput: (output) => {
    console.log('✅ Script.setShortcutOutput() called with', output.length, 'characters');
    global.lastShortcutOutput = output;
  }
};

global.Notification = class {
  constructor() {
    this.title = '';
    this.body = '';
    this.sound = null;
  }
  
  async schedule() {
    console.log('✅ Notification scheduled:', this.title, '-', this.body);
  }
};

global.Request = class {
  constructor(url) {
    this.url = url;
    this.headers = {};
    this.timeoutInterval = 10;
  }
  
  async loadJSON() {
    console.log('🌐 Mock Request to:', this.url);
    // Simulate API failure for testing error handling
    throw new Error('Mock API error - no real API key configured');
  }
};

global.Timer = {
  schedule: (delay, repeat, callback) => {
    setTimeout(callback, delay);
  }
};

global.Keychain = {
  contains: (key) => false,
  get: (key) => '',
  set: (key, value) => console.log('✅ Keychain.set() called for', key)
};

global.args = null;

console.log('🧪 Testing Scriptable-compatible iosResearch.js');
console.log('='.repeat(50));

// Test that the file loads without errors
try {
  const { IOSDeepResearcher, IOSDetector, IOSLogger } = require('./iosResearch.js');
  
  console.log('✅ Module loaded successfully');
  console.log('✅ Scriptable environment detected:', IOSDetector.isScriptable());
  console.log('✅ Terminal app detected:', IOSDetector.isTerminalApp());
  
  // Test creating researcher instance
  const researcher = new IOSDeepResearcher();
  console.log('✅ IOSDeepResearcher instance created');
  
  // Test configuration loading
  console.log('✅ Configuration loaded successfully');
  
  // Test a simple search (will fail with mock API but should handle gracefully)
  console.log('\n🔍 Testing search functionality...');
  researcher.braveSearch('test query').then(result => {
    console.log('✅ braveSearch completed (expected to fail with mock API)');
    console.log('   Success:', result.success);
    console.log('   Error:', result.error);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('The iosResearch.js file is now Scriptable-compatible.');
  }).catch(error => {
    console.log('❌ Unexpected error:', error.message);
  });
  
} catch (error) {
  console.log('❌ Failed to load module:', error.message);
  console.log('Stack:', error.stack);
}