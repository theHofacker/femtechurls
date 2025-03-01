import axios from 'axios';
import { parseISO, format } from 'date-fns';
import Parser from 'rss-parser';

export interface NewsItem {
  title: string;
  description: string;
  date: string;
  source: string;
  url: string;
  imageUrl?: string;
  category: string;
}

interface DevToArticle {
  title: string;
  description: string;
  published_at: string;
  user: {
    name: string;
  };
  url: string;
  cover_image: string;
  tag_list: string[];
}

interface GitHubRepo {
  name: string;
  description: string;
  created_at: string;
  owner: {
    login: string;
  };
  html_url: string;
  topics: string[];
}

export interface Source {
  name: string;
  type: 'rss' | 'devto' | 'github';
  endpoint: string;
  category: string;
}

// Initialize RSS parser
const rssParser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

export const sources: Source[] = [
  // Tech News Category
  {
    name: 'FemTech Insider',
    type: 'rss',
    endpoint: 'https://femtechinsider.com/feed/',
    category: 'tech-news'
  },
  {
    name: 'FemTech Live',
    type: 'rss',
    endpoint: 'https://femtech.live/feed/',
    category: 'tech-news'
  },
  {
    name: 'FemTech Focus',
    type: 'rss',
    endpoint: 'https://femtechfocus.org/feed/',
    category: 'tech-news'
  },
  {
    name: 'HIT Consultant',
    type: 'rss',
    endpoint: 'https://hitconsultant.net/tag/femtech/feed/',
    category: 'tech-news'
  },
  
  // Career Development Category
  {
    name: 'Women of Wearables',
    type: 'rss',
    endpoint: 'https://www.womenofwearables.com/blog?format=rss',
    category: 'career-development'
  },
  {
    name: 'Career Growth',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=career&per_page=10',
    category: 'career-development'
  },
  {
    name: 'Tech Leadership',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=leadership&per_page=10',
    category: 'career-development'
  },
  
  // Community Updates Category
  {
    name: 'Women In Tech',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=womenintech&per_page=10',
    category: 'community-updates'
  },
  {
    name: 'Community News',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=community&per_page=10', 
    category: 'community-updates'
  },
  
  // Technical Tutorials Category
  {
    name: 'Programming Tips',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=beginners&per_page=10',
    category: 'technical-tutorials'
  },
  {
    name: 'Coding Tutorials',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=tutorial&per_page=10',
    category: 'technical-tutorials'
  },
  
  // Founder Stories Category
  {
    name: 'Startup Stories',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=startup&per_page=10',
    category: 'founder-stories'
  },
  {
    name: 'Founder Insights',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=entrepreneurship&per_page=10',
    category: 'founder-stories'
  }
];

const CATEGORIES = [
  'tech-news',
  'career-development',
  'community-updates',
  'technical-tutorials',
  'founder-stories'
];

// Cache for feed data
const feedCache = new Map<string, { data: NewsItem[], timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Source health tracking
const sourceHealth = new Map<string, { status: 'active' | 'error', message?: string }>();

// Get cached feed data if available and not expired
function getCachedFeed(source: Source): NewsItem[] | null {
  const cacheKey = `${source.type}-${source.name}`;
  const cached = feedCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`Using cached data for ${source.name}`);
    return cached.data;
  }
  
  return null;
}

// Update cache with new feed data
function updateCache(source: Source, data: NewsItem[]): void {
  const cacheKey = `${source.type}-${source.name}`;
  feedCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

// Update source health status
function updateSourceHealth(source: Source, status: 'active' | 'error', message?: string): void {
  sourceHealth.set(source.name, { status, message });
}

// Helper function to strip HTML tags
function stripHtml(html: string): string {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  } else {
    // Fallback for server-side
    return html.replace(/<[^>]*>?/gm, '');
  }
}

function extractImageFromContent(content: string): string | undefined {
  // Simple regex to extract the first image URL from HTML content
  const imgMatch = content?.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : undefined;
}

// Updated function to handle RSS feeds using rss-parser
async function fetchFromRSS(source: Source): Promise<NewsItem[]> {
  try {
    const feed = await rssParser.parseURL(source.endpoint);
    
    return feed.items.map(item => ({
      title: item.title || 'Untitled',
      description: item.contentSnippet || item.content || '',
      date: item.isoDate || item.pubDate || new Date().toISOString(),
      source: source.name,
      url: item.link || '',
      imageUrl: extractImageFromContent(item.content || item['contentEncoded']),
      category: source.category
    }));
  } catch (error) {
    console.error(`Error fetching RSS feed from ${source.name}:`, error);
    const { getSampleNews } = await import('./sampleData');
    const sampleNews = getSampleNews();
    return sampleNews.filter(item => item.category === source.category).slice(0, 5);
  }
}

