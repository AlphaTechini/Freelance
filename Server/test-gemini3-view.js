/**
 * Test for Gemini 3 Flash Preview with Google Search Grounding
 * Using @google/genai SDK
 * Step 1: Ask if it can view web pages (natural response)
 * Step 2: If yes, ask it to review a URL
 * Store all responses in response.txt
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'response.txt');

const TEST_URL = 'https://cyberpunkinc.xyz';

async function testGemini3() {
    let output = '';

    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    const saveOutput = () => {
        fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
    };

    log('='.repeat(60));
    log('GEMINI 3 FLASH PREVIEW - WEB VIEWING TEST');
    log('Using: @google/genai SDK');
    log('='.repeat(60));
    log('');
    log('Timestamp: ' + new Date().toISOString());
    log('Model: gemini-3-flash-preview');
    log('');

    if (!process.env.GEMINI_API_KEY) {
        log('ERROR: GEMINI_API_KEY not found');
        saveOutput();
        return;
    }

    try {
        // Initialize with the correct SDK
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // =====================================================
        // STEP 1: Ask if it can view web pages (natural response)
        // =====================================================
        log('='.repeat(60));
        log('STEP 1: Asking if model can view web pages');
        log('='.repeat(60));
        log('');

        const question1 = 'Can you view and analyze a website if I paste its URL? What are your capabilities for accessing and seeing websites?';
        log('Question: ' + question1);
        log('');

        log('Sending request...');
        const response1 = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: question1
        });

        log('');
        log('Response:');
        log('-'.repeat(40));
        log(response1.text);
        log('-'.repeat(40));
        log('');

        // =====================================================
        // STEP 2: Ask it to review the URL
        // =====================================================
        log('='.repeat(60));
        log('STEP 2: Asking to review the portfolio URL');
        log('='.repeat(60));
        log('');

        const question2 = `Here is a developer portfolio website URL: ${TEST_URL}

Please look at this website and tell me what you see. What is the website about? Who is the developer? What projects, skills, or content is displayed on the site?`;

        log('Question: ' + question2);
        log('');

        log('Sending request...');
        const response2 = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: question2
        });

        log('');
        log('Response:');
        log('-'.repeat(40));
        log(response2.text);
        log('-'.repeat(40));
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

testGemini3();
