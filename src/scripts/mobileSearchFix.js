// src/scripts/mobileSearchFix.js
// Enhanced mobile search fix with flexible input identification and robust search handling

// Wait for all elements to be fully loaded
window.addEventListener('load', function() {
  initMobileSearch();
});

function initMobileSearch() {
  // Try to find both search inputs - with multiple possible IDs
  const desktopSearchInput = 
    document.getElementById('global-search-input') || 
    document.querySelector('input[type="search"]:not(#mobile-search-input)');
  
  const mobileSearchInput = 
    document.getElementById('mobile-search-input') || 
    document.querySelector('#mobile-search-overlay input[type="search"]');
  
  console.log('Desktop search input found:', !!desktopSearchInput);
  console.log('Mobile search input found:', !!mobileSearchInput);
  
  // If both inputs exist, synchronize them
  if (desktopSearchInput && mobileSearchInput) {
    // Remove any existing event listeners to avoid duplication
    const newDesktopInput = desktopSearchInput.cloneNode(true);
    const newMobileInput = mobileSearchInput.cloneNode(true);
    
    desktopSearchInput.parentNode.replaceChild(newDesktopInput, desktopSearchInput);
    mobileSearchInput.parentNode.replaceChild(newMobileInput, mobileSearchInput);
    
    // Re-assign variables
    const updatedDesktopInput = newDesktopInput;
    const updatedMobileInput = newMobileInput;
    
    // When desktop search input changes
    updatedDesktopInput.addEventListener('input', function() {
      console.log('Desktop search input value changed:', this.value);
      // Update mobile search input
      updatedMobileInput.value = this.value;
      // Trigger the search function with this value
      handleGlobalSearch(this.value);
    });
    
    // When mobile search input changes
    updatedMobileInput.addEventListener('input', function() {
      console.log('Mobile search input value changed:', this.value);
      // Update desktop search input
      updatedDesktopInput.value = this.value;
      // Trigger the search function with this value
      handleGlobalSearch(this.value);
    });
    
    // Make sure the inputs are focused properly when displayed
    const mobileSearchButton = document.getElementById('mobile-search-button');
    if (mobileSearchButton) {
      mobileSearchButton.addEventListener('click', function() {
        // Short delay to ensure the overlay is visible
        setTimeout(function() {
          updatedMobileInput.focus();
        }, 100);
      });
    }
  } else {
    console.error('Could not find both search inputs. Mobile search synchronization failed.');
  }
}

// The enhanced global search function
function handleGlobalSearch(searchValue) {
  console.log('Handling search for:', searchValue);
  
  // Normalize search query
  searchValue = searchValue.toLowerCase().trim();
  
  // Select all relevant elements
  const articles = document.querySelectorAll('.article-card-container, .article-card, .news-card-container');
  const sections = document.querySelectorAll('.article-section, .source-section');
  const sourceCards = document.querySelectorAll('.source-card');
  
  // First pass: Reset search filtering
  articles.forEach(article => {
    article.style.display = '';
    article.classList.remove('search-hidden');
  });
  
  sourceCards.forEach(card => {
    card.style.display = '';
    card.classList.remove('hidden');
  });
  
  sections.forEach(section => {
    section.style.display = '';
    section.classList.remove('hidden');
  });
  
  if (searchValue === '') return; // Exit if search is empty
  
  console.log('Found source cards:', sourceCards.length);
  console.log('Found articles:', articles.length);
  
  // Handle source cards (in "Group by Source" view)
  sourceCards.forEach(card => {
    let hasVisibleArticles = false;
    const cardArticles = card.querySelectorAll('.article-card');
    
    cardArticles.forEach(article => {
      const title = article.querySelector('h3')?.textContent?.toLowerCase() || '';
      const description = article.querySelector('p')?.textContent?.toLowerCase() || '';
      
      if (title.includes(searchValue) || description.includes(searchValue)) {
        hasVisibleArticles = true;
        console.log('Match found in source card article:', title);
      } else {
        article.classList.add('search-hidden');
        article.style.display = 'none';
      }
    });
    
    // Show/hide the entire card based on matches
    if (hasVisibleArticles) {
      card.classList.remove('hidden');
      card.style.display = '';
    } else {
      card.classList.add('hidden');
      card.style.display = 'none';
    }
  });
  
  // Handle category sections (in "Group by Category" view)
  sections.forEach(section => {
    let hasVisibleArticles = false;
    const sectionArticles = section.querySelectorAll('.article-card-container, .news-card-container, .article-card');
    
    sectionArticles.forEach(article => {
      const card = article.querySelector('.bg-white') || article;
      if (!card) return;
      
      const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
      const description = card.querySelector('p')?.textContent?.toLowerCase() || '';
      
      if (title.includes(searchValue) || description.includes(searchValue)) {
        hasVisibleArticles = true;
        console.log('Match found in section article:', title);
      } else {
        article.classList.add('search-hidden');
        article.style.display = 'none';
      }
    });
    
    // Show/hide the section based on matches
    if (hasVisibleArticles) {
      section.classList.remove('hidden');
      section.style.display = '';
    } else {
      section.classList.add('hidden');
      section.style.display = 'none';
    }
  });
}
