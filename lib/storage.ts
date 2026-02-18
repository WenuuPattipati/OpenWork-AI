/**
 * Local Storage Utility with 1-hour expiration
 * Stores conversations, favorites, and collections
 */

export interface StoredConversation {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    imageUrls?: string[]; // base64 image data (uploaded by user)
    visualFindings?: Array<{
      finding: string;
      severity: 'critical' | 'moderate' | 'mild';
      coordinates: [number, number, number, number];
      label: string;
      fileIndex?: number;
    }>; // AI-detected findings with coordinates
    medicalImages?: Array<{
      url: string;
      title: string;
      source: string;
      license: string;
      thumbnail?: string;
      description?: string;
    }>; // fetched educational images
  }>;
  mode: 'doctor' | 'general';
  expiresAt: number; // Unix timestamp
}

export interface StoredCollection {
  id: string;
  name: string;
  description: string;
  conversationIds: string[];
  createdAt: Date;
  expiresAt: number;
}

export interface StoredFavorite {
  id: string;
  conversationId: string;
  title: string;
  preview: string;
  timestamp: Date;
  expiresAt: number;
}

const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

// Storage keys
const CONVERSATIONS_KEY = 'openwork_conversations';
const FAVORITES_KEY = 'openwork_favorites';
const COLLECTIONS_KEY = 'openwork_collections';

/**
 * Get current timestamp + 1 hour
 */
function getExpirationTime(): number {
  return Date.now() + ONE_HOUR;
}

/**
 * Check if item has expired
 */
function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

/**
 * Clean expired items from array
 */
function cleanExpired<T extends { expiresAt: number }>(items: T[]): T[] {
  return items.filter(item => !isExpired(item.expiresAt));
}

// ============ CONVERSATIONS ============

export function saveConversation(conversation: Omit<StoredConversation, 'expiresAt'>): void {
  try {
    const conversations = getConversations();
    const newConversation: StoredConversation = {
      ...conversation,
      expiresAt: getExpirationTime()
    };
    
    // Update if exists, otherwise add
    const index = conversations.findIndex(c => c.id === conversation.id);
    if (index >= 0) {
      conversations[index] = newConversation;
    } else {
      conversations.unshift(newConversation); // Add to beginning
    }
    
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}

export function getConversations(): StoredConversation[] {
  try {
    const stored = localStorage.getItem(CONVERSATIONS_KEY);
    if (!stored) return [];
    
    const conversations: StoredConversation[] = JSON.parse(stored);
    const cleaned = cleanExpired(conversations);
    
    // Save cleaned list back
    if (cleaned.length !== conversations.length) {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(cleaned));
    }
    
    return cleaned;
  } catch (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
}

export function getConversationById(id: string): StoredConversation | null {
  const conversations = getConversations();
  return conversations.find(c => c.id === id) || null;
}

export function deleteConversation(id: string): void {
  try {
    const conversations = getConversations();
    const filtered = conversations.filter(c => c.id !== id);
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting conversation:', error);
  }
}

// ============ FAVORITES ============

export function saveFavorite(favorite: Omit<StoredFavorite, 'expiresAt'>): void {
  try {
    const favorites = getFavorites();
    
    // Check if already favorited
    if (favorites.some(f => f.conversationId === favorite.conversationId)) {
      return; // Already favorited
    }
    
    const newFavorite: StoredFavorite = {
      ...favorite,
      expiresAt: getExpirationTime()
    };
    
    favorites.unshift(newFavorite);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving favorite:', error);
  }
}

export function getFavorites(): StoredFavorite[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) return [];
    
    const favorites: StoredFavorite[] = JSON.parse(stored);
    const cleaned = cleanExpired(favorites);
    
    if (cleaned.length !== favorites.length) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(cleaned));
    }
    
    return cleaned;
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
}

export function removeFavorite(conversationId: string): void {
  try {
    const favorites = getFavorites();
    const filtered = favorites.filter(f => f.conversationId !== conversationId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
}

export function isFavorited(conversationId: string): boolean {
  const favorites = getFavorites();
  return favorites.some(f => f.conversationId === conversationId);
}

// ============ COLLECTIONS ============

export function saveCollection(collection: Omit<StoredCollection, 'expiresAt'>): void {
  try {
    const collections = getCollections();
    const newCollection: StoredCollection = {
      ...collection,
      expiresAt: getExpirationTime()
    };
    
    const index = collections.findIndex(c => c.id === collection.id);
    if (index >= 0) {
      collections[index] = newCollection;
    } else {
      collections.push(newCollection);
    }
    
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  } catch (error) {
    console.error('Error saving collection:', error);
  }
}

export function getCollections(): StoredCollection[] {
  try {
    const stored = localStorage.getItem(COLLECTIONS_KEY);
    if (!stored) return [];
    
    const collections: StoredCollection[] = JSON.parse(stored);
    const cleaned = cleanExpired(collections);
    
    if (cleaned.length !== collections.length) {
      localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(cleaned));
    }
    
    return cleaned;
  } catch (error) {
    console.error('Error getting collections:', error);
    return [];
  }
}

export function addToCollection(collectionId: string, conversationId: string): void {
  try {
    const collections = getCollections();
    const collection = collections.find(c => c.id === collectionId);
    
    if (collection && !collection.conversationIds.includes(conversationId)) {
      collection.conversationIds.push(conversationId);
      collection.expiresAt = getExpirationTime(); // Refresh expiration
      localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
    }
  } catch (error) {
    console.error('Error adding to collection:', error);
  }
}

export function removeFromCollection(collectionId: string, conversationId: string): void {
  try {
    const collections = getCollections();
    const collection = collections.find(c => c.id === collectionId);
    
    if (collection) {
      collection.conversationIds = collection.conversationIds.filter(id => id !== conversationId);
      localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
    }
  } catch (error) {
    console.error('Error removing from collection:', error);
  }
}

export function deleteCollection(id: string): void {
  try {
    const collections = getCollections();
    const filtered = collections.filter(c => c.id !== id);
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting collection:', error);
  }
}

// ============ UTILITY ============

/**
 * Clear all expired data
 */
export function clearExpiredData(): void {
  getConversations(); // This will auto-clean
  getFavorites(); // This will auto-clean
  getCollections(); // This will auto-clean
}

/**
 * Clear all data (for testing/reset)
 */
export function clearAllData(): void {
  localStorage.removeItem(CONVERSATIONS_KEY);
  localStorage.removeItem(FAVORITES_KEY);
  localStorage.removeItem(COLLECTIONS_KEY);
}
