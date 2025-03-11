// src/scripts/mobileSearchFix.js
// Mobile search fix that preserves your original global search functionality

// Wait for all elements to be fully loaded
window.addEventListener('load', function() {
  initMobileSearch();
});

function initMobileSearch() {
  // Find search inputs
  const desktopSearchInput = document.getElementById('global-search-input');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  
  console.log('Desktop search input found:', !!desktopSearchInput);
  console.log('Mobile search input found:', !!mobileSearchInput);
  
  // If both inputs exist, synchronize them
  if (desktopSearchInput && mobileSearchInput) {
    // When desktop search input changes, update mobile input
    desktopSearchInput.addEventListener('input', function() {
      mobileSearchInput.value = this.value;
      // DO NOT trigger search here - let your original event handler work
    });
    
    // When mobile search input changes, update desktop input
    mobileSearchInput.addEventListener('input', function() {
      desktopSearchInput.value = this.value;
      
      // Trigger any existing input event handlers on the desktop input
      // This should activate your original search functionality
      const inputEvent = new Event('input', {
        bubbles: true,
        cancelable: true
      });
      desktopSearchInput.dispatchEvent(inputEvent);
    });
    
    // Add keydown event for mobile search to handle Enter key
    mobileSearchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        // Prevent default to avoid form submission if inside a form
        e.preventDefault();
        
        // Find the search form if it exists and submit it
        const searchForm = mobileSearchInput.closest('form');
        if (searchForm) {
          searchForm.submit();
          return;
        }
        
        // Trigger a search when Enter is pressed
        console.log('Enter key pressed on mobile search');
        
        // Trigger input event on desktop search to use existing search logic
        const inputEvent = new Event('input', {
          bubbles: true,
          cancelable: true
        });
        desktopSearchInput.dispatchEvent(inputEvent);
        
        // Also simulate a keydown event with Enter key on desktop input
        const keyEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        });
        desktopSearchInput.dispatchEvent(keyEvent);
        
        // If there's a search button, try clicking it
        const searchButton = document.querySelector('[type="submit"], .search-button');
        if (searchButton) {
          searchButton.click();
        }
      }
    });
    
    // Make sure the input is focused when mobile search is opened
    const mobileSearchButton = document.getElementById('mobile-search-button');
    if (mobileSearchButton) {
      mobileSearchButton.addEventListener('click', function() {
        setTimeout(function() {
          mobileSearchInput.focus();
        }, 100);
      });
    }
  } else {
    console.error('Could not find both search inputs. Mobile search synchronization failed.');
  }
}
