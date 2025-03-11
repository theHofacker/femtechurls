/**
 * Global search functionality for FemTechURLs
 * This module provides search capabilities across all content
 */

import { fetchAllNews } from './feedAggregator';

// Store for news items from data sources
let allNewsItems = [];
let isSearchInitialized = false;
let isSearchLoading = false;

// Store for news items extracted from the current page
let pageNewsItems = [];

/**
 * Initialize the search data by fetching from data sources
 */
export async function initializeSearch() {
  if (isSearchInitialized || isSearchLoading) return isSearchInitialized;
  
  isSearchLoading = true;
  
  try {
    // Fetch all news items from all sources
    allNewsItems = await fetchAllNews();
    isSearchInitialized = true;
    
    // Also extract items from the current page (for on-page filtering)
    if (typeof document !== 'undefined') {
      const pageItems = extractNewsItemsFromPage();
      addItemsToPageSearch(pageItems);
    }
    
    console.log(`Global search initialized with ${allNewsItems.length} news items from sources and ${pageNewsItems.length} from page`);
    return true;
  } catch (error) {
    console.error('Error initializing global search:', error);
    return false;
  } finally {
    isSearchLoading = false;
  }
}

/**
 * Add news items to the page search index
 * @param {Array} items - Array of news items to add
 */
function addItemsToPageSearch(items) {
  if (!Array.isArray(items)) return;
  
  // Add only if not already in the store (prevent duplicates)
  items.forEach(item => {
    const exists = pageNewsItems.some(existing => 
      existing.link === item.link || existing.title === item.title
    );
    
    if (!exists) {
      pageNewsItems.push(item);
    }
  });
}

/**
 * Extract news items from the current page's DOM
 * @returns {Array} - Array of news items
 */
function extractNewsItemsFromPage() {
  // Only run in browser environment
  if (typeof document === 'undefined') return [];
  
  // Try to get news items from the page
  const newsItems = [];
  
  // Extract from article cards
  document.querySelectorAll('.article-card, .bg-white').forEach(card => {
    try {
      const title = card.querySelector('h3')?.textContent || '';
      const description = card.querySelector('p')?.textContent || '';
      
      // Find the link - might be the card itself or a child element
      let link = '';
      const linkElement = card.querySelector('a');
      if (linkElement && linkElement.href) {
        link = linkElement.href;
      } else if (card.tagName === 'A' && card.href) {
        link = card.href;
      }
      
      // Find the source name
      let sourceName = '';
      const sourceElement = card.querySelector('.text-purple-600, .text-purple-400');
      if (sourceElement) {
        sourceName = sourceElement.textContent || '';
      } else {
        // Try to find from parent elements
        const sourceCard = card.closest('[data-source]');
        if (sourceCard) {
          sourceName = sourceCard.getAttribute('data-source') || '';
        }
      }
      
      // Skip empty items
      if (!title || !link) return;
      
      // Try to find category from section or parent elements
      let category = '';
      const section = card.closest('section');
      if (section) {
        const sectionTitle = section.querySelector('h2')?.textContent || '';
        if (sectionTitle) {
          category = sectionTitle;
        }
      }
      
      // Get date if available
      let date = new Date();
      const dateElement = card.querySelector('.text-gray-500');
      if (dateElement) {
        const dateText = dateElement.textContent;
        if (dateText) {
          // Try to parse the date, fallback to current date
          try {
            date = new Date(dateText);
            if (isNaN(date.getTime())) {
              date = new Date();
            }
          } catch (e) {
            date = new Date();
          }
        }
      }
      
      // Create news item object
      const newsItem = {
        title,
        description,
        link,
        sourceName,
        category,
        date
      };
      
      newsItems.push(newsItem);
    } catch (error) {
      console.error('Error extracting article data:', error);
    }
  });
  
  return newsItems;
}

/**
 * Search across all news items (both from data sources and page)
 * @param {string} query - Search query
 * @param {Object} options - Search options (limit, category, source)
 * @returns {Array} - Array of matching news items
 */
