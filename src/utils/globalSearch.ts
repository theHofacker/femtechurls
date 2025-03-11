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
  console.log(`Searching for: "${query}"`);
  
  // Make sure search is initialized
  if (!isSearchInitialized && !isSearchLoading) {
    console.log("Initializing search...");
    await initializeSearch();
  }
  
  // If still loading, return empty array
  if (isSearchLoading) {
    console.log("Search still initializing, returning empty results");
    return [];
  }
  
  // If query is empty, return all items
  if (!query || query.trim() === '') {
    console.log("Empty query, returning all items:", allNewsItems.length);
    return allNewsItems;
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  console.log(`Normalized query: "${normalizedQuery}"`);
  console.log(`Searching through ${allNewsItems.length} items`);
  
  // Sample a few items to debug
  if (allNewsItems.length > 0) {
    console.log("Sample item 1:", {
      title: allNewsItems[0].title,
      description: allNewsItems[0].description?.substring(0, 50) + "...",
      source: allNewsItems[0].sourceName
    });
  }
  
  // More thorough search algorithm
  const results = allNewsItems.filter(item => {
    // Check for matches in various fields with logging
    const titleMatch = (item.title || '').toLowerCase().includes(normalizedQuery);
    const descriptionMatch = (item.description || '').toLowerCase().includes(normalizedQuery);
    const sourceMatch = (item.sourceName || '').toLowerCase().includes(normalizedQuery);
    const categoryMatch = (item.category || '').toLowerCase().includes(normalizedQuery);
    
    // For debugging a specific search term
    if (normalizedQuery === 'cycle' && (titleMatch || descriptionMatch)) {
      console.log("Match found for 'cycle' in:", {
        title: item.title,
        matched: titleMatch ? "title" : descriptionMatch ? "description" : "other",
        source: item.sourceName
      });
    }
    
    return titleMatch || descriptionMatch || sourceMatch || categoryMatch;
  });
  
  console.log(`Found ${results.length} results for "${query}"`);
  return results;
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
