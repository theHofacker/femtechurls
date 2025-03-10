// src/scripts/sourceCardScroll.js

/**
 * Enhanced scroll functionality for Source Cards on the home page
 * - Adds smooth scrolling to source cards
 * - Adds top and bottom shadow indicators for scroll position
 * - Shows "View All" link for sources with many articles
 */
document.addEventListener('DOMContentLoaded', () => {
  // Only run this code on the home page
  if (!document.getElementById('source-content')) return;
    
  // Find all source cards
  const sourceCards = document.querySelectorAll('.source-card');
    
  sourceCards.forEach(card => {
    const articleGrid = card.querySelector('.article-grid');
    if (!articleGrid) return;
      
    // Setup for better scrolling experience
    setupScrollableCard(card, articleGrid);
  });
});

/**
 * Configures a source card for enhanced scrolling
 * @param {HTMLElement} card - The source card container
 * @param {HTMLElement} articleGrid - The scrollable article container
 */
function setupScrollableCard(card, articleGrid) {
  // Add scroll shadow indicators
  const shadowTop = document.createElement('div');
  shadowTop.className = 'absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none opacity-0 transition-opacity duration-200';
  shadowTop.setAttribute('data-scroll-shadow', 'top');
    
  const shadowBottom = document.createElement('div');
  shadowBottom.className = 'absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none transition-opacity duration-200';
  shadowBottom.setAttribute('data-scroll-shadow', 'bottom');
    
  // Create a container for the scrollable content with relative positioning
  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'relative';
    
  // Move the article grid into our new container
  articleGrid.parentNode.insertBefore(scrollContainer, articleGrid);
  scrollContainer.appendChild(articleGrid);
    
  // Add shadow elements
  scrollContainer.appendChild(shadowTop);
  scrollContainer.appendChild(shadowBottom);
    
  // Add a 'View All' button at the bottom of card if there are many articles
  const articleCount = articleGrid.querySelectorAll('.article-card').length;
    
  if (articleCount > 5) {
    const sourceName = card.getAttribute('data-source');
      
    // Create view all button
    const viewAllContainer = document.createElement('div');
    viewAllContainer.className = 'p-3 text-center border-t border-gray-200 bg-white';
    viewAllContainer.innerHTML = `
      <a href="/search?q=${encodeURIComponent(sourceName)}" class="text-sm font-medium text-purple-600 hover:text-purple-800">
        View all ${articleCount} articles
      </a>
    `;
      
    // Add it after the scroll container
    scrollContainer.parentNode.insertBefore(viewAllContainer, scrollContainer.nextSibling);
  }
    
  // Setup scroll event listener to control shadow visibility
  articleGrid.addEventListener('scroll', () => {
    updateScrollShadows(articleGrid, shadowTop, shadowBottom);
  });
    
  // Initial check for shadows
  updateScrollShadows(articleGrid, shadowTop, shadowBottom);
    
  // Set a nicer height for the scrollable area
  articleGrid.style.maxHeight = '400px';
  articleGrid.style.overflowY = 'auto';
}

/**
 * Updates the visibility of scroll shadow indicators based on scroll position
 * @param {HTMLElement} scrollElement - The scrollable element
 * @param {HTMLElement} shadowTop - The top shadow indicator
 * @param {HTMLElement} shadowBottom - The bottom shadow indicator
 */
function updateScrollShadows(scrollElement, shadowTop, shadowBottom) {
  // Show top shadow when not at the top
  if (scrollElement.scrollTop > 10) {
    shadowTop.classList.add('opacity-100');
    shadowTop.classList.remove('opacity-0');
  } else {
    shadowTop.classList.add('opacity-0');
    shadowTop.classList.remove('opacity-100');
  }
    
  // Show bottom shadow when not at the bottom
  const isAtBottom = scrollElement.scrollHeight - scrollElement.scrollTop <= scrollElement.clientHeight + 10;
    
  if (!isAtBottom) {
    shadowBottom.classList.add('opacity-100');
    shadowBottom.classList.remove('opacity-0');
  } else {
    shadowBottom.classList.add('opacity-0');
    shadowBottom.classList.remove('opacity-100');
  }
}
