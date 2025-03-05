import { parseISO, format, formatDistanceToNow } from 'date-fns';
import Parser from 'rss-parser';

// Initialize RSS parser
const rssParser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['content:encoded', 'contentEncoded']
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

// Expanded keywords for better filtering
const categoryKeywords = {
  'FemTech News & Innovation': ['femtech', 'women\'s health', 'technology', 'innovation', 'digital health', 'health tech', 'startup', 'product', 'launch'],
  'Reproductive & Maternal Health': ['pregnancy', 'fertility', 'menstrual', 'period', 'maternal', 'birth', 'mother', 'prenatal', 'postnatal', 'baby', 'breastfeeding', 'cycle'],
  'Women\'s Health & Wellness': ['health', 'wellness', 'nutrition', 'fitness', 'mental health', 'menopause', 'hormones', 'selfcare', 'wellbeing', 'healthcare'],
  'Women in Tech & Leadership': ['women in tech', 'leadership', 'diversity', 'inclusion', 'representation', 'tech industry', 'women leaders', 'women entrepreneurs'],
  'Career & Professional Development': ['career', 'job', 'professional', 'skills', 'resume', 'interview', 'promotion', 'salary', 'negotiation', 'workplace'],
  'Tech Education & Skills': ['education', 'learning', 'tutorial', 'coding', 'programming', 'development', 'software', 'engineering', 'tech skills']
};

// Women in tech and femtech specific keywords
const femtechKeywords = [
  'women', 'woman', 'female', 'gender', 'diversity', 'inclusion', 'equity',
  'femtech', 'girls who code', 'women who code', 'ladies', 'she', 'her', 
  'maternity', 'maternal', 'pregnancy', 'girl', 'feminine', 'gender gap',
  'gender bias', 'glass ceiling', 'equal pay', 'representation', 'menstrual',
  'fertility', 'menopause', 'reproductive', 'maternal'
];

