/**
 * Global search functionality for FemTechURLs
 * This module provides search capabilities across all pages
 */

// Store for news items from all pages
let globalNewsItems = [];

/**
 * Add news items to the global search index
 * @param {Array} items - Array of news items to add
 */
export function addItemsToGlobalSearch(items) {
  if (!Array.isArray(items)) return;
  
  // Add only if not already in the global store (prevent duplicates)
  items.forEach(item => {
    const exists = globalNewsItems.some(existing => 
      existing.link === item.link || existing.title === item.title
    );
    
    if (!exists) {
      globalNewsItems.push(item);
    }
  });
}

/**
 * Search across all indexed news items
 * @param {string} query - Search query
 * @param {Object} options - Search options (limit, category, source)
 * @returns {Array} - Array of matching news items
 */
export function search(query, options = {}) {
  const { limit = 10, category = null, source = null } = options;
  
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase().trim();
  
  // Filter items based on query, category, and source
  const results = globalNewsItems.filter(item => {
    const titleMatch = item.title?.toLowerCase().includes(lowerQuery);
    const descMatch = item.description?.toLowerCase().includes(lowerQuery);
    const sourceMatch = !source || item.sourceName === source;
    const categoryMatch = !category || item.category === category;
    
    return (titleMatch || descMatch) && sourceMatch && categoryMatch;
  });
  
  // Sort by relevance (title matches are more relevant than description matches)
  results.sort((a, b) => {
    const aTitleMatch = a.title?.toLowerCase().includes(lowerQuery);
    const bTitleMatch = b.title?.toLowerCase().includes(lowerQuery);
    
    // Sort by title match first
    if (aTitleMatch && !bTitleMatch) return -1;
    if (!aTitleMatch && bTitleMatch) return 1;
    
    // If both match title or both don't match title, sort by date
    const aDate = new Date(a.date);
    const bDate = new Date(b.date);
    return bDate.getTime() - aDate.getTime(); // Newer first
  });
  
  // Return limited results
  return results.slice(0, limit);
}

/**
 * Search across all indexed news items - compatible with the TypeScript version
 * @param {string} query - Search query
 * @param {Object} options - Search options (limit, category, source)
 * @returns {Array} - Array of matching news items
 */
export function searchNews(query, options = {}) {
  const { limit = 50, category = null, source = null } = options;
  
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase().trim();
  
  // Filter items based on query, category, and source
  const results = globalNewsItems.filter(item => {
    const titleMatch = item.title?.toLowerCase().includes(lowerQuery);
    const descMatch = item.description?.toLowerCase().includes(lowerQuery);
    const sourceMatch = !source || item.sourceName === source;
    const categoryMatch = !category || item.category === category;
    
    return (titleMatch || descMatch) && sourceMatch && categoryMatch;
  });
  
  // Sort by relevance (title matches are more relevant than description matches)
  results.sort((a, b) => {
    const aTitleMatch = a.title?.toLowerCase().includes(lowerQuery);
    const bTitleMatch = b.title?.toLowerCase().includes(lowerQuery);
    
    // Sort by title match first
    if (aTitleMatch && !bTitleMatch) return -1;
    if (!aTitleMatch && bTitleMatch) return 1;
    
    // If both match title or both don't match title, sort by date
    const aDate = new Date(a.date);
    const bDate = new Date(b.date);
    return bDate.getTime() - aDate.getTime(); // Newer first
  });
  
  // Return results
  return results;
}

/**
 * Initialize global search from current page items
 */
export async function initGlobalSearch() {
  // Try to get news items from the page
  const newsItems = [];
  
  // Extract from article cards
  document.querySelectorAll('.article-card, [data-source]').forEach(card => {
    try {
      const title = card.querySelector('h3')?.textContent || '';
      const description = card.querySelector('p')?.textContent || '';
      const link = card.querySelector('a')?.href || '';
      const sourceElement = card.querySelector('.text-purple-600, .text-purple-700');
      const sourceName = sourceElement?.textContent || card.getAttribute('data-source') || '';
      
      // Skip empty items
      if (!title || !link) return;
      
      // Try to find category from section or parent elements
      let category = '';
      const section = card.closest('section');
      if (section) {
        const sectionTitle = section.querySelector('h2')?.textContent || '';
        // Check common categories
        const categories = [
          'FemTech News & Innovation',
          'Reproductive & Maternal Health',
          'Women\'s Health & Wellness'
        ];
        
        if (categories.includes(sectionTitle)) {
          category = sectionTitle;
        }
      }
      
      // Create news item object
      const newsItem = {
        title,
        description,
        link,
        sourceName,
        category,
        date: new Date()  // Use current date as fallback
      };
      
      newsItems.push(newsItem);
    } catch (error) {
      console.error('Error extracting article data:', error);
    }
  });
  
  // Add items to global search
  addItemsToGlobalSearch(newsItems);
  
  // Initialize search input functionality on the page
  initSearchInput();
}

/**
 * Initialize the search data
 */
export async function initializeSearch() {
  try {
    // In a real implementation, you'd fetch data here
    // For now, just initialize with page content
    await initGlobalSearch();
    return true;
  } catch (error) {
    console.error('Error initializing global search:', error);
    return false;
  }
}

/**
 * Set up search input functionality
 */
function initSearchInput() {
  const searchInput = document.getElementById('search-input');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  
  if (searchInput) {
    searchInput.addEventListener('input', handleSearchInput);
  }
  
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', handleSearchInput);
  }
}

/**
 * Handle search input events
 * @param {Event} event - Input event
 */
function handleSearchInput(event) {
  const query = event.target.value;
  
  // Sync the other search input if it exists
  const isDesktop = event.target.id === 'search-input';
  const otherInput = isDesktop 
    ? document.getElementById('mobile-search-input')
    : document.getElementById('search-input');
  
  if (otherInput) {
    otherInput.value = query;
  }
  
  // Perform search
  performSearch(query);
}

/**
 * Perform search and display results on the current page
 * @param {string} query - Search query
 */
function performSearch(query) {
  const articles = document.querySelectorAll('.article-card, [data-source]');
  const sections = document.querySelectorAll('section');
  const value = query.toLowerCase().trim();
  
  // If query is empty, show all articles
  if (!value) {
    articles.forEach(article => article.classList.remove('hidden'));
    sections.forEach(section => section.classList.remove('hidden'));
    return;
  }
  
  // Filter articles on current page
  sections.forEach(section => {
    let hasVisibleArticles = false;
    const sectionArticles = section.querySelectorAll('.article-card, [data-source]');
    
    sectionArticles.forEach(article => {
      const title = article.querySelector('h3')?.textContent?.toLowerCase() || '';
      const description = article.querySelector('p')?.textContent?.toLowerCase() || '';
      
      if (title.includes(value) || description.includes(value)) {
        article.classList.remove('hidden');
        hasVisibleArticles = true;
      } else {
        article.classList.add('hidden');
      }
    });
    
    if (hasVisibleArticles) {
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  });
}

// Initialize search when the page loads
document.addEventListener('DOMContentLoaded', initGlobalSearch);
