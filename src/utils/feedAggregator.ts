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
  'Tech News': ['technology', 'tech', 'digital', 'innovation', 'ai', 'artificial intelligence', 'femtech', 'women in tech', 'startup', 'product', 'launch', 'health tech', 'fintech'],
  'Career Development': ['career', 'job', 'leadership', 'management', 'professional', 'mentor', 'salary', 'promotion', 'skills', 'work', 'employment', 'hiring', 'interview', 'resume'],
  'Community Updates': ['community', 'event', 'conference', 'meetup', 'diversity', 'inclusion', 'dei', 'advocacy', 'networking', 'organization', 'initiative', 'program', 'award'],
  'Technical Tutorials': ['tutorial', 'guide', 'how to', 'learn', 'code', 'programming', 'development', 'software', 'engineering', 'github', 'coding', 'framework', 'language'],
  'Founder Stories': ['founder', 'startup', 'entrepreneur', 'venture', 'funding', 'business', 'ceo', 'launch', 'seed', 'series a', 'investment', 'vc', 'fundraising']
};

// Expanded women in tech specific keywords
const womenInTechKeywords = [
  'women', 'woman', 'female', 'gender', 'diversity', 'inclusion', 'equity',
  'femtech', 'girls who code', 'women who code', 'ladies', 'she', 'her', 
  'maternity', 'maternal', 'pregnancy', 'girl', 'feminine', 'gender gap',
  'gender bias', 'glass ceiling', 'equal pay', 'representation'
];

