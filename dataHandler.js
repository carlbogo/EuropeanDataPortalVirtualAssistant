// datahandler.js
const { formatDatasetsRichContent} = require('./responses');
const { extractQueryParameters} = require('./llmHelper');
const { fetchDataEuropaJson } = require('./dataEuropaJsonHandler');

function toSafeLower(str) {
  return typeof str === 'string' ? str.toLowerCase().trim() : '';
}
function deduplicateResults(items) {
  const seen = new Set();
  return items.filter(item => {
    const title = toSafeLower(item.title);
    if (seen.has(title)) return false;
    seen.add(title);
    return true;
  });
}

/*
exports.queryDatasetsJson = async (req, res) => {
  const sessionInfo = req.body.sessionInfo || {};
  const parameters = sessionInfo.parameters || {};
  const userPrompt = parameters.prompt?.trim() || '';

  let locationStr = '';
  if (parameters.location && typeof parameters.location === 'object') {
    locationStr = parameters.location.original || parameters.location.country || '';
  } else if (typeof parameters.location === 'string') {
    locationStr = parameters.location.trim();
  }

  console.log("User prompt:", userPrompt);

  let keyword = '';
  let year = '';
  try {
    const parsedParams = await extractQueryParameters(userPrompt);
    keyword = parsedParams.topic || '';
    year = parsedParams.year || '';
    if (!locationStr) locationStr = parsedParams.location || '';
  } catch (err) {
    console.error("LLM extraction error:", err.message);
  }

  if (!keyword && !locationStr && !year) {
    return res.json({
      fulfillment_response: {
        messages: [{ text: { text: ["Please provide a topic or location to search for datasets."] } }]
      }
    });
  }

  const combinedTerm = [keyword, locationStr, year].filter(Boolean).join(" ");
  console.log("Combined term being searched:", combinedTerm);


  const fallbackResponse = {
    fulfillment_response: {
      messages: [{ text: { text: ["The request timed out. Please try again later."] } }]
    },
    sessionInfo: {
      parameters: {
        dataset_results_ready: false,
        results: []
      }
    }
  };

  let result;

  try {
    result = await Promise.race([
      (async () => {
        const jsonResults = await fetchDataEuropaJson(combinedTerm, "en", 5);
        
        if (!jsonResults.length) {
          return {
            fulfillment_response: {
              messages: [{ text: { text: [`No datasets found for "${combinedTerm}".`] } }]
            },
            sessionInfo: {
              parameters: {
                redirect_to_datasets: true,
                results: []
              }
            }
          };
        }

  const mappedResults = await Promise.all(
  jsonResults.map(async (item) => {
    const distributions = item.distributions || [];

    const formatLinks = distributions.reduce((acc, dist) => {
      const formatLabel = typeof dist.format?.label === 'string'
      ? dist.format.label.toLowerCase()
      : '';

      const accessUrls = dist.access_url || [];
      if (formatLabel && accessUrls.length > 0) {
        if (!acc[formatLabel]) {
          acc[formatLabel] = [];
        }
        acc[formatLabel].push(accessUrls);
      }
      return acc;
    }, {});

    return {
    id: item.id,
    title: typeof item.title?.en === 'string'? item.title.en : (typeof item.title === 'string' ? item.title : "Untitled"),
    description: item.desc || item.description?.en || item.description || "",
    country: item.country?.label || item.country || "",
    link: `https://data.europa.eu/data/datasets/${item.id}`,
    formats: [...new Set((distributions || []).map(d => d.format?.label).filter(Boolean))],
    formatLinks,
    publisher: item.publisher?.name || null,
    license: item.distributions?.[0]?.license?.label || null
};

  })
);


    const uniqueResults = deduplicateResults(mappedResults);
    //const sortedResults = filterRelevantFirst(uniqueResults, locationStr);
    const responseChunks = formatDatasetsRichContent(combinedTerm, locationStr, uniqueResults);

    return {
      ...responseChunks,
      sessionInfo: {
        parameters: {
          dataset_results_ready: true,
          results: uniqueResults
        }
      }
    };
  })(),
  new Promise(resolve => setTimeout(() => resolve(fallbackResponse), 4500))
]);

} catch (error) {
console.error("Outer JSON API handler error:", error.message);
return res.json({
  fulfillment_response: {
    messages: [{ text: { text: ["An error occurred while processing your request. Please try again."] } }]
  }, 
  sessionInfo: {
      parameters: {
        redirect_to_datasets: true,
        results: []
      }
  }
});
}
return res.json(result);

};
*/

