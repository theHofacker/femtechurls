import axios from 'axios';
import Parser from 'rss-parser';
import { format, parseISO } from 'date-fns';

// Initialize RSS parser
const rssParser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

// Define NewsItem interface
export interface NewsItem {
  title: string;
  description: string;
  date: Date;
  sourceName: string;
  category: string;
  link: string;
  guid: string;
}

// Define Source interface
export interface Source {
  name: string;
  type: 'devto' | 'rss' | 'github' | 'hackernews';
  endpoint: string;
  category: string;
}

// Source health status
export interface SourceHealth {
  status: 'active' | 'error' | 'inactive';
  lastChecked: Date;
  errorMessage?: string;
}

// Category-specific keywords
const categoryKeywords = {
  'Tech News': ['technology', 'tech', 'digital', 'innovation', 'ai', 'artificial intelligence', 'femtech', 'women in tech'],
  'Career Development': ['career', 'job', 'leadership', 'management', 'professional', 'mentor', 'salary', 'promotion', 'skills'],
  'Community Updates': ['community', 'event', 'conference', 'meetup', 'diversity', 'inclusion', 'dei', 'advocacy'],
  'Technical Tutorials': ['tutorial', 'guide', 'how to', 'learn', 'code', 'programming', 'development', 'software', 'engineering'],
  'Founder Stories': ['founder', 'startup', 'entrepreneur', 'venture', 'funding', 'business', 'ceo', 'launch']
};

// Women in tech specific keywords
const womenInTechKeywords = [
  'women', 'woman', 'female', 'gender', 'diversity', 'inclusion',
  'femtech', 'girls who code', 'women who code', 'ladies', 'she',
  'her', 'maternity', 'maternal', 'pregnancy', 'girl'
];

// Define sources
export const sources: Source[] = [
  // Tech News Category
  {
    name: 'FemTech Insider',
    type: 'rss',
    endpoint: 'https://femtechinsider.com/feed/',
    category: 'Tech News'
  },
  {
    name: 'FemTech Live',
    type: 'rss',
    endpoint: 'https://femtech.live/feed/',
    category: 'Tech News'
  },
  {
    name: 'FemTech Focus',
    type: 'rss',
    endpoint: 'https://femtechfocus.org/feed/',
    category: 'Tech News'
  },
  {
    name: 'HIT Consultant',
    type: 'rss',
    endpoint: 'https://hitconsultant.net/tag/femtech/feed/',
    category: 'Tech News'
  },
  {
    name: 'Women In Tech Review',
    type: 'rss',
    endpoint: 'https://womenintech.co.uk/feed/',
    category: 'Tech News'
  },
  {
    name: 'WomenTech Network',
    type: 'rss',
    endpoint: 'https://www.womentech.net/feed',
    category: 'Tech News'
  },
  
  // Career Development Category
  {
    name: 'Women of Wearables',
    type: 'rss',
    endpoint: 'https://www.womenofwearables.com/blog?format=rss',
    category: 'Career Development'
  },
  {
    name: 'Elvie Blog',
    type: 'rss',
    endpoint: 'https://www.elvie.com/en-us/blog/feed',
    category: 'Career Development'
  },
  {
    name: 'PowerToFly Blog',
    type: 'rss',
    endpoint: 'https://blog.powertofly.com/feed',
    category: 'Career Development'
  },
  {
    name: 'Career Growth',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=career&per_page=10',
    category: 'Career Development'
  },
  {
    name: 'Tech Leadership',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=leadership&per_page=10',
    category: 'Career Development'
  },
  
  // Community Updates Category
  {
    name: 'FemTech Focus',
    type: 'rss',
    endpoint: 'https://femtechfocus.org/feed/',
    category: 'Community Updates'
  },
  {
    name: 'Ovia Health',
    type: 'rss',
    endpoint: 'https://www.oviahealth.com/blog/feed/',
    category: 'Community Updates'
  },
  {
    name: 'Women in Technology International',
    type: 'rss',
    endpoint: 'https://witi.com/feed/',
    category: 'Community Updates'
  },
  {
    name: 'Ada\'s List Blog',
    type: 'rss',
    endpoint: 'https://adaslist.co/blog?format=rss',
    category: 'Community Updates'
  },
  {
    name: 'Women In Tech',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=womenintech&per_page=10',
    category: 'Community Updates'
  },
  {
    name: 'Community News',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=community&per_page=10', 
    category: 'Community Updates'
  },
  
  // Technical Tutorials Category
  {
    name: 'Women Who Code',
    type: 'rss',
    endpoint: 'https://www.womenwhocode.com/blog/feed',
    category: 'Technical Tutorials'
  },
  {
    name: 'Code Like A Girl',
    type: 'rss',
    endpoint: 'https://medium.com/feed/code-like-a-girl',
    category: 'Technical Tutorials'
  },
  {
    name: 'She Can Code',
    type: 'rss',
    endpoint: 'https://shecancode.io/stories?format=rss',
    category: 'Technical Tutorials'
  },
  {
    name: 'Programming Tips',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=beginners&per_page=10',
    category: 'Technical Tutorials'
  },
  {
    name: 'Coding Tutorials',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=tutorial&per_page=10',
    category: 'Technical Tutorials'
  },
  
  // Founder Stories Category
  {
    name: 'Femovate',
    type: 'rss',
    endpoint: 'https://www.femovate.com/feed/',
    category: 'Founder Stories'
  },
  {
    name: 'FutureFemHealth',
    type: 'rss',
    endpoint: 'https://www.futurefemhealth.com/feed',
    category: 'Founder Stories'
  },
  {
    name: 'Women in Startups',
    type: 'rss',
    endpoint: 'https://medium.com/feed/women-in-startups',
    category: 'Founder Stories'
  },
  {
    name: 'Startup Stories',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=startup&per_page=10',
    category: 'Founder Stories'
  },
  {
    name: 'Founder Insights',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=entrepreneurship&per_page=10',
    category: 'Founder Stories'
  }
];

