// global-search.js
// This script implements global search functionality across all pages

// Function to handle search across the site
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
    const visibleArticles = card.querySelectorAll('.article-card:not(.hidden)');
    
    if (visibleArticles.length > 0) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

// Set up event listeners for search inputs
document.addEventListener('DOMContentLoaded', () => {
  const desktopSearchInput = document.getElementById('search-input');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  
  // Handle desktop search
  desktopSearchInput?.addEventListener('input', (e) => {
    const query = e.target.value;
    handleGlobalSearch(query);
    
    // Keep mobile search in sync
    if (mobileSearchInput && mobileSearchInput.value !== query) {
      mobileSearchInput.value = query;
    }
  });
  
  // Handle mobile search
  mobileSearchInput?.addEventListener('input', (e) => {
    const query = e.target.value;
    handleGlobalSearch(query);
    
    // Keep desktop search in sync
    if (desktopSearchInput && desktopSearchInput.value !== query) {
      desktopSearchInput.value = query;
    }
  });
  
  // Make the search function globally available
  window.globalSearch = handleGlobalSearch;
});
