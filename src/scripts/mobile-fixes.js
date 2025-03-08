// src/scripts/mobile-fixes.js

/**
 * This script fixes various mobile display issues
 */

// Fix for NewsCard components getting cut off on mobile
function fixNewsCardDisplay() {
  // Get all news cards
  const newsCards = document.querySelectorAll('.article-card, .bg-white');
  
  // Apply proper width and ensure no overflow
  newsCards.forEach(card => {
    if (card instanceof HTMLElement) {
      // Ensure cards fit within their container
      card.style.boxSizing = 'border-box';
      
      // On mobile screens
      if (window.innerWidth < 768) {
        card.style.width = '100%';
        card.style.maxWidth = '100%';
        card.style.marginLeft = '0';
        card.style.marginRight = '0';
      }
    }
  });
}

// Fix for sidebar not fully closing on mobile
function fixSidebarToggle() {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  
  // Make sure the sidebar is fully closed when toggled
  if (sidebar && sidebarToggle) {
    const originalToggleHandler = sidebarToggle.onclick;
    
    sidebarToggle.onclick = function(e) {
      if (window.innerWidth < 768) {
        // Ensure sidebar is fully hidden when closed
        if (!sidebar.classList.contains('-translate-x-full')) {
          sidebar.classList.add('-translate-x-full');
          sidebarOverlay?.classList.add('hidden');
          document.body.classList.remove('overflow-hidden');
        } else {
          sidebar.classList.remove('-translate-x-full');
          sidebarOverlay?.classList.remove('hidden');
          document.body.classList.add('overflow-hidden');
        }
      }
      
      // Call original handler if it exists
      if (typeof originalToggleHandler === 'function') {
        originalToggleHandler(e);
      }
    };
  }
}

// Fix truncated category names in the header
function fixTruncatedCategories() {
  const categoryLinks = document.querySelectorAll('.category-chip, [data-category-link]');
  
  categoryLinks.forEach(link => {
    if (link instanceof HTMLElement) {
      // Add title attribute for hover tooltip with full name
      if (link.textContent) {
        link.setAttribute('title', link.textContent.trim());
      }
      
      // Ensure proper truncation with ellipsis
      link.style.overflow = 'hidden';
      link.style.textOverflow = 'ellipsis';
      link.style.whiteSpace = 'nowrap';
    }
  });
}

// Fix the "Articles per section" filter in the customization modal
function fixArticlesPerSectionFilter() {
  const articlesPerSection = document.getElementById('articles-per-section');
  const applyButton = document.getElementById('save-preferences-btn');
  
  if (articlesPerSection && applyButton) {
    applyButton.addEventListener('click', () => {
      if (articlesPerSection instanceof HTMLSelectElement) {
        const articlesCount = parseInt(articlesPerSection.value);
        
        // Apply the filter to all article grids
        document.querySelectorAll('.article-grid').forEach(grid => {
          const articles = Array.from(grid.querySelectorAll('.article-card, .bg-white'));
          
          articles.forEach((article, index) => {
            if (index < articlesCount) {
              article.classList.remove('hidden');
            } else {
              article.classList.add('hidden');
            }
          });
        });
      }
    });
  }
}

