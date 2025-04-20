import { parseISO, format, formatDistanceToNow } from 'date-fns';
import Parser from 'rss-parser';

// Initialize RSS parser with expanded customFields
const rssParser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:group', 'media:group'],
      ['media:thumbnail', 'media:thumbnail'],
      ['content:encoded', 'content:encoded'],
      ['itunes:image', 'itunes:image'],
      'enclosure',
      'image'
    ],
    feed: [
      'image'
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

// Define our focused list of sources specific to FemTech
// NOTE: For some sources, you'll need to create RSS.app feeds if direct RSS isn't available
export const sources: Source[] = [
  // FemTech News & Innovation sources - specified websites
  {
    name: 'FemTech Insider',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/uhlIq3S7nRyF31Zu.xml',
    category: 'FemTech News & Innovation'
  },
  {
    name: 'FemTech World',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/jOTNliF6GonuLXLj.xml', // Replace with actual RSS URL or RSS.app feed
    category: 'FemTech News & Innovation'
  },
  {
    name: 'FemTech Live',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/jhn1Rq9JDn4YBi50.xml', // Replace with actual RSS URL or RSS.app feed
    category: 'FemTech News & Innovation'
  },
  {
    name: 'Women of Wearables',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/fgP1gfw7eQhLARM0.xml', // Replace with actual RSS URL or RSS.app feed
    category: 'FemTech News & Innovation'
  },
  {
    name: 'Future Fem Health',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/z5MUcYQ7ocqlPkf0.xml', // Replace with actual RSS URL or RSS.app feed
    category: 'FemTech News & Innovation'
  },
  {
    name: 'Women's Health Gov',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/6gH5uGajqWMYV91g.xml', // Replace with actual RSS URL or RSS.app feed
    category: 'FemTech News & Innovation'
  },
  {
    name: 'FemTech Health',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/M1VCLwRreb8msGIC.xml', // Replace with actual RSS URL or RSS.app feed
    category: 'FemTech News & Innovation'
  },
  {
    name: 'FemTech Canada',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/t4UKcveeIrnzb3zT.xml', // Replace with actual RSS URL or RSS.app feed
    category: 'FemTech News & Innovation'
  },
  {
    name: 'Femovate',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/Rv8Y9GNYRATPw4fD.xml', // Replace with actual RSS URL or RSS.app feed
    category: 'FemTech News & Innovation'
  },
  {
    name: 'WHAM Report',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/CaRW8onXU3HLDrGy.xml', // Replace with actual RSS URL or RSS.app feed
    category: 'FemTech News & Innovation'
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
  {
    title: "New Research Reveals Link Between Diet and Menstrual Health",
    link: "https://example.com/article3",
    description: "Study finds certain foods may improve symptoms of menstrual discomfort for many women.",
    date: new Date('2023-08-10'),
    sourceName: "FemTech World",
    category: "FemTech News & Innovation",
    guid: "sample-3"
  },
  {
    title: "The Science of Fertility Tracking: Beyond the Calendar Method",
    link: "https://example.com/article4",
    description: "Modern approaches to understanding your fertility window using technology and biomarkers.",
    date: new Date('2023-08-05'),
    sourceName: "FemTech Focus",
    category: "FemTech News & Innovation",
    guid: "sample-4"
  },
  {
    title: "Managing Menopause Symptoms: New Approaches",
    link: "https://example.com/article5",
    description: "Innovative techniques and lifestyle changes to address common menopause challenges.",
    date: new Date('2023-08-03'),
    sourceName: "Future Fem Health",
    category: "FemTech News & Innovation",
    guid: "sample-5"
  },
  {
    title: "The Connection Between Stress and Women's Health",
    link: "https://example.com/article6",
    description: "How chronic stress affects women differently and strategies for better stress management.",
    date: new Date('2023-07-28'),
    sourceName: "Women of Wearables",
    category: "FemTech News & Innovation",
    guid: "sample-6"
  }
];

/**
 * Extract image URL from RSS item with extensive pattern matching
 */
function extractImageFromRSSItem(item) {
  // Log the item structure to understand what's available
  console.log('Extracting image from item with keys:', Object.keys(item));

  // Check for direct image URL in media:content
  if (item['media:content']) {
    console.log('Found media:content:', typeof item['media:content']);
    
    // Handle media:content as an object
    if (typeof item['media:content'] === 'object' && item['media:content'].$ && item['media:content'].$.url) {
      console.log('Found image in media:content object:', item['media:content'].$.url);
      return item['media:content'].$.url;
    }
    
    // Handle media:content as an array
    if (Array.isArray(item['media:content']) && item['media:content'][0]) {
      if (item['media:content'][0].$ && item['media:content'][0].$.url) {
        console.log('Found image in media:content array:', item['media:content'][0].$.url);
        return item['media:content'][0].$.url;
      }
    }
  }
  
  // Check for RSS.app specific content:encoded pattern
  if (item['content:encoded']) {
    console.log('Found content:encoded, length:', item['content:encoded'].length);
    
    // Try to find image in various patterns
    const patterns = [
      /<img[^>]+src="([^">]+)"/i,
      /<figure[^\>]*>[\\s\\S]*?<img[^\>]+src="([^"\>]+)"[^\>]*>[\\s\\S]*?<\/figure>/i,
      /<div class="rss-app-image"[^\>]*>[\\s\\S]*?<img[^\>]+src="([^"\>]+)"[^\>]*>/i
    ];
    
    for (const pattern of patterns) {
      const match = item['content:encoded'].match(pattern);
      if (match && match[1]) {
        console.log('Found image in content:encoded using pattern:', match[1]);
        return match[1];
      }
    }
  }
  
  // Check for media:thumbnail
  if (item['media:thumbnail']) {
    if (typeof item['media:thumbnail'] === 'object' && item['media:thumbnail'].$ && item['media:thumbnail'].$.url) {
      console.log('Found image in media:thumbnail:', item['media:thumbnail'].$.url);
      return item['media:thumbnail'].$.url;
    }
  }
  
  // Check for media:group containing thumbnails (common in RSS.app)
  if (item['media:group']) {
    console.log('Found media:group:', typeof item['media:group']);
    
    if (item['media:group']['media:thumbnail'] && item['media:group']['media:thumbnail'].$ && 
        item['media:group']['media:thumbnail'].$.url) {
      console.log('Found image in media:group/media:thumbnail:', item['media:group']['media:thumbnail'].$.url);
      return item['media:group']['media:thumbnail'].$.url;
    }
  }
  
  // Check for enclosure
  if (item.enclosure) {
    if (typeof item.enclosure === 'object' && item.enclosure.url) {
      console.log('Found image in enclosure:', item.enclosure.url);
      return item.enclosure.url;
    }
    
    if (Array.isArray(item.enclosure) && item.enclosure[0] && item.enclosure[0].url) {
      console.log('Found image in enclosure array:', item.enclosure[0].url);
      return item.enclosure[0].url;
    }
  }
  
  // Check for image in item.content
  if (item.content) {
    const imgMatch = typeof item.content === 'string' ? item.content.match(/<img[^>]+src="([^">]+)"/i) : null;
    if (imgMatch && imgMatch[1]) {
      console.log('Found image in content:', imgMatch[1]);
      return imgMatch[1];
    }
  }
  
  // Check for image in contentSnippet
  if (item.contentSnippet) {
    const imgMatch = typeof item.contentSnippet === 'string' ? 
      item.contentSnippet.match(/<img[^>]+src="([^">]+)"/i) : null;
    if (imgMatch && imgMatch[1]) {
      console.log('Found image in contentSnippet:', imgMatch[1]);
      return imgMatch[1];
    }
  }
  
  // Check for image in description
  if (item.description) {
    const imgMatch = typeof item.description === 'string' ? 
      item.description.match(/<img[^>]+src="([^">]+)"/i) : null;
    if (imgMatch && imgMatch[1]) {
      console.log('Found image in description:', imgMatch[1]);
      return imgMatch[1];
    }
  }
  
  // Check for itunes:image
  if (item['itunes:image'] && item['itunes:image'].href) {
    console.log('Found image in itunes:image:', item['itunes:image'].href);
    return item['itunes:image'].href;
  }
  
  // Try to find image in any other object property that might contain an image URL
  for (const key in item) {
    if (
      typeof item[key] === 'string' && 
      (
        item[key].startsWith('http') && 
        (item[key].endsWith('.jpg') || item[key].endsWith('.jpeg') || 
         item[key].endsWith('.png') || item[key].endsWith('.gif'))
      )
    ) {
      console.log(`Found potential image URL in item.${key}:`, item[key]);
      return item[key];
    }
  }
  
  console.log('No image found in item');
  return null;
}

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
    
    // Debug: Log a sample of the raw RSS content
    console.log(`Raw RSS sample from ${source.name}:`, text.substring(0, 300) + '...');
    
    const feed = await rssParser.parseString(text);
    
    // Debug: Log the first item structure
    if (feed.items && feed.items.length > 0) {
      console.log(`First item from ${source.name}:`, JSON.stringify(feed.items[0], null, 2).substring(0, 500) + '...');
    }
    
    let items = feed.items.map(item => {
      // Extract image from the item
      const imageUrl = extractImageFromRSSItem(item);
      
      // Debug: Log whether we found an image
      console.log(`Image found for "${item.title?.substring(0, 30)}...": ${imageUrl || 'No image found'}`);
      
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
    
    // Debug: Log a summary of items with images
    const withImages = items.filter(item => !!item.image).length;
    console.log(`${source.name}: Found ${withImages} items with images out of ${items.length} total`);

    return items;
  } catch (error) {
    console.error(`Error fetching RSS feed from ${source.name}:`, error);
    updateSourceHealth(source, 'error');
    return sampleNewsItems.filter(item => item.sourceName === source.name || item.category === source.category).slice(0, 5);
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
    return sampleNewsItems.filter(item => item.sourceName === source.name || item.category === source.category).slice(0, 5);
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