// Define our comprehensive list of sources
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
    name: 'Women Who Code',
    type: 'rss',
    endpoint: 'https://www.womenwhocode.com/blog/feed',
    category: 'Tech News'
  },
  {
    name: 'Women 2.0',
    type: 'rss',
    endpoint: 'https://women2.com/feed/',
    category: 'Tech News'
  },
  {
    name: 'Women in Tech Review',
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
  // General tech sources (with filtering)
  {
    name: 'TechCrunch',
    type: 'rss',
    endpoint: 'https://techcrunch.com/feed/',
    category: 'Tech News'
  },
  {
    name: 'Wired',
    type: 'rss',
    endpoint: 'https://www.wired.com/feed/rss',
    category: 'Tech News'
  },
  {
    name: 'The Verge',
    type: 'rss',
    endpoint: 'https://www.theverge.com/rss/index.xml',
    category: 'Tech News'
  },
  {
    name: 'VentureBeat',
    type: 'rss',
    endpoint: 'https://venturebeat.com/feed/',
    category: 'Tech News'
  },
  {
    name: 'Women In Tech Dev',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=womenintech&per_page=10',
    category: 'Tech News'
  },
  
  // Career Development Category
  {
    name: 'Ada\'s List',
    type: 'rss',
    endpoint: 'https://adaslist.co/blog?format=rss',
    category: 'Career Development'
  },
  {
    name: 'Ladies Get Paid',
    type: 'rss',
    endpoint: 'https://ladiesgetpaid.com/feed/',
    category: 'Career Development'
  },
  {
    name: 'PowerToFly Blog',
    type: 'rss',
    endpoint: 'https://blog.powertofly.com/feed',
    category: 'Career Development'
  },
  {
    name: 'WITI',
    type: 'rss',
    endpoint: 'https://witi.com/feed/',
    category: 'Career Development'
  },
  {
    name: 'Women of Wearables',
    type: 'rss',
    endpoint: 'https://www.womenofwearables.com/blog?format=rss',
    category: 'Career Development'
  },
  {
    name: 'Women in Cloud',
    type: 'rss',
    endpoint: 'https://womenincloud.com/feed/',
    category: 'Career Development'
  },
  {
    name: 'Elpha Blog',
    type: 'rss',
    endpoint: 'https://elpha.com/blog?format=rss',
    category: 'Career Development'
  },
  {
    name: 'Hire Tech Ladies',
    type: 'rss',
    endpoint: 'https://www.hiretechladies.com/blog?format=rss',
    category: 'Career Development'
  },
  {
    name: 'ThinkHer Ambition',
    type: 'rss',
    endpoint: 'https://www.thinkhera.com/feed/',
    category: 'Career Development'
  },
  {
    name: 'Women in Product',
    type: 'rss',
    endpoint: 'https://www.womenpm.org/feed',
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
    name: 'Women in Tech Chat',
    type: 'rss',
    endpoint: 'https://podcast.womenintechshow.com/rss',
    category: 'Community Updates'
  },
  {
    name: 'Girls Who Code',
    type: 'rss',
    endpoint: 'https://girlswhocode.com/news/feed',
    category: 'Community Updates'
  },
  {
    name: 'Women Who Code Blog',
    type: 'rss',
    endpoint: 'https://www.womenwhocode.com/blog/feed',
    category: 'Community Updates'
  },
  {
    name: 'Girls in Tech',
    type: 'rss',
    endpoint: 'https://girlsintech.org/feed/',
    category: 'Community Updates'
  },
  {
    name: 'Women in Tech World',
    type: 'rss',
    endpoint: 'https://womenintechworldseries.com/feed/',
    category: 'Community Updates'
  },
  {
    name: 'Black Tech Women',
    type: 'rss',
    endpoint: 'https://medium.com/feed/blacktechwomen',
    category: 'Community Updates'
  },
  {
    name: 'AnitaB.org',
    type: 'rss',
    endpoint: 'https://anitab.org/feed/',
    category: 'Community Updates'
  },
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
    name: 'Community News',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=community&per_page=10',
    category: 'Community Updates'
  },
  {
    name: 'Diversity in Tech',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=diversity&per_page=10',
    category: 'Community Updates'
  },
  
  // Technical Tutorials Category
  {
    name: 'She Codes',
    type: 'rss',
    endpoint: 'https://shecodes.com/blog/feed/',
    category: 'Technical Tutorials'
  },
  {
    name: 'Women Who Code Tech Blog',
    type: 'rss',
    endpoint: 'https://medium.com/feed/women-who-code-technical-blog',
    category: 'Technical Tutorials'
  },
  {
    name: 'Code First Girls',
    type: 'rss',
    endpoint: 'https://codefirstgirls.com/feed/',
    category: 'Technical Tutorials'
  },
  {
    name: 'Coding Girls',
    type: 'rss',
    endpoint: 'https://coding-girls.com/feed/',
    category: 'Technical Tutorials'
  },
  {
    name: 'Code Like A Girl',
    type: 'rss',
    endpoint: 'https://medium.com/feed/code-like-a-girl',
    category: 'Technical Tutorials'
  },
  {
    name: 'Girls Who Code Tech Blog',
    type: 'rss',
    endpoint: 'https://girlswhocode.medium.com/feed',
    category: 'Technical Tutorials'
  },
  {
    name: 'She Geeks Out',
    type: 'rss',
    endpoint: 'https://shegeeksout.com/feed/',
    category: 'Technical Tutorials'
  },
  {
    name: 'Hackbright Academy Blog',
    type: 'rss',
    endpoint: 'https://hackbrightacademy.com/blog/feed/',
    category: 'Technical Tutorials'
  },
  {
    name: 'She Can Code',
    type: 'rss',
    endpoint: 'https://shecancode.io/stories?format=rss',
    category: 'Technical Tutorials'
  },
  {
    name: 'Women in Web Dev',
    type: 'rss',
    endpoint: 'https://womeninwebdev.com/feed/',
    category: 'Technical Tutorials'
  },
  {
    name: 'Coding Tutorials',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=tutorial&per_page=10',
    category: 'Technical Tutorials'
  },
  {
    name: 'Programming Tips',
    type: 'devto',
    endpoint: 'https://dev.to/api/articles?tag=beginners&per_page=10',
    category: 'Technical Tutorials'
  },
  
  // Founder Stories Category
  {
    name: 'Female Founders Fund',
    type: 'rss',
    endpoint: 'https://femalefoundersfund.com/feed/',
    category: 'Founder Stories'
  },
  {
    name: 'Women 2.0',
    type: 'rss',
    endpoint: 'https://women2.com/feed',
    category: 'Founder Stories'
  },
  {
    name: 'All Raise',
    type: 'rss',
    endpoint: 'https://allraise.org/feed',
    category: 'Founder Stories'
  },
  {
    name: 'Female Startup Club',
    type: 'rss',
    endpoint: 'https://femalestartupclub.com/feed',
    category: 'Founder Stories'
  },
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
    name: 'Female Founders Alliance',
    type: 'rss',
    endpoint: 'https://foundingmoms.com/feed/',
    category: 'Founder Stories'
  },
  {
    name: 'SheEO',
    type: 'rss',
    endpoint: 'https://sheeo.world/feed/',
    category: 'Founder Stories'
  },
  {
    name: '500 Women',
    type: 'rss',
    endpoint: 'https://500.co/blog/category/women/feed',
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
  // Tech News Category
  {
    title: "Women in Tech: Breaking Barriers and Building Futures",
    link: "https://example.com/article1",
    description: "An exploration of the challenges and opportunities for women in the technology sector today.",
    date: new Date('2023-08-15'),
    sourceName: "FemTech Insider",
    category: "Tech News",
    guid: "sample-1"
  },
  {
    title: "The Latest AI Tools Transforming Women's Health Tech",
    link: "https://example.com/article2",
    description: "How artificial intelligence is revolutionizing femtech and creating new opportunities for innovation.",
    date: new Date('2023-08-12'),
    sourceName: "Women In Tech",
    category: "Tech News",
    guid: "sample-2"
  },
  {
    title: "Microsoft Announces New Initiative for Women in STEM",
    link: "https://example.com/article3",
    description: "The tech giant unveils a $50 million program to support women entering technology fields with scholarships and mentorship.",
    date: new Date('2023-08-10'),
    sourceName: "Tech News",
    category: "Tech News",
    guid: "sample-3"
  },
  
  // Career Development Category
  {
    title: "Essential Career Skills for Women in Tech Leadership",
    link: "https://example.com/article4",
    description: "Key competencies and strategies for women aiming for leadership positions in technology companies.",
    date: new Date('2023-08-05'),
    sourceName: "Tech Leadership",
    category: "Career Development",
    guid: "sample-4"
  },
  {
    title: "Negotiation Tactics That Work for Women in Tech",
    link: "https://example.com/article5",
    description: "Research-backed strategies to help women negotiate better salaries and opportunities in male-dominated industries.",
    date: new Date('2023-08-03'),
    sourceName: "Career Growth",
    category: "Career Development",
    guid: "sample-5"
  },
  {
    title: "From Developer to CTO: One Woman's Journey to the Top",
    link: "https://example.com/article6",
    description: "An inspiring interview with Jane Chen, who rose from junior developer to CTO at a major tech firm.",
    date: new Date('2023-07-28'),
    sourceName: "Tech Leadership",
    category: "Career Development",
    guid: "sample-6"
  },
  
  // Community Updates Category
  {
    title: "Global Women in Tech Summit Announces 2023 Speakers",
    link: "https://example.com/article7",
    description: "Preview of the upcoming international conference highlighting achievements of women in technology.",
    date: new Date('2023-07-20'),
    sourceName: "Community News",
    category: "Community Updates",
    guid: "sample-7"
  },
  {
    title: "New Study Shows Progress in Tech Gender Diversity",
    link: "https://example.com/article8",
    description: "Recent research indicates that gender diversity in tech has improved by 12% over the past five years.",
    date: new Date('2023-07-18'),
    sourceName: "Diversity in Tech",
    category: "Community Updates",
    guid: "sample-8"
  },
  {
    title: "Women in Tech Mentorship Program Launches Nationwide",
    link: "https://example.com/article9",
    description: "A new initiative connecting experienced women in tech with early-career professionals expands to 50 cities.",
    date: new Date('2023-07-15'),
    sourceName: "Community News",
    category: "Community Updates",
    guid: "sample-9"
  },
  
  // Technical Tutorials Category
  {
    title: "Mastering React: A Guide for Female Developers",
    link: "https://example.com/article10",
    description: "Step-by-step tutorial on building complex applications with React, designed to be inclusive for all skill levels.",
    date: new Date('2023-07-12'),
    sourceName: "Coding Tutorials",
    category: "Technical Tutorials",
    guid: "sample-10"
  },
  {
    title: "Getting Started with Machine Learning: A Beginner's Guide",
    link: "https://example.com/article11",
    description: "An introduction to machine learning concepts and practical first steps for women interested in AI development.",
    date: new Date('2023-07-08'),
    sourceName: "Programming Tips",
    category: "Technical Tutorials",
    guid: "sample-11"
  },
  {
    title: "Building Your First Mobile App: From Concept to Deployment",
    link: "https://example.com/article12",
    description: "A comprehensive tutorial on developing and launching a mobile application even with limited coding experience.",
    date: new Date('2023-07-05'),
    sourceName: "Coding Tutorials",
    category: "Technical Tutorials",
    guid: "sample-12"
  },
  
  // Founder Stories Category
  {
    title: "The Rise of Women-Led Startups in 2023",
    link: "https://example.com/article13",
    description: "How female founders are changing the startup landscape with innovative approaches to technology and business.",
    date: new Date('2023-07-01'),
    sourceName: "Founder Insights",
    category: "Founder Stories",
    guid: "sample-13"
  },
  {
    title: "How I Secured $5M in Funding as a Solo Female Founder",
    link: "https://example.com/article14",
    description: "Sarah Johnson shares her journey of building a successful health tech startup and navigating the VC landscape.",
    date: new Date('2023-06-28'),
    sourceName: "Startup Stories",
    category: "Founder Stories",
    guid: "sample-14"
  },
  {
    title: "From Side Project to Unicorn: The Story of TechWomen Inc.",
    link: "https://example.com/article15",
    description: "The remarkable growth story of a women-led tech company that reached billion-dollar valuation in just four years.",
    date: new Date('2023-06-25'),
    sourceName: "Founder Insights",
    category: "Founder Stories",
    guid: "sample-15"
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
 * Filters content to ensure it's relevant to both women in tech and the specified category
 * Uses a scoring system instead of binary matching
 */
function filterContentByCategory(items: NewsItem[], category: string): NewsItem[] {
  return items.filter(item => {
    const titleLower = item.title.toLowerCase();
    const descLower = item.description.toLowerCase();
    
    // Calculate relevance score
    let relevanceScore = 0;
    
    // Check for women in tech keywords
    for (const keyword of womenInTechKeywords) {
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
