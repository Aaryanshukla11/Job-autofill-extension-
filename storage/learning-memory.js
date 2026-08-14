/**
 * Storage Abstraction Layer for Learned Mappings Memory
 * Interacts with chrome.storage.local with mock fallback for Node unit tests.
 */

import { createEmptyLearnedStore, createLearnedMapping, LEARNED_SCHEMA_VERSION } from './learning-schema.js';

let mockLearnedStore = createEmptyLearnedStore();

function isExtensionEnv() {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
}

export async function getLearnedStore() {
  if (isExtensionEnv()) {
    return new Promise(resolve => {
      chrome.storage.local.get(['learnedStore'], res => {
        const store = res.learnedStore || createEmptyLearnedStore();
        if (!store.version) store.version = LEARNED_SCHEMA_VERSION;
        if (!Array.isArray(store.mappings)) store.mappings = [];
        resolve(store);
      });
    });
  } else {
    return mockLearnedStore;
  }
}

export async function saveLearnedStore(store) {
  if (!store || typeof store !== 'object') store = createEmptyLearnedStore();
  if (!store.version) store.version = LEARNED_SCHEMA_VERSION;
  if (!Array.isArray(store.mappings)) store.mappings = [];

  if (isExtensionEnv()) {
    return new Promise(resolve => {
      chrome.storage.local.set({ learnedStore: store }, () => resolve(store));
    });
  } else {
    mockLearnedStore = store;
    return mockLearnedStore;
  }
}

export async function saveLearnedMapping(mappingInput) {
  const store = await getLearnedStore();
  const mapping = createLearnedMapping(mappingInput);

  // Check for existing mapping by id or duplicate signature + scope + domain
  const existingIdx = store.mappings.findIndex(m => 
    m.id === mapping.id ||
    (m.fieldSignature === mapping.fieldSignature && m.scope === mapping.scope && m.domain === mapping.domain)
  );

  if (existingIdx >= 0) {
    // Update existing mapping
    store.mappings[existingIdx] = {
      ...store.mappings[existingIdx],
      ...mapping,
      id: store.mappings[existingIdx].id, // preserve existing id
      updatedAt: new Date().toISOString()
    };
  } else {
    // Add new mapping
    store.mappings.push(mapping);
  }

  await saveLearnedStore(store);
  return mapping;
}

export async function deleteLearnedMapping(id) {
  const store = await getLearnedStore();
  const initialLength = store.mappings.length;
  store.mappings = store.mappings.filter(m => m.id !== id);

  if (store.mappings.length !== initialLength) {
    await saveLearnedStore(store);
    return true;
  }
  return false;
}

export async function updateLearnedMapping(id, updates = {}) {
  const store = await getLearnedStore();
  const target = store.mappings.find(m => m.id === id);

  if (target) {
    Object.assign(target, updates, { updatedAt: new Date().toISOString() });
    await saveLearnedStore(store);
    return target;
  }
  return null;
}

export async function clearAllLearnedMappings() {
  const emptyStore = createEmptyLearnedStore();
  await saveLearnedStore(emptyStore);
  return emptyStore;
}

export async function incrementMappingUsage(id) {
  const store = await getLearnedStore();
  const target = store.mappings.find(m => m.id === id);

  if (target) {
    target.usageCount = (target.usageCount || 0) + 1;
    target.updatedAt = new Date().toISOString();
    await saveLearnedStore(store);
    return target;
  }
  return null;
}
