// dataEuropaJsonHandler.js
const axios = require('axios');

function toSafeLower(str) {
  return typeof str === 'string' ? str.toLowerCase().trim() : '';
}

exports.fetchDataEuropaJson = async (keyword, locale = "en", limit = 5) => {
  try {
    const baseUrl = 'https://data.europa.eu/api/hub/search/search';
    const url = `${baseUrl}?q=${encodeURIComponent(keyword)}&limit=${limit}`;
    console.log("🔍 data.europa.eu JSON API URL:", url);

    const response = await axios.get(url, { timeout: 4000 });
    const items = response.data?.result?.results || [];

    if (!items.length) {
      console.warn(`⚠️ No results found for keyword: ${keyword}`);
    }

    const results = items.map(item => {
      const distributions = item.distributions || [];


      const formatLinks = distributions.reduce((acc, dist) => {
        const formatLabelRaw = dist.format?.label;
        const formatLabel = toSafeLower(formatLabelRaw);
        const accessUrls = Array.isArray(dist.access_url) ? dist.access_url : [];
        
        if (formatLabelRaw && typeof formatLabelRaw !== 'string') {
          console.warn(`⚠️ Non-string format.label encountered:`, formatLabelRaw);
        }
        if (formatLabel && accessUrls.length > 0) {
          if (!acc[formatLabel]) {
            acc[formatLabel] = [];
          }
          acc[formatLabel].push(...accessUrls);
        }

        return acc;
      }, {});

      const title = 
        typeof item.title?.[locale] === 'string' ? item.title[locale] :
        typeof item.title?.en === 'string' ? item.title.en :
        typeof item.title === 'string' ? item.title :
        typeof item.catalog?.title?.[locale] === 'string' ? item.catalog.title[locale] :
        typeof item.catalog?.title?.en === 'string' ? item.catalog.title.en :
        "";

      const description =
        typeof item.description?.[locale] === 'string' ? item.description[locale] :
        typeof item.description?.en === 'string' ? item.description.en :
        typeof item.description === 'string' ? item.description :
        typeof item.catalog?.description?.[locale] === 'string' ? item.catalog.description[locale] :
        typeof item.catalog?.description?.en === 'string' ? item.catalog.description.en :
        "";
      const country = item.country?.label || item.country || "";
      const link = `https://data.europa.eu/data/datasets/${item.id}`;
      const publisher = item.catalog?.publisher?.name || null; 
      const license = distributions.find(d => d.license?.label)?.license?.label || null;

      return {
        id: item.id,
        title: title == "" ? (description || "(No title)" ): title,
        description,
        country,
        link,
        formats: Object.keys(formatLinks),
        csvLinks: formatLinks["csv"] || [],
        formatLinks,
        publisher,
        license,
        distributions
      };
    });

    console.log("Datasets handler results: ", results);

    return results;
  } catch (error) {
    console.error("❌ Error fetching data.europa.eu JSON:", error.message);
    return [];
  }
};
