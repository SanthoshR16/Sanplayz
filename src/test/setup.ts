import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

// Ensure global indexedDB exists in test environment
if (typeof window !== 'undefined' && !window.indexedDB) {
  // fake-indexeddb/auto sets global.indexedDB
  window.indexedDB = indexedDB;
}
