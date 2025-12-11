import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';

class WebScrapingService {
  constructor() {
    this.browser = null;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  /**
   * Initialize Puppeteer browser
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Close browser instance
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
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
   * Extract basic information from HTML content
   * @param {string} html - HTML content
   * @param {string} url - Original URL
   * @returns {object} - Extracted information
   */
  extractBasicInfo(html, url) {
    const $ = cheerio.load(html);
    
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
    const technologies = this.extractTechnologies(html);

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
   * Analyze portfolio website comprehensively
   * @param {string} portfolioUrl - Portfolio website URL
   * @returns {Promise<object>} - Portfolio analysis results
   */
  async analyzePortfolio(portfolioUrl) {
    try {
      // Validate URL first
      const isAccessible = await this.validateUrl(portfolioUrl);
      if (!isAccessible) {
        throw new Error('Portfolio URL is not accessible');
      }

      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent(this.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to portfolio with timeout
      await page.goto(portfolioUrl, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });

      // Get page content
      const html = await page.content();
      const basicInfo = this.extractBasicInfo(html, portfolioUrl);

      // Extract projects from the page
      const projects = await this.extractProjects(page);

      // Analyze page structure and quality
      const qualityMetrics = await this.analyzePageQuality(page);

      // Take screenshot for visual analysis (optional)
      // const screenshot = await page.screenshot({ type: 'png', fullPage: false });

      await page.close();

      return {
        url: portfolioUrl,
        title: basicInfo.title,
        description: basicInfo.description,
        technologies: basicInfo.technologies,
        projects,
        qualityMetrics,
        hasDeployment: basicInfo.hasDeployment,
        projectLinks: basicInfo.projectLinks,
        analyzedAt: new Date()
      };

    } catch (error) {
      throw new Error(`Portfolio analysis failed: ${error.message}`);
    }
  }

  /**
   * Extract project information from portfolio page
   * @param {object} page - Puppeteer page instance
   * @returns {Promise<Array>} - Array of project objects
   */
  async extractProjects(page) {
    try {
      const projects = await page.evaluate(() => {
        const projectElements = [];
        
        // Look for common project container patterns
        const selectors = [
          '.project', '.portfolio-item', '.work-item',
          '[class*="project"]', '[class*="portfolio"]',
          'article', '.card'
        ];

        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            const title = el.querySelector('h1, h2, h3, h4, .title, [class*="title"]')?.textContent?.trim();
            const description = el.querySelector('p, .description, [class*="description"]')?.textContent?.trim();
            const link = el.querySelector('a')?.href;
            
            if (title && title.length > 3) {
              projectElements.push({
                name: title,
                description: description || '',
                deploymentUrl: link || '',
                complexity: description && description.length > 100 ? 'moderate' : 'simple'
              });
            }
          });
        });

        return projectElements.slice(0, 10); // Limit to 10 projects
      });

      return projects;
    } catch (error) {
      return [];
    }
  }

  /**
   * Analyze page quality metrics
   * @param {object} page - Puppeteer page instance
   * @returns {Promise<object>} - Quality metrics
   */
  async analyzePageQuality(page) {
    try {
      const metrics = await page.evaluate(() => {
        // Count different elements
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
        const images = document.querySelectorAll('img').length;
        const links = document.querySelectorAll('a').length;
        const sections = document.querySelectorAll('section, article, .section').length;
        
        // Check for responsive design indicators
        const hasViewportMeta = !!document.querySelector('meta[name="viewport"]');
        const hasMediaQueries = Array.from(document.styleSheets).some(sheet => {
          try {
            return Array.from(sheet.cssRules).some(rule => 
              rule.type === CSSRule.MEDIA_RULE
            );
          } catch (e) {
            return false;
          }
        });

        // Check for modern web practices
        const hasStructuredData = !!document.querySelector('script[type="application/ld+json"]');
        const hasMetaTags = document.querySelectorAll('meta').length;

        return {
          headings,
          images,
          links,
          sections,
          hasViewportMeta,
          hasMediaQueries,
          hasStructuredData,
          metaTagCount: hasMetaTags,
          wordCount: document.body.textContent.split(/\s+/).length
        };
      });

      // Calculate quality score
      let qualityScore = 0;
      if (metrics.headings > 0) qualityScore += 10;
      if (metrics.images > 0) qualityScore += 10;
      if (metrics.sections > 2) qualityScore += 15;
      if (metrics.hasViewportMeta) qualityScore += 15;
      if (metrics.hasMediaQueries) qualityScore += 10;
      if (metrics.metaTagCount > 5) qualityScore += 10;
      if (metrics.wordCount > 200) qualityScore += 15;
      if (metrics.links > 3) qualityScore += 15;

      return {
        ...metrics,
        qualityScore: Math.min(qualityScore, 100)
      };
    } catch (error) {
      return { qualityScore: 0 };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.closeBrowser();
  }
}

export default new WebScrapingService();