// src/utils/globalSearch.ts
import { fetchAllNews, NewsItem } from './feedAggregator';

// Store for all news items
let allNewsItems: NewsItem[] = [];
let isSearchInitialized = false;
let isSearchLoading = false;

// Initialize the search data
export async function initializeSearch(): Promise<boolean> {
  if (isSearchInitialized || isSearchLoading) return isSearchInitialized;
  
  isSearchLoading = true;
  
  try {
    // Fetch all news items from all sources
    allNewsItems = await fetchAllNews();
    isSearchInitialized = true;
    console.log(`Global search initialized with ${allNewsItems.length} news items`);
    return true;
  } catch (error) {
    console.error('Error initializing global search:', error);
    return false;
  } finally {
    isSearchLoading = false;
  }
}

// Search function that filters news items based on query
export async function searchNews(query: string): Promise<NewsItem[]> {
  if (!isSearchInitialized && !isSearchLoading) {
    await initializeSearch();
  }
  
  // If search is still loading, return empty array
  if (isSearchLoading) return [];
  
  // If query is empty, return all items
  if (!query || query.trim() === '') return allNewsItems;
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return allNewsItems.filter(item => {
    const titleMatch = item.title.toLowerCase().includes(normalizedQuery);
    const descriptionMatch = item.description?.toLowerCase().includes(normalizedQuery);
    
    return titleMatch || descriptionMatch;
  });
}

// Get all news items (useful for direct access)
export function getAllNewsItems(): NewsItem[] {
  return allNewsItems;
}

// Search specifically for categories
export async function searchByCategory(categoryId: string, query?: string): Promise<NewsItem[]> {
  if (!isSearchInitialized && !isSearchLoading) {
    await initializeSearch();
  }
  
  let filtered = allNewsItems.filter(item => item.category === categoryId);
  
  if (query && query.trim() !== '') {
    const normalizedQuery = query.toLowerCase().trim();
    filtered = filtered.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(normalizedQuery);
      const descriptionMatch = item.description?.toLowerCase().includes(normalizedQuery);
      
      return titleMatch || descriptionMatch;
    });
  }
  
  return filtered;
}

// Search specifically for sources
export async function searchBySource(sourceName: string, query?: string): Promise<NewsItem[]> {
  if (!isSearchInitialized && !isSearchLoading) {
    await initializeSearch();
  }
  
  let filtered = allNewsItems.filter(item => item.sourceName === sourceName);
  
  if (query && query.trim() !== '') {
    const normalizedQuery = query.toLowerCase().trim();
    filtered = filtered.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(normalizedQuery);
      const descriptionMatch = item.description?.toLowerCase().includes(normalizedQuery);
      
      return titleMatch || descriptionMatch;
    });
  }
  
  return filtered;
}
