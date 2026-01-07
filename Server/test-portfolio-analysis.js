/**
 * Test for LLM-based Portfolio Website Analysis
 * FIXED: Scrapes website content first, then sends to LLM for analysis
 * This is necessary because LLM cannot browse URLs directly
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'test-output.txt');

const geminiService = (await import('./src/services/geminiService.js')).default;

const TEST_URL = 'https://cyberpunkinc.xyz';

// Helper to write to file (overwrite mode)
let outputBuffer = '';
function log(message) {
    console.log(message);
    outputBuffer += message + '\n';
}

function saveOutput() {
    fs.writeFileSync(OUTPUT_FILE, outputBuffer, 'utf8');
}

// Scrape website content
async function scrapeWebsite(url) {
    try {
        const response = await axios.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        const $ = cheerio.load(response.data);

        // Extract key content
        const title = $('title').text() || '';
        const metaDescription = $('meta[name="description"]').attr('content') || '';
        const h1 = $('h1').text() || '';
        const h2s = $('h2').map((i, el) => $(el).text()).get().slice(0, 10);
        const paragraphs = $('p').map((i, el) => $(el).text()).get().slice(0, 20);
        const links = $('a').map((i, el) => $(el).text()).get().filter(t => t.trim()).slice(0, 20);
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 8000);

        return {
            url,
            title,
            metaDescription,
            h1,
            headings: h2s,
            paragraphs: paragraphs.join('\n'),
            links: links.join(', '),
            bodyText,
            rawHtml: response.data.substring(0, 15000) // First 15KB of HTML
        };
    } catch (error) {
        throw new Error('Failed to scrape website: ' + error.message);
    }
}

log('============================================================');
log('PORTFOLIO WEBSITE ANALYSIS TEST');
log('============================================================');
log('');
log('Testing URL: ' + TEST_URL);
log('Timestamp: ' + new Date().toISOString());
log('');

try {
    // Step 1: Scrape the website
    log('Step 1: Scraping website content...');
    const scrapedContent = await scrapeWebsite(TEST_URL);
    log('  - Title: ' + scrapedContent.title);
    log('  - H1: ' + scrapedContent.h1.substring(0, 100));
    log('  - Content length: ' + scrapedContent.bodyText.length + ' chars');
    log('');

    // Step 2: Send to LLM for analysis
    log('Step 2: Sending to LLM for analysis...');
    log('  (This may take 10-30 seconds...)');
    log('');

    const startTime = Date.now();
    const result = await geminiService.analyzePortfolioWebsiteWithContent(scrapedContent);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log('============================================================');
    log('RESULTS (LLM analysis completed in ' + duration + ' seconds)');
    log('============================================================');
    log('');
    log('Website Accessible: ' + (result.canAccessWebsite ? 'YES' : 'NO'));
    log('');
    log('SCORES (0-100):');
    log('------------------------------------------------------------');
    log('  Specialization Clarity:  ' + result.scores.specializationClarity);
    log('  Experience Showcase:     ' + result.scores.experienceShowcase);
    log('  Projects Display:        ' + result.scores.projectsDisplay);
    log('  Call-to-Actions:         ' + result.scores.callToActions);
    log('  Design Quality:          ' + result.scores.designQuality);
    log('  Completeness:            ' + result.scores.completeness);
    log('------------------------------------------------------------');
    log('  OVERALL SCORE:           ' + result.scores.overall);
    log('');
    log('FIRST IMPRESSION:');
    log('  ' + (result.firstImpression || 'N/A'));
    log('');
    log('STRENGTHS:');
    if (result.strengths && result.strengths.length > 0) {
        result.strengths.forEach((s, i) => log('  ' + (i + 1) + '. ' + s));
    } else {
        log('  None identified');
    }
    log('');
    log('WEAKNESSES:');
    if (result.weaknesses && result.weaknesses.length > 0) {
        result.weaknesses.forEach((w, i) => log('  ' + (i + 1) + '. ' + w));
    } else {
        log('  None identified');
    }
    log('');
    log('IMPROVEMENT SUGGESTIONS:');
    if (result.suggestions && result.suggestions.length > 0) {
        result.suggestions.forEach((s, i) => log('  ' + (i + 1) + '. ' + s));
    } else {
        log('  None provided');
    }
    log('');
    log('LLM ASSESSMENT:');
    log('  ' + (result.llmAssessment || 'N/A'));
    log('');
    log('============================================================');
    log('TEST COMPLETED SUCCESSFULLY');
    log('============================================================');

} catch (error) {
    log('');
    log('ERROR: ' + error.message);
    log('');
    if (error.stack) {
        log('Stack trace:');
        log(error.stack);
    }
}

saveOutput();
console.log('');
console.log('Results saved to: ' + OUTPUT_FILE);