export async function searchNews(query, options = {}) {
  console.log(`Searching for: "${query}"`);
  
  const { limit = 50, category = null, source = null } = options;
  
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
  
  // If query is empty, return all items (up to limit)
  if (!query || query.trim() === '') {
    console.log("Empty query, returning all items");
    return allNewsItems.slice(0, limit);
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
  
  // Filter items based on query, category, and source
  const results = allNewsItems.filter(item => {
    // Check for matches in various fields
    const titleMatch = (item.title || '').toLowerCase().includes(normalizedQuery);
    const descriptionMatch = (item.description || '').toLowerCase().includes(normalizedQuery);
    const sourceMatch = (source === null) || (item.sourceName === source);
    const categoryMatch = (category === null) || (item.category === category);
    
    // For debugging a specific search term
    if (normalizedQuery === 'cycle' && (titleMatch || descriptionMatch)) {
      console.log("Match found for 'cycle' in:", {
        title: item.title,
        matched: titleMatch ? "title" : descriptionMatch ? "description" : "other",
        source: item.sourceName
      });
    }
    
    return (titleMatch || descriptionMatch) && sourceMatch && categoryMatch;
  });
  
  // Sort by relevance
  const sortedResults = results.sort((a, b) => {
    const aTitleMatch = (a.title || '').toLowerCase().includes(normalizedQuery);
    const bTitleMatch = (b.title || '').toLowerCase().includes(normalizedQuery);
    
    // Sort by title match first
    if (aTitleMatch && !bTitleMatch) return -1;
    if (!aTitleMatch && bTitleMatch) return 1;
    
    // If both match title or both don't match title, sort by date
    const aDate = new Date(a.date);
    const bDate = new Date(b.date);
    return bDate.getTime() - aDate.getTime(); // Newer first
  });
  
  console.log(`Found ${sortedResults.length} results for "${query}"`);
  return sortedResults.slice(0, limit);
}

/**
 * Handle global search across the current page
 * @param {string} searchQuery - Search query
 */
export function handleGlobalSearch(searchQuery) {
  // Only run in browser environment
  if (typeof document === 'undefined') return;
  
  searchQuery = searchQuery.toLowerCase().trim();
  
  // Articles can be in different structures depending on the page
  const articles = document.querySelectorAll('.article-card, .bg-white');
  const sections = document.querySelectorAll('section, .article-section');
  const sourceCards = document.querySelectorAll('.source-card');
  
  // First pass: Hide/show articles
  articles.forEach(article => {
    // Get all potential text content elements
    const title = article.querySelector('h3')?.textContent?.toLowerCase() || '';
    const description = article.querySelector('p')?.textContent?.toLowerCase() || '';
    
    // Check if the article matches the search query
    if (searchQuery === '' || title.includes(searchQuery) || description.includes(searchQuery)) {
      article.classList.remove('hidden');
    } else {
      article.classList.add('hidden');
    }
  });
  
  // Second pass: Hide/show sections based on whether they have visible articles
  sections.forEach(section => {
    const visibleArticles = section.querySelectorAll('.article-card:not(.hidden), .bg-white:not(.hidden)');
    
    if (visibleArticles.length > 0) {
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  });
  
  // Third pass: Handle source cards (if present)
  sourceCards.forEach(card => {
    const visibleArticles = card.querySelectorAll('.article-card:not(.hidden), .bg-white:not(.hidden)');
    
    if (visibleArticles.length > 0) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

/**
 * Get all news items
 */
export function getAllNewsItems() {
  return allNewsItems;
}

/**
 * Search specifically for categories
 */
export async function searchByCategory(categoryId, query) {
  if (!isSearchInitialized && !isSearchLoading) {
    await initializeSearch();
  }
  
  let filtered = allNewsItems.filter(item => item.category === categoryId);
  
  if (query && query.trim() !== '') {
    const normalizedQuery = query.toLowerCase().trim();
    filtered = filtered.filter(item => {
      const titleMatch = (item.title || '').toLowerCase().includes(normalizedQuery);
      const descriptionMatch = (item.description || '').toLowerCase().includes(normalizedQuery);
      
      return titleMatch || descriptionMatch;
    });
  }
  
  return filtered;
}

/**
 * Search specifically for sources
 */
export async function searchBySource(sourceName, query) {
  if (!isSearchInitialized && !isSearchLoading) {
    await initializeSearch();
  }
  
  let filtered = allNewsItems.filter(item => item.sourceName === sourceName);
  
  if (query && query.trim() !== '') {
    const normalizedQuery = query.toLowerCase().trim();
    filtered = filtered.filter(item => {
      const titleMatch = (item.title || '').toLowerCase().includes(normalizedQuery);
      const descriptionMatch = (item.description || '').toLowerCase().includes(normalizedQuery);
      
      return titleMatch || descriptionMatch;
    });
  }
  
  return filtered;
}

// Initialize search when the page loads in browser environment
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize search data
    initializeSearch();
    
    // Set up search input functionality
    const searchInput = document.getElementById('global-search-input');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    
    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        const query = event.target.value;
        
        // Sync with mobile input if it exists
        if (mobileSearchInput) {
          mobileSearchInput.value = query;
        }
        
        // Perform search on the current page
        handleGlobalSearch(query);
      });
    }
    
    if (mobileSearchInput) {
      mobileSearchInput.addEventListener('input', (event) => {
        const query = event.target.value;
        
        // Sync with desktop input if it exists
        if (searchInput) {
          searchInput.value = query;
        }
        
        // Perform search on the current page
        handleGlobalSearch(query);
      });
    }
    
    // Make the search function globally available
    window.performSearch = handleGlobalSearch;
  });
}