// Fix filters to apply across both Group by Category and Group by Source views
function fixFilterConsistency() {
  // We'll save filter selections to localStorage so they persist
  // between view changes
  
  function saveFilters() {
    // Save selected sources
    const sourceCheckboxes = document.querySelectorAll('.source-checkbox:checked');
    const selectedSources = Array.from(sourceCheckboxes).map(cb => 
      cb instanceof HTMLInputElement ? cb.getAttribute('data-source') : ''
    ).filter(Boolean);
    
    // Save selected categories
    const categoryCheckboxes = document.querySelectorAll('.category-checkbox:checked');
    const selectedCategories = Array.from(categoryCheckboxes).map(cb => 
      cb instanceof HTMLInputElement ? cb.getAttribute('data-category') : ''
    ).filter(Boolean);
    
    // Save to localStorage
    localStorage.setItem('femtech-selected-sources', JSON.stringify(selectedSources));
    localStorage.setItem('femtech-selected-categories', JSON.stringify(selectedCategories));
  }
  
  function loadAndApplyFilters() {
    try {
      // Load saved filters
      const savedSources = JSON.parse(localStorage.getItem('femtech-selected-sources') || '[]');
      const savedCategories = JSON.parse(localStorage.getItem('femtech-selected-categories') || '[]');
      
      // Apply to source checkboxes
      document.querySelectorAll('.source-checkbox').forEach(cb => {
        if (cb instanceof HTMLInputElement) {
          const source = cb.getAttribute('data-source');
          if (source) {
            cb.checked = savedSources.length === 0 || savedSources.includes(source);
          }
        }
      });
      
      // Apply to category checkboxes
      document.querySelectorAll('.category-checkbox').forEach(cb => {
        if (cb instanceof HTMLInputElement) {
          const category = cb.getAttribute('data-category');
          if (category) {
            cb.checked = savedCategories.length === 0 || savedCategories.includes(category);
          }
        }
      });
      
      // Now apply these filters to the view
      applyFiltersToView(savedSources, savedCategories);
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }
  
  function applyFiltersToView(selectedSources, selectedCategories) {
    // Apply to Category view
    const categoryView = document.getElementById('category-content');
    if (categoryView) {
      // Hide sections for filtered-out categories
      categoryView.querySelectorAll('section').forEach(section => {
        const sectionTitle = section.querySelector('h2')?.textContent;
        if (sectionTitle && selectedCategories.length > 0 && !selectedCategories.includes(sectionTitle)) {
          section.classList.add('hidden');
        } else {
          section.classList.remove('hidden');
          
          // Within visible sections, filter articles by source
          if (selectedSources.length > 0) {
            section.querySelectorAll('.article-card, .bg-white').forEach(article => {
              const sourceElement = article.querySelector('.text-purple-600, .text-purple-400');
              const source = sourceElement?.textContent;
              
              if (source && !selectedSources.includes(source)) {
                article.classList.add('hidden');
              } else {
                article.classList.remove('hidden');
              }
            });
          }
        }
      });
    }
    
    // Apply to Source view
    const sourceView = document.getElementById('source-content');
    if (sourceView) {
      // Hide cards for filtered-out sources
      sourceView.querySelectorAll('.source-card').forEach(card => {
        const source = card.getAttribute('data-source');
        if (source && selectedSources.length > 0 && !selectedSources.includes(source)) {
          card.classList.add('hidden');
        } else {
          card.classList.remove('hidden');
          
          // Within visible source cards, filter articles by category
          if (selectedCategories.length > 0) {
            card.querySelectorAll('.article-card, .bg-white').forEach(article => {
              const category = article.getAttribute('data-category');
              
              if (category && !selectedCategories.includes(category)) {
                article.classList.add('hidden');
              } else {
                article.classList.remove('hidden');
              }
            });
          }
        }
      });
    }
  }
  
  // Add event listeners to save preferences button
  const savePreferencesBtn = document.getElementById('save-preferences-btn');
  if (savePreferencesBtn) {
    savePreferencesBtn.addEventListener('click', saveFilters);
  }
  
  // Load and apply filters on page load
  window.addEventListener('DOMContentLoaded', loadAndApplyFilters);
  
  // Add event listeners to view toggle buttons to ensure filters apply when switching views
  const categoryViewBtn = document.getElementById('category-view');
  const sourceViewBtn = document.getElementById('source-view');
  
  if (categoryViewBtn && sourceViewBtn) {
    categoryViewBtn.addEventListener('click', loadAndApplyFilters);
    sourceViewBtn.addEventListener('click', loadAndApplyFilters);
  }
}

// Set up group by source as default view
function setSourceViewAsDefault() {
  const categoryViewBtn = document.getElementById('category-view');
  const sourceViewBtn = document.getElementById('source-view');
  const categoryContent = document.getElementById('category-content');
  const sourceContent = document.getElementById('source-content');
  
  // Only apply if all elements exist and we're on the home page
  if (categoryViewBtn && sourceViewBtn && categoryContent && sourceContent) {
    // Check if this is the first visit
    const hasSetDefaultView = localStorage.getItem('femtech-default-view-set');
    
    if (!hasSetDefaultView) {
      // Set source view as default
      sourceViewBtn.classList.add('bg-purple-100', 'text-purple-800');
      categoryViewBtn.classList.remove('bg-purple-100', 'text-purple-800');
      
      sourceContent.classList.remove('hidden');
      categoryContent.classList.add('hidden');
      
      // Mark that we've set the default view
      localStorage.setItem('femtech-default-view-set', 'true');
    }
  }
}

// Initialize all fixes
document.addEventListener('DOMContentLoaded', function() {
  fixNewsCardDisplay();
  fixSidebarToggle();
  fixTruncatedCategories();
  fixArticlesPerSectionFilter();
  fixFilterConsistency();
  setSourceViewAsDefault();
  
  // Also run some fixes on window resize
  window.addEventListener('resize', function() {
    fixNewsCardDisplay();
  });
});
