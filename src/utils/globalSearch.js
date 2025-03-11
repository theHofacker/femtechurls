/**
 * Global search functionality for FemTechURLs
 * This module provides search capabilities across the current page
 */

// Store for news items from current page
let globalNewsItems = [];

/**
 * Add news items to the search index
 * @param {Array} items - Array of news items to add
 */
function addItemsToGlobalSearch(items) {
  if (!Array.isArray(items)) return;
  
  // Add only if not already in the store (prevent duplicates)
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
function search(query, options = {}) {
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
 * Search across all indexed news items
 * @param {string} query - Search query
 * @param {Object} options - Search options (limit, category, source)
 * @returns {Array} - Array of matching news items
 */
function searchNews(query, options = {}) {
  return search(query, options);
}

/**
 * Extract news items from the current page's DOM
 * @returns {Array} - Array of news items
 */
function extractNewsItemsFromPage() {
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
 * Initialize the search data
 */
function initializeSearch() {
  // Extract news items from the page
  const newsItems = extractNewsItemsFromPage();
  
  // Add to global search
  addItemsToGlobalSearch(newsItems);
  
  return true;
}

/**
 * Get all news items (for search page)
 * @returns {Array} - Array of all news items
 */
function getAllNewsItems() {
  return globalNewsItems;
}

/**
 * Set up search input functionality
 */
function initSearchInput() {
  const searchInput = document.getElementById('global-search-input');
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
  const isDesktop = event.target.id === 'global-search-input';
  const otherInput = isDesktop 
    ? document.getElementById('mobile-search-input')
    : document.getElementById('global-search-input');
  
  if (otherInput) {
    otherInput.value = query;
  }
  
  // Perform search on the current page
  handleGlobalSearch(query);
}

/**
 * Handle global search across the site
 * @param {string} searchQuery - Search query
 */
function handleGlobalSearch(searchQuery) {
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

// Initialize search when the page loads
document.addEventListener('DOMContentLoaded', () => {
  initializeSearch();
  initSearchInput();
  
  // Make the search function globally available
  window.performSearch = handleGlobalSearch;
});

// Export functions for use in other modules
export {
  searchNews,
  initializeSearch,
  handleGlobalSearch,
  getAllNewsItems  // Add this export to fix the compilation error
};
