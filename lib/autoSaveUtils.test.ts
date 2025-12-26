/**
 * Auto-Save Utilities Tests
 * Run these tests to verify auto-save functionality
 */

import {
  validateAutoSaveData,
  safeParseJSON,
  safeStringifyJSON,
  isLocalStorageAvailable,
  sanitizeFormData,
  getDataSize,
  isDataSizeSafe,
  checkBrowserCompatibility,
  clearAllAutoSaveData,
  getAllAutoSaveEntries,
} from './autoSaveUtils';

// Test utilities
const assert = (condition: boolean, message: string) => {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    return false;
  }
  console.log(`✅ PASSED: ${message}`);
  return true;
};

// Run all tests
export const runAutoSaveTests = () => {
  console.log('🧪 Running Auto-Save Tests...\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: validateAutoSaveData
  const validData = {
    sessionId: 'test123',
    timestamp: Date.now(),
    data: { name: 'Test' },
  };
  
  if (assert(validateAutoSaveData(validData), 'validateAutoSaveData - valid data')) {
    passed++;
  } else {
    failed++;
  }

  const invalidData = { name: 'Test' };
  if (assert(!validateAutoSaveData(invalidData), 'validateAutoSaveData - invalid data')) {
    passed++;
  } else {
    failed++;
  }

  // Test 2: safeParseJSON
  const jsonString = '{"name":"Test"}';
  const parsed = safeParseJSON(jsonString);
  if (assert(parsed?.name === 'Test', 'safeParseJSON - valid JSON')) {
    passed++;
  } else {
    failed++;
  }

  const invalidJSON = '{invalid}';
  if (assert(safeParseJSON(invalidJSON) === null, 'safeParseJSON - invalid JSON')) {
    passed++;
  } else {
    failed++;
  }

  // Test 3: safeStringifyJSON
  const obj = { name: 'Test', age: 30 };
  const stringified = safeStringifyJSON(obj);
  if (assert(stringified === '{"name":"Test","age":30}', 'safeStringifyJSON - valid object')) {
    passed++;
  } else {
    failed++;
  }

  // Test 4: isLocalStorageAvailable
  if (typeof window !== 'undefined') {
    if (assert(isLocalStorageAvailable() === true, 'isLocalStorageAvailable - available')) {
      passed++;
    } else {
      failed++;
    }
  } else {
    console.log('⚠️  SKIPPED: isLocalStorageAvailable (server-side)');
  }

  // Test 5: sanitizeFormData
  const dangerousData = {
    name: 'Test<script>alert("XSS")</script>',
    email: 'test@test.com',
    description: 'Normal text with javascript:void(0) link',
  };
  
  const sanitized = sanitizeFormData(dangerousData);
  const hasNoScript = !sanitized.name.includes('<script>');
  const hasNoJavascript = !sanitized.description.includes('javascript:');
  
  if (assert(hasNoScript && hasNoJavascript, 'sanitizeFormData - removes dangerous content')) {
    passed++;
  } else {
    failed++;
  }

  // Test 6: getDataSize
  const testData = { name: 'Test', value: 123 };
  const size = getDataSize(testData);
  if (assert(size > 0, 'getDataSize - returns size in bytes')) {
    passed++;
  } else {
    failed++;
  }

  // Test 7: isDataSizeSafe
  const smallData = { name: 'Test' };
  const largeData = { data: 'x'.repeat(1000000) }; // 1MB of data
  
  if (assert(isDataSizeSafe(smallData), 'isDataSizeSafe - small data is safe')) {
    passed++;
  } else {
    failed++;
  }
  
  if (assert(!isDataSizeSafe(largeData), 'isDataSizeSafe - large data is unsafe')) {
    passed++;
  } else {
    failed++;
  }

  // Test 8: checkBrowserCompatibility
  const compat = checkBrowserCompatibility();
  if (assert(typeof compat.compatible === 'boolean', 'checkBrowserCompatibility - returns compatibility')) {
    passed++;
  } else {
    failed++;
  }

  if (assert(
    typeof compat.features.localStorage === 'boolean' &&
    typeof compat.features.sessionStorage === 'boolean' &&
    typeof compat.features.beforeUnload === 'boolean',
    'checkBrowserCompatibility - returns all features'
  )) {
    passed++;
  } else {
    failed++;
  }

  // Test 9: clearAllAutoSaveData and getAllAutoSaveEntries
  if (typeof window !== 'undefined' && isLocalStorageAvailable()) {
    // Save test data
    localStorage.setItem('record_form_test1', JSON.stringify({ data: 'test1' }));
    localStorage.setItem('record_form_test2', JSON.stringify({ data: 'test2' }));
    localStorage.setItem('other_key', JSON.stringify({ data: 'other' }));

    const entries = getAllAutoSaveEntries('record_form');
    if (assert(Object.keys(entries).length >= 2, 'getAllAutoSaveEntries - finds entries')) {
      passed++;
    } else {
      failed++;
    }

    clearAllAutoSaveData('record_form');
    const entriesAfterClear = getAllAutoSaveEntries('record_form');
    
    if (assert(Object.keys(entriesAfterClear).length === 0, 'clearAllAutoSaveData - clears entries')) {
      passed++;
    } else {
      failed++;
    }

    // Clean up
    localStorage.removeItem('other_key');
  } else {
    console.log('⚠️  SKIPPED: clearAllAutoSaveData tests (server-side or no localStorage)');
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  return { passed, failed, total: passed + failed };
};

// Auto-run tests if called directly (for Node.js testing)
if (typeof window !== 'undefined') {
  // Make available globally for browser console testing
  (window as any).runAutoSaveTests = runAutoSaveTests;
}

// Export for use in test files
export default runAutoSaveTests;