// Define our comprehensive list of sources organized by new categories
export const sources: Source[] = [
  // FemTech News & Innovation
  {
    name: 'FemTech Insider',
    type: 'rss',
    endpoint: 'https://femtechinsider.com/feed/',
    category: 'FemTech News & Innovation'
  },
  {
    name: 'FemTech Live',
    type: 'rss',
    endpoint: 'https://femtech.live/feed/',
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
  
  // Women in Tech & Leadership
  {
    name: 'Women in Tech (UK)',
    type: 'rss',
    endpoint: 'https://womenintech.co.uk/feed/',
    category: 'Women in Tech & Leadership'
  },
  {
    name: 'Women in Cloud',
    type: 'rss',
    endpoint: 'https://womenincloud.com/feed/',
    category: 'Women in Tech & Leadership'
  },
  {
    name: 'AnitaB.org',
    type: 'rss',
    endpoint: 'https://anitab.org/feed/',
    category: 'Women in Tech & Leadership'
  },
  {
    name: 'Black Tech Women',
    type: 'rss',
    endpoint: 'https://medium.com/feed/blacktechwomen',
    category: 'Women in Tech & Leadership'
  },
  {
    name: 'Joylux - Women We Admire',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/RFDlQehrDn2nw7lC.xml',
    category: 'Women in Tech & Leadership'
  },
  {
    name: 'Women In Tech Dev',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=womenintech&per_page=10',
    category: 'Women in Tech & Leadership'
  },
  {
    name: 'Tech Leadership',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=leadership&per_page=10',
    category: 'Women in Tech & Leadership'
  },
  
  // Career & Professional Development
  {
    name: 'Ladies Get Paid',
    type: 'rss',
    endpoint: 'https://ladiesgetpaid.com/feed/',
    category: 'Career & Professional Development'
  },
  {
    name: 'Women in Product',
    type: 'rss',
    endpoint: 'https://www.womenpm.org/feed',
    category: 'Career & Professional Development'
  },
  {
    name: 'Maven Clinic - Career',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/V3sweXLyvLhqR2DX.xml',
    category: 'Career & Professional Development'
  },
  {
    name: 'She Can Code - Career Advice',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/qwHYGqXQ1ODPCGyj.xml',
    category: 'Career & Professional Development'
  },
  {
    name: 'Hire Tech Ladies',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/clQVJ9Ji7yPmBW2Z.xml',
    category: 'Career & Professional Development'
  },
  {
    name: 'Career Growth',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=career&per_page=10',
    category: 'Career & Professional Development'
  },
  
  // Tech Education & Skills
  {
    name: 'Code First Girls',
    type: 'rss',
    endpoint: 'https://codefirstgirls.com/feed/',
    category: 'Tech Education & Skills'
  },
  {
    name: 'Code Like A Girl',
    type: 'rss',
    endpoint: 'https://medium.com/feed/code-like-a-girl',
    category: 'Tech Education & Skills'
  },
  {
    name: 'Girls Who Code Tech Blog',
    type: 'rss',
    endpoint: 'https://girlswhocode.medium.com/feed',
    category: 'Tech Education & Skills'
  },
  {
    name: 'She Geeks Out',
    type: 'rss',
    endpoint: 'https://shegeeksout.com/feed/',
    category: 'Tech Education & Skills'
  },
  {
    name: 'She Can Code',
    type: 'rss',
    endpoint: 'https://rss.app/feeds/6sobZsVsrj197cmH.xml',
    category: 'Tech Education & Skills'
  },
  {
    name: 'Coding Tutorials',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=tutorial&per_page=10',
    category: 'Tech Education & Skills'
  },
  {
    name: 'Programming Tips',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=beginners&per_page=10',
    category: 'Tech Education & Skills'
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
    sourceName: "FemTech Live",
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
  },
  
  // Women in Tech & Leadership
  {
    title: "Breaking the Glass Ceiling: Women Leaders in Health Tech",
    link: "https://example.com/article7",
    description: "Profiles of women who are transforming healthcare through innovative technology solutions.",
    date: new Date('2023-07-20'),
    sourceName: "Women in Tech",
    category: "Women in Tech & Leadership",
    guid: "sample-7"
  },
  {
    title: "Diversity in FemTech: Why Representation Matters",
    link: "https://example.com/article8",
    description: "How diverse teams create more effective solutions for women's health challenges.",
    date: new Date('2023-07-18'),
    sourceName: "Black Tech Women",
    category: "Women in Tech & Leadership",
    guid: "sample-8"
  },
  
  // Career & Professional Development
  {
    title: "Navigating Career Transitions in Health Technology",
    link: "https://example.com/article9",
    description: "Strategies for women looking to move into health tech from other industries.",
    date: new Date('2023-07-15'),
    sourceName: "Ladies Get Paid",
    category: "Career & Professional Development",
    guid: "sample-9"
  },
  {
    title: "Salary Negotiation Tactics for Women in FemTech",
    link: "https://example.com/article10",
    description: "Expert advice on how to advocate for fair compensation in the growing FemTech sector.",
    date: new Date('2023-07-12'),
    sourceName: "Career Growth",
    category: "Career & Professional Development",
    guid: "sample-10"
  },
  
  // Tech Education & Skills
  {
    title: "Building Your First FemTech App: A Beginner's Guide",
    link: "https://example.com/article11",
    description: "Step-by-step tutorial for creating a basic women's health tracking application.",
    date: new Date('2023-07-08'),
    sourceName: "Code Like A Girl",
    category: "Tech Education & Skills",
    guid: "sample-11"
  },
  {
    title: "Data Science Skills for Women's Health Innovation",
    link: "https://example.com/article12",
    description: "Essential data analysis techniques being used to advance women's health research and products.",
    date: new Date('2023-07-05'),
    sourceName: "She Can Code",
    category: "Tech Education & Skills",
    guid: "sample-12"
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
 * Filters content to ensure it's relevant to both femtech and the specified category
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
    updateSourceHealth(source, 'error');
    return sampleNewsItems.filter(item => item.category === source.category).slice(0, 5);
  }
}

/**
 * Main function to fetch feed from a source
 */
export async function fetchFeed(source: Source): Promise<NewsItem[]> {
  // For development or preview in Bolt, always return sample data with simulated delay
  if (process.env.NODE_ENV === 'development' || typeof window !== 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 200));
    return sampleNewsItems.filter(item => item.sourceName === source.name || item.category === source.category);
  }
  
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
