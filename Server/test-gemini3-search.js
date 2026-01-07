/**
 * Test for Gemini 3 Flash with Google Search Grounding
 * Step 1: Ask if it can view web pages (natural response)
 * Step 2: If yes, ask it to review a URL
 * Store all responses in response.txt
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'response.txt');

const TEST_URL = 'https://cyberpunkinc.xyz';

async function testGemini3Flash() {
    let output = '';

    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    const saveOutput = () => {
        fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
    };

    log('='.repeat(60));
    log('GEMINI 2.5 FLASH - WEB SEARCH GROUNDING TEST');
    log('='.repeat(60));
    log('');
    log('Timestamp: ' + new Date().toISOString());
    log('Model: gemini-2.5-flash');
    log('');

    if (!process.env.GEMINI_API_KEY) {
        log('ERROR: GEMINI_API_KEY not found');
        saveOutput();
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Get model with Google Search tool
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            tools: [{ googleSearch: {} }]
        });

        // =====================================================
        // STEP 1: Ask if it can view web pages (natural response)
        // =====================================================
        log('='.repeat(60));
        log('STEP 1: Asking if model can view web pages');
        log('='.repeat(60));
        log('');

        const question1 = 'Can you view and analyze web pages if I give you a URL? What capabilities do you have for accessing websites?';
        log('Question: ' + question1);
        log('');

        log('Sending request...');
        const result1 = await model.generateContent(question1);
        const response1 = result1.response.text();

        log('');
        log('Response:');
        log('-'.repeat(40));
        log(response1);
        log('-'.repeat(40));
        log('');

        // Check grounding metadata for step 1
        const metadata1 = result1.response.candidates?.[0]?.groundingMetadata;
        if (metadata1) {
            log('Grounding Metadata (Step 1):');
            log(JSON.stringify(metadata1, null, 2));
        }
        log('');

        // =====================================================
        // STEP 2: Ask it to review the URL
        // =====================================================
        log('='.repeat(60));
        log('STEP 2: Asking to review the portfolio URL');
        log('='.repeat(60));
        log('');

        const question2 = `Please visit and review this developer portfolio website: ${TEST_URL}

Tell me what you see on the website. What is it about? Who is the developer? What projects or skills are showcased?`;

        log('Question: ' + question2);
        log('');

        log('Sending request...');
        const result2 = await model.generateContent(question2);
        const response2 = result2.response.text();

        log('');
        log('Response:');
        log('-'.repeat(40));
        log(response2);
        log('-'.repeat(40));
        log('');

        // Check grounding metadata for step 2
        const metadata2 = result2.response.candidates?.[0]?.groundingMetadata;
        if (metadata2) {
            log('Grounding Metadata (Step 2):');
            log(JSON.stringify(metadata2, null, 2));

            // Check for web sources
            if (metadata2.groundingChunks) {
                log('');
                log('Web Sources Found:');
                metadata2.groundingChunks.forEach((chunk, i) => {
                    if (chunk.web) {
                        log(`  ${i + 1}. ${chunk.web.title || 'Unknown'}`);
                        log(`     URL: ${chunk.web.uri || 'N/A'}`);
                    }
                });
            }
        }

        log('');
        log('='.repeat(60));
        log('TEST COMPLETED');
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

    saveOutput();
    console.log('');
    console.log('Results saved to: ' + OUTPUT_FILE);
}

testGemini3Flash();
