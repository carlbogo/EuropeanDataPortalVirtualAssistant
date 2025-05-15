const { Configuration, OpenAIApi } = require('openai');

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

const PRIMARY_MODEL = 'gpt-3.5-turbo';
const FALLBACK_MODEL = 'gpt-4';

// extracting parameters from prompt

exports.extractQueryParameters = async (userQuery) => {
  const prompt = `
  You are a helpful assistant that extracts search parameters for querying a dataset portal.
  Your task is to extract clean and general-purpose keywords for searching datasets.

  Given the following user query:
  "${userQuery}"

  Extract and return a JSON object with:
  - "topic": a general keyword suitable for open data search (e.g., "transport", "waste", "pollution", "education").
  - "location": a country or region mentioned in the query (e.g., "Germany", "Estonia").
  - "year": a specific year or timeframe, if clearly mentioned.

  The topic should be:
  - A single word or short phrase.
  - In lowercase.
  - Avoid extra context or adjectives. Just the core term.
  - If user uses slang or vague phrasing, map it to a more formal and general keyword.
    Example: "poop data" → "wastewater", "car stats" → "traffic"

  NB! Only return valid JSON. If any value is missing, leave it as an empty string.
  Format:
  {
    "topic": "",
    "location": "",
    "year": ""
  }
  `;


  const tryModel = async (model) => {
    console.log(`🔄 Trying model: ${model}`);
    const completion = await openai.createChatCompletion({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that returns JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.0,
    });

    const rawAnswer = completion.data.choices[0]?.message?.content?.trim() || '';

    try {
      const parsed = JSON.parse(rawAnswer);
      return {
        topic: parsed.topic || '',
        location: parsed.location || '',
        year: parsed.year || '',
      };
    } catch (err) {
      throw new Error(`❌ Failed to parse JSON from ${model}: ${err.message}`);
    }
  };

  try {
    return await tryModel(PRIMARY_MODEL);
  } catch (err1) {
    try {
      return await tryModel(FALLBACK_MODEL);
    } catch (err2) {
      console.error('❌ Both models failed:', err2.message);
      return { topic: '', location: '', year: '' };
    }
  }
};


exports.refineSearchQuery = async (originalQuery) => {
  const prompt = `
Rewrite the following user question into a keyword-focused search query for finding help articles or documentation from the European Data Portal.

Respond ONLY with plain keywords — no explanations, no quotes, no extra words.

User query: "${originalQuery}"
`;

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that converts natural questions into short keyword-based search queries.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 30,
      temperature: 0.3,
    });

    const raw = completion.data.choices?.[0]?.message?.content || '';
    const cleaned = raw.replace(/["']/g, '').replace(/^(search\s*query\s*:)?/i, '').trim();

    return cleaned;
  } catch (error) {
    console.error('❌ Failed to refine query:', error.message);
    return originalQuery;
  }
};





exports.explainMetadata = async (metadata) => {
  const prompt = `
You are a helpful assistant that explains dataset metadata in a friendly and concise way.

Given the following metadata (such as column names, format, topics), describe what kind of data the dataset contains and what it can be used for.

Metadata:
${JSON.stringify(metadata, null, 2)}

Explanation:
`;

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a metadata explainer.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.4,
    });

    return completion.data.choices?.[0]?.message?.content?.trim() || "";
  } catch (err) {
    console.error("❌ Failed to explain metadata:", err.message);
    return "";
  }
};


