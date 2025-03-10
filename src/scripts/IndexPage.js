// src/scripts/indexPage.js

/**
 * Main JavaScript for the FemTechURLs index page
 * - Handles view toggling (Category/Source)
 * - Customization preferences
 * - Search functionality
 * - Load More buttons for category view
 */

// Define categories for script access
const categories = [
  { id: 'FemTech News & Innovation', name: 'FemTech News & Innovation', slug: 'femtech-news-innovation' },
  { id: 'Reproductive & Maternal Health', name: 'Reproductive & Maternal Health', slug: 'reproductive-maternal-health' },
  { id: 'Women\'s Health & Wellness', name: 'Women\'s Health & Wellness', slug: 'womens-health-wellness' }
];

// Handle search functionality
const searchInput = document.getElementById('global-search-input');

function handleSearch(value) {
  const articles = document.querySelectorAll('.article-card-container, .article-card');
  const sections = document.querySelectorAll('.article-section');
  const sourceCards = document.querySelectorAll('.source-card');
  
  value = value.toLowerCase().trim();
  
  // Reset visibility first (only for search filtering)
  articles.forEach(article => {
    article.classList.remove('search-hidden');
  });
  
  if (value === '') return; // No search term, no filtering
  
  // Filter source cards
  sourceCards.forEach(card => {
    const articles = card.querySelectorAll('.article-card');
    let hasVisibleArticles = false;
    
    articles.forEach(article => {
      const title = article.querySelector('h3')?.textContent?.toLowerCase() || '';
      const description = article.querySelector('p')?.textContent?.toLowerCase() || '';
      
      if (title.includes(value) || description.includes(value)) {
        hasVisibleArticles = true;
      } else {
        article.classList.add('search-hidden');
      }
    });
    
    if (hasVisibleArticles) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
  
  // Filter category sections
  sections.forEach(section => {
    let hasVisibleArticles = false;
    const sectionArticles = section.querySelectorAll('.article-card-container:not(.hidden), .article-card:not(.hidden)');
    
    sectionArticles.forEach(article => {
      const card = article.querySelector('.bg-white') || article;
      if (!card) return;
      
      const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
      const description = card.querySelector('p')?.textContent?.toLowerCase() || '';
      
      if (title.includes(value) || description.includes(value)) {
        hasVisibleArticles = true;
      } else {
        article.classList.add('search-hidden');
      }
    });
    
    // Show/hide the section based on matching articles
    if (hasVisibleArticles) {
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  });
}

// Attach search event listener
searchInput?.addEventListener('input', (e) => {
  if (e.target instanceof HTMLInputElement) {
    handleSearch(e.target.value);
  }
});

// Modal functionality
const customizeButton = document.getElementById('customize-button');
const customizationModal = document.getElementById('customization-modal');
const modalBackdrop = document.getElementById('customization-modal-backdrop');
const closeModalButton = document.getElementById('close-modal');

function openModal() {
  customizationModal.classList.remove('hidden');
  modalBackdrop.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeModal() {
  customizationModal.classList.add('hidden');
  modalBackdrop.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

customizeButton?.addEventListener('click', openModal);
closeModalButton?.addEventListener('click', closeModal);
modalBackdrop?.addEventListener('click', closeModal);

// Tab functionality
const categoriesTab = document.getElementById('categories-tab');
const sourcesTab = document.getElementById('sources-tab');
const categoriesContent = document.getElementById('categories-content');
const sourcesContent = document.getElementById('sources-content');

categoriesTab?.addEventListener('click', () => {
  categoriesTab.classList.add('border-purple-500', 'text-purple-600');
  sourcesTab.classList.remove('border-purple-500', 'text-purple-600');
  sourcesTab.classList.add('border-transparent', 'text-gray-500');
  
  categoriesContent.classList.remove('hidden');
  sourcesContent.classList.add('hidden');
});

sourcesTab?.addEventListener('click', () => {
  sourcesTab.classList.add('border-purple-500', 'text-purple-600');
  categoriesTab.classList.remove('border-purple-500', 'text-purple-600');
  categoriesTab.classList.add('border-transparent', 'text-gray-500');
  
  sourcesContent.classList.remove('hidden');
  categoriesContent.classList.add('hidden');
});

// View toggle functionality
const categoryViewBtn = document.getElementById('category-view');
const sourceViewBtn = document.getElementById('source-view');
const categoryContent = document.getElementById('category-content');
const sourceContent = document.getElementById('source-content');
const groupBySourceToggle = document.getElementById('group-by-source');

// Toggle between category and source views
function setViewMode(isSourceView) {
  if (isSourceView) {
    sourceViewBtn.classList.add('bg-purple-100', 'text-purple-800');
    categoryViewBtn.classList.remove('bg-purple-100', 'text-purple-800');
    categoryViewBtn.classList.add('text-gray-700', 'hover:bg-gray-50');
    
    sourceContent.classList.remove('hidden');
    categoryContent.classList.add('hidden');
    
    if (groupBySourceToggle) {
      groupBySourceToggle.checked = true;
    }
  } else {
    categoryViewBtn.classList.add('bg-purple-100', 'text-purple-800');
    sourceViewBtn.classList.remove('bg-purple-100', 'text-purple-800');
    sourceViewBtn.classList.add('text-gray-700', 'hover:bg-gray-50');
    
    categoryContent.classList.remove('hidden');
    sourceContent.classList.add('hidden');
    
    if (groupBySourceToggle) {
      groupBySourceToggle.checked = false;
    }
  }
}

categoryViewBtn?.addEventListener('click', () => setViewMode(false));
sourceViewBtn?.addEventListener('click', () => setViewMode(true));

// Initialize with source view as default
window.addEventListener('DOMContentLoaded', () => {
  setViewMode(true);
});

// Toggle from modal
groupBySourceToggle?.addEventListener('change', () => {
  setViewMode(groupBySourceToggle.checked);
});

// Save preferences functionality
const savePreferencesBtn = document.getElementById('save-preferences-btn');
const categoryToggles = document.querySelectorAll('.category-toggle');
const sourceToggles = document.querySelectorAll('.source-toggle');
const articlesPerSection = document.getElementById('articles-per-section');

savePreferencesBtn?.addEventListener('click', () => {
  // Handle category visibility
  const selectedCategories = Array.from(categoryToggles)
    .filter(cb => cb.checked)
    .map(cb => cb.dataset.category);
  
  // Hide/show category sections
  document.querySelectorAll('.article-section').forEach(section => {
    const sectionId = section.id;
    
    // Try to find matching category
    const matchingCategory = categories.find(cat => 
      cat.slug === sectionId || cat.id.toLowerCase().replace(/\s+/g, '-').replace(/[&\']/g, '') === sectionId
    );
    
    if (matchingCategory && selectedCategories.includes(matchingCategory.id)) {
      section.classList.remove('hidden');
    } else if (matchingCategory) {
      section.classList.add('hidden');
    }
  });
  
  // Handle source visibility if in source view
  const selectedSources = Array.from(sourceToggles)
    .filter(cb => cb.checked)
    .map(cb => cb.dataset.source);
    
  // Hide/show source cards
  document.querySelectorAll('.source-card').forEach(card => {
    const sourceName = card.dataset.source;
    
    if (selectedSources.includes(sourceName)) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });

  // Update number of articles shown
  const articlesCount = parseInt(articlesPerSection.value);
  document.querySelectorAll('.article-grid').forEach(grid => {
    const articles = Array.from(grid.querySelectorAll('.article-card'));
    
    articles.forEach((article, index) => {
      if (index < articlesCount) {
        article.classList.remove('hidden');
      } else {
        article.classList.add('hidden');
      }
    });
  });
  
  // Show success message
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg transition-opacity duration-500';
  notification.innerHTML = '<div class="flex items-center"><svg class="h-5 w-5 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>Preferences saved successfully!</div>';
  
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
  
  // Close modal after saving
  closeModal();
});

// Add classes on page load
document.addEventListener('DOMContentLoaded', () => {
  // Add appropriate classes to source cards if not already present
  document.querySelectorAll('#source-content > div').forEach(card => {
    const sourceName = card.querySelector('h2')?.textContent;
    if (sourceName && !card.classList.contains('source-card')) {
      card.classList.add('source-card');
      card.dataset.source = sourceName;
    }
  });
});

// Handle Load More functionality for category view
document.addEventListener('DOMContentLoaded', () => {
  const loadMoreCategoryButtons = document.querySelectorAll('.load-more-category-btn');
  
  loadMoreCategoryButtons.forEach(button => {
    if (button instanceof HTMLElement) {
      const categoryId = button.getAttribute('data-category');
      let currentlyShown = parseInt(button.getAttribute('data-shown') || '9', 10);
      const totalItems = parseInt(button.getAttribute('data-total') || '0', 10);
      const increment = 6; // Show 6 more items at a time
      
      button.addEventListener('click', () => {
        const section = button.closest('.article-section');
        if (!section) return;
        
        const hiddenCards = section.querySelectorAll('.article-card-container.hidden:not(.search-hidden)');
        const cardsToShow = Array.from(hiddenCards).slice(0, increment);
        
        // Show the next batch of cards
        cardsToShow.forEach(card => {
          card.classList.remove('hidden');
        });
        
        // Update counter
        currentlyShown += cardsToShow.length;
        button.setAttribute('data-shown', currentlyShown.toString());
        
        // Hide the button if no more cards to show
        if (currentlyShown >= totalItems || hiddenCards.length <= increment) {
          button.classList.add('hidden');
        }
        
        // Update button text to show count
        button.textContent = `Showing ${currentlyShown} of ${totalItems} - Load More`;
      });
    }
  });
});
