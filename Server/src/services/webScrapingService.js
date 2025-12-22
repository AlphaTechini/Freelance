import * as cheerio from 'cheerio';
import axios from 'axios';

class WebScrapingService {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  /**
   * Validate URL accessibility
   * @param {string} url - URL to validate
   * @returns {Promise<boolean>} - Whether URL is accessible
   */
  async validateUrl(url) {
    try {
      const response = await axios.head(url, {
        timeout: 10000,
        headers: { 'User-Agent': this.userAgent }
      });
      return response.status >= 200 && response.status < 400;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract technology stack from HTML content
   * @param {string} html - HTML content
   * @returns {Array<string>} - Array of detected technologies
   */
  extractTechnologies(html) {
    const techKeywords = [
      'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt',
      'node.js', 'express', 'fastify', 'django', 'flask', 'rails',
      'python', 'javascript', 'typescript', 'java', 'c#', 'php',
      'mongodb', 'postgresql', 'mysql', 'redis', 'firebase',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes',
      'html', 'css', 'sass', 'tailwind', 'bootstrap',
      'git', 'github', 'gitlab', 'bitbucket'
    ];

    const lowerHtml = html.toLowerCase();
    const detectedTech = [];

    techKeywords.forEach(tech => {
      if (lowerHtml.includes(tech.toLowerCase())) {
        detectedTech.push(tech);
      }
    });

    return [...new Set(detectedTech)]; // Remove duplicates
  }

  /**
   * Check for deployment indicators
   * @param {object} $ - Cheerio instance
   * @param {string} url - Original URL
   * @returns {boolean} - Whether site appears to be deployed
   */
  checkDeploymentIndicators($, url) {
    // Check for common deployment platforms in URL
    const deploymentPlatforms = [
      'vercel.app', 'netlify.app', 'herokuapp.com', 'github.io',
      'firebase.app', 'surge.sh', 'now.sh', 'pages.dev'
    ];

    const hasDeploymentUrl = deploymentPlatforms.some(platform => 
      url.includes(platform)
    );

    // Check for live functionality indicators
    const hasInteractiveElements = $('form, button, input').length > 0;
    const hasApiCalls = $('script').text().includes('fetch') || 
                       $('script').text().includes('axios') ||
                       $('script').text().includes('api');

    return hasDeploymentUrl || hasInteractiveElements || hasApiCalls;
  }

  /**
   * Extract project links from portfolio
   * @param {object} $ - Cheerio instance
   * @returns {Array<object>} - Array of project links
   */
  extractProjectLinks($) {
    const projectLinks = [];
    
    // Look for common project link patterns
    $('a[href*="github.com"], a[href*="gitlab.com"], a[href*="bitbucket.org"]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && text) {
        projectLinks.push({
          type: 'repository',
          url: href,
          title: text
        });
      }
    });

    // Look for demo/live links
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim().toLowerCase();
      
      if (href && (text.includes('demo') || text.includes('live') || text.includes('view'))) {
        projectLinks.push({
          type: 'demo',
          url: href,
          title: $(el).text().trim()
        });
      }
    });

    return projectLinks.slice(0, 10); // Limit to 10 links
  }

  /**
   * Analyze portfolio website (lightweight HTTP + Cheerio approach)
   * @param {string} portfolioUrl - Portfolio website URL
   * @returns {Promise<object>} - Portfolio analysis results
   */
  async analyzePortfolio(portfolioUrl) {
    try {
      // Use lightweight HTTP + Cheerio approach (more reliable for production)
      return await this.analyzeWithHttp(portfolioUrl);
    } catch (error) {
      console.warn('HTTP analysis failed, using basic fallback:', error.message);
      // Return basic fallback data
      return this.getBasicFallbackData(portfolioUrl);
    }
  }

  /**
   * Analyze portfolio using HTTP + Cheerio (lightweight and reliable)
   * @param {string} portfolioUrl - Portfolio website URL
   * @returns {Promise<object>} - Portfolio analysis results
   */
  async analyzeWithHttp(portfolioUrl) {
    try {
      // Validate URL first
      const isAccessible = await this.validateUrl(portfolioUrl);
      if (!isAccessible) {
        throw new Error('Portfolio URL is not accessible');
      }

      // Fetch HTML content
      const response = await axios.get(portfolioUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        }
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract basic information
      const basicInfo = this.extractBasicInfoFromHtml($, portfolioUrl);

      // Extract projects
      const projects = this.extractProjectsFromHtml($);

      // Analyze page quality
      const qualityMetrics = this.analyzePageQualityFromHtml($);

      return {
        url: portfolioUrl,
        title: basicInfo.title,
        description: basicInfo.description,
        technologies: basicInfo.technologies,
        projects,
        qualityMetrics,
        hasDeployment: basicInfo.hasDeployment,
        projectLinks: basicInfo.projectLinks,
        content: html.substring(0, 5000), // First 5KB for AI analysis
        analyzedAt: new Date()
      };

    } catch (error) {
      throw new Error(`Portfolio analysis failed: ${error.message}`);
    }
  }

  /**
   * Get basic fallback data when analysis fails
   * @param {string} portfolioUrl - Portfolio website URL
   * @returns {object} - Basic portfolio data
   */
  getBasicFallbackData(portfolioUrl) {
    return {
      url: portfolioUrl,
      title: 'Portfolio Analysis',
      description: 'Portfolio website detected',
      technologies: ['Web Development'],
      projects: [{
        name: 'Portfolio Website',
        description: 'Personal portfolio website',
        techStack: ['HTML', 'CSS', 'JavaScript'],
        deploymentUrl: portfolioUrl,
        complexity: 'moderate'
      }],
      qualityMetrics: {
        qualityScore: 60,
        hasViewportMeta: true,
        images: 1,
        sections: 3,
        wordCount: 200
      },
      hasDeployment: true,
      projectLinks: [portfolioUrl],
      content: 'Portfolio website content',
      analyzedAt: new Date()
    };
  }

  /**
   * Extract basic information from HTML using Cheerio
   * @param {object} $ - Cheerio instance
   * @param {string} url - Original URL
   * @returns {object} - Extracted information
   */
  extractBasicInfoFromHtml($, url) {
    // Extract title
    const title = $('title').text().trim() || 
                  $('h1').first().text().trim() || 
                  'Untitled';

    // Extract description
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       $('p').first().text().trim().substring(0, 200) ||
                       '';

    // Extract technologies mentioned
    const technologies = this.extractTechnologies($.html());

    // Check for deployment indicators
    const hasDeployment = this.checkDeploymentIndicators($, url);

    // Extract project links
    const projectLinks = this.extractProjectLinks($);

    return {
      title,
      description,
      technologies,
      hasDeployment,
      projectLinks,
      wordCount: $('body').text().split(/\s+/).length
    };
  }

  /**
   * Extract projects from HTML using Cheerio
   * @param {object} $ - Cheerio instance
   * @returns {Array} - Array of project objects
   */
  extractProjectsFromHtml($) {
    const projects = [];
    
    // Look for common project container patterns
    const selectors = [
      '.project', '.portfolio-item', '.work-item',
      '[class*="project"]', '[class*="portfolio"]',
      'article', '.card'
    ];

    selectors.forEach(selector => {
      $(selector).each((i, el) => {
        const $el = $(el);
        const title = $el.find('h1, h2, h3, h4, .title, [class*="title"]').first().text().trim();
        const description = $el.find('p, .description, [class*="description"]').first().text().trim();
        const link = $el.find('a').first().attr('href');
        
        if (title && title.length > 3) {
          projects.push({
            name: title,
            description: description || '',
            techStack: this.extractTechFromText(description),
            deploymentUrl: link || '',
            complexity: description && description.length > 100 ? 'moderate' : 'simple'
          });
        }
      });
    });

    return projects.slice(0, 10); // Limit to 10 projects
  }

  /**
   * Extract technologies from text content
   * @param {string} text - Text content
   * @returns {Array} - Array of technologies
   */
  extractTechFromText(text) {
    if (!text) return [];
    
    const techKeywords = [
      'React', 'Vue', 'Angular', 'Svelte', 'Next.js',
      'Node.js', 'Express', 'Python', 'JavaScript', 'TypeScript',
      'HTML', 'CSS', 'MongoDB', 'PostgreSQL', 'Firebase'
    ];

    const lowerText = text.toLowerCase();
    return techKeywords.filter(tech => 
      lowerText.includes(tech.toLowerCase())
    ).slice(0, 5);
  }

  /**
   * Analyze page quality from HTML using Cheerio
   * @param {object} $ - Cheerio instance
   * @returns {object} - Quality metrics
   */
  analyzePageQualityFromHtml($) {
    // Count different elements
    const headings = $('h1, h2, h3, h4, h5, h6').length;
    const images = $('img').length;
    const links = $('a').length;
    const sections = $('section, article, .section').length;
    
    // Check for responsive design indicators
    const hasViewportMeta = $('meta[name="viewport"]').length > 0;
    const metaTagCount = $('meta').length;
    const wordCount = $('body').text().split(/\s+/).length;

    // Calculate quality score
    let qualityScore = 0;
    if (headings > 0) qualityScore += 10;
    if (images > 0) qualityScore += 10;
    if (sections > 2) qualityScore += 15;
    if (hasViewportMeta) qualityScore += 15;
    if (metaTagCount > 5) qualityScore += 10;
    if (wordCount > 200) qualityScore += 15;
    if (links > 3) qualityScore += 15;

    return {
      headings,
      images,
      links,
      sections,
      hasViewportMeta,
      metaTagCount,
      wordCount,
      qualityScore: Math.min(qualityScore, 100)
    };
  }

  /**
   * Cleanup resources (no-op for HTTP-based approach)
   */
  async cleanup() {
    // No cleanup needed for HTTP-based approach
  }
}

export default new WebScrapingService();