// Sample data for fallbacks
export const sampleNewsItems: NewsItem[] = [
  {
    title: 'Women in Tech: Breaking Barriers and Building Futures',
    description: 'An exploration of the challenges and opportunities for women in the technology sector today.',
    date: new Date('2023-08-15'),
    sourceName: 'FemTech Insider',
    category: 'Tech News',
    link: 'https://example.com/article1',
    guid: 'sample-1'
  },
  {
    title: 'The Rise of Women-Led Startups in 2023',
    description: 'How female founders are changing the startup landscape with innovative approaches to technology and business.',
    date: new Date('2023-08-10'),
    sourceName: 'Femovate',
    category: 'Founder Stories',
    link: 'https://example.com/article2',
    guid: 'sample-2'
  },
  {
    title: 'Essential Career Skills for Women in Tech Leadership',
    description: 'Key competencies and strategies for women aiming for leadership positions in technology companies.',
    date: new Date('2023-08-05'),
    sourceName: 'Women of Wearables',
    category: 'Career Development',
    link: 'https://example.com/article3',
    guid: 'sample-3'
  },
  {
    title: 'Mastering React: A Guide for Female Developers',
    description: 'Step-by-step tutorial on building complex applications with React, designed to be inclusive for all skill levels.',
    date: new Date('2023-07-28'),
    sourceName: 'Women Who Code',
    category: 'Technical Tutorials',
    link: 'https://example.com/article4',
    guid: 'sample-4'
  },
  {
    title: 'Global Women in Tech Summit Announces 2023 Speakers',
    description: 'Preview of the upcoming international conference highlighting achievements of women in technology.',
    date: new Date('2023-07-20'),
    sourceName: 'WomenTech Network',
    category: 'Community Updates',
    link: 'https://example.com/article5',
    guid: 'sample-5'
  },
  {
    title: 'The Future of FemTech: Innovations Transforming Women\'s Health',
    description: 'Exploring the latest technological advances designed specifically for women\'s health and wellness needs.',
    date: new Date('2023-07-15'),
    sourceName: 'FemTech Live',
    category: 'Tech News',
    link: 'https://example.com/article6',
    guid: 'sample-6'
  },
  {
    title: 'From Engineer to CEO: One Woman\'s Journey in Silicon Valley',
    description: 'The inspiring story of a female engineer who built a tech empire from the ground up.',
    date: new Date('2023-07-10'),
    sourceName: 'Female Founders Fund',
    category: 'Founder Stories',
    link: 'https://example.com/article7',
    guid: 'sample-7'
  },
  {
    title: 'Building Community: Women Supporting Women in Tech',
    description: 'How community initiatives are creating support networks for women at all stages of their tech careers.',
    date: new Date('2023-07-05'),
    sourceName: 'Ada\'s List Blog',
    category: 'Community Updates',
    link: 'https://example.com/article8',
    guid: 'sample-8'
  },
  {
    title: 'Python for Data Science: A Beginner\'s Tutorial',
    description: 'An accessible introduction to using Python for data analysis and visualization, with examples relevant to women researchers.',
    date: new Date('2023-06-28'),
    sourceName: 'Code Like A Girl',
    category: 'Technical Tutorials',
    link: 'https://example.com/article9',
    guid: 'sample-9'
  },
  {
    title: 'Negotiation Strategies for Women in Tech',
    description: 'Practical advice for salary negotiations and career advancement specific to the challenges women face in technology fields.',
    date: new Date('2023-06-20'),
    sourceName: 'PowerToFly Blog',
    category: 'Career Development',
    link: 'https://example.com/article10',
    guid: 'sample-10'
  }
];

