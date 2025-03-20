import { parseISO, format, formatDistanceToNow } from 'date-fns';
import Parser from 'rss-parser';

// Initialize RSS parser
const rssParser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['content:encoded', 'contentEncoded'],
      'enclosure'
    ]
  }
});

// TypeScript interfaces
export interface NewsItem {
  title: string;
  link: string;
  description: string;
  date: Date;
  sourceName: string;
  category: string;
  guid: string;
  image?: string; // Added image property
}

export interface FeedCache {
  items: NewsItem[];
  timestamp: number;
  expiresAt: number;
}

export interface SourceHealth {
  status: 'active' | 'error' | 'using_fallback';
  lastChecked: number;
  errorCount: number;
  lastRefresh?: number;
}

export interface Source {
  name: string;
  type: 'rss' | 'devto';
  endpoint: string;
  category: string;
}

// In-memory stores
const feedCache = new Map<string, FeedCache>();
const sourceHealthStore = new Map<string, SourceHealth>();

// Cache configuration
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

// Refined categories after removing non-FemTech sources
const categoryKeywords = {
  'FemTech News & Innovation': ['femtech', 'women\'s health', 'technology', 'innovation', 'digital health', 'health tech', 'startup', 'product', 'launch'],
  'Reproductive & Maternal Health': ['pregnancy', 'fertility', 'menstrual', 'period', 'maternal', 'birth', 'mother', 'prenatal', 'postnatal', 'baby', 'breastfeeding', 'cycle'],
  'Women\'s Health & Wellness': ['health', 'wellness', 'nutrition', 'fitness', 'mental health', 'menopause', 'hormones', 'selfcare', 'wellbeing', 'healthcare']
};

// Women's health specific keywords
const femtechKeywords = [
  'women', 'woman', 'female', 'health', 'wellness', 
  'femtech', 'pregnancy', 'maternal', 'menstrual', 'cycle',
  'menopause', 'fertility', 'reproductive', 'hormones',
  'period', 'gynecology', 'pelvic', 'menstruation',
  'birth control', 'contraception', 'breastfeeding'
];

// Replace your current extractImageFromRSSItem function with this improved version

/**
 * Extract image URL from RSS item
 * Updated to handle RSS.app feed format specifically
 */
function extractImageFromRSSItem(item) {
  // Check for RSS.app specific image format first
  if (item['content:encoded']) {
    const imgMatch = item['content:encoded'].match(/<img[^>]+src="([^">]+)"/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
  }
  
  // Check for thumbnail in media:group (common in RSS.app)
  if (item['media:group'] && item['media:group']['media:thumbnail'] && item['media:group']['media:thumbnail'].$.url) {
    return item['media:group']['media:thumbnail'].$.url;
  }
  
  // Check for media:content
  if (item['media:content'] && item['media:content'].$ && item['media:content'].$.url) {
    return item['media:content'].$.url;
  }
  
  // Check for media:content as array
  if (Array.isArray(item['media:content']) && item['media:content'][0] && item['media:content'][0].$ && item['media:content'][0].$.url) {
    return item['media:content'][0].$.url;
  }
  
  // Check for enclosure
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }
  
  // Check for image in content
  if (item.content) {
    const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
  }
  
  // Check for image in description
  if (item.description) {
    const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
  }
  
  // Additional check for RSS.app image format from itunes:image
  if (item['itunes:image'] && item['itunes:image'].href) {
    return item['itunes:image'].href;
  }
  
  // Return null if no image found
  return null;
}

