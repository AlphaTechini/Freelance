/**
 * Quick test for the updated geminiService with gemini-3-flash-preview
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'response.txt');

// Import the service
import geminiService from './src/services/geminiService.js';

const TEST_URL = 'https://cyberpunkinc.xyz';

async function testService() {
    let output = '';

    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    log('='.repeat(60));
    log('TESTING UPDATED GEMINI SERVICE');
    log('='.repeat(60));
    log('');
    log('Timestamp: ' + new Date().toISOString());
    log('URL: ' + TEST_URL);
    log('');

    try {
        log('Calling analyzePortfolioWebsiteWithSearch...');
        log('(This may take 30-60 seconds as Gemini visits the website)');
        log('');

        const startTime = Date.now();
        const result = await geminiService.analyzePortfolioWebsiteWithSearch(TEST_URL);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        log('='.repeat(60));
        log(`RESULTS (completed in ${duration} seconds)`);
        log('='.repeat(60));
        log('');

        log('Website Accessible: ' + (result.canAccessWebsite ? 'YES' : 'NO'));
        log('Used Direct Browsing: ' + (result.usedDirectBrowsing ? 'YES' : 'NO'));
        log('');

        log('SCORES:');
        log('-'.repeat(40));
        if (result.scores) {
            log('  Specialization Clarity:  ' + result.scores.specializationClarity);
            log('  Experience Showcase:     ' + result.scores.experienceShowcase);
            log('  Projects Display:        ' + result.scores.projectsDisplay);
            log('  Call-to-Actions:         ' + result.scores.callToActions);
            log('  Design Quality:          ' + result.scores.designQuality);
            log('  Completeness:            ' + result.scores.completeness);
            log('-'.repeat(40));
            log('  OVERALL SCORE:           ' + result.scores.overall);
        }
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

        log('SUGGESTIONS:');
        if (result.suggestions && result.suggestions.length > 0) {
            result.suggestions.forEach((s, i) => log('  ' + (i + 1) + '. ' + s));
        } else {
            log('  None provided');
        }
        log('');

        log('LLM ASSESSMENT:');
        log('  ' + (result.llmAssessment || 'N/A'));
        log('');

        log('='.repeat(60));
        log('TEST COMPLETED SUCCESSFULLY');
        log('='.repeat(60));

    } catch (error) {
        log('');
        log('ERROR: ' + error.message);
        log('');
        if (error.stack) {
            log('Stack trace:');
            log(error.stack);
        }
    }

    fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
    console.log('');
    console.log('Results saved to: ' + OUTPUT_FILE);
}

testService();
