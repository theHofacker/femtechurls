// src/scripts/mobileSearchFix.js
// Mobile search fix that works with the global search

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Mobile search fix script loaded');
  
  // Find both search inputs
  const desktopSearchInput = document.getElementById('global-search-input');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  
  // Find the mobile search button and overlay
  const mobileSearchButton = document.getElementById('mobile-search-button');
  const mobileSearchOverlay = document.getElementById('mobile-search-overlay');
  const closeMobileSearch = document.getElementById('close-mobile-search');
  
  // Log what we found for debugging
  console.log('Desktop search input:', !!desktopSearchInput);
  console.log('Mobile search input:', !!mobileSearchInput);
  console.log('Mobile search button:', !!mobileSearchButton);
  console.log('Mobile search overlay:', !!mobileSearchOverlay);
  
  // Make sure mobile search opens correctly
  if (mobileSearchButton && mobileSearchOverlay) {
    mobileSearchButton.addEventListener('click', function() {
      console.log('Opening mobile search');
      mobileSearchOverlay.classList.remove('hidden');
      
      // Focus the search input after a short delay
      setTimeout(function() {
        if (mobileSearchInput) mobileSearchInput.focus();
      }, 100);
    });
  }
  
  // Make sure mobile search closes correctly
  if (closeMobileSearch && mobileSearchOverlay) {
    closeMobileSearch.addEventListener('click', function() {
      console.log('Closing mobile search');
      mobileSearchOverlay.classList.add('hidden');
    });
  }
  
  // Make sure Escape key closes the search
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileSearchOverlay && !mobileSearchOverlay.classList.contains('hidden')) {
      console.log('Closing mobile search via Escape key');
      mobileSearchOverlay.classList.add('hidden');
    }
  });
  
  // Ensure the search form submits properly
  const mobileSearchForm = mobileSearchInput ? mobileSearchInput.closest('form') : null;
  if (mobileSearchForm) {
    console.log('Found mobile search form', mobileSearchForm);
    
    mobileSearchForm.addEventListener('submit', function(e) {
      console.log('Mobile search form submitted');
      
      // Get the search query
      const query = mobileSearchInput.value.trim();
      console.log('Search query:', query);
      
      if (!query) {
        e.preventDefault();
        return false;
      }
      
      // Allow form to submit naturally if it has the right action and method
      if (this.getAttribute('action') === '/search' && this.getAttribute('method') === 'get') {
        console.log('Form has correct action and method, letting it submit naturally');
        return true;
      }
      
      // Otherwise handle manually
      console.log('Handling form submission manually');
      e.preventDefault();
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    });
  }
});