exports.queryDatasetsJson = async (req, res) => {
  const sessionInfo = req.body.sessionInfo || {};
  const parameters = sessionInfo.parameters || {};
  const userPrompt = parameters.prompt?.trim() || '';

  let locationStr = '';
  if (parameters.location && typeof parameters.location === 'object') {
    locationStr = parameters.location.original || parameters.location.country || '';
  } else if (typeof parameters.location === 'string') {
    locationStr = parameters.location.trim();
  }

  console.log("User prompt:", userPrompt);

  let keyword = '';
  let year = '';
  try {
    const parsedParams = await extractQueryParameters(userPrompt);
    keyword = parsedParams.topic || '';
    year = parsedParams.year || '';
    if (!locationStr) locationStr = parsedParams.location || '';
  } catch (err) {
    console.error("LLM extraction error:", err.message);
  }

  if (!keyword && !locationStr && !year) {
    return res.json({
      fulfillment_response: {
        messages: [{ text: { text: ["Please provide a topic or location to search for datasets."] } }]
      },
      sessionInfo: {
        parameters: {
          dataset_results_ready: false,
          results: []
        }
      }
    });
  }

  const combinedTerm = [keyword, locationStr, year].filter(Boolean).join(" ");
  console.log("Combined term being searched:", combinedTerm);

  const fallbackResponse = {
    fulfillment_response: {
      messages: [{ text: { text: ["The request timed out. Please try again later."] } }]
    },
    sessionInfo: {
      parameters: {
        dataset_results_ready: false,
        results: []
      }
    }
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const jsonResults = await fetchDataEuropaJson(combinedTerm, "en", 5);
    clearTimeout(timeout);

    if (!jsonResults.length) {
      return res.json({
        fulfillment_response: {
          messages: [{ text: { text: [`No datasets found for "${combinedTerm}".`] } }]
        },
        sessionInfo: {
          parameters: {
            redirect_to_datasets: true,
            results: []
          }
        }
      });
    }

    const mappedResults = await Promise.all(jsonResults.map(async (item) => {
      const distributions = item.distributions || [];
      const formatLinks = distributions.reduce((acc, dist) => {
        const formatLabel = typeof dist.format?.label === 'string'
          ? dist.format.label.toLowerCase()
          : '';
        const accessUrls = dist.access_url || [];
        if (formatLabel && accessUrls.length > 0) {
          if (!acc[formatLabel]) acc[formatLabel] = [];
          acc[formatLabel].push(accessUrls);
        }
        return acc;
      }, {});

      return {
        id: item.id,
        title: typeof item.title?.en === 'string'
          ? item.title.en
          : (typeof item.title === 'string' ? item.title : "Untitled"),
        description: item.desc || item.description?.en || item.description || "",
        country: item.country?.label || item.country || "",
        link: `https://data.europa.eu/data/datasets/${item.id}`,
        formats: [...new Set((distributions || []).map(d => d.format?.label).filter(Boolean))],
        formatLinks,
        publisher: item.publisher?.name || null,
        license: item.distributions?.[0]?.license?.label || null
      };
    }));

    const uniqueResults = deduplicateResults(mappedResults);
    const responseChunks = formatDatasetsRichContent(combinedTerm, locationStr, uniqueResults);

    return res.json({
      ...responseChunks,
      sessionInfo: {
        parameters: {
          dataset_results_ready: true,
          results: uniqueResults
        }
      }
    });

  } catch (error) {
    console.error("Dataset fetch error:", error.message);
    return res.json(fallbackResponse);
  }
};