// Cache for feed data
const feedCache = new Map<string, { data: NewsItem[], timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Source health tracking
const sourceHealth = new Map<string, SourceHealth>();

/**
 * Updates the health status of a source
 */
function updateSourceHealth(source: Source, status: 'active' | 'error' | 'inactive', errorMessage?: string): void {
  sourceHealth.set(source.name, {
    status,
    lastChecked: new Date(),
    errorMessage
  });
}

/**
 * Gets cached feed data if available and not expired
 */
function getCachedFeed(source: Source): NewsItem[] | null {
  const cached = feedCache.get(source.endpoint);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

/**
 * Updates the cache with new feed data
 */
function updateCache(source: Source, data: NewsItem[]): void {
  feedCache.set(source.endpoint, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Filters content to ensure it's relevant to both women in tech and the specified category
 */
function filterContentByCategory(items: NewsItem[], category: string): NewsItem[] {
  return items.filter(item => {
    const titleLower = item.title.toLowerCase();
    const descLower = item.description.toLowerCase();
    
    // For women-specific sources, we only need to filter by category
    const matchesCategory = categoryKeywords[category]?.some(keyword => 
      titleLower.includes(keyword) || descLower.includes(keyword)
    ) || false;
    
    // For general tech sources, we need both women and category matches
    const matchesWomenInTech = womenInTechKeywords.some(keyword => 
      titleLower.includes(keyword) || descLower.includes(keyword)
    );
    
    // List of general tech sources that need dual filtering
    const generalTechSources = ['TechCrunch', 'Wired', 'The Verge', 'VentureBeat'];
    
    // If it's a general source, require both women and category matches
    // If it's a women-specific source, only require category match
    if (generalTechSources.includes(item.sourceName)) {
      return matchesWomenInTech && matchesCategory;
    } else {
      // For women-specific sources, we assume the content is already women-focused
      // So we only check category relevance, but more leniently (don't require an exact match)
      return matchesCategory || category === 'Tech News';  // Default to Tech News if no matches
    }
  });
}

/**
 * Fetches articles from DEV.to API
 */
async function fetchFromDevTo(source: Source): Promise<NewsItem[]> {
  try {
    const response = await axios.get(source.endpoint);
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format from DEV.to API');
    }
    
    return response.data.map(item => ({
      title: item.title,
      description: item.description || '',
      date: new Date(item.published_at),
      sourceName: source.name,
      category: source.category,
      link: item.url,
      guid: item.id.toString()
    }));
  } catch (error) {
    console.error(`Error fetching from DEV.to (${source.name}):`, error);
    updateSourceHealth(source, 'error', error instanceof Error ? error.message : 'Unknown error');
    return sampleNewsItems.filter(item => item.category === source.category).slice(0, 5);
  }
}

/**
 * Fetches articles from RSS feeds
 */
async function fetchFromRSS(source: Source): Promise<NewsItem[]> {
  try {
    const feed = await rssParser.parseURL(source.endpoint);
    
    if (!feed.items || !Array.isArray(feed.items)) {
      throw new Error('Invalid RSS feed format');
    }
    
    let items = feed.items.map(item => ({
      title: item.title || 'Untitled',
      link: item.link || '',
      description: item.contentSnippet || item.content || '',
      date: item.isoDate ? new Date(item.isoDate) : new Date(),
      sourceName: source.name,
      category: source.category,
      guid: item.guid || item.link || ''
    }));
    
    // Apply category filtering for general tech sources
    const generalTechSources = ['TechCrunch', 'Wired', 'The Verge', 'VentureBeat'];
    if (generalTechSources.includes(source.name)) {
      items = filterContentByCategory(items, source.category);
    }
    
    return items;
  } catch (error) {
    console.error(`Error fetching RSS feed from ${source.name}:`, error);
    updateSourceHealth(source, 'error', error instanceof Error ? error.message : 'Unknown error');
    return sampleNewsItems.filter(item => item.category === source.category).slice(0, 5);
  }
}

/**
 * Main function to fetch from any source type
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
    updateSourceHealth(source, 'error', error instanceof Error ? error.message : 'Unknown error');
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
 * Gets all active categories
 */
export function getCategories(): string[] {
  return Array.from(new Set(sources.map(source => source.category)));
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string): string {
  try {
    if (!date) return 'Unknown date';
    
    // Handle string dates
    if (typeof date === 'string') {
      // Try to parse the date
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