// Define our focused list of sources specific to FemTech
export const sources: Source[] = [
  // FemTech News & Innovation
  {
    name: 'FemTech Insider',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/uhlIq3S7nRyF31Zu.xml',
    category: 'FemTech News & Innovation'
  },
  {
    name: 'HIT Consultant',
    type: 'rss',
    endpoint: 'https://hitconsultant.net/tag/femtech/feed/',
    category: 'FemTech News & Innovation'
  },
  {
    name: 'Med-Tech Insights FemTech',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/bnx9o8imYxcim0YF.xml',
    category: 'FemTech News & Innovation'
  },
  {
    name: 'FemTech Health',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/M1VCLwRreb8msGIC.xml',
    category: 'FemTech News & Innovation'
  },
  {
    name: 'Femovate',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/3C8HedhSEAyT0e3A.xml',
    category: 'FemTech News & Innovation'
  },
  
  // Reproductive & Maternal Health
  {
    name: 'Flo Health - Menstrual Cycle',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/IR2Vq1nmmF752hpE.xml',
    category: 'Reproductive & Maternal Health'
  },
  {
    name: 'Flo Health - Getting Pregnant',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/FRkZlECyVfI6BSgV.xml',
    category: 'Reproductive & Maternal Health'
  },
  {
    name: 'Flo Health - Being a Mom',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/ReM4oFcyMw3jOcuQ.xml',
    category: 'Reproductive & Maternal Health'
  },
  {
    name: 'Maven Clinic - Health',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/O0yCyMe0OiKaBgOs.xml',
    category: 'Reproductive & Maternal Health'
  },
  {
    name: 'Joylux',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/alBRVrwCSbiQ9cFP.xml',
    category: 'Reproductive & Maternal Health'
  },
  {
    name: 'Nurx Health',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/fkRtN3NueMrY6Jip.xml',
    category: 'Reproductive & Maternal Health'
  },
  {
    name: 'Willow - Breastfeeding',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/sQUko7g3kYHPFXlt.xml',
    category: 'Reproductive & Maternal Health'
  },
  {
    name: 'Willow - Expert Guidance',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/b8uAF4AEWcZcHFky.xml',
    category: 'Reproductive & Maternal Health'
  },
  {
    name: 'Clue - Menstrual Cycle',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/N8Hm5TN5V2o3PaXs.xml',
    category: 'Reproductive & Maternal Health'
  },
  {
    name: 'Clue - Fertility',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/uT03fffyFYm7RDVv.xml',
    category: 'Reproductive & Maternal Health'
  },
  {
    name: 'Clue - Birth Control',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/qbffgMx68SwysLQx.xml',
    category: 'Reproductive & Maternal Health'
  },
  {
    name: 'Ovia - Life During Pregnancy',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/4bXDcc46TVje86D5.xml',
    category: 'Reproductive & Maternal Health'
  },
  {
    name: 'Ovia - Pregnancy by Week',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/KZoE71UAa9W63VW6.xml',
    category: 'Reproductive & Maternal Health'
  },
  {
    name: 'Ovia - Your Body After Baby',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/IHCX9FuSffL3Qc22.xml',
    category: 'Reproductive & Maternal Health'
  },
  
  // Women's Health & Wellness
  {
    name: 'Maven Clinic - Insights',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/0jmcOyjdyOVJ849e.xml',
    category: 'Women\'s Health & Wellness'
  },
  {
    name: 'Future Fem Health',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/z5MUcYQ7ocqlPkf0.xml',
    category: 'Women\'s Health & Wellness'
  },
  {
    name: 'Balance - Menopause',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/vndruuaeiVu6IiKv.xml',
    category: 'Women\'s Health & Wellness'
  },
  {
    name: 'Clue - Issues & Conditions',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/CZbPvlVppu7sAXJN.xml',
    category: 'Women\'s Health & Wellness'
  },
  {
    name: 'Clue - Dating & Pleasure',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/1jAnZxeBMZMkvmfc.xml',
    category: 'Women\'s Health & Wellness'
  },
  {
    name: 'Clue - Life & Culture',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/E3ktXXU0vd4nbO3a.xml',
    category: 'Women\'s Health & Wellness'
  },
  {
    name: 'Ovia - Health & Wellness',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/TkriSZ8NV31YR67P.xml',
    category: 'Women\'s Health & Wellness'
  },
  {
    name: 'Women\'s Health Gov',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/6gH5uGajqWMYV91g.xml',
    category: 'Women\'s Health & Wellness'
  }
];

