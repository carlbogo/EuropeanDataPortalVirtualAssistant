// portalSearchHandler.js
const axios = require('axios');
const { refineSearchQuery } = require('./llmHelper'); 
const CUSTOM_SEARCH_API_KEY = process.env.CUSTOM_SEARCH_API_KEY; 
const CUSTOM_SEARCH_CX_ID = process.env.CUSTOM_SEARCH_CX_ID;
const { formatPortalResponse } = require('./responses');


exports.handlePortalSearch = async (req, res) => {
  try {
    const sessionInfo = req.body.sessionInfo || {};
    const parameters = sessionInfo.parameters || {};
    const websiteQuery = (parameters.prompt || '').trim();

    console.log('Website Query:', websiteQuery);

    if (!websiteQuery || websiteQuery.trim().length < 2) {
      return res.json({
        fulfillment_response: {
          messages: [{
            text: {
              text: ["I didn't catch that. Could you please rephrase what you'd like to search for?"]
            }
          }]
        }
      });
    }


    const optimizedQuery = (await refineSearchQuery(websiteQuery)).replace(/["']/g, '').trim();
    console.log(optimizedQuery);
    
    const url = `https://www.googleapis.com/customsearch/v1?key=${CUSTOM_SEARCH_API_KEY}&cx=${CUSTOM_SEARCH_CX_ID}&q=${encodeURIComponent(optimizedQuery)}`;
    console.log('Custom Search API URL:', url);

    const searchRes = await axios.get(url);
    const items = searchRes.data.items || [];

    if (items.length === 0) {
      return res.json({
        fulfillment_response: {
          messages: [
            {
              text: { text: [`I couldn't find anything about "${websiteQuery}" on the portal.`] },
            },
          ],
        },
      });
    }

    const topResults = items.slice(0, 3).map(item => ({
      title: item.title,
      snippet: item.snippet?.slice(0, 300),
      link: item.link,
    }));

    console.log('Top Results:', topResults);

    const formattedResponse = formatPortalResponse(websiteQuery, topResults);

    return res.json({
      fulfillment_response: {
        messages: [
          {
            text: { text: [formattedResponse] },
          },
        ],
      },
    });
  } catch (error) {
    if (error.response) {
      console.error('API Error Response:', error.response.data);
    } else {
      console.error('Portal Search Error:', error.message);
    }
    return res.json({
      fulfillment_response: {
        messages: [
          {
            text: { text: ["Hmm, I couldn’t reach the portal right now. Let’s try again?"] },

          },
        ],
      },
    });
  }
};