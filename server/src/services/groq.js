/**
 * groq.js — Groq AI client for market summaries.
 * Single export: getMarketSummary(stats) -> { headline, summary, tips }
 */

const Groq = require('groq-sdk');

// Instantiate once at module load — fails fast if API key is missing
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 12000 // 12-second request timeout (groq-sdk top-level option)
});

const MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

const SYSTEM_PROMPT = `You are a neutral crypto market commentator. \
You will be given market statistics. Write a brief, plain-English summary and \
3 short practical tips for someone watching the market today. \
Base every sentence ONLY on the numbers provided — never invent a price, \
percentage, or coin not present in the input. \
Never tell the user to buy or sell a specific coin or amount. \
Never give price targets. \
Respond ONLY as JSON matching this shape exactly: \
{ "headline": string, "summary": string (2-3 sentences), "tips": [string, string, string] }.`;

/**
 * Validate that the parsed JSON matches the expected shape.
 * Throws a descriptive error on any mismatch.
 * @param {unknown} data
 * @returns {{ headline: string, summary: string, tips: string[] }}
 */
function validate(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Groq response is not an object');
  }
  if (typeof data.headline !== 'string' || data.headline.trim() === '') {
    throw new Error('Groq response: "headline" must be a non-empty string');
  }
  if (typeof data.summary !== 'string' || data.summary.trim() === '') {
    throw new Error('Groq response: "summary" must be a non-empty string');
  }
  if (!Array.isArray(data.tips) || data.tips.length !== 3) {
    throw new Error('Groq response: "tips" must be an array of exactly 3 items');
  }
  for (let i = 0; i < 3; i++) {
    if (typeof data.tips[i] !== 'string' || data.tips[i].trim() === '') {
      throw new Error(`Groq response: tips[${i}] must be a non-empty string`);
    }
  }
  return {
    headline: data.headline.trim(),
    summary: data.summary.trim(),
    tips: data.tips.map((t) => t.trim())
  };
}

/**
 * Call Groq and return a validated market summary.
 * @param {object} stats - output of buildMarketStats()
 * @returns {Promise<{ headline: string, summary: string, tips: string[] }>}
 */
async function getMarketSummary(stats) {
  const userContent = JSON.stringify(stats);

  console.log(`[Groq] Calling model=${MODEL} with market stats`);

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 400
  });

  const raw = completion.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error('Groq returned an empty response content');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Groq response could not be parsed as JSON: ${raw.slice(0, 200)}`);
  }

  return validate(parsed);
}

module.exports = { getMarketSummary };