// Sample data for fallbacks
export const sampleNewsItems: NewsItem[] = [
  // FemTech News & Innovation
  {
    title: "The Growing Landscape of FemTech Innovations in 2023",
    link: "https://example.com/article1",
    description: "An exploration of the latest technologies transforming women's health and wellbeing.",
    date: new Date('2023-08-15'),
    sourceName: "FemTech Insider",
    category: "FemTech News & Innovation",
    guid: "sample-1"
  },
  {
    title: "Investment in FemTech Reaches Record High",
    link: "https://example.com/article2",
    description: "Venture capital funding for women's health technology startups has doubled in the past year.",
    date: new Date('2023-08-12'),
    sourceName: "FemTech Health",
    category: "FemTech News & Innovation",
    guid: "sample-2"
  },
  
  // Reproductive & Maternal Health
  {
    title: "New Research Reveals Link Between Diet and Menstrual Health",
    link: "https://example.com/article3",
    description: "Study finds certain foods may improve symptoms of menstrual discomfort for many women.",
    date: new Date('2023-08-10'),
    sourceName: "Flo Health",
    category: "Reproductive & Maternal Health",
    guid: "sample-3"
  },
  {
    title: "The Science of Fertility Tracking: Beyond the Calendar Method",
    link: "https://example.com/article4",
    description: "Modern approaches to understanding your fertility window using technology and biomarkers.",
    date: new Date('2023-08-05'),
    sourceName: "Clue",
    category: "Reproductive & Maternal Health",
    guid: "sample-4"
  },
  
  // Women's Health & Wellness
  {
    title: "Managing Menopause Symptoms: New Approaches",
    link: "https://example.com/article5",
    description: "Innovative techniques and lifestyle changes to address common menopause challenges.",
    date: new Date('2023-08-03'),
    sourceName: "Balance",
    category: "Women's Health & Wellness",
    guid: "sample-5"
  },
  {
    title: "The Connection Between Stress and Women's Health",
    link: "https://example.com/article6",
    description: "How chronic stress affects women differently and strategies for better stress management.",
    date: new Date('2023-07-28'),
    sourceName: "Maven Clinic",
    category: "Women's Health & Wellness",
    guid: "sample-6"
  }
];

/**
 * Gets cached feed data if available and not expired
 */
function getCachedFeed(source: Source): NewsItem[] | null {
  const cached = feedCache.get(source.endpoint);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.items;
  }
  return null;
}

/**
 * Updates the cache with new feed data
 */
function updateCache(source: Source, items: NewsItem[]): void {
  feedCache.set(source.endpoint, {
    items,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_DURATION
  });
}

/**
 * Updates the health status of a source
 */
function updateSourceHealth(source: Source, status: 'active' | 'error' | 'using_fallback', errorMessage?: string): void {
  const health = sourceHealthStore.get(source.name) || {
    status: 'active',
    lastChecked: 0,
    errorCount: 0
  };
  
  health.status = status;
  health.lastChecked = Date.now();
  
  if (status === 'error') {
    health.errorCount += 1;
  } else {
    health.errorCount = 0;
  }
  
  sourceHealthStore.set(source.name, health);
}

/**
 * Filters content to ensure it's relevant to FemTech and the specified category
 * Uses a scoring system instead of binary matching
 */
function filterContentByCategory(items: NewsItem[], category: string): NewsItem[] {
  return items.filter(item => {
    const titleLower = item.title.toLowerCase();
    const descLower = item.description.toLowerCase();
    
    // Calculate relevance score
    let relevanceScore = 0;
    
    // Check for femtech keywords
    for (const keyword of femtechKeywords) {
      if (titleLower.includes(keyword)) relevanceScore += 3; // Title matches are more important
      if (descLower.includes(keyword)) relevanceScore += 1;
    }
    
    // Check for category keywords
    for (const keyword of categoryKeywords[category] || []) {
      if (titleLower.includes(keyword)) relevanceScore += 2;
      if (descLower.includes(keyword)) relevanceScore += 1;
    }
    
    // General tech sources need a higher threshold
    const generalTechSources = ['TechCrunch', 'Wired', 'The Verge', 'VentureBeat'];
    
    // Different thresholds based on source type
    if (generalTechSources.includes(item.sourceName)) {
      return relevanceScore >= 4; // Higher threshold for general sources
    } else {
      return relevanceScore >= 2; // Lower threshold for women-specific sources
    }
  });
}

/**
 * Fetch from DEV.to API
 */
async function fetchFromDevTo(source: Source): Promise<NewsItem[]> {
  try {
    const response = await fetch(source.endpoint);
    if (!response.ok) {
      throw new Error(`DEV.to API error: ${response.status}`);
    }
    
    const articles = await response.json();
    return articles.map(article => ({
      title: article.title || 'Untitled',
      link: article.url || '',
      description: article.description || '',
      date: new Date(article.published_at),
      sourceName: source.name,
      category: source.category,
      guid: article.id.toString()
    }));
  } catch (error) {
    console.error(`Error fetching from DEV.to (${source.name}):`, error);
    updateSourceHealth(source, 'error');
    return sampleNewsItems.filter(item => item.category === source.category).slice(0, 5);
  }
}

/**
 * Fetch from RSS feed
 */
