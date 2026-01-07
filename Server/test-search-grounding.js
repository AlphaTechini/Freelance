/**
 * Test for Google Search Grounding with Gemini 2.5 Flash
 * Tests the new approach where Gemini can directly visit and analyze portfolio URLs
 * using its built-in Google Search grounding capability
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'test-search-grounding-output.txt');

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

// Build the search-grounded portfolio analysis prompt
function buildPortfolioWebsitePrompt(portfolioUrl) {
    return `Search the web and find information about this developer portfolio website: ${portfolioUrl}

Use Google Search to visit and analyze the portfolio at: ${portfolioUrl}

After searching and finding information about this website, evaluate it as an experienced tech recruiter would when screening candidates for software engineering positions.

EVALUATION CRITERIA (Score each 0-100):

1. **Specialization Clarity**: Does it clearly state what the developer specializes in?
2. **Experience Showcase**: How well is work experience presented?
3. **Projects Display**: Are projects showcased with descriptions and technologies?
4. **Call-to-Actions**: Are there contact options, hire me buttons, or social links?
5. **Design Quality**: How professional and modern is the design?
6. **Completeness**: Does it have about, skills, projects, and contact sections?

Return your analysis in this EXACT JSON format:
{
  "scores": {
    "specializationClarity": number (0-100),
    "experienceShowcase": number (0-100),
    "projectsDisplay": number (0-100),
    "callToActions": number (0-100),
    "designQuality": number (0-100),
    "completeness": number (0-100),
    "overall": number (0-100, weighted average)
  },
  "firstImpression": "One sentence first impression as a recruiter",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": [
    "Improvement 1",
    "Improvement 2",
    "Improvement 3"
  ],
  "canAccessWebsite": true or false,
  "llmAssessment": "2-3 sentence overall assessment"
}

If you cannot access or find the website, set canAccessWebsite to false.`;
}

// Parse LLM response
function parsePortfolioWebsiteResponse(responseText) {
    try {
        let content = responseText || '';

        // Strip code block markers (```json, ```js, ```, etc.)
        content = content.replace(/```(?:json|js|javascript)?\n?/g, '').trim();

        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);

            // Ensure scores object exists with all fields
            const scores = {
                specializationClarity: parsed.scores?.specializationClarity || 0,
                experienceShowcase: parsed.scores?.experienceShowcase || 0,
                projectsDisplay: parsed.scores?.projectsDisplay || 0,
                callToActions: parsed.scores?.callToActions || 0,
                designQuality: parsed.scores?.designQuality || 0,
                completeness: parsed.scores?.completeness || 0,
                overall: parsed.scores?.overall || 0
            };

            // Calculate overall if not provided
            if (!scores.overall) {
                const sum = scores.specializationClarity + scores.experienceShowcase +
                    scores.projectsDisplay + scores.callToActions +
                    scores.designQuality + scores.completeness;
                scores.overall = Math.round(sum / 6);
            }

            return {
                scores,
                firstImpression: parsed.firstImpression || '',
                strengths: parsed.strengths || [],
                weaknesses: parsed.weaknesses || [],
                suggestions: parsed.suggestions || [],
                canAccessWebsite: parsed.canAccessWebsite !== false,
                llmAssessment: parsed.llmAssessment || ''
            };
        }

        // Fallback if JSON parsing fails
        return {
            scores: {
                specializationClarity: 0,
                experienceShowcase: 0,
                projectsDisplay: 0,
                callToActions: 0,
                designQuality: 0,
                completeness: 0,
                overall: 0
            },
            firstImpression: '',
            strengths: [],
            weaknesses: [],
            suggestions: [],
            canAccessWebsite: false,
            llmAssessment: 'Failed to parse response: ' + content.substring(0, 200)
        };
    } catch (error) {
        return {
            scores: {
                specializationClarity: 0,
                experienceShowcase: 0,
                projectsDisplay: 0,
                callToActions: 0,
                designQuality: 0,
                completeness: 0,
                overall: 0
            },
            firstImpression: '',
            strengths: [],
            weaknesses: [],
            suggestions: [],
            canAccessWebsite: false,
            llmAssessment: 'Error parsing response: ' + error.message
        };
    }
}

// Extract sources from grounding metadata
function extractSources(groundingMetadata) {
    const sources = [];

    if (groundingMetadata?.groundingChunks) {
        groundingMetadata.groundingChunks.forEach((chunk, index) => {
            if (chunk.web) {
                sources.push({
                    index: index + 1,
                    title: chunk.web.title || 'Unknown',
                    uri: chunk.web.uri || ''
                });
            }
        });
    }

    return sources;
}

async function testSearchGrounding() {
    log('============================================================');
    log('GOOGLE SEARCH GROUNDING TEST - PORTFOLIO ANALYSIS');
    log('============================================================');
    log('');
    log('Testing URL: ' + TEST_URL);
    log('Timestamp: ' + new Date().toISOString());
    log('');

    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
        log('ERROR: GEMINI_API_KEY not found in environment');
        saveOutput();
        return;
    }

    log('API Key found: ' + process.env.GEMINI_API_KEY.substring(0, 8) + '...');
    log('');

    try {
        // Initialize Google Generative AI
        log('Step 1: Initializing Gemini with Google Search Grounding...');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Get model with Google Search tool
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            tools: [
                {
                    googleSearch: {}
                }
            ]
        });

        log('  - Model: gemini-2.5-flash');
        log('  - Tool: googleSearch enabled');
        log('');

        // Build prompt
        log('Step 2: Building portfolio analysis prompt...');
        const prompt = buildPortfolioWebsitePrompt(TEST_URL);
        log('  - Prompt length: ' + prompt.length + ' chars');
        log('');

        // Generate content with search grounding
        log('Step 3: Sending request to Gemini with Search Grounding...');
        log('  (This may take 15-60 seconds as Gemini visits the website...)');
        log('');

        const startTime = Date.now();
        const result = await model.generateContent(prompt);
        const response = result.response;
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        log('============================================================');
        log('RAW RESPONSE (completed in ' + duration + ' seconds)');
        log('============================================================');
        log('');

        // Get text content
        const responseText = response.text();
        log('Response Text:');
        log(responseText.substring(0, 1000) + (responseText.length > 1000 ? '...' : ''));
        log('');

        // Extract grounding metadata (citations/sources)
        log('============================================================');
        log('GROUNDING METADATA (Citations/Sources)');
        log('============================================================');
        log('');

        const candidate = response.candidates?.[0];
        const groundingMetadata = candidate?.groundingMetadata;

        if (groundingMetadata) {
            log('Grounding metadata found!');
            log('');

            const sources = extractSources(groundingMetadata);
            if (sources.length > 0) {
                log('Sources Used:');
                sources.forEach(source => {
                    log('  ' + source.index + '. ' + source.title);
                    log('     URL: ' + source.uri);
                });
            } else {
                log('No web sources found in grounding metadata');
            }

            // Log raw metadata for debugging
            log('');
            log('Raw Grounding Metadata:');
            log(JSON.stringify(groundingMetadata, null, 2).substring(0, 2000));
        } else {
            log('No grounding metadata found in response');
            log('');
            log('This could mean:');
            log('  - Search grounding was not triggered');
            log('  - The model answered from its knowledge base');
            log('  - The API response structure differs');
        }

        log('');

        // Parse the response
        log('============================================================');
        log('PARSED ANALYSIS RESULTS');
        log('============================================================');
        log('');

        const analysis = parsePortfolioWebsiteResponse(responseText);

        log('Website Accessible: ' + (analysis.canAccessWebsite ? 'YES' : 'NO'));
        log('');
        log('SCORES (0-100):');
        log('------------------------------------------------------------');
        log('  Specialization Clarity:  ' + analysis.scores.specializationClarity);
        log('  Experience Showcase:     ' + analysis.scores.experienceShowcase);
        log('  Projects Display:        ' + analysis.scores.projectsDisplay);
        log('  Call-to-Actions:         ' + analysis.scores.callToActions);
        log('  Design Quality:          ' + analysis.scores.designQuality);
        log('  Completeness:            ' + analysis.scores.completeness);
        log('------------------------------------------------------------');
        log('  OVERALL SCORE:           ' + analysis.scores.overall);
        log('');
        log('FIRST IMPRESSION:');
        log('  ' + (analysis.firstImpression || 'N/A'));
        log('');
        log('STRENGTHS:');
        if (analysis.strengths && analysis.strengths.length > 0) {
            analysis.strengths.forEach((s, i) => log('  ' + (i + 1) + '. ' + s));
        } else {
            log('  None identified');
        }
        log('');
        log('WEAKNESSES:');
        if (analysis.weaknesses && analysis.weaknesses.length > 0) {
            analysis.weaknesses.forEach((w, i) => log('  ' + (i + 1) + '. ' + w));
        } else {
            log('  None identified');
        }
        log('');
        log('IMPROVEMENT SUGGESTIONS:');
        if (analysis.suggestions && analysis.suggestions.length > 0) {
            analysis.suggestions.forEach((s, i) => log('  ' + (i + 1) + '. ' + s));
        } else {
            log('  None provided');
        }
        log('');
        log('LLM ASSESSMENT:');
        log('  ' + (analysis.llmAssessment || 'N/A'));
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
}

// Run the test
testSearchGrounding();