async function fetchDevToArticles(source: Source): Promise<NewsItem[]> {
  console.log(`Fetching Dev.to articles from: ${source.endpoint}`);
  
  // Check cache first
  const cached = getCachedFeed(source);
  if (cached) return cached;
  
  try {
    const response = await axios.get<DevToArticle[]>(source.endpoint);
    console.log(`Received ${response.data.length} articles from Dev.to`);
    
    const items = response.data.map(article => ({
      title: article.title,
      description: article.description || '',
      date: article.published_at,
      source: source.name,
      url: article.url,
      imageUrl: article.cover_image,
      category: source.category
    }));
    
    updateCache(source, items);
    updateSourceHealth(source, 'active');
    return items;
  } catch (error) {
    console.error(`Error fetching from Dev.to (${source.name}):`, error);
    updateSourceHealth(source, 'error', error instanceof Error ? error.message : 'Unknown error');
    
    // Return sample data as fallback
    const { getSampleNews } = await import('./sampleData');
    const sampleNews = getSampleNews();
    return sampleNews.filter(item => item.category === source.category).slice(0, 5);
  }
}

async function fetchGitHubTrending(source: Source): Promise<NewsItem[]> {
  console.log(`Fetching GitHub trending repositories from: ${source.endpoint}`);
  
  // Check cache first
  const cached = getCachedFeed(source);
  if (cached) return cached;
  
  try {
    const response = await axios.get<{ items: GitHubRepo[] }>(
      source.endpoint,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );
    
    console.log(`Received ${response.data.items.length} repositories from GitHub`);
    const items = response.data.items.slice(0, 10).map(repo => ({
      title: repo.name,
      description: repo.description || '',
      date: repo.created_at,
      source: source.name,
      url: repo.html_url,
      category: source.category
    }));
    
    updateCache(source, items);
    updateSourceHealth(source, 'active');
    return items;
  } catch (error) {
    console.error(`Error fetching from GitHub (${source.name}):`, error);
    updateSourceHealth(source, 'error', error instanceof Error ? error.message : 'Unknown error');
    
    // Return sample data as fallback
    const { getSampleNews } = await import('./sampleData');
    const sampleNews = getSampleNews();
    return sampleNews.filter(item => item.category === source.category).slice(0, 5);
  }
}

// Update the main fetchFeed function to handle the appropriate type
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
        items = await fetchDevToArticles(source);
        break;
      case 'github':
        items = await fetchGitHubTrending(source);
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
    
    // Return sample data as fallback
    const { getSampleNews } = await import('./sampleData');
    const sampleNews = getSampleNews();
    return sampleNews.filter(item => item.category === source.category).slice(0, 5);
  }
}

async function fetchSourceData(source: Source): Promise<NewsItem[]> {
  return fetchFeed(source);
}

export async function fetchNewsByCategory(category: string): Promise<NewsItem[]> {
  console.log(`Fetching news for category: ${category}`);
  
  try {
    // Filter sources by category
    const categorySources = sources.filter(source => source.category === category);
    console.log(`Found ${categorySources.length} sources for category ${category}`);
    
    // Fetch from all sources for this category
    const fetchPromises = categorySources.map(source => fetchSourceData(source));
    const results = await Promise.allSettled(fetchPromises);
    
    // Combine all successful results
    let allNews: NewsItem[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allNews = [...allNews, ...result.value];
      } else {
        console.error(`Failed to fetch from ${categorySources[index].name}:`, result.reason);
      }
    });
    
    console.log(`Total items fetched for ${category}: ${allNews.length}`);

    // Sort by date
    allNews.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (allNews.length === 0) {
      console.log(`No items found for ${category}, using sample data`);
      const { getSampleNews } = await import('./sampleData');
      const sampleNews = getSampleNews();
      return sampleNews.filter(item => item.category === category);
    }

    return allNews;
  } catch (error) {
    console.error('Error fetching news:', error);
    // Return sample data as fallback
    console.log('Falling back to sample data');
    const { getSampleNews } = await import('./sampleData');
    const sampleNews = getSampleNews();
    return sampleNews.filter(item => item.category === category);
  }
}

export async function fetchNews(category?: string): Promise<NewsItem[]> {
  try {
    if (category) {
      return fetchNewsByCategory(category);
    }
    
    // Fetch from all sources
    const fetchPromises = sources.map(source => fetchSourceData(source));
    const results = await Promise.allSettled(fetchPromises);
    
    // Combine all successful results
    let allNews: NewsItem[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allNews = [...allNews, ...result.value];
      } else {
        console.error(`Failed to fetch from ${sources[index].name}:`, result.reason);
      }
    });
    
    console.log(`Total items fetched: ${allNews.length}`);

    // Sort by date
    allNews.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (allNews.length === 0) {
      console.log('No items found, using sample data');
      const { getSampleNews } = await import('./sampleData');
      return getSampleNews();
    }

    return allNews;
  } catch (error) {
    console.error('Error fetching news:', error);
    // Return sample data as fallback
    const { getSampleNews } = await import('./sampleData');
    const sampleNews = getSampleNews();
    return category ? sampleNews.filter(item => item.category === category) : sampleNews;
  }
}

export function formatDate(date: string): string {
  try {
    return format(parseISO(date), 'MMM d, yyyy');
  } catch (error) {
    // Fallback for invalid dates
    return 'Recent';
  }
}
    return 'Recent';
  }
}
