import type { NewsItem } from './feedAggregator';

export function getSampleNews(): NewsItem[] {
  return [
    // Tech News
    {
      title: "Breaking the Glass Ceiling: Women Leaders in Tech",
      description: "Exploring how women are revolutionizing leadership roles in the technology sector and breaking down traditional barriers.",
      date: "2024-02-15",
      source: "TechCrunch",
      url: "https://example.com/article1",
      imageUrl: "https://picsum.photos/800/400",
      category: "tech-news"
    },
    {
      title: "The Future of AI Ethics: A Woman's Perspective",
      description: "How women researchers are leading the charge in developing ethical frameworks for artificial intelligence systems.",
      date: "2024-02-14",
      source: "Wired",
      url: "https://example.com/article2",
      imageUrl: "https://picsum.photos/800/401",
      category: "tech-news"
    },
    
    // Career Development
    {
      title: "Negotiating Salary in Tech: Strategies for Women",
      description: "Practical advice for women in tech to successfully negotiate compensation packages and close the gender pay gap.",
      date: "2024-02-13",
      source: "Women in Tech",
      url: "https://example.com/article3",
      imageUrl: "https://picsum.photos/800/402",
      category: "career-development"
    },
    {
      title: "From Engineer to CTO: Career Paths for Women in Tech",
      description: "Stories and strategies from women who have climbed the technical leadership ladder.",
      date: "2024-02-12",
      source: "Forbes Tech",
      url: "https://example.com/article4",
      imageUrl: "https://picsum.photos/800/403",
      category: "career-development"
    },
    
    // Community Updates
    {
      title: "Women in Tech Global Conference Announces 2024 Lineup",
      description: "Details on the upcoming global conference featuring female leaders from major tech companies around the world.",
      date: "2024-02-11",
      source: "Tech Events",
      url: "https://example.com/article5",
      imageUrl: "https://picsum.photos/800/404",
      category: "community-updates"
    },
    {
      title: "New Mentorship Program Connects Junior Female Developers",
      description: "How a new initiative is helping bridge the experience gap for women entering the tech industry.",
      date: "2024-02-10",
      source: "Dev.to",
      url: "https://example.com/article6",
      imageUrl: "https://picsum.photos/800/405",
      category: "community-updates"
    },
    
    // Technical Tutorials
    {
      title: "Building Scalable React Applications: A Complete Guide",
      description: "A comprehensive tutorial on creating production-ready React applications with best practices and advanced patterns.",
      date: "2024-02-09",
      source: "Dev.to",
      url: "https://example.com/article7",
      imageUrl: "https://picsum.photos/800/406",
      category: "technical-tutorials"
    },
    {
      title: "Machine Learning for Web Developers",
      description: "An introduction to implementing machine learning models in web applications using TensorFlow.js.",
      date: "2024-02-08",
      source: "Mozilla",
      url: "https://example.com/article8",
      imageUrl: "https://picsum.photos/800/407",
      category: "technical-tutorials"
    },
    
    // Founder Stories
    {
      title: "Building a Tech Company: My Journey as a Female Founder",
      description: "The challenges and triumphs of building a successful tech startup from the ground up.",
      date: "2024-02-07",
      source: "Women Founders",
      url: "https://example.com/article9",
      imageUrl: "https://picsum.photos/800/408",
      category: "founder-stories"
    },
    {
      title: "From Side Project to Successful Startup",
      description: "How I turned my weekend project into a thriving tech business while maintaining work-life balance.",
      date: "2024-02-06",
      source: "Startup Stories",
      url: "https://example.com/article10",
      imageUrl: "https://picsum.photos/800/409",
      category: "founder-stories"
    }
  ];
}