async function fetchFromRSS(source: Source): Promise<NewsItem[]> {
  try {
    const response = await fetch(source.endpoint);
    if (!response.ok) {
      throw new Error(`RSS feed error: ${response.status}`);
    }
    
    const text = await response.text();
    const feed = await rssParser.parseString(text);
    
    let items = feed.items.map(item => {
      // Extract image from the item
      const imageUrl = extractImageFromRSSItem(item);
      
      return {
        title: item.title || 'Untitled',
        link: item.link || '',
        description: item.contentSnippet || item.content || '',
        date: item.isoDate ? new Date(item.isoDate) : new Date(),
        sourceName: source.name,
        category: source.category,
        guid: item.guid || item.link || '',
        image: imageUrl // Add image URL to the item
      };
    });
    
    // Apply category filtering for general tech sources
    const generalTechSources = ['TechCrunch', 'Wired', 'The Verge', 'VentureBeat'];
    if (generalTechSources.includes(source.name)) {
      items = filterContentByCategory(items, source.category);
    }
    
    return items;
  } catch (error) {
    console.error(`Error fetching RSS feed from ${source.name}:`, error);
    updateSourceHealth(source, 'error');
    return sampleNewsItems.filter(item => item.category === source.category).slice(0, 5);
  }
}

/**
 * Main function to fetch feed from a source
 */
export async function fetchFeed(source: Source): Promise<NewsItem[]> {
  // Check cache first
  const cached = getCachedFeed(source);
  if (cached) return cached;

  try {
    let items: NewsItem[];
    
    switch (source.type) {
      case 'rss':
        items = await fetchFromRSS(source);
        break;
      case 'devto':
        items = await fetchFromDevTo(source);
        break;
      default:
        throw new Error(`Unknown source type: ${source.type}`);
    }
    
    updateCache(source, items);
    updateSourceHealth(source, 'active');
    return items;
  } catch (error) {
    console.error(`Error fetching from ${source.name}:`, error);
    updateSourceHealth(source, 'error');
    return sampleNewsItems.filter(item => item.category === source.category).slice(0, 5);
  }
}

/**
 * Fetches news items by category
 */
export async function fetchNewsByCategory(category: string): Promise<NewsItem[]> {
  const categorySources = sources.filter(source => source.category === category);
  
  if (categorySources.length === 0) {
    return sampleNewsItems.filter(item => item.category === category);
  }
  
  const promises = categorySources.map(source => fetchFeed(source));
  
  try {
    const results = await Promise.allSettled(promises);
    const fulfilled = results
      .filter((result): result is PromiseFulfilledResult<NewsItem[]> => result.status === 'fulfilled')
      .map(result => result.value);
    
    return fulfilled.flat();
  } catch (error) {
    console.error(`Error fetching news for category ${category}:`, error);
    return sampleNewsItems.filter(item => item.category === category);
  }
}

/**
 * Fetches all news items
 */
export async function fetchNews(): Promise<NewsItem[]> {
  return await fetchAllNews();
}

/**
 * Fetches all news items
 */
export async function fetchAllNews(): Promise<NewsItem[]> {
  const promises = sources.map(source => fetchFeed(source));
  
  try {
    const results = await Promise.allSettled(promises);
    const fulfilled = results
      .filter((result): result is PromiseFulfilledResult<NewsItem[]> => result.status === 'fulfilled')
      .map(result => result.value);
    
    return fulfilled.flat();
  } catch (error) {
    console.error('Error fetching all news:', error);
    return sampleNewsItems;
  }
}

/**
 * Gets all categories
 */
export function getCategories(): string[] {
  return Array.from(new Set(sources.map(source => source.category)));
}

/**
 * Gets source health information
 */
export function getSourcesHealth(): Record<string, SourceHealth> {
  const health: Record<string, SourceHealth> = {};
  
  for (const source of sources) {
    health[source.name] = sourceHealthStore.get(source.name) || {
      status: 'active',
      lastChecked: 0,
      errorCount: 0
    };
  }
  
  return health;
}

/**
 * Gets cache status information
 */
export function getCacheStatus(): Record<string, string> {
  const status: Record<string, string> = {};
  
  for (const source of sources) {
    const cached = feedCache.get(source.endpoint);
    if (cached) {
      const timeAgo = formatDistanceToNow(cached.timestamp, { addSuffix: true });
      status[source.name] = timeAgo;
    } else {
      status[source.name] = 'never';
    }
  }
  
  return status;
}

/**
 * Formats a date to a readable string
 */
export function formatDate(date: Date | string): string {
  try {
    if (!date) return 'Unknown date';
    
    // Handle string dates
    if (typeof date === 'string') {
      try {
        date = parseISO(date);
      } catch (e) {
        date = new Date(date);
      }
    }
    
    // Check if date is valid
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Unknown date';
    }
    
    // Format the date
    return format(date, 'MMM d, yyyy');
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Unknown date';
  }
}
