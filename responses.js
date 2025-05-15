exports.formatPortalResponse = (query, results) => {
  if (!results || results.length === 0) {
    return `Sorry, I couldn't find any results for "${query}".`;
  }

  const formattedList = results.map((r, i) => {
    const index = i + 1;
    const title = r.title ? `**${index}. ${r.title}**` : `**${index}. (No title available)**`;
    const snippet = r.snippet ? `> ${r.snippet}` : '';
    const link = r.link ? `[View more](${r.link})` : '(No link available)';
    
    return `${title}\n${snippet}\n🔗 ${link}`;
  });

  return `Here are some results for **"${query}"**:\n\n${formattedList.join("\n\n")}`;
};

exports.formatDatasetsRichContent = (keyword, location, results) => {
  if (!results || results.length === 0) {
    return {
      fulfillment_response: {
        messages: [
          {
            text: {
              text: [
                `Sorry, I couldn't find any datasets for "${keyword}"${location ? ` in "${location}"` : ""}.`
              ]
            }
          }
        ]
      }
    };
  }

  const normalize = str => (str || "").toLowerCase().trim();
  const normalizeText = (str, maxLength = 80) =>
    str && str.length > maxLength ? str.slice(0, maxLength) + "..." : str || "(No title)";

  const computeRelevanceScore = (item) => {
    const keywordParts = normalize(keyword).split(/\s+/);
    const locationParts = normalize(location).split(/\s+/);

    const title = normalize(item.title || item.description || '');
    const description = normalize(item.description);
    const country = normalize(item.country || '');
    const loc  = normalize(item.location || '');

    let score = 0;

    for (const word of keywordParts) {
      if (title.includes(word)) score += 3;        
      else if (description.includes(word)) score += 2;
    }

    for (const word of locationParts) {
      if (loc.includes(word)) score += 1;
      if (country.includes(word)) score += 2;
    }

    const matchesInTitle = keywordParts.filter(w => title.includes(w)).length;
    if (matchesInTitle >= 2) score += 2;

    return score;
  };





  const scored = results.map(r => ({ ...r, relevanceScore: computeRelevanceScore(r) }));
  const sorted = scored.sort((a, b) => b.relevanceScore - a.relevanceScore);


  const RELEVANCE_THRESHOLD = 5;
  const relevant = sorted.filter(item => item.relevanceScore > RELEVANCE_THRESHOLD);
  const others = sorted.filter(item => item.relevanceScore <= RELEVANCE_THRESHOLD);

  const formatCards = (items) => {
  const truncate = (text, maxLength = 70) =>
    typeof text === 'string' && text.length > maxLength
      ? text.slice(0, maxLength).trim() + "..."
      : text || "(No title)";

  return items.slice(0, 5).map((item, index) => ([
    {
      type: "info",
      title: `${index + 1}. ${truncate(item.title)}`,
      subtitle: `📍 Country: ${item.country || item.location || "Unknown"}`,
      actionLink: item.link || "https://data.europa.eu/"
    }
  ]));
};


  const richContentMessages = [];

  if (relevant.length > 0) {
    richContentMessages.push({
      text: {
        text: [`📄 Here are the results for "${keyword}"${location ? ` in "${location}"` : ""}:`]
      }
    });

    const relevantCards = formatCards(relevant);
    relevantCards.forEach(card => {
      richContentMessages.push({ payload: { richContent: [card] } });
    });

  } else {
    richContentMessages.push({
      text: {
        text: ["⚠️ No clearly relevant datasets found"]
      }
    });
  }


  if (others.length > 0) {
    richContentMessages.push({
      text: {
        text: ["📂 Here are some other datasets that might be of interest:"]
      }
    });

    const otherCards = formatCards(others);
    otherCards.forEach(card => {
      richContentMessages.push({ payload: { richContent: [card] } });
    });
  }

  return {
    fulfillment_response: {
      messages: richContentMessages
    }
  };
};

function truncateTitle(title, maxLength = 50) {
  if (!title || typeof title !== 'string') return "Untitled";
  return title.length > maxLength ? title.slice(0, maxLength - 3) + "..." : title;
}

exports.buildActionChips = (action, results = []) => {
  if (!Array.isArray(results) || results.length === 0) return [];

  const emojiMap = {
    visualize: '📊',
    summarize: '📘',
    download: '📥'
  };

  const emoji = emojiMap[action] || '🔍';

  const chipOptions = results.map((item, index) => {
    const title = truncateTitle(item.title || item.description|| '(No title)');
    const country = item.country ? `📍 ${item.country}` : '';
    const desc = item.description ? '🗂️' : '';
    return {
      text: `${emoji} ${index + 1}. ${title} ${country} ${desc}`.trim()
    };
  });

  return [
    [
      {
        type: "info",
        title: `${emoji} Choose a dataset to ${action}`,
        subtitle: `Pick one to ${action} from the list.`
      },
      {
        type: "chips",
        options: chipOptions
      }
    ]
  ];
};


